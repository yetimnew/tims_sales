import 'package:flutter/material.dart';

/// App-wide theme constants for consistent styling
class AppTheme {
  // Colors
  static const Color primaryColor = Colors.blue;
  static Color get successColor => Colors.green;
  static const Color warningColor = Colors.orange;
  static MaterialColor get errorColor => Colors.red;
  static const Color infoColor = Colors.blue;

  // Status Colors
  static Color get statusActive => Colors.green;
  static Color get statusInactive => Colors.grey;
  static Color get statusPending => Colors.orange;
  static Color get statusError => Colors.red;

  // Text Colors
  static Color get textPrimary => Colors.black87;
  static Color get textSecondary => Colors.grey;
  static Color textSecondaryShade(int shade) => Colors.grey[shade]!;
  static Color get textDisabled => Colors.grey[400]!;

  // Background Colors
  static Color get backgroundLight => Colors.grey[50]!;
  static Color get backgroundCard => Colors.white;
  static Color get backgroundError => Colors.red[50]!;
  static Color get backgroundSuccess => Colors.green[50]!;
  static Color get backgroundWarning => Colors.orange[50]!;
  static Color get backgroundInfo => Colors.blue[50]!;

  // Border Colors
  static Color get borderLight => Colors.grey[300]!;
  static Color get borderMedium => Colors.grey[400]!;
  static Color get borderDark => Colors.grey[600]!;

  // Spacing
  static const double spacingXS = 4.0;
  static const double spacingSM = 8.0;
  static const double spacingMD = 12.0;
  static const double spacingLG = 16.0;
  static const double spacingXL = 20.0;
  static const double spacingXXL = 24.0;
  static const double spacingXXXL = 32.0;

  // Border Radius
  static const double radiusSM = 8.0;
  static const double radiusMD = 12.0;
  static const double radiusLG = 16.0;
  static const double radiusXL = 20.0;
  static const double radiusFull = 999.0;

  // Elevation
  static const double elevationLow = 2.0;
  static const double elevationMedium = 4.0;
  static const double elevationHigh = 8.0;

  // Card Style
  static BoxDecoration cardDecoration({
    Color? color,
    double elevation = elevationLow,
    Color? borderColor,
    double borderRadius = radiusMD,
  }) {
    return BoxDecoration(
      color: color ?? backgroundCard,
      borderRadius: BorderRadius.circular(borderRadius),
      border: borderColor != null ? Border.all(color: borderColor) : null,
      boxShadow: elevation > 0
          ? [
              BoxShadow(
                color: Colors.black.withAlpha(25),
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

  // Standard Padding
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

  // Standard Gaps
  static Widget get gapXS => const SizedBox(height: spacingXS);
  static Widget get gapSM => const SizedBox(height: spacingSM);
  static Widget get gapMD => const SizedBox(height: spacingMD);
  static Widget get gapLG => const SizedBox(height: spacingLG);
  static Widget get gapXL => const SizedBox(height: spacingXL);
  static Widget get gapXXL => const SizedBox(height: spacingXXL);

  // Text Styles
  static TextStyle? headingLarge(BuildContext context) {
    return Theme.of(context).textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.bold,
        );
  }

  static TextStyle? headingMedium(BuildContext context) {
    return Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.bold,
        );
  }

  static TextStyle? bodyMedium(BuildContext context) {
    return Theme.of(context).textTheme.bodyMedium;
  }

  static TextStyle captionStyle(BuildContext context) {
    return TextStyle(
      fontSize: 12,
      color: textSecondaryShade(600),
    );
  }

  static TextStyle smallTextStyle(BuildContext context) {
    return TextStyle(
      fontSize: 13,
      color: textSecondaryShade(600),
    );
  }

  // Icon Sizes
  static const double iconSizeSM = 16.0;
  static const double iconSizeMD = 20.0;
  static const double iconSizeLG = 24.0;
  static const double iconSizeXL = 32.0;
  static const double iconSizeXXL = 64.0;

  // Status Badge Colors
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
        return warningColor;
      case 'inactive':
      case 'cancelled':
      case 'error':
        return Colors.red;
      case 'overdue':
        return Colors.red[700]!;
      default:
        return textSecondaryShade(600);
    }
  }
}

