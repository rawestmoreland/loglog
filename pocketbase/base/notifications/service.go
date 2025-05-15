package notifications

import (
	"fmt"
	"log"

	"github.com/pocketbase/dbx"
	"github.com/pocketbase/pocketbase"
	expo "github.com/oliveroneill/exponent-server-sdk-golang/sdk"
)

type NotificationType string

// String returns the string representation of the NotificationType
func (nt NotificationType) String() string {
	return string(nt)
}

const (
	PoopSesh NotificationType = "poop_sesh"
)

type NotificationService struct {
	app    *pocketbase.PocketBase
	client *expo.PushClient
}

func NewNotificationService(app *pocketbase.PocketBase) *NotificationService {
	return &NotificationService{
		app:    app,
		client: expo.NewPushClient(nil),
	}
}

type NotificationData struct {
	Title    string
	Body     string
	Screen   string
	Data     map[string]string
}

// NotificationRecord represents how the notification should be stored in the database
type NotificationRecord struct {
	CollectionName string                 // The name of the collection to store the notification in
	Fields         map[string]interface{} // The fields to store in the notification record
}

// SendPushNotification sends a push notification to a specific user and optionally records it in the database
func (s *NotificationService) SendPushNotification(recipientID string, notificationType NotificationType, data NotificationData, record *NotificationRecord) error {
	// Get the user's expo push token
	pooProfile, err := s.app.FindFirstRecordByFilter("poo_profiles", "id = {:pooProfileId}", dbx.Params{"pooProfileId": recipientID})
	if err != nil {
		return fmt.Errorf("error getting player profile: %w", err)
	}

	expoPushToken, err := expo.NewExponentPushToken(pooProfile.Get("expo_push_token").(string))
	if err != nil {
		return fmt.Errorf("error creating push token: %w", err)
	}

	// Merge provided data with screen navigation data
	notificationData := data.Data
	if notificationData == nil {
		notificationData = make(map[string]string)
	}
	if data.Screen != "" {
		notificationData["screen"] = data.Screen
	}

	// Send the notification
	response, err := s.client.Publish(
		&expo.PushMessage{
			To:       []expo.ExponentPushToken{expoPushToken},
			Body:     data.Body,
			Data:     notificationData,
			Sound:    "default",
			Title:    data.Title,
			Priority: expo.DefaultPriority,
		},
	)

	if err != nil {
		return fmt.Errorf("error publishing notification: %w", err)
	}

	// Validate response
	if err := response.ValidateResponse(); err != nil {
		log.Printf("Failed to send notification to %v: %v", expoPushToken, err)
		return err
	}

	return nil
}

// Should send notification checks if a user should receive a notification. It users the player_notification_settings collection to check if the user should receive the notification.
func (s *NotificationService) ShouldSendNotification(recipientID string, notificationType NotificationType) (bool, error) {
	playerSettings, err := s.app.FindFirstRecordByFilter("player_notification_settings", "player_profile_id = {:recipientId} && notification_type = {:notificationType} && channel = 'push'", dbx.Params{"recipientId": recipientID, "notificationType": notificationType.String()})
	if err != nil {
		return false, err
	}
	return playerSettings.Get("enabled").(bool), nil
}