package achievements

import (
	"encoding/json"
	"fmt"
	"log"
	"sort"
	"time"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/core"
)

// Condition checks a single field on a record against a value.
type Condition struct {
	Table    string `json:"table"`
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    any    `json:"value"`
}

// CalculatedCondition checks a computed value (e.g. session duration).
type CalculatedCondition struct {
	ConditionType string `json:"conditionType"`
	Table         string `json:"table"`
	Calculation   string `json:"calculation"` // "duration"
	StartField    string `json:"startField"`
	EndField      string `json:"endField"`
	Operator      string `json:"operator"`
	Value         int    `json:"value"`
	Unit          string `json:"unit"` // "seconds", "minutes", "hours", "days"
}

// AggregateCondition computes an aggregate (count, sum, avg, count_distinct,
// max_group_count) over the user's records and checks it against a threshold.
type AggregateCondition struct {
	ConditionType string `json:"conditionType"`
	Table         string `json:"table"`
	Aggregation   string `json:"aggregation"`  // count, count_distinct, sum, avg, max_group_count
	Field         string `json:"field"`
	Filter        string `json:"filter"`        // optional extra PocketBase filter expression
	ProfileField  string `json:"profileField"`  // field linking to poo_profile (default: "poo_profile")
	Operator      string `json:"operator"`
	Value         any    `json:"value"`
}

// StreakCondition checks for consecutive daily/weekly/monthly activity.
type StreakCondition struct {
	ConditionType      string `json:"conditionType"`
	Table              string `json:"table"`
	StreakType         string `json:"streakType"`         // "daily", "weekly", "monthly"
	DateField          string `json:"dateField"`
	ConsecutiveCount   int    `json:"consecutiveCount"`
	MinEventsPerPeriod int    `json:"minEventsPerPeriod"`
}

// TimeOfDayCondition checks how many seshes started in a given hour range.
// When startHour > endHour the range wraps midnight (e.g. 22–06).
type TimeOfDayCondition struct {
	ConditionType string `json:"conditionType"`
	Table         string `json:"table"`
	Field         string `json:"field"`     // datetime field, default "started"
	StartHour     int    `json:"startHour"` // inclusive, 0-23
	EndHour       int    `json:"endHour"`   // exclusive, 0-23
	MinCount      int    `json:"minCount"`  // minimum matching seshes required (default 1)
}

// Criteria is the top-level structure stored in the achievement's criteria JSON
// field. All conditions are AND-ed together.
type Criteria struct {
	Type       string            `json:"type"`
	Conditions []json.RawMessage `json:"conditions"`
}

// AchievementService scans and grants achievements for a poo profile.
type AchievementService struct {
	app *pocketbase.PocketBase
}

func NewAchievementService(app *pocketbase.PocketBase) *AchievementService {
	return &AchievementService{app: app}
}

// AchievementScan evaluates all active achievements for the given poo profile
// and grants any that are newly earned. Returns IDs of newly granted achievements.
func (s *AchievementService) AchievementScan(poopProfileId string) ([]string, error) {
	earnedAchievements := []string{}

	seshes, err := s.app.FindAllRecords("poop_seshes",
		dbx.NewExp("poo_profile = {:id}", dbx.Params{"id": poopProfileId}))
	if err != nil {
		return earnedAchievements, fmt.Errorf("getting seshes: %w", err)
	}

	if len(seshes) < 10 {
		log.Printf("Profile %s has %d seshes, skipping achievement scan (minimum 10)", poopProfileId, len(seshes))
		return earnedAchievements, nil
	}

	achievements, err := s.app.FindRecordsByFilter(
		"achievements",
		"active = true && criteria != null && criteria != ''",
		"",
		1000,
		0,
	)
	if err != nil {
		return earnedAchievements, fmt.Errorf("getting achievements: %w", err)
	}

	for _, achievement := range achievements {
		criteriaStr := achievement.GetString("criteria")
		if criteriaStr == "" || criteriaStr == "null" {
			continue
		}

		var criteria Criteria
		if err := json.Unmarshal([]byte(criteriaStr), &criteria); err != nil {
			log.Printf("Error parsing criteria for achievement %s: %v", achievement.Id, err)
			continue
		}

		matched, err := s.evaluateCriteria(criteria, poopProfileId)
		if err != nil {
			log.Printf("Error evaluating criteria for achievement %s (%s): %v",
				achievement.Id, achievement.GetString("name"), err)
			continue
		}

		if !matched {
			continue
		}

		if err := s.GrantAchievement(poopProfileId, achievement.Id); err != nil {
			log.Printf("Error granting achievement %s: %v", achievement.Id, err)
			continue
		}

		earnedAchievements = append(earnedAchievements, achievement.Id)
		log.Printf("Achievement '%s' earned by profile %s", achievement.GetString("name"), poopProfileId)
	}

	return earnedAchievements, nil
}

// evaluateCriteria checks all conditions in the criteria (AND logic).
// Returns true only when every condition is satisfied.
func (s *AchievementService) evaluateCriteria(criteria Criteria, poopProfileId string) (bool, error) {
	if len(criteria.Conditions) == 0 {
		return false, nil
	}

	for _, rawCond := range criteria.Conditions {
		var matched bool
		var err error

		switch criteria.Type {
		case "simple":
			var cond Condition
			if err = json.Unmarshal(rawCond, &cond); err != nil {
				return false, fmt.Errorf("parsing simple condition: %w", err)
			}
			matched, err = s.checkSimpleCondition(cond, poopProfileId)

		case "calculated":
			var cond CalculatedCondition
			if err = json.Unmarshal(rawCond, &cond); err != nil {
				return false, fmt.Errorf("parsing calculated condition: %w", err)
			}
			matched, err = s.checkCalculatedCondition(cond, poopProfileId)

		case "aggregate":
			var cond AggregateCondition
			if err = json.Unmarshal(rawCond, &cond); err != nil {
				return false, fmt.Errorf("parsing aggregate condition: %w", err)
			}
			matched, err = checkAggregateCondition(s.app, cond, poopProfileId)

		case "streak":
			var cond StreakCondition
			if err = json.Unmarshal(rawCond, &cond); err != nil {
				return false, fmt.Errorf("parsing streak condition: %w", err)
			}
			matched, err = checkStreakCondition(s.app, cond, poopProfileId)

		case "time_of_day":
			var cond TimeOfDayCondition
			if err = json.Unmarshal(rawCond, &cond); err != nil {
				return false, fmt.Errorf("parsing time_of_day condition: %w", err)
			}
			matched, err = checkTimeOfDayCondition(s.app, cond, poopProfileId)

		default:
			return false, fmt.Errorf("unknown criteria type: %s", criteria.Type)
		}

		if err != nil {
			return false, err
		}
		if !matched {
			return false, nil
		}
	}

	return true, nil
}

// checkSimpleCondition checks whether at least one of the user's records matches
// the given field/operator/value.
func (s *AchievementService) checkSimpleCondition(cond Condition, poopProfileId string) (bool, error) {
	table := cond.Table
	if table == "" {
		table = "poop_seshes"
	}
	sqlOp, err := operatorToSQL(cond.Operator)
	if err != nil {
		return false, err
	}
	filter := fmt.Sprintf("poo_profile = {:profileId} && %s %s {:value}", cond.Field, sqlOp)
	records, err := s.app.FindRecordsByFilter(
		table, filter, "-created", 1, 0,
		dbx.Params{"profileId": poopProfileId, "value": cond.Value},
	)
	if err != nil {
		return false, err
	}
	return len(records) > 0, nil
}

// checkCalculatedCondition fetches completed seshes and evaluates duration in Go.
func (s *AchievementService) checkCalculatedCondition(cond CalculatedCondition, poopProfileId string) (bool, error) {
	table := cond.Table
	if table == "" {
		table = "poop_seshes"
	}

	records, err := s.app.FindRecordsByFilter(
		table,
		"poo_profile = {:profileId} && ended != null && ended != ''",
		"",
		10000,
		0,
		dbx.Params{"profileId": poopProfileId},
	)
	if err != nil {
		return false, err
	}

	thresholdSeconds := float64(toSeconds(cond.Value, cond.Unit))

	for _, record := range records {
		start, okStart := parseTime(record.GetString(cond.StartField))
		end, okEnd := parseTime(record.GetString(cond.EndField))
		if !okStart || !okEnd {
			continue
		}
		duration := end.Sub(start).Seconds()
		if matchesConditionFloat(duration, thresholdSeconds, cond.Operator) {
			return true, nil
		}
	}

	return false, nil
}

// UserHasAchievement checks whether the profile already owns the achievement.
func (s *AchievementService) UserHasAchievement(poopProfileId string, achievementId string) (bool, error) {
	records, err := s.app.FindRecordsByFilter(
		"user_achievement",
		"poo_profile = {:profileId} && achievement = {:achievementId}",
		"-created",
		1,
		0,
		dbx.Params{"profileId": poopProfileId, "achievementId": achievementId},
	)
	if err != nil {
		return false, err
	}
	return len(records) > 0, nil
}

// GrantAchievement awards an achievement to a profile if not already owned.
func (s *AchievementService) GrantAchievement(poopProfileId string, achievementId string) error {
	has, err := s.UserHasAchievement(poopProfileId, achievementId)
	if err != nil {
		return err
	}
	if has {
		return nil
	}

	collection, err := s.app.FindCollectionByNameOrId("user_achievement")
	if err != nil {
		return err
	}

	record := core.NewRecord(collection)
	record.Set("poo_profile", poopProfileId)
	record.Set("achievement", achievementId)
	record.Set("unlocked_at", time.Now().Format(time.RFC3339))

	return s.app.Save(record)
}

// ---------------------------------------------------------------------------
// Aggregate condition
// ---------------------------------------------------------------------------

func checkAggregateCondition(app *pocketbase.PocketBase, cond AggregateCondition, pooProfileId string) (bool, error) {
	table := cond.Table
	if table == "" {
		table = "poop_seshes"
	}
	profileField := cond.ProfileField
	if profileField == "" {
		profileField = "poo_profile"
	}

	filter := fmt.Sprintf("%s = '%s'", profileField, pooProfileId)
	if cond.Filter != "" {
		filter = filter + " && " + cond.Filter
	}

	records, err := app.FindRecordsByFilter(table, filter, "", 10000, 0)
	if err != nil {
		return false, err
	}

	targetValue := toFloat64(cond.Value)

	switch cond.Aggregation {
	case "count":
		return matchesConditionFloat(float64(len(records)), targetValue, cond.Operator), nil

	case "count_distinct":
		unique := make(map[string]struct{})
		for _, r := range records {
			if val := r.GetString(cond.Field); val != "" {
				unique[val] = struct{}{}
			}
		}
		return matchesConditionFloat(float64(len(unique)), targetValue, cond.Operator), nil

	case "sum":
		var sum float64
		for _, r := range records {
			sum += r.GetFloat(cond.Field)
		}
		return matchesConditionFloat(sum, targetValue, cond.Operator), nil

	case "avg":
		if len(records) == 0 {
			return false, nil
		}
		var sum float64
		for _, r := range records {
			sum += r.GetFloat(cond.Field)
		}
		return matchesConditionFloat(sum/float64(len(records)), targetValue, cond.Operator), nil

	// max_group_count: find the highest per-value count across all records.
	// Useful for "creature of habit" (largest number of seshes at same place).
	case "max_group_count":
		groups := make(map[string]int)
		for _, r := range records {
			if val := r.GetString(cond.Field); val != "" {
				groups[val]++
			}
		}
		maxCount := 0
		for _, count := range groups {
			if count > maxCount {
				maxCount = count
			}
		}
		return matchesConditionFloat(float64(maxCount), targetValue, cond.Operator), nil

	default:
		return false, fmt.Errorf("unknown aggregation type: %s", cond.Aggregation)
	}
}

// ---------------------------------------------------------------------------
// Time-of-day condition
// ---------------------------------------------------------------------------

func checkTimeOfDayCondition(app *pocketbase.PocketBase, cond TimeOfDayCondition, pooProfileId string) (bool, error) {
	table := cond.Table
	if table == "" {
		table = "poop_seshes"
	}
	field := cond.Field
	if field == "" {
		field = "started"
	}
	minCount := cond.MinCount
	if minCount == 0 {
		minCount = 1
	}

	records, err := app.FindRecordsByFilter(
		table,
		fmt.Sprintf("poo_profile = '%s'", pooProfileId),
		"",
		10000,
		0,
	)
	if err != nil {
		return false, err
	}

	count := 0
	for _, record := range records {
		t, ok := parseTime(record.GetString(field))
		if !ok {
			continue
		}
		if isHourInRange(t.Hour(), cond.StartHour, cond.EndHour) {
			count++
		}
	}

	return count >= minCount, nil
}

// ---------------------------------------------------------------------------
// Streak condition
// ---------------------------------------------------------------------------

func checkStreakCondition(app *pocketbase.PocketBase, cond StreakCondition, pooProfileId string) (bool, error) {
	table := cond.Table
	if table == "" {
		table = "poop_seshes"
	}

	records, err := app.FindRecordsByFilter(
		table,
		fmt.Sprintf("poo_profile = '%s'", pooProfileId),
		cond.DateField,
		10000,
		0,
	)
	if err != nil {
		return false, err
	}

	periodMap := make(map[string]int)
	for _, record := range records {
		t, ok := parseTime(record.GetString(cond.DateField))
		if !ok {
			continue
		}
		periodMap[getPeriodKey(t, cond.StreakType)]++
	}

	return calculateLongestStreak(periodMap, cond) >= cond.ConsecutiveCount, nil
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

func operatorToSQL(op string) (string, error) {
	switch op {
	case "equals":
		return "=", nil
	case "not_equals":
		return "!=", nil
	case "greater_than":
		return ">", nil
	case "less_than":
		return "<", nil
	case "greater_than_or_equal":
		return ">=", nil
	case "less_than_or_equal":
		return "<=", nil
	default:
		return "", fmt.Errorf("unknown operator: %s", op)
	}
}

func matchesConditionFloat(actual, target float64, operator string) bool {
	switch operator {
	case "greater_than_or_equal":
		return actual >= target
	case "greater_than":
		return actual > target
	case "equals":
		return actual == target
	case "less_than":
		return actual < target
	case "less_than_or_equal":
		return actual <= target
	default:
		return false
	}
}

// matchesCondition wraps matchesConditionFloat for integer inputs.
func matchesCondition(actual, target int, operator string) bool {
	return matchesConditionFloat(float64(actual), float64(target), operator)
}

func toFloat64(v any) float64 {
	switch val := v.(type) {
	case float64:
		return val
	case float32:
		return float64(val)
	case int:
		return float64(val)
	case int64:
		return float64(val)
	case int32:
		return float64(val)
	case json.Number:
		f, _ := val.Float64()
		return f
	default:
		return 0
	}
}

func toSeconds(value int, unit string) int {
	switch unit {
	case "minutes":
		return value * 60
	case "hours":
		return value * 3600
	case "days":
		return value * 86400
	default:
		return value
	}
}

// parseTime tries a set of common datetime formats used by PocketBase/SQLite.
func parseTime(s string) (time.Time, bool) {
	layouts := []string{
		"2006-01-02 15:04:05.000Z",
		"2006-01-02 15:04:05.000",
		"2006-01-02 15:04:05Z",
		"2006-01-02 15:04:05",
		time.RFC3339Nano,
		time.RFC3339,
	}
	for _, layout := range layouts {
		if t, err := time.Parse(layout, s); err == nil {
			return t, true
		}
	}
	return time.Time{}, false
}

func isHourInRange(hour, start, end int) bool {
	if start <= end {
		return hour >= start && hour < end
	}
	// Wraps midnight (e.g. start=22, end=6 covers 22,23,0,1,2,3,4,5)
	return hour >= start || hour < end
}

func getPeriodKey(t time.Time, streakType string) string {
	switch streakType {
	case "daily":
		return t.Format("2006-01-02")
	case "weekly":
		year, week := t.ISOWeek()
		return fmt.Sprintf("%d-W%02d", year, week)
	case "monthly":
		return t.Format("2006-01")
	default:
		return t.Format("2006-01-02")
	}
}

func calculateLongestStreak(periodMap map[string]int, cond StreakCondition) int {
	if len(periodMap) == 0 {
		return 0
	}

	var periods []time.Time
	for periodStr := range periodMap {
		periods = append(periods, parsePeriod(periodStr, cond.StreakType))
	}
	sort.Slice(periods, func(i, j int) bool {
		return periods[i].Before(periods[j])
	})

	longestStreak := 0
	currentStreak := 0
	var prevPeriod time.Time

	for i, period := range periods {
		count := periodMap[getPeriodKey(period, cond.StreakType)]
		if count < cond.MinEventsPerPeriod {
			currentStreak = 0
			prevPeriod = period
			continue
		}
		if i == 0 {
			currentStreak = 1
		} else if isConsecutivePeriod(prevPeriod, period, cond.StreakType) {
			currentStreak++
		} else {
			currentStreak = 1
		}
		if currentStreak > longestStreak {
			longestStreak = currentStreak
		}
		prevPeriod = period
	}

	return longestStreak
}

func parsePeriod(periodStr string, streakType string) time.Time {
	switch streakType {
	case "daily":
		t, _ := time.Parse("2006-01-02", periodStr)
		return t
	case "weekly":
		var year, week int
		fmt.Sscanf(periodStr, "%d-W%d", &year, &week)
		jan1 := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
		_, jan1Week := jan1.ISOWeek()
		return jan1.AddDate(0, 0, (week-jan1Week)*7)
	case "monthly":
		t, _ := time.Parse("2006-01", periodStr)
		return t
	default:
		t, _ := time.Parse("2006-01-02", periodStr)
		return t
	}
}

func isConsecutivePeriod(prev, current time.Time, streakType string) bool {
	switch streakType {
	case "daily":
		return int(current.Sub(prev).Hours()/24) == 1
	case "weekly":
		prevYear, prevWeek := prev.ISOWeek()
		currYear, currWeek := current.ISOWeek()
		if prevYear == currYear {
			return currWeek == prevWeek+1
		}
		if currYear == prevYear+1 {
			_, lastWeek := time.Date(prevYear, 12, 31, 0, 0, 0, 0, time.UTC).ISOWeek()
			return prevWeek == lastWeek && currWeek == 1
		}
		return false
	case "monthly":
		prevYear, prevMonth := prev.Year(), prev.Month()
		currYear, currMonth := current.Year(), current.Month()
		if prevYear == currYear {
			return int(currMonth) == int(prevMonth)+1
		}
		if currYear == prevYear+1 {
			return prevMonth == time.December && currMonth == time.January
		}
		return false
	default:
		return false
	}
}
