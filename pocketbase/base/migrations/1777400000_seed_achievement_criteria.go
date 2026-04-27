package migrations

import (
	"encoding/json"
	"strings"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// achievementCriteria maps normalized achievement names to their criteria JSON.
// Criteria are only written when the achievement record has no criteria yet.
//
// Condition type reference:
//
//   simple       – at least one sesh where field op value
//   calculated   – at least one completed sesh whose duration matches
//   aggregate    – aggregate function over the user's seshes vs threshold
//                  aggregation: count | count_distinct | sum | avg | max_group_count
//                  filter: optional extra PocketBase filter (applied on top of poo_profile)
//                  profileField: relation field name (default "poo_profile")
//   streak       – longest consecutive daily/weekly/monthly streak
//   time_of_day  – seshes that started inside [startHour, endHour) hour window
var achievementCriteria = map[string]string{
	// 100+ total logged seshes
	"century_club": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count",
			"field": "id",
			"operator": "greater_than_or_equal",
			"value": 100
		}]
	}`,

	// 7-day consecutive daily streak
	"streak_master": `{
		"type": "streak",
		"conditions": [{
			"conditionType": "streak",
			"table": "poop_seshes",
			"streakType": "daily",
			"dateField": "started",
			"consecutiveCount": 7,
			"minEventsPerPeriod": 1
		}]
	}`,

	// First sesh before 08:00
	"early_bird": `{
		"type": "time_of_day",
		"conditions": [{
			"conditionType": "time_of_day",
			"table": "poop_seshes",
			"field": "started",
			"startHour": 5,
			"endHour": 8,
			"minCount": 1
		}]
	}`,

	// First sesh after 22:00 (wraps midnight to 04:00)
	"night_owl": `{
		"type": "time_of_day",
		"conditions": [{
			"conditionType": "time_of_day",
			"table": "poop_seshes",
			"field": "started",
			"startHour": 22,
			"endHour": 4,
			"minCount": 1
		}]
	}`,

	// 5+ unique timezones visited
	"globe_trotter": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count_distinct",
			"field": "timezone",
			"operator": "greater_than_or_equal",
			"value": 5
		}]
	}`,

	// 10+ unique timezones – full world tour
	"world_tour": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count_distinct",
			"field": "timezone",
			"operator": "greater_than_or_equal",
			"value": 10
		}]
	}`,

	// 3+ unique timezones – cross-country travel
	"cross_country": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count_distinct",
			"field": "timezone",
			"operator": "greater_than_or_equal",
			"value": 3
		}]
	}`,

	// 50+ home seshes (is_local = true)
	"home_court_advantage": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count",
			"field": "id",
			"filter": "is_local = true",
			"operator": "greater_than_or_equal",
			"value": 50
		}]
	}`,

	// 25+ away seshes (is_local = false, not airplane)
	"road_warrior": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count",
			"field": "id",
			"filter": "is_local = false && is_airplane = false",
			"operator": "greater_than_or_equal",
			"value": 25
		}]
	}`,

	// 5+ unique named places visited
	"adventurer": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count_distinct",
			"field": "place_id",
			"operator": "greater_than_or_equal",
			"value": 5
		}]
	}`,

	// 10+ unique named places visited
	"never_same_twice": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count_distinct",
			"field": "place_id",
			"operator": "greater_than_or_equal",
			"value": 10
		}]
	}`,

	// 20+ seshes at the same single place
	"creature_of_habit": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "max_group_count",
			"field": "place_id",
			"operator": "greater_than_or_equal",
			"value": 20
		}]
	}`,

	// At least one airplane sesh
	"off_the_grid": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "is_airplane",
			"operator": "equals",
			"value": true
		}]
	}`,

	// At least one sesh on company time
	"perfect_timing": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "company_time",
			"operator": "equals",
			"value": true
		}]
	}`,

	// At least one sesh with a Bristol score of 4 (ideal stool)
	"perfection": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "bristol_score",
			"operator": "equals",
			"value": 4
		}]
	}`,

	// A completed sesh lasting 20+ minutes
	"marathon": `{
		"type": "calculated",
		"conditions": [{
			"conditionType": "calculated",
			"table": "poop_seshes",
			"calculation": "duration",
			"startField": "started",
			"endField": "ended",
			"operator": "greater_than",
			"value": 20,
			"unit": "minutes"
		}]
	}`,

	// A completed sesh under 2 minutes
	"speed_demon": `{
		"type": "calculated",
		"conditions": [{
			"conditionType": "calculated",
			"table": "poop_seshes",
			"calculation": "duration",
			"startField": "started",
			"endField": "ended",
			"operator": "less_than",
			"value": 2,
			"unit": "minutes"
		}]
	}`,

	// 3+ toilet ratings left
	"tourist_trap": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "toilet_ratings",
			"aggregation": "count",
			"field": "id",
			"profileField": "user_id",
			"operator": "greater_than_or_equal",
			"value": 3
		}]
	}`,

	// 10+ public/away seshes (not home, not airplane)
	"beach_bum": `{
		"type": "aggregate",
		"conditions": [{
			"conditionType": "aggregate",
			"table": "poop_seshes",
			"aggregation": "count",
			"field": "id",
			"filter": "is_local = false && is_airplane = false",
			"operator": "greater_than_or_equal",
			"value": 10
		}]
	}`,
}

func normalizeName(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(name, " ", "_"), "-", "_"))
}

func init() {
	m.Register(func(app core.App) error {
		achievements, err := app.FindAllRecords("achievements")
		if err != nil {
			// Collection may not exist in some test environments; skip gracefully.
			return nil
		}

		for _, achievement := range achievements {
			// Skip if criteria already set.
			existing := achievement.GetString("criteria")
			if existing != "" && existing != "null" {
				continue
			}

			key := normalizeName(achievement.GetString("name"))
			criteriaJSON, ok := achievementCriteria[key]
			if !ok {
				continue
			}

			// Validate JSON before storing.
			var check any
			if err := json.Unmarshal([]byte(criteriaJSON), &check); err != nil {
				continue
			}

			achievement.Set("criteria", json.RawMessage(criteriaJSON))
			achievement.Set("active", true)
			if err := app.Save(achievement); err != nil {
				return err
			}
		}

		return nil
	}, func(app core.App) error {
		// Down migration: clear criteria that this migration set.
		achievements, err := app.FindAllRecords("achievements")
		if err != nil {
			return nil
		}
		for _, achievement := range achievements {
			key := normalizeName(achievement.GetString("name"))
			if _, ok := achievementCriteria[key]; ok {
				achievement.Set("criteria", nil)
				achievement.Set("active", false)
				_ = app.Save(achievement)
			}
		}
		return nil
	})
}
