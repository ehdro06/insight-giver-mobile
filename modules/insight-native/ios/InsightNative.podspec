Pod::Spec.new do |s|
  s.name           = 'InsightNative'
  s.version        = '0.1.0'
  s.summary        = 'Native insight pushes, widget storage and FCM token for Insight Giver'
  s.description    = s.summary
  s.author         = ''
  s.homepage       = 'https://github.com/ehdro06/insight-giver-mobile'
  s.platforms      = {
    :ios => '16.4'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  # 12.x is the last Firebase line published to CocoaPods; 13.0+ ships only through SwiftPM.
  s.dependency 'FirebaseMessaging', '~> 12.16'
  s.frameworks = 'WidgetKit'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
