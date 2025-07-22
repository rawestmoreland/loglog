package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2365814001")
		if err != nil {
			return err
		}

		// add field
		if err := collection.Fields.AddMarshaledJSONAt(14, []byte(`{
			"cascadeDelete": false,
			"collectionId": "pbc_3384545563",
			"hidden": false,
			"id": "relation229024281",
			"maxSelect": 1,
			"minSelect": 0,
			"name": "place_id",
			"presentable": false,
			"required": false,
			"system": false,
			"type": "relation"
		}`)); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2365814001")
		if err != nil {
			return err
		}

		// remove field
		collection.Fields.RemoveById("relation229024281")

		return app.Save(collection)
	})
}
