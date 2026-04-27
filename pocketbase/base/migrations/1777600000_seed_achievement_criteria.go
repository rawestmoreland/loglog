package migrations

import (
	"encoding/json"
	"strings"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// criteriaByName maps normalized achievement names to their criteria JSON and
// marks them active. Only applied when the achievement's criteria field is empty.
//
// Condition type reference:
//
//	simple       – at least one sesh where field op value
//	calculated   – at least one completed sesh whose duration matches
//	aggregate    – aggregate over user's seshes vs threshold
//	               aggregation: count | count_distinct | sum | avg | max_group_count
//	               filter: optional extra PocketBase filter
//	               profileField: relation field name (default "poo_profile")
//	streak       – longest consecutive daily/weekly/monthly streak
//	time_of_day  – seshes started inside [startHour, endHour) window
var criteriaByName = map[string]string{
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

	"off_the_grid": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "is_airplane",
			"operator": "equals",
			"value": true
		}]
	}`,

	"perfect_timing": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "company_time",
			"operator": "equals",
			"value": true
		}]
	}`,

	"perfection": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "bristol_score",
			"operator": "equals",
			"value": 4
		}]
	}`,

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

func seedNormalizeName(name string) string {
	return strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(name, " ", "_"), "-", "_"))
}

func init() {
	m.Register(func(app core.App) error {
		achievements, err := app.FindAllRecords("achievements")
		if err != nil {
			return nil
		}

		for _, achievement := range achievements {
			if existing := achievement.GetString("criteria"); existing != "" && existing != "null" {
				continue
			}

			key := seedNormalizeName(achievement.GetString("name"))
			criteriaJSON, ok := criteriaByName[key]
			if !ok {
				continue
			}

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
		achievements, err := app.FindAllRecords("achievements")
		if err != nil {
			return nil
		}
		for _, achievement := range achievements {
			key := seedNormalizeName(achievement.GetString("name"))
			if _, ok := criteriaByName[key]; ok {
				achievement.Set("criteria", nil)
				achievement.Set("active", false)
				_ = app.Save(achievement)
			}
		}
		return nil
	})
}
