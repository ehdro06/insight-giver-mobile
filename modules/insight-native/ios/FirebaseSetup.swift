import FirebaseCore

enum FirebaseSetup {
  /// Firebase needs GoogleService-Info.plist, which app.config.ts bundles only when the file
  /// exists. Without it the app still works; it just never receives pushes.
  static func configureIfPossible() {
    guard FirebaseApp.app() == nil,
      Bundle.main.path(forResource: "GoogleService-Info", ofType: "plist") != nil
    else {
      return
    }
    FirebaseApp.configure()
  }

  static var isConfigured: Bool {
    FirebaseApp.app() != nil
  }
}
