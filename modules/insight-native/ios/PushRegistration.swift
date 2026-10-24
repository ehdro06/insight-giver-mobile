import Foundation

/// The APNs device token the backend sends insight pushes to. iOS hands it over shortly after
/// launch (see InsightAppDelegateSubscriber); a caller that asks before the first registration has
/// finished waits for it.
enum PushRegistration {
  private static let tokenKey = "insightGiver.apnsDeviceToken"
  /// Only touched on the main queue.
  private static var waiting: [(String?) -> Void] = []

  /// Called on the main queue.
  static func didRegister(deviceToken: Data) {
    let token = deviceToken.map { String(format: "%02x", $0) }.joined()
    UserDefaults.standard.set(token, forKey: tokenKey)
    finishWaiting(with: token)
  }

  /// Called on the main queue.
  static func didFailToRegister() {
    finishWaiting(with: UserDefaults.standard.string(forKey: tokenKey))
  }

  /// Calls back on the main queue with the token, waiting up to `timeout` for the first registration.
  static func token(timeout: TimeInterval, completion: @escaping (String?) -> Void) {
    DispatchQueue.main.async {
      if let token = UserDefaults.standard.string(forKey: tokenKey) {
        completion(token)
        return
      }
      waiting.append(completion)
      DispatchQueue.main.asyncAfter(deadline: .now() + timeout) {
        finishWaiting(with: nil)
      }
    }
  }

  private static func finishWaiting(with token: String?) {
    let callbacks = waiting
    waiting.removeAll()
    callbacks.forEach { $0(token) }
  }
}

/// The APNs host this build's device tokens belong to, so the backend sends to the right one.
enum ApnsEnvironment {
  /// "SANDBOX" for builds signed for development (Xcode runs, development builds, the simulator),
  /// "PRODUCTION" for App Store, TestFlight and ad hoc builds.
  static let current: String = {
    #if targetEnvironment(simulator)
      return "SANDBOX"
    #else
      return provisioningProfileEnvironment() == "development" ? "SANDBOX" : "PRODUCTION"
    #endif
  }()

  /// App Store builds carry no provisioning profile. Every other build embeds the one it was signed
  /// with, whose entitlements name the APNs environment.
  private static func provisioningProfileEnvironment() -> String? {
    guard let url = Bundle.main.url(forResource: "embedded", withExtension: "mobileprovision"),
      let profile = try? Data(contentsOf: url),
      let start = profile.range(of: Data("<?xml".utf8)),
      let end = profile.range(of: Data("</plist>".utf8), in: start.upperBound..<profile.endIndex),
      let plist = try? PropertyListSerialization.propertyList(
        from: Data(profile[start.lowerBound..<end.upperBound]), format: nil) as? [String: Any],
      let entitlements = plist["Entitlements"] as? [String: Any]
    else {
      return nil
    }
    return entitlements["aps-environment"] as? String
  }
}
