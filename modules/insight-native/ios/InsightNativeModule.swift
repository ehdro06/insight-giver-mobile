import ExpoModulesCore
import FirebaseMessaging
import WidgetKit

struct InsightRecord: Record {
  @Field var id: String = ""
  @Field var body: String = ""
  @Field var preview: String?
  @Field var createdAt: String = ""
  @Field var revealed: Bool = false

  init() {}

  init(_ insight: StoredInsight) {
    id = insight.id
    body = insight.body
    preview = insight.preview
    createdAt = insight.createdAt
    revealed = insight.revealed
  }

  var storedInsight: StoredInsight {
    StoredInsight(id: id, body: body, preview: preview, createdAt: createdAt, revealed: revealed)
  }
}

public class InsightNativeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("InsightNative")

    Function("getInsight") { () -> InsightRecord? in
      InsightStore.load().map(InsightRecord.init)
    }

    Function("setInsight") { (record: InsightRecord) in
      InsightStore.save(record.storedInsight)
      WidgetCenter.shared.reloadAllTimelines()
    }

    AsyncFunction("getPushTokenAsync") { (promise: Promise) in
      guard FirebaseSetup.isConfigured else {
        promise.resolve(nil)
        return
      }
      // Fails until APNs has handed over a device token; the app asks again on its next launch.
      Messaging.messaging().token { token, _ in
        promise.resolve(token)
      }
    }
  }
}
