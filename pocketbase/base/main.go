package main

import (
    "log"
    "os"
    "strings"
		"fmt"

		"loglog/notifications"
		_ "loglog/migrations"

		"github.com/pocketbase/dbx"
    "github.com/pocketbase/pocketbase"
    "github.com/pocketbase/pocketbase/apis"
    "github.com/pocketbase/pocketbase/core"
    "github.com/pocketbase/pocketbase/plugins/migratecmd"
		"github.com/joho/godotenv"
)

func main() {
		_ = godotenv.Load()
		
    app := pocketbase.New()

    // loosely check if it was executed using "go run"
    isGoRun := strings.HasPrefix(os.Args[0], os.TempDir())

    migratecmd.MustRegister(app, app.RootCmd, migratecmd.Config{
        Automigrate: isGoRun,
    })

		app.OnRecordAfterCreateSuccess("users").BindFunc(func(e *core.RecordEvent) error {
			fmt.Println("User created")
			user := e.Record

			codeName := user.Get("codeName").(string)

			// create a poo_profile record for the user
			collection, err := app.FindCollectionByNameOrId("poo_profiles")
			if err != nil {
				return e.Next()
			}
			
			record := core.NewRecord(collection)
			record.Set("user", user.Id)
			record.Set("codeName", codeName)

			err = app.Save(record)
			if (err != nil) {
				return e.Next()
			}

			fmt.Println("Poo profile created")
			return e.Next()
		})

		app.OnRecordAfterCreateSuccess("poop_seshes").BindFunc(func(e *core.RecordEvent) error {
			notificationService := notifications.NewNotificationService(app)
			fmt.Println("Poop sesh created")
			activeSesh := e.Record

			// Get poo pals that follow you
			followers, err := app.FindAllRecords("follows", dbx.NewExp("following = {:following}", dbx.Params{"following": activeSesh.GetString("poo_profile")}))
			if err != nil {
				return e.Next()
			}

			if len(followers) == 0 {
				return e.Next()
			}

			followersIds := []string{}
			for _, follower := range followers {
				followersIds = append(followersIds, follower.GetString("follower"))
			}

			// Get all poo seshes from the above followers. The should be started and not ended
			var conditions []string
			for _, id := range followersIds {
				conditions = append(conditions, fmt.Sprintf("poo_profile ~ '%s'", id))
			}
			profileFilter := strings.Join(conditions, " || ")
			poopSeshes, err := app.FindRecordsByFilter("poop_seshes", "( " + profileFilter + " ) && started != null && ended = null", "-started", 100, 0)
			if err != nil {
				fmt.Println("Error getting poo seshes", err)
				return e.Next()
			}

			if len(poopSeshes) == 0 {
				return e.Next()
			}

			for _, pooSesh := range poopSeshes {
				notificationService.SendPushNotification(pooSesh.GetString("poo_profile"), notifications.PoopSesh, notifications.NotificationData{
					Title: "Poop Sesh",
					Body: "One of your buddies is also pooping",
					Screen: "/(protected)/(screens)/chat/" + pooSesh.GetString("poo_profile") + "/" + activeSesh.GetString("poo_profile"),
				}, nil)
			}

			return e.Next()
		})

    app.OnServe().BindFunc(func(se *core.ServeEvent) error {
        // Register task routes

        // serves static files from the provided public dir (if exists)
        se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

        return se.Next()
    })

    if err := app.Start(); err != nil {
        log.Fatal(err)
    }
}