import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:driver_mobile_app/l10n/app_localizations.dart';
import '../../main.dart';
import '../../services/auth_service.dart';
import '../../services/biometric_service.dart';
import '../../services/language_service.dart';
import '../../services/location_service.dart';
import '../auth/login_screen.dart';
import '../dashboard/dashboard_screen.dart';
import 'about_screen.dart';
import 'password_change_screen.dart';
import 'help_support_screen.dart';
import 'offline_sync_screen.dart';
import 'api_config_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final AuthService _authService = AuthService();
  final BiometricService _biometricService = BiometricService();
  final LocationService _locationService = LocationService();
  
  bool _biometricEnabled = false;
  bool _locationTrackingEnabled = true;
  bool _pushNotificationsEnabled = true;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final prefs = await SharedPreferences.getInstance();
      final biometricEnabled = await _biometricService.isEnabled();
      final biometricAvailable = await _biometricService.isAvailable();

      setState(() {
        _biometricEnabled = biometricEnabled && biometricAvailable;
        _locationTrackingEnabled = prefs.getBool('location_tracking_enabled') ?? true;
        _pushNotificationsEnabled = prefs.getBool('push_notifications_enabled') ?? true;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleBiometric(bool value) async {
    if (value) {
      // Check if biometric is available
      final isAvailable = await _biometricService.isAvailable();
      if (!isAvailable) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Biometric authentication is not available on this device'),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      // Authenticate to enable
      final authenticated = await _biometricService.authenticate(
        reason: 'Authenticate to enable biometric login',
      );

      if (!authenticated) {
        return; // User cancelled
      }

      await _biometricService.enable();
    } else {
      await _biometricService.disable();
    }

    setState(() {
      _biometricEnabled = value;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(value ? 'Biometric authentication enabled' : 'Biometric authentication disabled'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _toggleLocationTracking(bool value) async {
    if (value) {
      try {
        await _locationService.startBackgroundTracking(persistPreference: false);
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Unable to start location tracking: ${e.toString()}'),
              backgroundColor: Colors.red,
            ),
          );
        }
        return;
      }
    } else {
      await _locationService.stopBackgroundTracking(persistPreference: false);
    }

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('location_tracking_enabled', value);

    setState(() {
      _locationTrackingEnabled = value;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(value ? 'Location tracking enabled' : 'Location tracking disabled'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _togglePushNotifications(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('push_notifications_enabled', value);
    setState(() {
      _pushNotificationsEnabled = value;
    });

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(value ? 'Push notifications enabled' : 'Push notifications disabled'),
          backgroundColor: Colors.green,
        ),
      );
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Logout', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await _authService.logout();
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            Navigator.of(context).pushReplacement(
              MaterialPageRoute(builder: (_) => const DashboardScreen()),
            );
          },
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Account Section
                _buildSectionHeader('Account'),
                _buildSettingTile(
                  icon: Icons.person,
                  title: 'Profile',
                  subtitle: 'View and edit your profile',
                  onTap: () {
                    // Navigate to profile tab in dashboard
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const DashboardScreen()),
                    );
                  },
                ),
                _buildSettingTile(
                  icon: Icons.lock,
                  title: 'Change Password',
                  subtitle: 'Update your account password',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const PasswordChangeScreen()),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Security Section
                _buildSectionHeader('Security'),
                FutureBuilder<bool>(
                  future: _biometricService.isAvailable(),
                  builder: (context, snapshot) {
                    if (!snapshot.hasData || !snapshot.data!) {
                      return const SizedBox.shrink();
                    }
                    return FutureBuilder<String>(
                      future: _biometricService.getBiometricTypeName(),
                      builder: (context, nameSnapshot) {
                        return SwitchListTile(
                          secondary: const Icon(Icons.fingerprint),
                          title: const Text('Biometric Authentication'),
                          subtitle: Text(nameSnapshot.data ?? 'Fingerprint/Face ID'),
                          value: _biometricEnabled,
                          onChanged: _toggleBiometric,
                        );
                      },
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Notifications Section
                _buildSectionHeader('Notifications'),
                SwitchListTile(
                  secondary: const Icon(Icons.notifications),
                  title: const Text('Push Notifications'),
                  subtitle: const Text('Receive notifications from dispatchers'),
                  value: _pushNotificationsEnabled,
                  onChanged: _togglePushNotifications,
                ),
                const SizedBox(height: 24),

                // Location Section
                _buildSectionHeader('Location'),
                SwitchListTile(
                  secondary: const Icon(Icons.location_on),
                  title: const Text('Location Tracking'),
                  subtitle: const Text('Track your location during trips'),
                  value: _locationTrackingEnabled,
                  onChanged: _toggleLocationTracking,
                ),
                const SizedBox(height: 24),

                // General Section
                _buildSectionHeader('General'),
                _buildLanguageSelector(),
                _buildSettingTile(
                  icon: Icons.settings_ethernet,
                  title: 'API Configuration',
                  subtitle: 'Configure API server URL for physical devices',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const ApiConfigScreen()),
                    );
                  },
                ),
                _buildSettingTile(
                  icon: Icons.sync,
                  title: 'Offline Sync',
                  subtitle: 'View and manage pending sync items',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const OfflineSyncScreen()),
                    );
                  },
                ),
                _buildSettingTile(
                  icon: Icons.help_outline,
                  title: 'Help & Support',
                  subtitle: 'FAQs, tutorials, and contact support',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const HelpSupportScreen()),
                    );
                  },
                ),
                _buildSettingTile(
                  icon: Icons.info_outline,
                  title: 'About',
                  subtitle: 'App version and information',
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(builder: (_) => const AboutScreen()),
                    );
                  },
                ),
                const SizedBox(height: 24),

                // Danger Zone
                _buildSectionHeader('Account Actions'),
                _buildSettingTile(
                  icon: Icons.logout,
                  title: 'Logout',
                  subtitle: 'Sign out of your account',
                  titleColor: Colors.red,
                  iconColor: Colors.red,
                  onTap: _handleLogout,
                ),
                const SizedBox(height: 40),
              ],
            ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12, top: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildLanguageSelector() {
    final l10n = AppLocalizations.of(context)!;
    return FutureBuilder<Locale>(
      future: LanguageService.getSavedLocale(),
      builder: (context, snapshot) {
        final currentLocale = snapshot.data ?? const Locale('en');
        final currentLanguage = LanguageService.getSupportedLanguages()
            .firstWhere((lang) => lang['locale'] == currentLocale, orElse: () => LanguageService.getSupportedLanguages().first);
        
        return ListTile(
          leading: const Icon(Icons.language, color: Colors.blue),
          title: Text(l10n.language),
          subtitle: Text(currentLanguage['nativeName'] as String),
          trailing: const Icon(Icons.chevron_right),
          onTap: () => _showLanguageDialog(context),
        );
      },
    );
  }

  Future<void> _showLanguageDialog(BuildContext context) async {
    final l10n = AppLocalizations.of(context)!;
    final currentLocale = await LanguageService.getSavedLocale();
    final languages = LanguageService.getSupportedLanguages();

    final selectedLocale = await showDialog<Locale>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.selectLanguage),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: languages.map((lang) {
            final locale = lang['locale'] as Locale;
            final nativeName = lang['nativeName'] as String;
            final isSelected = locale == currentLocale;
            
            return RadioListTile<Locale>(
              title: Text(nativeName),
              value: locale,
              groupValue: currentLocale,
              onChanged: (value) {
                Navigator.of(context).pop(value);
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(l10n.cancel),
          ),
        ],
      ),
    );

    if (selectedLocale != null && selectedLocale != currentLocale) {
      await LanguageService.saveLocale(selectedLocale);
      
      // Update locale using inherited widget
      if (context.mounted) {
        final inherited = MyAppInheritedWidget.of(context);
        if (inherited != null) {
          inherited.setLocale(selectedLocale);
          
          // Show success message
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${l10n.language} changed successfully'),
              backgroundColor: Colors.green,
              duration: const Duration(seconds: 2),
            ),
          );
        }
      }
    }
  }

  Widget _buildSettingTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color? titleColor,
    Color? iconColor,
  }) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? Theme.of(context).primaryColor),
      title: Text(
        title,
        style: TextStyle(
          color: titleColor,
          fontWeight: FontWeight.w500,
        ),
      ),
      subtitle: Text(subtitle),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}


