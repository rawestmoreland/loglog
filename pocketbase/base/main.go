package main

import (
	"fmt"
	"log"
	"net/mail"
	"os"
	"strings"

	_ "loglog/migrations"
	"loglog/notifications"
	"loglog/achievements"

	"github.com/joho/godotenv"
	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/plugins/migratecmd"
	"github.com/pocketbase/pocketbase/tools/mailer"
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
		if err != nil {
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

		// Get all poo seshes from the above followers. They should be started and not ended
		var conditions []string
		for _, id := range followersIds {
			conditions = append(conditions, fmt.Sprintf("poo_profile ~ '%s'", id))
		}
		profileFilter := strings.Join(conditions, " || ")
		poopSeshes, err := app.FindRecordsByFilter("poop_seshes", "( "+profileFilter+" ) && started != null && ended = null", "-started", 100, 0)
		if err != nil {
			fmt.Println("Error getting poo seshes", err)
			return e.Next()
		}

		if len(poopSeshes) == 0 {
			return e.Next()
		}

		for _, pooSesh := range poopSeshes {
			notificationService.SendPushNotification(pooSesh.GetString("poo_profile"), notifications.PoopSesh, notifications.NotificationData{
				Title:  "Poop Sesh",
				Body:   "One of your buddies is also pooping",
				Screen: "/(protected)/(screens)/chat/" + pooSesh.GetString("poo_profile") + "/" + activeSesh.GetString("poo_profile"),
			}, nil)
		}

		return e.Next()
	})

	app.OnRecordAfterUpdateSuccess("poop_seshes").BindFunc(func(e *core.RecordEvent) error {
		achievementService := achievements.NewAchievementService(app)
		earnedAchievements, err := achievementService.AchievementScan(e.Record.GetString("poo_profile"))
		if err != nil {
			fmt.Println("Error scanning achievements", err)
			return e.Next()
		}

		fmt.Println("Earned achievements", earnedAchievements)


		// e.HttpContext.Set("earned_achievements", earnedAchievements)

		return e.Next()
	})

	app.OnServe().BindFunc(func(se *core.ServeEvent) error {
		// Register task routes
		se.Router.GET("/api/geo-conversion", func(e *core.RequestEvent) error {

			result := struct {
				City        string `json:"city"`
				Coordinates struct {
					Lat float64 `json:"lat"`
					Lon float64 `json:"lon"`
				} `json:"coordinates"`
			}{}

			allSeshes, err := app.FindAllRecords("poop_seshes")
			if err != nil {
				return e.JSON(500, err)
			}

			for _, sesh := range allSeshes {
				err := sesh.UnmarshalJSONField("location", &result)
				if err != nil {
					return e.JSON(500, err)
				}

				sesh.Set("coords", result.Coordinates)

				err = app.Save(sesh)
				if err != nil {
					return e.JSON(500, err)
				}

				fmt.Println(result.Coordinates)
			}
			return e.JSON(200, "success")
		})

		se.Router.POST("/api/delete-account", func(e *core.RequestEvent) error {
			authRecord := e.Auth

			userRecord, err := app.FindRecordById("users", authRecord.Id)
			if err != nil {
				return e.JSON(500, err)
			}

			err = app.Delete(userRecord)
			if err != nil {
				return e.JSON(500, err)
			}

			message := &mailer.Message{
				From: mail.Address{
					Address: e.App.Settings().Meta.SenderAddress,
					Name:    e.App.Settings().Meta.SenderName,
				},
				To:      []mail.Address{{Address: userRecord.GetString("email")}},
				Subject: "Your LogLog account has been deleted",
				HTML:    "Your LogLog account has been deleted. If you did not request this, please contact support.",
			}

			err = e.App.NewMailClient().Send(message)
			if err != nil {
				return e.JSON(500, err)
			}

			return e.JSON(200, "success")
		})

		// serves static files from the provided public dir (if exists)
		se.Router.GET("/{path...}", apis.Static(os.DirFS("./pb_public"), false))

		return se.Next()
	})

	if err := app.Start(); err != nil {
		log.Fatal(err)
	}
}
