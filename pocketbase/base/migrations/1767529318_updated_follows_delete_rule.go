package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3660641689")
		if err != nil {
			return err
		}

		// follower/following are poo_profile IDs, not user auth IDs.
		// Must traverse the relation via .user to compare against @request.auth.id.
		if err := json.Unmarshal([]byte(`{
			"createRule": "@request.auth.id != \"\" && @request.auth.id = follower.user",
			"deleteRule": "@request.auth.id != \"\" && (@request.auth.id = follower.user || @request.auth.id = following.user)",
			"updateRule": "@request.auth.id != \"\" && @request.auth.id = following.user"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3660641689")
		if err != nil {
			return err
		}

		if err := json.Unmarshal([]byte(`{
			"createRule": "@request.auth.id != \"\" && (@request.auth.id = follower || @request.auth.id = following)",
			"deleteRule": "@request.auth.id != \"\" && (@request.auth.id = follower || @request.auth.id = following)",
			"updateRule": "@request.auth.id != \"\" && (@request.auth.id = follower || @request.auth.id = following)"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
