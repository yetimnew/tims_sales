import 'package:flutter/material.dart';
import '../../services/auth_service.dart';
import '../../config/app_config.dart';
import 'login_screen.dart';

class ResetPasswordScreen extends StatefulWidget {
  final String? email;
  final String? token;

  const ResetPasswordScreen({
    super.key,
    this.email,
    this.token,
  });

  @override
  State<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends State<ResetPasswordScreen> with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _tokenController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final AuthService _authService = AuthService();
  bool _isLoading = false;
  bool _passwordReset = false;
  bool _showPassword = false;
  bool _showConfirmPassword = false;
  String? _errorMessage;
  String? _emailError;
  String? _tokenError;
  String? _passwordError;
  String? _confirmPasswordError;
  bool _emailTouched = false;
  bool _tokenTouched = false;
  bool _passwordTouched = false;
  bool _confirmPasswordTouched = false;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  late Animation<Offset> _slideAnimation;

  // Color scheme matching login screen
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
    
    // Pre-fill email and token if provided
    if (widget.email != null) {
      _emailController.text = widget.email!;
    }
    if (widget.token != null) {
      _tokenController.text = widget.token!;
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _tokenController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
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

  String? _validateToken(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Reset token is required';
    }
    return null;
  }

  String? _validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Password is required';
    }
    if (value.length < 8) {
      return 'Password must be at least 8 characters';
    }
    return null;
  }

  String? _validateConfirmPassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please confirm your password';
    }
    if (value != _passwordController.text) {
      return 'Passwords do not match';
    }
    return null;
  }

  Future<void> _handleResetPassword() async {
    setState(() {
      _emailTouched = true;
      _tokenTouched = true;
      _passwordTouched = true;
      _confirmPasswordTouched = true;
      _emailError = _validateEmail(_emailController.text);
      _tokenError = _validateToken(_tokenController.text);
      _passwordError = _validatePassword(_passwordController.text);
      _confirmPasswordError = _validateConfirmPassword(_confirmPasswordController.text);
    });

    if (!_formKey.currentState!.validate() ||
        _emailError != null ||
        _tokenError != null ||
        _passwordError != null ||
        _confirmPasswordError != null) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final result = await _authService.resetPassword(
      email: _emailController.text.trim().toLowerCase(),
      token: _tokenController.text.trim(),
      password: _passwordController.text,
      passwordConfirmation: _confirmPasswordController.text,
    );

    setState(() {
      _isLoading = false;
    });

    if (result['success'] == true) {
      setState(() {
        _passwordReset = true;
      });
    } else {
      setState(() {
        _errorMessage = result['error'] ?? 'Failed to reset password. Please try again.';
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
                      // Back Button
                      Align(
                        alignment: Alignment.topLeft,
                        child: IconButton(
                          icon: const Icon(Icons.arrow_back, color: Colors.white),
                          onPressed: () {
                            Navigator.of(context).pushReplacement(
                              MaterialPageRoute(builder: (_) => const LoginScreen()),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 20),
                      
                      // Icon
                      Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: _sky500.withAlpha(25),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(
                          Icons.lock_open,
                          size: 48,
                          color: _sky400,
                        ),
                      ),
                      const SizedBox(height: 24),

                      // Header
                      const Text(
                        'Reset Password',
                        style: TextStyle(
                          fontSize: 32,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _passwordReset
                            ? 'Your password has been reset successfully'
                            : 'Enter your email, reset token, and new password',
                        style: TextStyle(
                          fontSize: 16,
                          color: _slate400,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),

                      if (_passwordReset)
                        // Success State
                        Container(
                          padding: const EdgeInsets.all(24),
                          decoration: BoxDecoration(
                            color: Colors.green.withAlpha(25),
                            borderRadius: BorderRadius.circular(24),
                            border: Border.all(
                              color: Colors.green.withAlpha(76),
                              width: 1,
                            ),
                          ),
                          child: Column(
                            children: [
                              Icon(Icons.check_circle, size: 64, color: Colors.green[300]),
                              const SizedBox(height: 16),
                              Text(
                                'Password Reset Successful!',
                                style: TextStyle(
                                  fontSize: 20,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Your password has been reset. You can now login with your new password.',
                                style: TextStyle(
                                  fontSize: 14,
                                  color: _slate400,
                                ),
                                textAlign: TextAlign.center,
                              ),
                              const SizedBox(height: 24),
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  onPressed: () {
                                    Navigator.of(context).pushReplacement(
                                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                                    );
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: _sky600,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                  ),
                                  child: const Text('Back to Login'),
                                ),
                              ),
                            ],
                          ),
                        )
                      else
                        // Form
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
                                _buildTextField(
                                  controller: _emailController,
                                  label: 'Email Address',
                                  hint: 'email@example.com',
                                  icon: Icons.email_outlined,
                                  keyboardType: TextInputType.emailAddress,
                                  error: _emailError,
                                  touched: _emailTouched,
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
                                const SizedBox(height: 16),

                                // Token Field
                                _buildTextField(
                                  controller: _tokenController,
                                  label: 'Reset Token',
                                  hint: 'Enter the token from your email',
                                  icon: Icons.key,
                                  error: _tokenError,
                                  touched: _tokenTouched,
                                  onChanged: (value) {
                                    if (_tokenTouched) {
                                      setState(() {
                                        _tokenError = _validateToken(value);
                                      });
                                    }
                                  },
                                  onTap: () {
                                    setState(() {
                                      _tokenTouched = true;
                                    });
                                  },
                                  validator: _validateToken,
                                  helperText: 'Check your email for the reset token',
                                ),
                                const SizedBox(height: 16),

                                // Password Field
                                _buildPasswordField(
                                  controller: _passwordController,
                                  label: 'New Password',
                                  hint: 'Enter your new password',
                                  error: _passwordError,
                                  touched: _passwordTouched,
                                  showPassword: _showPassword,
                                  onChanged: (value) {
                                    if (_passwordTouched) {
                                      setState(() {
                                        _passwordError = _validatePassword(value);
                                        // Re-validate confirm password if it's already touched
                                        if (_confirmPasswordTouched) {
                                          _confirmPasswordError = _validateConfirmPassword(_confirmPasswordController.text);
                                        }
                                      });
                                    }
                                  },
                                  onTap: () {
                                    setState(() {
                                      _passwordTouched = true;
                                    });
                                  },
                                  onToggleVisibility: () {
                                    setState(() {
                                      _showPassword = !_showPassword;
                                    });
                                  },
                                  validator: _validatePassword,
                                  helperText: 'Minimum 8 characters',
                                ),
                                const SizedBox(height: 16),

                                // Confirm Password Field
                                _buildPasswordField(
                                  controller: _confirmPasswordController,
                                  label: 'Confirm New Password',
                                  hint: 'Confirm your new password',
                                  error: _confirmPasswordError,
                                  touched: _confirmPasswordTouched,
                                  showPassword: _showConfirmPassword,
                                  onChanged: (value) {
                                    if (_confirmPasswordTouched) {
                                      setState(() {
                                        _confirmPasswordError = _validateConfirmPassword(value);
                                      });
                                    }
                                  },
                                  onTap: () {
                                    setState(() {
                                      _confirmPasswordTouched = true;
                                    });
                                  },
                                  onToggleVisibility: () {
                                    setState(() {
                                      _showConfirmPassword = !_showConfirmPassword;
                                    });
                                  },
                                  validator: _validateConfirmPassword,
                                ),
                                const SizedBox(height: 24),

                                // Error Message
                                if (_errorMessage != null)
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    margin: const EdgeInsets.only(bottom: 16),
                                    decoration: BoxDecoration(
                                      color: Colors.red.withAlpha(25),
                                      border: Border.all(color: Colors.red.withAlpha(76)),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: Row(
                                      children: [
                                        const Icon(Icons.error_outline, color: Colors.red, size: 20),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            _errorMessage!,
                                            style: const TextStyle(
                                              color: Colors.red,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),

                                // Reset Password Button
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
                                      onTap: _isLoading ? null : _handleResetPassword,
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
                                                    Icons.lock_reset,
                                                    color: Colors.white,
                                                    size: 18,
                                                  ),
                                                  const SizedBox(width: 8),
                                                  const Text(
                                                    'Reset Password',
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
                              ],
                            ),
                          ),
                        ),

                      const SizedBox(height: 24),
                      // Back to Login Link
                      TextButton(
                        onPressed: () {
                          Navigator.of(context).pushReplacement(
                            MaterialPageRoute(builder: (_) => const LoginScreen()),
                          );
                        },
                        child: Text(
                          'Back to Login',
                          style: TextStyle(
                            color: _sky400,
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
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

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    String? error,
    bool touched = false,
    String? helperText,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
    VoidCallback? onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
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
          controller: controller,
          style: const TextStyle(color: Colors.white),
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: _slate500),
            prefixIcon: Icon(icon, color: _slate400),
            helperText: helperText,
            helperStyle: TextStyle(color: _slate500, fontSize: 11),
            filled: true,
            fillColor: _darkSurface.withAlpha(128), // 50% opacity
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _slate700, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: error != null ? Colors.red : _slate700,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: error != null ? Colors.red : _sky500,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            errorText: error != null && touched ? error : null,
          ),
          onChanged: onChanged,
          onTap: onTap,
          validator: validator,
        ),
      ],
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required String? error,
    required bool touched,
    required bool showPassword,
    String? helperText,
    String? Function(String?)? validator,
    void Function(String)? onChanged,
    VoidCallback? onTap,
    required VoidCallback onToggleVisibility,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              label,
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
          controller: controller,
          style: const TextStyle(color: Colors.white),
          obscureText: !showPassword,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: _slate500),
            prefixIcon: Icon(Icons.lock_outlined, color: _slate400),
            suffixIcon: IconButton(
              icon: Icon(
                showPassword ? Icons.visibility_off : Icons.visibility,
                color: _slate400,
              ),
              onPressed: onToggleVisibility,
            ),
            helperText: helperText,
            helperStyle: TextStyle(color: _slate500, fontSize: 11),
            filled: true,
            fillColor: _darkSurface.withAlpha(128), // 50% opacity
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(color: _slate700, width: 1),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: error != null ? Colors.red : _slate700,
                width: 1,
              ),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: BorderSide(
                color: error != null ? Colors.red : _sky500,
                width: 2,
              ),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red, width: 1),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
              borderSide: const BorderSide(color: Colors.red, width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            errorText: error != null && touched ? error : null,
          ),
          onChanged: onChanged,
          onTap: onTap,
          validator: validator,
        ),
      ],
    );
  }
}

