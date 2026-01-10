import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_theme.dart';

/// Standardized Card Widget
class StandardCard extends StatelessWidget {
  final Widget child;
  final Color? color;
  final double elevation;
  final Color? borderColor;
  final double borderRadius;
  final EdgeInsets? padding;
  final VoidCallback? onTap;

  const StandardCard({
    super.key,
    required this.child,
    this.color,
    this.elevation = AppTheme.elevationLow,
    this.borderColor,
    this.borderRadius = AppTheme.radiusMD,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final cardWidget = Card(
      elevation: elevation,
      shape: AppTheme.cardShape(borderRadius: borderRadius),
      color: color ?? AppTheme.backgroundCard,
      child: Container(
        padding: padding ?? AppTheme.paddingCard,
        decoration: borderColor != null
            ? BoxDecoration(
                borderRadius: BorderRadius.circular(borderRadius),
                border: Border.all(color: borderColor!),
              )
            : null,
        child: child,
      ),
    );

    if (onTap != null) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: cardWidget,
      );
    }

    return cardWidget;
  }
}

/// Standardized Empty State Widget
class StandardEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String message;
  final Color? iconColor;

  const StandardEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.message,
    this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return StandardCard(
      elevation: AppTheme.elevationLow,
      child: Column(
        children: [
          Icon(
            icon,
            size: AppTheme.iconSizeXXL,
            color: iconColor ?? AppTheme.textSecondaryShade(400),
          ),
          AppTheme.gapLG,
          Text(
            title,
            style: AppTheme.headingLarge(context)?.copyWith(
              color: AppTheme.textSecondaryShade(700),
            ),
            textAlign: TextAlign.center,
          ),
          AppTheme.gapSM,
          Text(
            message,
            textAlign: TextAlign.center,
            style: AppTheme.smallTextStyle(context),
          ),
        ],
      ),
    );
  }
}

/// Standardized Error State Widget
class StandardErrorState extends StatelessWidget {
  final String title;
  final String message;
  final VoidCallback? onRetry;

  const StandardErrorState({
    super.key,
    required this.title,
    required this.message,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: AppTheme.paddingScreen,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: AppTheme.iconSizeXXL,
              color: Colors.red[300],
            ),
            AppTheme.gapLG,
            Text(
              title,
              style: AppTheme.headingLarge(context)?.copyWith(
                color: Colors.red[700],
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            AppTheme.gapSM,
            Text(
              message,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red[600]),
            ),
            if (onRetry != null) ...[
              AppTheme.gapLG,
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                  padding: AppTheme.paddingButton,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(AppTheme.radiusSM),
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// Standardized Loading State Widget
class StandardLoadingState extends StatelessWidget {
  final String? message;
  final int itemCount;

  const StandardLoadingState({
    super.key,
    this.message,
    this.itemCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    if (message != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(),
            AppTheme.gapLG,
            Text(
              message!,
              style: AppTheme.smallTextStyle(context),
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      padding: AppTheme.paddingScreen,
      itemCount: itemCount,
      itemBuilder: (context, index) => Padding(
        padding: EdgeInsets.only(bottom: index < itemCount - 1 ? AppTheme.spacingLG : 0),
        child: _ShimmerCard(),
      ),
    );
  }
}

/// Shimmer Card for loading states
class _ShimmerCard extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppTheme.textSecondaryShade(300),
      highlightColor: AppTheme.textSecondaryShade(100),
      child: StandardCard(
        elevation: AppTheme.elevationLow,
        child: SizedBox(
          height: 120,
        ),
      ),
    );
  }
}

/// Standardized Info Row Widget
class StandardInfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color? iconColor;
  final Color? valueColor;

  const StandardInfoRow({
    super.key,
    required this.icon,
    required this.label,
    required this.value,
    this.iconColor,
    this.valueColor,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(
          icon,
          size: AppTheme.iconSizeMD,
          color: iconColor ?? AppTheme.textSecondaryShade(600),
        ),
        SizedBox(width: AppTheme.spacingMD),
        Expanded(
          child: Text(
            label,
            style: AppTheme.smallTextStyle(context).copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
        Text(
          value,
          style: AppTheme.bodyMedium(context)?.copyWith(
            fontWeight: FontWeight.w500,
            color: valueColor,
          ),
          textAlign: TextAlign.end,
        ),
      ],
    );
  }
}

/// Standardized Section Header
class StandardSectionHeader extends StatelessWidget {
  final String title;
  final int? count;
  final Color color;
  final IconData icon;

  const StandardSectionHeader({
    super.key,
    required this.title,
    this.count,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(AppTheme.spacingSM),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(AppTheme.radiusSM),
          ),
          child: Icon(icon, color: color, size: AppTheme.iconSizeMD),
        ),
        SizedBox(width: AppTheme.spacingMD),
        Text(
          title,
          style: AppTheme.headingLarge(context)?.copyWith(
            color: color,
          ),
        ),
        if (count != null && count! > 0) ...[
          SizedBox(width: AppTheme.spacingSM),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppTheme.spacingMD,
              vertical: AppTheme.spacingXS,
            ),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(AppTheme.radiusSM),
            ),
            child: Text(
              count! > 99 ? '99+' : count.toString(),
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ],
    );
  }
}

/// Standardized Status Badge
class StandardStatusBadge extends StatelessWidget {
  final String label;
  final Color color;
  final bool isOutlined;

  const StandardStatusBadge({
    super.key,
    required this.label,
    required this.color,
    this.isOutlined = false,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppTheme.spacingMD,
        vertical: AppTheme.spacingXS,
      ),
      decoration: BoxDecoration(
        color: isOutlined ? Colors.transparent : color,
        borderRadius: BorderRadius.circular(AppTheme.radiusXL),
        border: isOutlined ? Border.all(color: color, width: 2) : null,
      ),
      child: Text(
        label,
        style: TextStyle(
          color: isOutlined ? color : Colors.white,
          fontWeight: FontWeight.bold,
          fontSize: isOutlined ? 11 : 12,
        ),
      ),
    );
  }
}

