package migrations

import (
	"encoding/json"
	"strings"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// seedCategories defines the achievement categories to create if absent.
var seedCategories = []string{
	"Consistency",
	"Explorer",
	"Timing",
	"Performance",
}

// achievementCategory maps normalized achievement names to their category.
var achievementCategory = map[string]string{
	"century_club":         "Consistency",
	"streak_master":        "Consistency",
	"creature_of_habit":    "Consistency",
	"home_court_advantage": "Consistency",

	"globe_trotter":   "Explorer",
	"world_tour":      "Explorer",
	"cross_country":   "Explorer",
	"adventurer":      "Explorer",
	"never_same_twice": "Explorer",
	"road_warrior":    "Explorer",
	"off_the_grid":    "Explorer",
	"beach_bum":       "Explorer",
	"tourist_trap":    "Explorer",

	"early_bird":     "Timing",
	"night_owl":      "Timing",
	"perfect_timing": "Timing",

	"marathon":    "Performance",
	"speed_demon": "Performance",
	"perfection":  "Performance",
}

// achievementCriteria maps normalized achievement names to their criteria JSON.
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
var achievementCriteria = map[string]string{
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

	"off_the_grid": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "is_airplane",
			"operator": "equals",
			"value": true
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

	"perfect_timing": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "company_time",
			"operator": "equals",
			"value": true
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

	"perfection": `{
		"type": "simple",
		"conditions": [{
			"table": "poop_seshes",
			"field": "bristol_score",
			"operator": "equals",
			"value": 4
		}]
	}`,
}

func normalizeName(s string) string {
	return strings.ToLower(strings.ReplaceAll(strings.ReplaceAll(s, " ", "_"), "-", "_"))
}

func init() {
	m.Register(func(app core.App) error {
		// 1. Ensure all categories exist and collect their IDs.
		categoryIds := make(map[string]string, len(seedCategories))
		catCollection, err := app.FindCollectionByNameOrId("achievement_categories")
		if err != nil {
			return err
		}
		for _, name := range seedCategories {
			existing, err := app.FindFirstRecordByFilter(
				"achievement_categories",
				"name = {:name}",
				dbx.Params{"name": name},
			)
			if err != nil {
				// Not found — create it.
				rec := core.NewRecord(catCollection)
				rec.Set("name", name)
				if err := app.Save(rec); err != nil {
					return err
				}
				categoryIds[name] = rec.Id
			} else {
				categoryIds[name] = existing.Id
			}
		}

		// 2. Update every achievement with its criteria and category.
		//    This migration is the source of truth — always overwrite.
		achievements, err := app.FindAllRecords("achievements")
		if err != nil {
			return err
		}
		for _, achievement := range achievements {
			key := normalizeName(achievement.GetString("name"))
			changed := false

			if criteria, ok := achievementCriteria[key]; ok {
				var check any
				if err := json.Unmarshal([]byte(criteria), &check); err == nil {
					achievement.Set("criteria", json.RawMessage(criteria))
					achievement.Set("active", true)
					changed = true
				}
			}

			if catName, ok := achievementCategory[key]; ok {
				if catId, ok := categoryIds[catName]; ok {
					achievement.Set("category", catId)
					changed = true
				}
			}

			if changed {
				if err := app.Save(achievement); err != nil {
					return err
				}
			}
		}

		return nil
	}, func(app core.App) error {
		// Clear criteria, category, and active flag on all seeded achievements.
		achievements, err := app.FindAllRecords("achievements")
		if err != nil {
			return nil
		}
		for _, achievement := range achievements {
			key := normalizeName(achievement.GetString("name"))
			if _, ok := achievementCriteria[key]; ok {
				achievement.Set("criteria", nil)
				achievement.Set("category", nil)
				achievement.Set("active", false)
				_ = app.Save(achievement)
			}
		}

		// Remove categories created by this migration.
		for _, name := range seedCategories {
			rec, err := app.FindFirstRecordByFilter(
				"achievement_categories",
				"name = {:name}",
				dbx.Params{"name": name},
			)
			if err == nil {
				_ = app.Delete(rec)
			}
		}

		return nil
	})
}
