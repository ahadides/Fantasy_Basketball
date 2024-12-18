const {onDocumentUpdated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
admin.initializeApp();
const logger = require("firebase-functions/logger");

// Cloud Function to send notifications on injury status update
exports.sendInjuryStatusNotification = onDocumentUpdated("players/{playerId}", async (event) => {
    const beforeData = event.data.before.data(); // Data before the change
    const afterData = event.data.after.data();   // Data after the change

    // Check if the injury status has changed
    const beforeStatus = beforeData.Injury.status;
    const afterStatus = afterData.Injury.status;

    // Only send a notification if the status changes to "Out" or "Day-To-Day"
    if (beforeStatus !== afterStatus && (afterStatus === "Out" || afterStatus === "Day-To-Day")) {
        const playerName = afterData.longName;
        const description = afterData.Injury.description;

        // Prepare notification payload
        const payload = {
            notification: {
                title: `${playerName} Status Update`,
                body: `${playerName} is now ${afterStatus}: ${description}`,
            },
            data: {
                playerId: event.params.playerId,
                playerName: playerName,
                status: afterStatus,
                description: description,
            },
            topic: 'player_updates' // Topic for client devices
        };

        // Send FCM notification to devices subscribed to 'player_updates' topic
        try {
            const response = await admin.messaging().send(payload);
            logger.info("Successfully sent message:", response);
        } catch (error) {
            logger.error("Error sending message:", error);
        }

        return null; // Return null to signify success
    } else {
        logger.info("No relevant injury status change detected");
        return null;
    }
});
