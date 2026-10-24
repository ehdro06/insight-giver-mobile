import ExpoModulesCore
import FirebaseMessaging
import WidgetKit

/// Handles insight pushes without React Native. A silent push launches the app in the background
/// without connecting a scene, and React Native only starts when a scene connects
/// (`ExpoAppSceneDelegate`), so the JavaScript engine never boots for these: the payload is
/// parsed, stored in the App Group and the widget reloaded, all in native code.
public class InsightAppDelegateSubscriber: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    FirebaseSetup.configureIfPossible()
    // Silent pushes need no permission prompt, only an APNs registration.
    application.registerForRemoteNotifications()
    return true
  }

  public func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
    // Firebase's app delegate swizzling is off (FirebaseAppDelegateProxyEnabled), so hand the token over here.
    if FirebaseSetup.isConfigured {
      Messaging.messaging().apnsToken = deviceToken
    }
  }

  public func application(
    _ application: UIApplication,
    didReceiveRemoteNotification userInfo: [AnyHashable: Any],
    fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
  ) {
    guard let insight = StoredInsight(push: userInfo) else {
      completionHandler(.noData)
      return
    }
    if FirebaseSetup.isConfigured {
      Messaging.messaging().appDidReceiveMessage(userInfo)
    }
    InsightStore.save(insight)
    WidgetCenter.shared.reloadAllTimelines()
    completionHandler(.newData)
  }
}
