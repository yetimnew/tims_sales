import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../services/biometric_service.dart';
import '../../services/api_config_service.dart';
import '../dashboard/dashboard_screen.dart';
import '../settings/api_config_screen.dart';
import 'forgot_password_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final AuthService _authService = AuthService();
  final BiometricService _biometricService = BiometricService();
  bool _isLoading = false;
  bool _showPassword = false;
  bool _rememberMe = false;
  bool _biometricAvailable = false;
  bool _biometricEnabled = false;
  String? _biometricTypeName;
  String? _errorMessage;
  String? _emailError;
  String? _passwordError;
  bool _emailTouched = false;
  bool _passwordTouched = false;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Color scheme matching web design
  static const Color _darkBg = Color(0xFF0F172A); // slate-950
  static const Color _darkSurface = Color(0xFF1E293B); // slate-800
  static const Color _darkCard = Color(0xFF1E293B); // slate-800
  static const Color _sky400 = Color(0xFF38BDF8); // sky-400
  static const Color _sky500 = Color(0xFF0EA5E9); // sky-500
  static const Color _sky600 = Color(0xFF0284C7); // sky-600
  static const Color _blue600 = Color(0xFF2563EB); // blue-600
  static const Color _slate400 = Color(0xFF94A3B8); // slate-400
  static const Color _slate500 = Color(0xFF64748B); // slate-500
  static const Color _slate700 = Color(0xFF475569); // slate-700

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 0.1),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeOut),
    );
    _animationController.forward();
    _checkBiometricAvailability();
    _checkStoredCredentials();
  }

  Future<void> _checkBiometricAvailability() async {
    final isAvailable = await _biometricService.isAvailable();
    final isEnabled = await _biometricService.isEnabled();
    final typeName = await _biometricService.getBiometricTypeName();
    
    if (mounted) {
      setState(() {
        _biometricAvailable = isAvailable;
        _biometricEnabled = isEnabled;
        _biometricTypeName = typeName;
      });
    }
  }

  Future<void> _checkStoredCredentials() async {
    final credentials = await _biometricService.getStoredCredentials();
    if (credentials['email'] != null && credentials['password'] != null) {
      if (mounted) {
        setState(() {
          _emailController.text = credentials['email'] ?? '';
          _rememberMe = true;
        });
      }
      
      // Auto-trigger biometric if enabled and available
      if (_biometricAvailable && _biometricEnabled) {
        Future.delayed(const Duration(milliseconds: 500), () {
          _handleBiometricLogin();
        });
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Email address is required';
    }
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value.trim())) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    return null;
  }

  bool _isFormValid() {
    return _emailController.text.trim().isNotEmpty &&
        _passwordController.text.isNotEmpty &&
        _validateEmail(_emailController.text) == null &&
        _validatePassword(_passwordController.text) == null;
  }

  Future<void> _handleLogin() async {
    setState(() {
      _emailTouched = true;
      _passwordTouched = true;
      _emailError = _validateEmail(_emailController.text);
      _passwordError = _validatePassword(_passwordController.text);
    });

    if (!_formKey.currentState!.validate() || !_isFormValid()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final email = _emailController.text.trim().toLowerCase();
    final password = _passwordController.text;

    final result = await _authService.login(email, password);

    setState(() {
      _isLoading = false;
    });

    if (result['success'] == true) {
      // Store credentials if remember me is checked and biometric is available
      if (_rememberMe && _biometricAvailable) {
        await _biometricService.storeCredentials(email, password);
        await _biometricService.enable();
      } else if (!_rememberMe) {
        await _biometricService.disable();
        await _biometricService.clearCredentials();
      }
      
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      }
    } else {
      setState(() {
        _errorMessage = result['error'] ?? 'Login failed. Please try again.';
      });
    }
  }

  Future<void> _handleBiometricLogin() async {
    if (!_biometricAvailable || !_biometricEnabled) {
      return;
    }

    final authenticated = await _biometricService.authenticate(
      reason: 'Authenticate to access your TIMS account',
    );

    if (!authenticated) {
      return; // User cancelled or authentication failed
    }

    // Get stored credentials
    final credentials = await _biometricService.getStoredCredentials();
    if (credentials['email'] == null || credentials['password'] == null) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
      _emailController.text = credentials['email'] ?? '';
    });

    final result = await _authService.login(
      credentials['email']!,
      credentials['password']!,
    );

    setState(() {
      _isLoading = false;
    });

    if (result['success'] == true) {
      if (mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const DashboardScreen()),
        );
      }
    } else {
      setState(() {
        _errorMessage = 'Biometric login failed. Please try again.';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              _darkBg,
              const Color(0xFF1E293B), // slate-800
              const Color(0xFF1E3A8A), // blue-950
            ],
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnimation,
            child: SlideTransition(
              position: _slideAnimation,
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 40),
                      // Logo/Icon
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: _sky500.withAlpha(25),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.local_shipping_rounded,
                          size: 48,
                          color: _sky400,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Secure Access Badge
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: _sky500.withAlpha(25),
                          border: Border.all(color: _sky500.withAlpha(51)),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(Icons.shield, size: 16, color: _sky400),
                            const SizedBox(width: 8),
                            Text(
                              'SECURE ACCESS',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: _sky400,
                                letterSpacing: 1.2,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 20),

                      // Header
                      const Text(
                        'Welcome Back',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Access the TIMS control tower',
                        style: TextStyle(
                          fontSize: 16,
                          color: _slate400,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),

                      // Login Card (Glass Morphism)
                      Container(
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          color: _darkCard.withAlpha(204), // 80% opacity
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(
                            color: _slate700.withAlpha(128), // 50% opacity
                            width: 1,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(76),
                              blurRadius: 20,
                              spreadRadius: 0,
                              offset: const Offset(0, 10),
                            ),
                          ],
                        ),
                        child: Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              // Email Field
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        'Email Address',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white.withAlpha(230),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Text(
                                        '*',
                                        style: TextStyle(
                                          color: Colors.red,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    controller: _emailController,
                                    style: const TextStyle(color: Colors.white),
                                    decoration: InputDecoration(
                                      hintText: 'email@example.com',
                                      hintStyle: TextStyle(color: _slate500),
                                      prefixIcon: Icon(Icons.email_outlined, color: _slate400),
                                      filled: true,
                                      fillColor: _darkSurface.withAlpha(128), // 50% opacity
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: _slate700,
                                          width: 1,
                                        ),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: _emailError != null ? Colors.red : _slate700,
                                          width: 1,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: _emailError != null ? Colors.red : _sky500,
                                          width: 2,
                                        ),
                                      ),
                                      errorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                          color: Colors.red,
                                          width: 1,
                                        ),
                                      ),
                                      focusedErrorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                          color: Colors.red,
                                          width: 2,
                                        ),
                                      ),
                                      contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 16,
                                      ),
                                    ),
                                    keyboardType: TextInputType.emailAddress,
                                    textCapitalization: TextCapitalization.none,
                                    autocorrect: false,
                                    onChanged: (value) {
                                      if (_emailTouched) {
                                        setState(() {
                                          _emailError = _validateEmail(value);
                                        });
                                      }
                                    },
                                    onTap: () {
                                      setState(() {
                                        _emailTouched = true;
                                      });
                                    },
                                    validator: _validateEmail,
                                  ),
                                  if (_emailError != null && _emailTouched) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Text('⚠', style: TextStyle(fontSize: 16)),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            _emailError!,
                                            style: const TextStyle(
                                              color: Colors.red,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 20),

                              // Password Field
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(
                                        'Password',
                                        style: TextStyle(
                                          fontSize: 14,
                                          fontWeight: FontWeight.w600,
                                          color: Colors.white.withAlpha(230),
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Text(
                                        '*',
                                        style: TextStyle(
                                          color: Colors.red,
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  TextFormField(
                                    controller: _passwordController,
                                    style: const TextStyle(color: Colors.white),
                                    obscureText: !_showPassword,
                                    decoration: InputDecoration(
                                      hintText: 'Enter your password',
                                      hintStyle: TextStyle(color: _slate500),
                                      prefixIcon: Icon(Icons.lock_outlined, color: _slate400),
                                      suffixIcon: IconButton(
                                        icon: Icon(
                                          _showPassword ? Icons.visibility_off : Icons.visibility,
                                          color: _slate400,
                                        ),
                                        onPressed: () {
                                          setState(() {
                                            _showPassword = !_showPassword;
                                          });
                                        },
                                      ),
                                      filled: true,
                                      fillColor: _darkSurface.withAlpha(128), // 50% opacity
                                      border: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: _slate700,
                                          width: 1,
                                        ),
                                      ),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: _passwordError != null ? Colors.red : _slate700,
                                          width: 1,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: BorderSide(
                                          color: _passwordError != null ? Colors.red : _sky500,
                                          width: 2,
                                        ),
                                      ),
                                      errorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                          color: Colors.red,
                                          width: 1,
                                        ),
                                      ),
                                      focusedErrorBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.circular(12),
                                        borderSide: const BorderSide(
                                          color: Colors.red,
                                          width: 2,
                                        ),
                                      ),
                                      contentPadding: const EdgeInsets.symmetric(
                                        horizontal: 16,
                                        vertical: 16,
                                      ),
                                    ),
                                    onChanged: (value) {
                                      if (_passwordTouched) {
                                        setState(() {
                                          _passwordError = _validatePassword(value);
                                        });
                                      }
                                    },
                                    onTap: () {
                                      setState(() {
                                        _passwordTouched = true;
                                      });
                                    },
                                    validator: _validatePassword,
                                  ),
                                  if (_passwordError != null && _passwordTouched) ...[
                                    const SizedBox(height: 6),
                                    Row(
                                      children: [
                                        const Text('⚠', style: TextStyle(fontSize: 16)),
                                        const SizedBox(width: 4),
                                        Expanded(
                                          child: Text(
                                            _passwordError!,
                                            style: const TextStyle(
                                              color: Colors.red,
                                              fontSize: 12,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ],
                                ],
                              ),
                              const SizedBox(height: 20),

                              // Remember Me & Forgot Password
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      Checkbox(
                                        value: _rememberMe,
                                        onChanged: (value) {
                                          setState(() {
                                            _rememberMe = value ?? false;
                                          });
                                        },
                                        checkColor: Colors.white,
                                        fillColor: WidgetStateProperty.resolveWith<Color>(
                                          (Set<WidgetState> states) {
                                            if (states.contains(WidgetState.selected)) {
                                              return _sky600;
                                            }
                                            return Colors.transparent;
                                          },
                                        ),
                                        side: BorderSide(color: _slate700),
                                      ),
                                      Text(
                                        'Remember me',
                                        style: TextStyle(
                                          color: Colors.white.withAlpha(230),
                                          fontSize: 14,
                                        ),
                                      ),
                                    ],
                                  ),
                                  TextButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) => const ForgotPasswordScreen(),
                                        ),
                                      );
                                    },
                                    child: Text(
                                      'Forgot password?',
                                      style: TextStyle(
                                        color: _sky400,
                                        fontSize: 14,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),

                              // Biometric Authentication (if available)
                              if (_biometricAvailable && _biometricEnabled) ...[
                                Row(
                                  children: [
                                    Expanded(
                                      child: Divider(
                                        color: _slate700,
                                        thickness: 1,
                                      ),
                                    ),
                                    Padding(
                                      padding: const EdgeInsets.symmetric(horizontal: 16),
                                      child: Text(
                                        'OR',
                                        style: TextStyle(
                                          color: _slate500,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                    Expanded(
                                      child: Divider(
                                        color: _slate700,
                                        thickness: 1,
                                      ),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 20),
                                OutlinedButton.icon(
                                  onPressed: _isLoading ? null : _handleBiometricLogin,
                                  icon: Icon(
                                    _biometricTypeName?.toLowerCase().contains('face') ?? false
                                        ? Icons.face
                                        : Icons.fingerprint,
                                    color: _sky400,
                                    size: 20,
                                  ),
                                  label: Text(
                                    'Sign in with $_biometricTypeName',
                                    style: TextStyle(
                                      color: _sky400,
                                      fontSize: 14,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  style: OutlinedButton.styleFrom(
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    side: BorderSide(color: _sky500.withAlpha(128)),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 20),
                              ],
                              const SizedBox(height: 4),

                              // Error Message
                              if (_errorMessage != null)
                                FutureBuilder<String>(
                                  future: ApiConfigService().getApiBaseUrl(),
                                  builder: (context, snapshot) {
                                    final currentUrl = snapshot.data ?? 'Unknown';
                                    final isConnectionError = _errorMessage!.toLowerCase().contains('timeout') ||
                                        _errorMessage!.toLowerCase().contains('connection') ||
                                        _errorMessage!.toLowerCase().contains('cannot connect');
                                    
                                    return Container(
                                      padding: const EdgeInsets.all(16),
                                      margin: const EdgeInsets.only(bottom: 16),
                                      decoration: BoxDecoration(
                                        color: Colors.red.withAlpha(25),
                                        border: Border.all(color: Colors.red.withAlpha(76)),
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            children: [
                                              const Icon(Icons.error_outline, color: Colors.red, size: 20),
                                              const SizedBox(width: 8),
                                              Expanded(
                                                child: Text(
                                                  _errorMessage!,
                                                  style: const TextStyle(
                                                    color: Colors.red,
                                                    fontSize: 13,
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                          if (isConnectionError) ...[
                                            const SizedBox(height: 12),
                                            Container(
                                              padding: const EdgeInsets.all(10),
                                              decoration: BoxDecoration(
                                                color: Colors.black.withAlpha(51),
                                                borderRadius: BorderRadius.circular(8),
                                              ),
                                              child: Column(
                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                children: [
                                                  Text(
                                                    'Current API URL: $currentUrl',
                                                    style: TextStyle(
                                                      color: _slate400,
                                                      fontSize: 12,
                                                      fontFamily: 'monospace',
                                                    ),
                                                  ),
                                                  const SizedBox(height: 8),
                                                  const Text(
                                                    'For physical devices, ensure:',
                                                    style: TextStyle(
                                                      color: Colors.white,
                                                      fontSize: 12,
                                                      fontWeight: FontWeight.bold,
                                                    ),
                                                  ),
                                                  const SizedBox(height: 4),
                                                  Text(
                                                    '1. Phone and computer are on same Wi-Fi\n'
                                                    '2. API URL is set correctly in Settings\n'
                                                    '3. Laravel server is running: php artisan serve --host=0.0.0.0',
                                                    style: TextStyle(
                                                      color: _slate400,
                                                      fontSize: 11,
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            const SizedBox(height: 12),
                                            SizedBox(
                                              width: double.infinity,
                                              child: OutlinedButton.icon(
                                                onPressed: () {
                                                  Navigator.push(
                                                    context,
                                                    MaterialPageRoute(
                                                      builder: (_) => const ApiConfigScreen(),
                                                    ),
                                                  );
                                                },
                                                icon: const Icon(Icons.settings_ethernet, size: 18),
                                                label: const Text('Configure API URL'),
                                                style: OutlinedButton.styleFrom(
                                                  foregroundColor: _sky400,
                                                  side: BorderSide(color: _sky400.withAlpha(128)),
                                                  padding: const EdgeInsets.symmetric(vertical: 12),
                                                ),
                                              ),
                                            ),
                                          ],
                                        ],
                                      ),
                                    );
                                  },
                                ),

                              // Login Button (Gradient)
                              Container(
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [_sky600, _blue600],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _sky500.withAlpha(76),
                                      blurRadius: 12,
                                      spreadRadius: 0,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Material(
                                  color: Colors.transparent,
                                  child: InkWell(
                                    onTap: _isLoading || !_isFormValid() ? null : _handleLogin,
                                    borderRadius: BorderRadius.circular(12),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(vertical: 16),
                                      alignment: Alignment.center,
                                      child: _isLoading
                                          ? const SizedBox(
                                              height: 20,
                                              width: 20,
                                              child: CircularProgressIndicator(
                                                strokeWidth: 2,
                                                color: Colors.white,
                                              ),
                                            )
                                          : Row(
                                              mainAxisAlignment: MainAxisAlignment.center,
                                              children: [
                                                const Icon(
                                                  Icons.lock,
                                                  color: Colors.white,
                                                  size: 18,
                                                ),
                                                const SizedBox(width: 8),
                                                const Text(
                                                  'Sign In',
                                                  style: TextStyle(
                                                    color: Colors.white,
                                                    fontSize: 16,
                                                    fontWeight: FontWeight.bold,
                                                  ),
                                                ),
                                              ],
                                            ),
                                    ),
                                  ),
                                ),
                              ),

                              // Helper Text
                              if (!_isFormValid() && (_emailTouched || _passwordTouched))
                                Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Text(
                                    'Please fill in all required fields with valid information',
                                    style: TextStyle(
                                      color: _slate500,
                                      fontSize: 11,
                                    ),
                                    textAlign: TextAlign.center,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ),

                      const SizedBox(height: 24),
                      // Footer
                      Text(
                        'Protected by TIMS • Enterprise Security',
                        style: TextStyle(
                          color: _slate500,
                          fontSize: 12,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

