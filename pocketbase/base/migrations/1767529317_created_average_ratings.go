package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		jsonData := `{
			"createRule": null,
			"deleteRule": null,
			"fields": [
				{
					"autogeneratePattern": "",
					"hidden": false,
					"id": "text3208210256",
					"max": 0,
					"min": 0,
					"name": "id",
					"pattern": "^[a-z0-9]+$",
					"presentable": false,
					"primaryKey": true,
					"required": true,
					"system": true,
					"type": "text"
				},
				{
					"cascadeDelete": false,
					"collectionId": "pbc_3384545563",
					"hidden": false,
					"id": "_clone_Zt5Q",
					"maxSelect": 1,
					"minSelect": 0,
					"name": "place_id",
					"presentable": false,
					"required": true,
					"system": false,
					"type": "relation"
				},
				{
					"hidden": false,
					"id": "json3632866850",
					"maxSize": 1,
					"name": "rating",
					"presentable": false,
					"required": false,
					"system": false,
					"type": "json"
				},
				{
					"hidden": false,
					"id": "number984262331",
					"max": null,
					"min": null,
					"name": "total_ratings",
					"onlyInt": false,
					"presentable": false,
					"required": false,
					"system": false,
					"type": "number"
				}
			],
			"id": "pbc_3700094976",
			"indexes": [],
			"listRule": "",
			"name": "average_ratings",
			"system": false,
			"type": "view",
			"updateRule": null,
			"viewQuery": "SELECT (ROW_NUMBER() OVER()) as id, place_id, ROUND(AVG(rating), 1) as rating, COUNT(*) as total_ratings FROM toilet_ratings GROUP BY place_id;",
			"viewRule": ""
		}`

		collection := &core.Collection{}
		if err := json.Unmarshal([]byte(jsonData), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_3700094976")
		if err != nil {
			return err
		}

		return app.Delete(collection)
	})
}
