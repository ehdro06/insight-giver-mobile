package com.insightgiver.insightnative

import android.content.Context
import androidx.glance.appwidget.updateAll
import com.google.firebase.FirebaseApp
import com.google.firebase.messaging.FirebaseMessaging
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import kotlinx.coroutines.launch

class InsightRecord : Record {
  @Field var id: String = ""
  @Field var body: String = ""
  @Field var preview: String? = null
  @Field var createdAt: String = ""
  @Field var revealed: Boolean = false

  fun toStoredInsight() = StoredInsight(id, body, preview, createdAt, revealed)

  companion object {
    fun from(insight: StoredInsight) = InsightRecord().apply {
      id = insight.id
      body = insight.body
      preview = insight.preview
      createdAt = insight.createdAt
      revealed = insight.revealed
    }
  }
}

class InsightNativeModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.ReactContextLost()

  override fun definition() = ModuleDefinition {
    Name("InsightNative")

    Function("getInsight") {
      InsightStore.load(context)?.let { InsightRecord.from(it) }
    }

    Function("setInsight") { record: InsightRecord ->
      store(record.toStoredInsight())
    }

    AsyncFunction("getPushTokenAsync") { promise: Promise ->
      // Firebase initializes itself only when google-services.json was bundled (see app.config.ts).
      if (FirebaseApp.getApps(context).isEmpty()) {
        promise.resolve(null)
      } else {
        FirebaseMessaging.getInstance().token.addOnCompleteListener { task ->
          promise.resolve(if (task.isSuccessful) task.result else null)
        }
      }
    }
  }

  private fun store(insight: StoredInsight) {
    val reactContext = context
    InsightStore.save(reactContext, insight)
    appContext.backgroundCoroutineScope.launch { InsightWidget().updateAll(reactContext) }
  }
}
