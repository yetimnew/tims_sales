import 'package:flutter/material.dart';

/// App-wide theme constants for consistent styling with dark theme and glass morphism
class AppTheme {
  // === DARK THEME COLORS (Matching Login Page) ===

  // Background Colors
  static const Color darkBackground = Color(0xFF0F172A); // slate-950
  static const Color darkSurface = Color(0xFF1E293B); // slate-800
  static const Color darkCard = Color(0xFF1E293B); // slate-800

  // Sky Blue Accents (Primary)
  static const Color sky400 = Color(0xFF38BDF8); // sky-400
  static const Color sky500 = Color(0xFF0EA5E9); // sky-500
  static const Color sky600 = Color(0xFF0284C7); // sky-600

  // Blue Accents
  static const Color blue600 = Color(0xFF2563EB); // blue-600
  static const Color blue700 = Color(0xFF1D4ED8); // blue-700

  // Slate Grays
  static const Color slate400 = Color(0xFF94A3B8); // slate-400
  static const Color slate500 = Color(0xFF64748B); // slate-500
  static const Color slate600 = Color(0xFF475569); // slate-600
  static const Color slate700 = Color(0xFF334155); // slate-700
  static const Color slate800 = Color(0xFF1E293B); // slate-800
  static const Color slate950 = Color(0xFF0F172A); // slate-950

  // Text Colors (Light for Dark Theme)
  static const Color textPrimary = Colors.white;
  static const Color textSecondary = Color(0xFF94A3B8); // slate-400
  static const Color textTertiary = Color(0xFF64748B); // slate-500
  static const Color textDisabled = Color(0xFF475569); // slate-600

  // Helper method for backward compatibility
  static Color textSecondaryShade(int shade) {
    switch (shade) {
      case 100:
        return const Color(0xFFF1F5F9); // slate-100
      case 200:
        return const Color(0xFFE2E8F0); // slate-200
      case 300:
        return const Color(0xFFCBD5E1); // slate-300
      case 400:
        return slate400; // slate-400
      case 500:
        return slate500; // slate-500
      case 600:
        return slate600; // slate-600
      case 700:
        return slate700; // slate-700
      case 800:
        return slate800; // slate-800
      default:
        return textSecondary;
    }
  }

  // Status Colors
  static const Color successColor = Color(0xFF10B981); // green-500
  static const Color warningColor = Color(0xFFF59E0B); // amber-500
  static const Color errorColor = Color(0xFFEF4444); // red-500
  static const Color infoColor = sky500;

  // Status Colors for Dark Theme
  static const Color statusActive = Color(0xFF10B981); // green-500
  static const Color statusInactive = slate500;
  static const Color statusPending = Color(0xFFF59E0B); // amber-500
  static const Color statusError = Color(0xFFEF4444); // red-500

  // Background Gradients
  static const LinearGradient darkGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      darkBackground,
      Color(0xFF1E293B), // slate-800
      Color(0xFF1E3A8A), // blue-950
    ],
  );

  static const LinearGradient skyGradient = LinearGradient(
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
    colors: [
      sky600,
      blue600,
    ],
  );

  // === SPACING ===
  static const double spacingXS = 4.0;
  static const double spacingSM = 8.0;
  static const double spacingMD = 12.0;
  static const double spacingLG = 16.0;
  static const double spacingXL = 20.0;
  static const double spacingXXL = 24.0;
  static const double spacingXXXL = 32.0;

  // === BORDER RADIUS ===
  static const double radiusSM = 8.0;
  static const double radiusMD = 12.0;
  static const double radiusLG = 16.0;
  static const double radiusXL = 20.0;
  static const double radiusFull = 999.0;

  // === ELEVATION ===
  static const double elevationLow = 2.0;
  static const double elevationMedium = 4.0;
  static const double elevationHigh = 8.0;

  // === GLASS MORPHISM DECORATION ===
  /// Glass morphism card decoration with blur effect
  static BoxDecoration glassCardDecoration({
    Color? color,
    double opacity = 0.8,
    double borderRadius = radiusMD,
    Color? borderColor,
    double borderWidth = 1.0,
  }) {
    return BoxDecoration(
      color: (color ?? darkCard).withAlpha((255 * opacity).round()),
      borderRadius: BorderRadius.circular(borderRadius),
      border: Border.all(
        color: (borderColor ?? sky500.withAlpha(51)), // 20% opacity
        width: borderWidth,
      ),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withAlpha(76), // 30% opacity
          blurRadius: 20,
          offset: const Offset(0, 4),
        ),
        BoxShadow(
          color: Colors.white.withAlpha(5),
          blurRadius: 6,
          offset: const Offset(0, -2),
        ),
      ],
    );
  }

  /// Glass morphism container with backdrop filter effect
  /// Note: Use this with BackdropFilter widget for true blur effect
  static BoxDecoration glassContainerDecoration({
    Color? color,
    double opacity = 0.8,
    double borderRadius = radiusMD,
    Color? borderColor,
  }) {
    return BoxDecoration(
      color: (color ?? darkCard).withAlpha((255 * opacity).round()),
      borderRadius: BorderRadius.circular(borderRadius),
      border: borderColor != null
          ? Border.all(
              color: borderColor.withAlpha(51),
              width: 1.0,
            )
          : null,
    );
  }

  // === LEGACY LIGHT THEME SUPPORT (for backward compatibility) ===
  // Keep these for any screens that might still use them
  static Color get primaryColor => sky500; // Use sky blue as primary
  static Color get successColorLight => Colors.green;
  static Color get warningColorLight => Colors.orange;
  static Color get errorColorLight => Colors.red;
  static Color get infoColorLight => Colors.blue;

  // Background Colors (Light Theme - for reference)
  static Color get backgroundLight => Colors.grey[50]!;
  static Color get backgroundCard => Colors.white;

  // Border Colors (Light Theme - for reference)
  static Color get borderLight => Colors.grey[300]!;
  static Color get borderMedium => Colors.grey[400]!;
  static Color get borderDark => Colors.grey[600]!;

  // === CARD STYLE (Updated for Dark Theme) ===
  static BoxDecoration cardDecoration({
    Color? color,
    double elevation = elevationLow,
    Color? borderColor,
    double borderRadius = radiusMD,
    bool useGlassMorphism = true,
    double opacity = 0.8,
  }) {
    if (useGlassMorphism) {
      return glassCardDecoration(
        color: color ?? darkCard,
        opacity: opacity,
        borderRadius: borderRadius,
        borderColor: borderColor ?? sky500,
      );
    }

    return BoxDecoration(
      color: color ?? darkCard,
      borderRadius: BorderRadius.circular(borderRadius),
      border: borderColor != null ? Border.all(color: borderColor) : null,
      boxShadow: elevation > 0
          ? [
              BoxShadow(
                color: Colors.black.withAlpha((255 * 0.3).round()),
                blurRadius: elevation * 2,
                offset: Offset(0, elevation),
              ),
            ]
          : null,
    );
  }

  // Card Shape
  static ShapeBorder cardShape({double borderRadius = radiusMD}) {
    return RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(borderRadius),
    );
  }

  // === STANDARD PADDING ===
  static EdgeInsets get paddingScreen => const EdgeInsets.all(spacingLG);
  static EdgeInsets get paddingCard => const EdgeInsets.all(spacingXL);
  static EdgeInsets get paddingCardSmall => const EdgeInsets.all(spacingLG);
  static EdgeInsets get paddingButton => const EdgeInsets.symmetric(
        horizontal: spacingXL,
        vertical: spacingLG,
      );
  static EdgeInsets get paddingButtonSmall => const EdgeInsets.symmetric(
        horizontal: spacingLG,
        vertical: spacingMD,
      );

  // === STANDARD GAPS ===
  static Widget get gapXS => const SizedBox(height: spacingXS);
  static Widget get gapSM => const SizedBox(height: spacingSM);
  static Widget get gapMD => const SizedBox(height: spacingMD);
  static Widget get gapLG => const SizedBox(height: spacingLG);
  static Widget get gapXL => const SizedBox(height: spacingXL);
  static Widget get gapXXL => const SizedBox(height: spacingXXL);

  // === TEXT STYLES (Dark Theme) ===
  static TextStyle headingLarge(BuildContext context, {Color? color}) {
    return Theme.of(context).textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.bold,
          color: color ?? textPrimary,
        ) ?? TextStyle(
      fontWeight: FontWeight.bold,
      fontSize: 24,
      color: color ?? textPrimary,
    );
  }

  static TextStyle headingMedium(BuildContext context, {Color? color}) {
    return Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.bold,
          color: color ?? textPrimary,
        ) ?? TextStyle(
      fontWeight: FontWeight.bold,
      fontSize: 20,
      color: color ?? textPrimary,
    );
  }

  static TextStyle bodyMedium(BuildContext context, {Color? color}) {
    return Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: color ?? textSecondary,
        ) ?? TextStyle(
      fontSize: 14,
      color: color ?? textSecondary,
    );
  }

  static TextStyle captionStyle(BuildContext context, {Color? color}) {
    return TextStyle(
      fontSize: 12,
      color: color ?? textTertiary,
    );
  }

  static TextStyle smallTextStyle(BuildContext context, {Color? color}) {
    return TextStyle(
      fontSize: 13,
      color: color ?? textTertiary,
    );
  }

  // === ICON SIZES ===
  static const double iconSizeSM = 16.0;
  static const double iconSizeMD = 20.0;
  static const double iconSizeLG = 24.0;
  static const double iconSizeXL = 32.0;
  static const double iconSizeXXL = 64.0;

  // === STATUS BADGE COLORS ===
  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
      case 'available':
      case 'completed':
      case 'success':
        return statusActive;
      case 'pending':
      case 'scheduled':
      case 'open':
      case 'warning':
        return statusPending;
      case 'inactive':
      case 'cancelled':
      case 'error':
        return statusError;
      case 'overdue':
        return Color(0xFFDC2626); // red-600
      default:
        return textTertiary;
    }
  }

  // === GRADIENT BUTTON DECORATION ===
  static BoxDecoration gradientButtonDecoration({
    List<Color>? colors,
    double borderRadius = radiusMD,
  }) {
    return BoxDecoration(
      gradient: LinearGradient(
        colors: colors ?? [sky600, blue600],
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
      ),
      borderRadius: BorderRadius.circular(borderRadius),
      boxShadow: [
        BoxShadow(
          color: sky600.withAlpha(76), // 30% opacity
          blurRadius: 12,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }
}
