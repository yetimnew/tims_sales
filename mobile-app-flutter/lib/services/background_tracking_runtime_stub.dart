class BackgroundTrackingRuntime {
  bool get supported => false;

  Future<void> initialize() async {}

  Future<bool> start() async => false;

  Future<void> stop() async {}

  Future<bool> isRunning() async => false;
}

BackgroundTrackingRuntime createBackgroundTrackingRuntime() => BackgroundTrackingRuntime();
