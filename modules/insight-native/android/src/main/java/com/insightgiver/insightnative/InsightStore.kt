package com.insightgiver.insightnative

import android.content.Context
import android.content.SharedPreferences
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import org.json.JSONException
import org.json.JSONObject

/** The latest insight as the widget shows it. */
data class StoredInsight(
  val id: String,
  val body: String,
  /** Teaser shown instead of [body] until the app has been opened. */
  val preview: String?,
  val createdAt: String,
  val revealed: Boolean,
) {
  /**
   * Only the teaser until the app is opened. The tap is the point: opening the app is the
   * engagement Android's app standby buckets ration background pushes by.
   */
  val isTeaser: Boolean
    get() = preview != null && !revealed

  val widgetText: String
    get() = preview?.takeIf { !revealed } ?: body

  fun toJson(): String =
    JSONObject()
      .put("id", id)
      .put("body", body)
      .put("preview", preview ?: JSONObject.NULL)
      .put("createdAt", createdAt)
      .put("revealed", revealed)
      .toString()

  companion object {
    fun fromJson(json: String): StoredInsight? =
      try {
        val obj = JSONObject(json)
        StoredInsight(
          id = obj.getString("id"),
          body = obj.getString("body"),
          preview = if (obj.isNull("preview")) null else obj.getString("preview"),
          createdAt = obj.getString("createdAt"),
          revealed = obj.optBoolean("revealed"),
        )
      } catch (e: JSONException) {
        null
      }

    /** Reads the data of an insight push. The keys are set by the backend's InsightPayload. */
    fun fromPush(data: Map<String, String>): StoredInsight? {
      if (data["type"] != "insight") {
        return null
      }
      return StoredInsight(
        id = data["insightId"] ?: return null,
        body = data["body"] ?: return null,
        preview = data["preview"],
        createdAt = data["createdAt"] ?: return null,
        revealed = false,
      )
    }
  }
}

/**
 * SharedPreferences shared by the push service, the Glance widget and the React Native app
 * (through [InsightNativeModule]), so all three see the same insight.
 */
object InsightStore {
  private const val PREFERENCES = "insight_giver_widget"
  private const val KEY = "insight"

  fun load(context: Context): StoredInsight? =
    preferences(context).getString(KEY, null)?.let { StoredInsight.fromJson(it) }

  fun save(context: Context, insight: StoredInsight) {
    // commit, not apply: the push service can be torn down as soon as it returns.
    preferences(context).edit().putString(KEY, insight.toJson()).commit()
  }

  /** The stored insight now and after every change; keeps a running widget session current. */
  fun observe(context: Context): Flow<StoredInsight?> = callbackFlow {
    val preferences = preferences(context)
    val listener = SharedPreferences.OnSharedPreferenceChangeListener { _, key ->
      if (key == KEY) {
        trySend(load(context))
      }
    }
    preferences.registerOnSharedPreferenceChangeListener(listener)
    trySend(load(context))
    awaitClose { preferences.unregisterOnSharedPreferenceChangeListener(listener) }
  }

  private fun preferences(context: Context): SharedPreferences =
    context.applicationContext.getSharedPreferences(PREFERENCES, Context.MODE_PRIVATE)
}
