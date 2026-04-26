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

		// fix delete rule: relation fields store the referenced record ID directly,
		// so compare against follower/following without .id (join not supported in delete rules)
		if err := json.Unmarshal([]byte(`{
			"deleteRule": "@request.auth.id != \"\" && (@request.auth.id = follower || @request.auth.id = following)"
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
			"deleteRule": "@request.auth.id != \"\" && (@request.auth.id = follower.id || @request.auth.id = following.id)"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
