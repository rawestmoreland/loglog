package migrations

import (
	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

// geoPointExpr mirrors the expression PocketBase generates for a `coords.<key>`
// filter. SQLite only uses an expression index when the query expression
// matches it exactly, so a plain json_extract() index would go unused.
func geoPointExpr(key string) string {
	return "(CASE WHEN json_valid(`coords`) THEN JSON_EXTRACT(`coords`, '$." + key + "') " +
		"ELSE JSON_EXTRACT(json_object('pb', `coords`), '$.pb." + key + "') END)"
}

// Indexes backing the map queries: bounding-box lookups on public seshes
// (is_public + coords.lat/lon) and per-user history (user + started).
func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2365814001")
		if err != nil {
			return err
		}

		collection.AddIndex("idx_poop_seshes_public_coords", false, "`is_public`, "+geoPointExpr("lat")+", "+geoPointExpr("lon"), "")
		collection.AddIndex("idx_poop_seshes_user_started", false, "`user`, `started`", "")

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2365814001")
		if err != nil {
			return err
		}

		collection.RemoveIndex("idx_poop_seshes_public_coords")
		collection.RemoveIndex("idx_poop_seshes_user_started")

		return app.Save(collection)
	})
}
