import SwiftUI
import WidgetKit

/// The insight the app shares through the App Group. Same JSON as
/// modules/insight-native/ios/InsightStore.swift writes; change both together.
struct StoredInsight: Codable {
  var id: String
  var body: String
  var preview: String?
  var createdAt: String
  var revealed: Bool

  /// Shows only the teaser until the app has been opened. That tap is the point: opening the app is
  /// the engagement iOS rations background pushes by.
  var isTeaser: Bool { preview != nil && !revealed }

  var widgetText: String { isTeaser ? preview ?? body : body }

  static let sample = StoredInsight(
    id: "sample",
    body: "Two weeks ago the river run cleared your head too. Funny how it keeps doing that.",
    preview: nil,
    createdAt: "",
    revealed: true)
}

enum InsightStore {
  /// The containing app's Info.plist names the App Group (the config plugin writes it there), and
  /// an extension can read its containing app's bundle.
  static func load() -> StoredInsight? {
    let appBundleURL = Bundle.main.bundleURL.deletingLastPathComponent().deletingLastPathComponent()
    guard let group = Bundle(url: appBundleURL)?.object(forInfoDictionaryKey: "InsightGiverAppGroup") as? String,
      let data = UserDefaults(suiteName: group)?.data(forKey: "insight")
    else {
      return nil
    }
    return try? JSONDecoder().decode(StoredInsight.self, from: data)
  }
}

struct InsightEntry: TimelineEntry {
  let date: Date
  let insight: StoredInsight?
}

struct InsightProvider: TimelineProvider {
  func placeholder(in context: Context) -> InsightEntry {
    InsightEntry(date: .now, insight: .sample)
  }

  func getSnapshot(in context: Context, completion: @escaping (InsightEntry) -> Void) {
    completion(InsightEntry(date: .now, insight: context.isPreview ? .sample : InsightStore.load()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<InsightEntry>) -> Void) {
    // Nothing to schedule: the app reloads the widget whenever a push or the app changes the insight.
    completion(Timeline(entries: [InsightEntry(date: .now, insight: InsightStore.load())], policy: .never))
  }
}

struct InsightWidgetView: View {
  @Environment(\.widgetFamily) private var family
  let entry: InsightEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("\u{2726} from your diary")
        .font(.caption2.weight(.semibold))
        .foregroundStyle(Color("$accent"))

      if let insight = entry.insight {
        Text(insight.widgetText)
          .font(family == .systemSmall ? .footnote : .callout)
          .foregroundStyle(Color("insightText"))
        Spacer(minLength: 0)
        if insight.isTeaser {
          Text("Tap to read the rest")
            .font(.caption2)
            .foregroundStyle(.secondary)
        }
      } else {
        Text("Write a few thoughts in the app. One day soon, something you wrote finds its way back here.")
          .font(.footnote)
          .foregroundStyle(.secondary)
        Spacer(minLength: 0)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
    .widgetURL(destination)
    .containerBackground(for: .widget) {
      Color("$widgetBackground")
    }
  }

  /// Handled by Expo Router: src/app/insight/[id].tsx, or the diary when there is no insight yet.
  private var destination: URL? {
    guard let id = entry.insight?.id else {
      return URL(string: "insightgiver://")
    }
    return URL(string: "insightgiver://insight/\(id)")
  }
}

@main
struct InsightWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "InsightWidget", provider: InsightProvider()) { entry in
      InsightWidgetView(entry: entry)
    }
    .configurationDisplayName("Insight")
    .description("Something you wrote, coming back to you once a day.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
