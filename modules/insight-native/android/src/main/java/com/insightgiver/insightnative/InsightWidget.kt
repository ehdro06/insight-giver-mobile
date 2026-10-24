package com.insightgiver.insightnative

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.appWidgetBackground
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Column
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle

class InsightWidget : GlanceAppWidget() {
  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      // Observed rather than read once, so a push that lands while this session is alive shows up.
      val insight by remember { InsightStore.observe(context) }.collectAsState(InsightStore.load(context))
      GlanceTheme {
        InsightContent(context, insight)
      }
    }
  }
}

class InsightWidgetReceiver : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = InsightWidget()
}

@Composable
private fun InsightContent(context: Context, insight: StoredInsight?) {
  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .appWidgetBackground()
      .background(GlanceTheme.colors.widgetBackground)
      .padding(16.dp)
      .clickable(actionStartActivity(openApp(context, insight))),
  ) {
    Text(
      text = context.getString(R.string.insight_widget_title),
      style = TextStyle(color = GlanceTheme.colors.primary, fontSize = 11.sp, fontWeight = FontWeight.Medium),
    )
    Spacer(GlanceModifier.height(6.dp))
    if (insight != null) {
      Text(
        text = insight.widgetText,
        style = TextStyle(color = GlanceTheme.colors.onSurface, fontSize = 14.sp),
        maxLines = 8,
      )
      Spacer(GlanceModifier.defaultWeight())
      if (insight.isTeaser) {
        Text(
          text = context.getString(R.string.insight_widget_teaser_hint),
          style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant, fontSize = 11.sp),
        )
      }
    } else {
      Text(
        text = context.getString(R.string.insight_widget_empty),
        style = TextStyle(color = GlanceTheme.colors.onSurfaceVariant, fontSize = 13.sp),
      )
    }
  }
}

/**
 * Deep link handled by Expo Router: src/app/insight/[id].tsx, or the diary before the first
 * insight. Prebuild registers the app's `insightgiver` scheme on the main activity.
 */
private fun openApp(context: Context, insight: StoredInsight?): Intent {
  val uri = if (insight != null) "insightgiver://insight/${insight.id}" else "insightgiver://"
  return Intent(Intent.ACTION_VIEW, Uri.parse(uri)).setPackage(context.packageName)
}
