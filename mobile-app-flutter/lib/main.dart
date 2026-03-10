import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kDebugMode, debugPrint;
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:driver_mobile_app/l10n/app_localizations.dart';
import 'screens/auth/login_screen.dart';
import 'screens/dashboard/dashboard_screen.dart';
import 'services/auth_service.dart';
import 'services/sync_service.dart';
import 'services/offline_storage_service.dart';
import 'services/connectivity_service.dart';
import 'services/app_startup_service.dart';
import 'services/language_service.dart';
import 'services/location_service.dart';
import 'services/local_notification_service.dart';
import 'theme/app_theme.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize offline services
  await _initializeOfflineServices();

  await LocalNotificationService().initialize();

  await LocationService().resumeTrackingIfEnabled();

  // Initialize push services (native only; web safely skips)
  await initializePushPlatformServices();

  // Initialize language service and get saved locale
  final savedLocale = await LanguageService.getSavedLocale();

  runApp(MyApp(initialLocale: savedLocale));
}

Future<void> _initializeOfflineServices() async {
  try {
    // Initialize offline storage
    final offlineStorage = OfflineStorageService();
    await offlineStorage.initialize();

    // Initialize connectivity service
    final connectivityService = ConnectivityService();
    await connectivityService.initialize();

    // Initialize sync service
    final syncService = SyncService();
    await syncService.initialize();

    // Note: TripService and FuelService will need to be updated to use singleton pattern
    // or dependency injection for proper service management
    // For now, services will create their own sync service instances if needed

    // Start background sync if connected
    if (connectivityService.isConnected) {
      // Delay initial sync to allow app to fully load
      Future.delayed(const Duration(seconds: 3), () {
        syncService.syncPendingItems();
      });
    }
  } catch (e) {
    // Silently fail - app can still work without offline mode
    debugPrint('Failed to initialize offline services: $e');
  }
}

class MyApp extends StatefulWidget {
  final Locale initialLocale;

  const MyApp({
    super.key,
    required this.initialLocale,
  });

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  Locale _locale = const Locale('en');

  @override
  void initState() {
    super.initState();
    _locale = widget.initialLocale;
    _loadLocale();
  }

  Future<void> _loadLocale() async {
    final savedLocale = await LanguageService.getSavedLocale();
    if (mounted) {
      setState(() {
        _locale = savedLocale;
      });
    }
  }

  void setLocale(Locale locale) {
    setState(() {
      _locale = locale;
    });
    LanguageService.saveLocale(locale);
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'TIMS Driver',
      locale: _locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: LanguageService.supportedLocales,
      theme: ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        colorScheme: ColorScheme.dark(
          primary: AppTheme.sky500,
          secondary: AppTheme.sky400,
          surface: AppTheme.darkSurface,
          background: AppTheme.darkBackground,
          error: AppTheme.errorColor,
          onPrimary: Colors.white,
          onSecondary: Colors.white,
          onSurface: AppTheme.textPrimary,
          onBackground: AppTheme.textPrimary,
          onError: Colors.white,
        ),
        scaffoldBackgroundColor: AppTheme.darkBackground,
        primaryColor: AppTheme.sky500,
        cardTheme: CardThemeData(
          elevation: 0,
          shape: AppTheme.cardShape(),
          color: AppTheme.darkCard.withAlpha((255 * 0.8).round()),
          margin: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingLG,
            vertical: AppTheme.spacingSM,
          ),
        ),
        appBarTheme: AppBarTheme(
          elevation: 0,
          centerTitle: false,
          backgroundColor: AppTheme.darkSurface.withAlpha((255 * 0.9).round()),
          foregroundColor: AppTheme.textPrimary,
          iconTheme: const IconThemeData(color: AppTheme.textPrimary),
          titleTextStyle: const TextStyle(
            color: AppTheme.textPrimary,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: AppTheme.darkCard.withAlpha((255 * 0.6).round()),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            borderSide: BorderSide(
              color: AppTheme.sky500.withAlpha(51),
              width: 1.0,
            ),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            borderSide: BorderSide(
              color: AppTheme.slate700.withAlpha(128),
              width: 1.0,
            ),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            borderSide: BorderSide(
              color: AppTheme.sky500,
              width: 2.0,
            ),
          ),
          errorBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            borderSide: const BorderSide(
              color: AppTheme.errorColor,
              width: 1.0,
            ),
          ),
          labelStyle: const TextStyle(color: AppTheme.textSecondary),
          hintStyle: TextStyle(color: AppTheme.textTertiary),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppTheme.spacingLG,
            vertical: AppTheme.spacingMD,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            padding: AppTheme.paddingButton,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            ),
            elevation: 0,
            backgroundColor: AppTheme.sky500,
            foregroundColor: Colors.white,
          ),
        ),
        filledButtonTheme: FilledButtonThemeData(
          style: FilledButton.styleFrom(
            padding: AppTheme.paddingButton,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            ),
            elevation: 0,
            backgroundColor: AppTheme.sky500,
            foregroundColor: Colors.white,
          ),
        ),
        textTheme: const TextTheme(
          displayLarge: TextStyle(color: AppTheme.textPrimary),
          displayMedium: TextStyle(color: AppTheme.textPrimary),
          displaySmall: TextStyle(color: AppTheme.textPrimary),
          headlineLarge: TextStyle(color: AppTheme.textPrimary),
          headlineMedium: TextStyle(color: AppTheme.textPrimary),
          headlineSmall: TextStyle(color: AppTheme.textPrimary),
          titleLarge: TextStyle(color: AppTheme.textPrimary),
          titleMedium: TextStyle(color: AppTheme.textPrimary),
          titleSmall: TextStyle(color: AppTheme.textPrimary),
          bodyLarge: TextStyle(color: AppTheme.textPrimary),
          bodyMedium: TextStyle(color: AppTheme.textSecondary),
          bodySmall: TextStyle(color: AppTheme.textTertiary),
          labelLarge: TextStyle(color: AppTheme.textPrimary),
          labelMedium: TextStyle(color: AppTheme.textSecondary),
          labelSmall: TextStyle(color: AppTheme.textTertiary),
        ),
        iconTheme: const IconThemeData(color: AppTheme.textPrimary),
        dividerColor: AppTheme.slate700,
        dividerTheme: DividerThemeData(
          color: AppTheme.slate700.withAlpha(128),
          thickness: 1.0,
          space: 1.0,
        ),
      ),
      home: const AuthWrapper(),
      debugShowCheckedModeBanner: false,
      builder: (context, child) {
        // Listen for locale changes from LanguageService
        return MyAppInheritedWidget(
          setLocale: setLocale,
          child: child!,
        );
      },
    );
  }
}

/// Inherited widget to provide locale change callback to child widgets
class MyAppInheritedWidget extends InheritedWidget {
  final void Function(Locale) setLocale;

  const MyAppInheritedWidget({
    required this.setLocale,
    required super.child,
  });

  static MyAppInheritedWidget? of(BuildContext context) {
    return context.dependOnInheritedWidgetOfExactType<MyAppInheritedWidget>();
  }

  @override
  bool updateShouldNotify(MyAppInheritedWidget oldWidget) {
    return setLocale != oldWidget.setLocale;
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  final AuthService _authService = AuthService();
  bool _isLoading = true;
  bool _isAuthenticated = false;

  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final isAuth = await _authService.isAuthenticated();
    setState(() {
      _isAuthenticated = isAuth;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return _isAuthenticated
        ? const DashboardScreen()
        : const LoginScreen();
  }
}
