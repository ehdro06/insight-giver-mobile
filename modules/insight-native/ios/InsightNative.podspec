Pod::Spec.new do |s|
  s.name           = 'InsightNative'
  s.version        = '0.1.0'
  s.summary        = 'Native insight pushes, widget storage and push registration for Insight Giver'
  s.description    = s.summary
  s.author         = ''
  s.homepage       = 'https://github.com/ehdro06/insight-giver-mobile'
  s.platforms      = {
    :ios => '16.4'
  }
  s.swift_version  = '5.0'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'WidgetKit'

  # Swift/Objective-C compatibility
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
