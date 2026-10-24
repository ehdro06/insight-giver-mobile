import Foundation

/// The latest insight as the widget shows it. Stored as JSON under `InsightStore.key` in the App
/// Group's UserDefaults; the widget extension decodes the same shape
/// (targets/widget/InsightWidget.swift), so change both together.
struct StoredInsight: Codable, Equatable {
  var id: String
  var body: String
  /// Teaser shown instead of `body` until the app has been opened.
  var preview: String?
  var createdAt: String
  var revealed: Bool
}

extension StoredInsight {
  /// Reads the data of an insight push. The keys are set by the backend's InsightPayload.
  init?(push userInfo: [AnyHashable: Any]) {
    guard userInfo["type"] as? String == "insight",
      let id = userInfo["insightId"] as? String,
      let body = userInfo["body"] as? String,
      let createdAt = userInfo["createdAt"] as? String
    else {
      return nil
    }
    self.init(id: id, body: body, preview: userInfo["preview"] as? String, createdAt: createdAt, revealed: false)
  }
}

enum InsightStore {
  static let key = "insight"

  /// The App Group shared with the widget; the config plugin writes it into Info.plist.
  private static var defaults: UserDefaults? {
    guard let group = Bundle.main.object(forInfoDictionaryKey: "InsightGiverAppGroup") as? String else {
      return nil
    }
    return UserDefaults(suiteName: group)
  }

  static func load() -> StoredInsight? {
    guard let data = defaults?.data(forKey: key) else {
      return nil
    }
    return try? JSONDecoder().decode(StoredInsight.self, from: data)
  }

  static func save(_ insight: StoredInsight) {
    guard let defaults, let data = try? JSONEncoder().encode(insight) else {
      return
    }
    defaults.set(data, forKey: key)
  }
}
