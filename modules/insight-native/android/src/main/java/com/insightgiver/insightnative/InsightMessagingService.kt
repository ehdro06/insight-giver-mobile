package com.insightgiver.insightnative

import androidx.glance.appwidget.updateAll
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import kotlinx.coroutines.runBlocking

/**
 * Handles insight pushes without React Native. FCM starts this service (and the app process, if
 * needed) for data messages; nothing here touches the React host, so no JavaScript runs: the
 * payload goes to SharedPreferences and the widget redraws.
 *
 * Token refreshes need no handling here: the app sends its current token to the backend each time
 * it opens.
 */
class InsightMessagingService : FirebaseMessagingService() {
  override fun onMessageReceived(message: RemoteMessage) {
    val insight = StoredInsight.fromPush(message.data) ?: return
    InsightStore.save(applicationContext, insight)
    // Runs on a background thread, and the work must be done before this returns.
    runBlocking { InsightWidget().updateAll(applicationContext) }
  }
}
