package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2822695520")
		if err != nil {
			return err
		}

		// createRule: null — profiles are only created via the backend hook (app.Save bypasses API rules)
		// updateRule: scoped to the profile owner so users can only update their own profile
		if err := json.Unmarshal([]byte(`{
			"createRule": null,
			"updateRule": "@request.auth.id != \"\" && @request.auth.id = user"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2822695520")
		if err != nil {
			return err
		}

		if err := json.Unmarshal([]byte(`{
			"createRule": "@request.auth.id != \"\"",
			"updateRule": "@request.auth.id != \"\""
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}
