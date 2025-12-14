package migrations

import (
	"encoding/json"

	"github.com/pocketbase/pocketbase/core"
	m "github.com/pocketbase/pocketbase/migrations"
)

func init() {
	m.Register(func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2755712140")
		if err != nil {
			return err
		}

		// update collection data
		if err := json.Unmarshal([]byte(`{
			"createRule": "@request.auth.id != \"\" && user = @request.auth.id && (sesh.user = @request.auth.id || (@collection.follows.following ?= sesh.poo_profile && @collection.follows.follower.user ?= @request.auth.id && @collection.follows.status ?= \"approved\") || (@collection.follows.follower ?= sesh.poo_profile && @collection.follows.following.user ?= @request.auth.id && @collection.follows.status ?= \"approved\"))",
			"deleteRule": "@request.auth.id != \"\" && (user = @request.auth.id || sesh.user = @request.auth.id)",
			"listRule": "@request.auth.id != \"\" && (sesh.user = @request.auth.id || (@collection.follows.following ?= sesh.poo_profile && @collection.follows.follower.user ?= @request.auth.id && @collection.follows.status ?= \"approved\") || (@collection.follows.follower ?= sesh.poo_profile && @collection.follows.following.user ?= @request.auth.id && @collection.follows.status ?= \"approved\"))",
			"updateRule": "@request.auth.id != \"\" && (user = @request.auth.id || sesh.user = @request.auth.id)",
			"viewRule": "@request.auth.id != \"\" && (sesh.user = @request.auth.id || (@collection.follows.following ?= sesh.poo_profile && @collection.follows.follower.user ?= @request.auth.id && @collection.follows.status ?= \"approved\") || (@collection.follows.follower ?= sesh.poo_profile && @collection.follows.following.user ?= @request.auth.id && @collection.follows.status ?= \"approved\"))"
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	}, func(app core.App) error {
		collection, err := app.FindCollectionByNameOrId("pbc_2755712140")
		if err != nil {
			return err
		}

		// revert collection data
		if err := json.Unmarshal([]byte(`{
			"createRule": null,
			"deleteRule": null,
			"listRule": null,
			"updateRule": null,
			"viewRule": null
		}`), &collection); err != nil {
			return err
		}

		return app.Save(collection)
	})
}

