import 'dart:ui';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Glass morphism card widget with dark theme styling
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsets? margin;
  final EdgeInsets? padding;
  final double? width;
  final double? height;
  final double opacity;
  final Color? color;
  final Color? borderColor;
  final double borderRadius;
  final VoidCallback? onTap;
  final bool useGradient;

  const GlassCard({
    super.key,
    required this.child,
    this.margin,
    this.padding,
    this.width,
    this.height,
    this.opacity = 0.8,
    this.color,
    this.borderColor,
    this.borderRadius = AppTheme.radiusMD,
    this.onTap,
    this.useGradient = false,
  });

  @override
  Widget build(BuildContext context) {
    Widget cardContent = Container(
      width: width,
      height: height,
      margin: margin,
      padding: padding ?? AppTheme.paddingCardSmall,
      decoration: useGradient
          ? BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  (color ?? AppTheme.darkCard).withAlpha((255 * opacity).round()),
                  (color ?? AppTheme.darkCard).withAlpha((255 * (opacity * 0.8)).round()),
                ],
              ),
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(
                color: (borderColor ?? AppTheme.sky500).withAlpha(51),
                width: 1.0,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(76),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                ),
                BoxShadow(
                  color: Colors.white.withAlpha(5),
                  blurRadius: 6,
                  offset: const Offset(0, -2),
                ),
              ],
            )
          : AppTheme.glassCardDecoration(
              color: color,
              opacity: opacity,
              borderRadius: borderRadius,
              borderColor: borderColor ?? AppTheme.sky500,
            ),
      child: child,
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: cardContent,
      );
    }

    return cardContent;
  }
}

/// Glass morphism container with backdrop filter effect
/// Note: BackdropFilter requires a backdrop, so use this with Stack
class GlassContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsets? margin;
  final EdgeInsets? padding;
  final double opacity;
  final Color? color;
  final double borderRadius;
  final double blurSigma;

  const GlassContainer({
    super.key,
    required this.child,
    this.margin,
    this.padding,
    this.opacity = 0.3,
    this.color,
    this.borderRadius = AppTheme.radiusMD,
    this.blurSigma = 10.0,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: margin,
      padding: padding,
      decoration: AppTheme.glassContainerDecoration(
        color: color ?? AppTheme.darkCard,
        opacity: opacity,
        borderRadius: borderRadius,
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurSigma, sigmaY: blurSigma),
          child: child,
        ),
      ),
    );
  }
}
