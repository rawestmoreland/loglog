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

		collection.Fields.Add(&core.TextField{
			Id:   "text_poop_country",
			Name: "country",
		})
		collection.Fields.Add(&core.TextField{
			Id:   "text_poop_region",
			Name: "region",
		})

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2365814001")
		if err != nil {
			return err
		}

		collection.Fields.RemoveById("text_poop_country")
		collection.Fields.RemoveById("text_poop_region")

		return app.Save(collection)
	})
}
