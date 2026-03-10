import 'app_startup_service_mobile.dart'
    if (dart.library.html) 'app_startup_service_web.dart';

Future<void> initializePushPlatformServices() => initializePushPlatformServicesImpl();
