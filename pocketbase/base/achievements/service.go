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

type Condition struct {
	Table    string `json:"table"`
	Field    string `json:"field"`
	Operator string `json:"operator"`
	Value    any    `json:"value"`
}

type CalculatedCondition struct {
	ConditionType string `json:"conditionType"`
	Table         string `json:"table"`
	Calculation   string `json:"calculation"`
	StartField    string `json:"startField"`
	EndField      string `json:"endField"`
	Operator      string `json:"operator"`
	Value         int    `json:"value"`
	Unit          string `json:"unit"`
}

type AggregateCondition struct {
	ConditionType string `json:"conditionType"`
	Table         string `json:"table"`
	Aggregation   string `json:"aggregation"` // count_distinct, count, sum, avg, etc.
	Field         string `json:"field"`
	Operator      string `json:"operator"`
	Value         any    `json:"value"`
}

type StreakCondition struct {
	ConditionType      string `json:"conditionType"`
	Table              string `json:"table"`
	StreakType         string `json:"streakType"`  // daily, weekly, monthly
	DateField          string `json:"dateField"`
	ConsecutiveCount   int    `json:"consecutiveCount"`
	MinEventsPerPeriod int    `json:"minEventsPerPeriod"`
}

type Criteria struct {
	Type       string      `json:"type"`
	Conditions []any `json:"conditions"`
}

type AchievementService struct {
	app *pocketbase.PocketBase
}

func NewAchievementService(app *pocketbase.PocketBase) *AchievementService {
	return &AchievementService{
		app: app,
	}
}

func (s *AchievementService) AchievementScan(poopProfileId string) ([]string, error) {
	earnedAchievements := []string{}
	// Get all seshes for the profile
	profileExpr := dbx.NewExp("poo_profile = {:poopProfileId}", dbx.Params{"poopProfileId": poopProfileId})
	seshes, err := s.app.FindAllRecords("poop_seshes", profileExpr)
	if err != nil {
		log.Println("Error getting seshes", err)
		return earnedAchievements, err
	}
	log.Printf("Seshes count: %d", len(seshes))

	// Don't grant achievements until 10 seshes have been logged
	if len(seshes) < 10 {
		log.Println("Not enough seshes to grant achievements")
		return earnedAchievements, nil
	}

	// Get all achievements with criteria
	achievements, err := s.app.FindAllRecords("achievements", dbx.NewExp("criteria != 'null'"))
	if err != nil {
		log.Println("Error getting achievements", err)
		return earnedAchievements, err
	}

	for _, achievement := range achievements {
		var criteria Criteria
		if err := json.Unmarshal([]byte(achievement.GetString("criteria")), &criteria); err != nil {
			log.Println("Error unmarshalling criteria", err)
			continue
		}

		switch criteria.Type {
		case "simple":
			simpleCriteria := criteria.Conditions[0].(Condition)
			log.Println("Simple Criteria", simpleCriteria)
			if simpleCriteria.Operator == "equals" {
				stringExpr := fmt.Sprintf("%s = {:value}", simpleCriteria.Field)
				result, err := s.app.FindRecordsByFilter(simpleCriteria.Table, stringExpr, "-created", 1, 0, dbx.Params{"value": simpleCriteria.Value})
				if err != nil {
					log.Println("Error getting records", err)
					continue
				} else if len(result) > 0 {
					log.Println("We have a match", result)
					err = s.GrantAchievement(poopProfileId, achievement.GetString("id"))
					if err != nil {
						log.Println("Error granting achievement", err)
						continue
					}
					continue
				} else {
					log.Println("No simple match found")
					continue
				}
			}
		case "calculated":
			calculatedCriteria := criteria.Conditions[0].(CalculatedCondition)
			collection, err := s.app.FindCollectionByNameOrId(calculatedCriteria.Table)
			if err != nil {
				log.Println("Error getting collection", err)
				continue
			}
			filterQuery := buildDurationQuery(calculatedCriteria)

			records, err := s.app.FindRecordsByFilter(collection.Id, filterQuery, "-created", 1, 0)
			if err != nil {
				log.Println("Error getting records", err)
				continue
			}
			if len(records) > 0 {
				log.Println("We have a match", records)
				err = s.GrantAchievement(poopProfileId, achievement.Id)
				if err != nil {
					log.Println("Error granting achievement", err)
					continue
				}
				continue
			} else {
				log.Println("No calculated match found")
				continue
			}
		case "aggregate":
			aggregateCriteria := criteria.Conditions[0].(AggregateCondition)
			matches, err := checkAggregateCondition(s.app, aggregateCriteria, poopProfileId)
			if err != nil {
				log.Println("Error checking aggregate condition", err)
				continue
			}
			if matches {
				log.Println("We have a match", matches)
				err = s.GrantAchievement(poopProfileId, achievement.Id)
				if err != nil {
					log.Println("Error granting achievement", err)
					continue
				}
				continue
			} else {
				log.Println("No aggregate match found")
				continue
			}
		case "streak":
			streakCriteria := criteria.Conditions[0].(StreakCondition)
			matches, err := checkStreakCondition(s.app, streakCriteria, poopProfileId)
			if err != nil {
				log.Println("Error checking streak condition", err)
				continue
			}
			if matches {
				log.Println("We have a match", matches)
			}
			if matches {
				log.Println("We have a match", matches)
				err = s.GrantAchievement(poopProfileId, achievement.Id)
				if err != nil {
					log.Println("Error granting achievement", err)
					continue
				}
				continue
			} else {
				log.Println("No streak match found")
				continue
			}
		default:
			log.Println("Unknown criteria type", criteria.Type)
			continue
		}
	}

	return earnedAchievements, nil
}

// AchievementCheck checks if a user already has an achievement
func (s *AchievementService) UserHasAchievement(poopProfileId string, achievementId string) (bool, error) {
	// Get the achievement
	achievement, err := s.app.FindRecordsByFilter("user_achievement", "poo_profile = {:poopProfileId} && achievement = {:achievementId}", "-created", 1, 0, dbx.Params{"poopProfileId": poopProfileId, "achievementId": achievementId})
	if err != nil {
		log.Println("Error getting achievement", err)
		return false, err
	}

	if len(achievement) > 0 {
		log.Println("User already has achievement", achievement)
		return true, nil
	}

	return false, nil
}

// GrantAchievement grants an achievement to a user
func (s *AchievementService) GrantAchievement(poopProfileId string, achievementId string) error {
	// Check if the user already has the achievement
	hasAchievement, err := s.UserHasAchievement(poopProfileId, achievementId)
	if err != nil {
		log.Println("Error checking if user has achievement", err)
		return err
	}

	if hasAchievement {
		log.Println("User already has achievement", achievementId)
		return nil
	}

	collection, err := s.app.FindCollectionByNameOrId("user_achievement")
	if err != nil {
		log.Println("Error getting user_achievement collection", err)
		return err
	}

	// Create the user_achievement record
	record := core.NewRecord(collection)
	record.Set("poo_profile", poopProfileId)
	record.Set("achievement", achievementId)
	record.Set("unlocked_at", time.Now().Format(time.RFC3339))

	err = s.app.Save(record)
	if err != nil {
		log.Println("Error saving user_achievement record", err)
		return err
	}

	log.Printf("Achievement %s granted to user %s", achievementId, poopProfileId)
	return nil
}

func buildDurationQuery(cond CalculatedCondition) string {
	valueInSeconds := cond.Value
	switch cond.Unit {
	case "minutes":
		valueInSeconds = cond.Value * 60
	case "hours":
		valueInSeconds = cond.Value * 3600
	case "days":
		valueInSeconds = cond.Value * 86400
	}

	var query string

	switch cond.Operator {
	case "greater_than":
		query = fmt.Sprintf("(strftime('%%s', %s) - strftime('%%s', %s)) > %d",
			cond.EndField, cond.StartField, valueInSeconds)
	case "less_than":
		query = fmt.Sprintf("(strftime('%%s', %s) - strftime('%%s', %s)) < %d",
			cond.EndField, cond.StartField, valueInSeconds)
	case "equals":
		query = fmt.Sprintf("(strftime('%%s', %s) - strftime('%%s', %s)) = %d",
			cond.EndField, cond.StartField, valueInSeconds)
	case "between":
		// You'd need a second value for this
		query = fmt.Sprintf("(strftime('%%s', %s) - strftime('%%s', %s)) BETWEEN %d AND %d",
			cond.EndField, cond.StartField, valueInSeconds, valueInSeconds)
	}

	return query
}

func checkAggregateCondition(app *pocketbase.PocketBase, cond AggregateCondition, pooProfileId string) (bool, error) {
	collection, err := app.FindCollectionByNameOrId(cond.Table)
	if err != nil {
		return false, err
	}

	// Fetch all user's records
	records, err := app.FindRecordsByFilter(
		collection.Id,
		fmt.Sprintf("poo_profile = '%s'", pooProfileId), // filter by poo profile
		"",
		10000,
		0,
	)
	if err != nil {
		return false, err
	}

	// Count distinct timezones
	uniqueTimezones := make(map[string]bool)
	for _, record := range records {
		timezone := record.GetString(cond.Field)
		if timezone != "" {
			uniqueTimezones[timezone] = true
		}
	}

	actualCount := len(uniqueTimezones)
	targetValue := cond.Value.(float64) // JSON numbers unmarshal to float64

	return matchesCondition(actualCount, int(targetValue), cond.Operator), nil
}

func matchesCondition(actual, target int, operator string) bool {
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

func checkStreakCondition(app *pocketbase.PocketBase, cond StreakCondition, pooProfileId string) (bool, error) {
	collection, err := app.FindCollectionByNameOrId(cond.Table)
	if err != nil {
		return false, err
	}

	// Fetch all user's records sorted by date
	records, err := app.FindRecordsByFilter(
		collection.Id,
		fmt.Sprintf("poo_profile = '%s'", pooProfileId),
		cond.DateField,
		10000,
		0,
	)
	if err != nil {
		return false, err
	}

	// Group records by period
	periodMap := make(map[string]int) // period key -> count
	for _, record := range records {
		timestamp, _ := time.Parse(time.RFC3339, record.GetString(cond.DateField))
		periodKey := getPeriodKey(timestamp, cond.StreakType)
		periodMap[periodKey]++
	}

	// Find longest consecutive streak
	longestStreak := calculateLongestStreak(periodMap, cond)

	return longestStreak >= cond.ConsecutiveCount, nil
}

func getPeriodKey(t time.Time, streakType string) string {
	switch streakType {
	case "daily":
		return t.Format("2006-01-02") // YYYY-MM-DD
	case "weekly":
		// ISO week: year + week number
		year, week := t.ISOWeek()
		return fmt.Sprintf("%d-W%02d", year, week)
	case "monthly":
		return t.Format("2006-01") // YYYY-MM
	default:
		return t.Format("2006-01-02")
	}
}

func calculateLongestStreak(periodMap map[string]int, cond StreakCondition) int {
	if len(periodMap) == 0 {
		return 0
	}

	// Get sorted periods
	var periods []time.Time
	for periodStr := range periodMap {
		period := parsePeriod(periodStr, cond.StreakType)
		periods = append(periods, period)
	}
	sort.Slice(periods, func(i, j int) bool {
		return periods[i].Before(periods[j])
	})

	longestStreak := 0
	currentStreak := 0
	var prevPeriod time.Time

	for i, period := range periods {
		periodKey := getPeriodKey(period, cond.StreakType)
		count := periodMap[periodKey]

		// Check if meets minimum events per period
		if count < cond.MinEventsPerPeriod {
			currentStreak = 0
			prevPeriod = period
			continue
		}

		if i == 0 {
			currentStreak = 1
		} else {
			// Check if consecutive
			if isConsecutivePeriod(prevPeriod, period, cond.StreakType) {
				currentStreak++
			} else {
				currentStreak = 1
			}
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
		// Parse "2024-W01" format
		var year, week int
		fmt.Sscanf(periodStr, "%d-W%d", &year, &week)
		// Get first day of that week
		jan1 := time.Date(year, 1, 1, 0, 0, 0, 0, time.UTC)
		_, jan1Week := jan1.ISOWeek()
		daysToAdd := (week - jan1Week) * 7
		return jan1.AddDate(0, 0, daysToAdd)
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
		daysDiff := int(current.Sub(prev).Hours() / 24)
		return daysDiff == 1
	case "weekly":
		prevYear, prevWeek := prev.ISOWeek()
		currYear, currWeek := current.ISOWeek()
		
		// Same year, next week
		if prevYear == currYear {
			return currWeek == prevWeek+1
		}
		// Year transition: last week of prev year to first week of curr year
		if currYear == prevYear+1 {
			_, lastWeekOfYear := time.Date(prevYear, 12, 31, 0, 0, 0, 0, time.UTC).ISOWeek()
			return prevWeek == lastWeekOfYear && currWeek == 1
		}
		return false
	case "monthly":
		prevYear, prevMonth := prev.Year(), prev.Month()
		currYear, currMonth := current.Year(), current.Month()
		
		// Same year, next month
		if prevYear == currYear {
			return int(currMonth) == int(prevMonth)+1
		}
		// Year transition: December to January
		if currYear == prevYear+1 {
			return prevMonth == time.December && currMonth == time.January
		}
		return false
	default:
		return false
	}
}