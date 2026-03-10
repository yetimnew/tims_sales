import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../config/app_config.dart';
import '../../models/status.dart';
import '../../services/api_service.dart';
import '../../services/location_service.dart';
import '../../services/status_service.dart';
import '../../theme/app_theme.dart';
import '../../widgets/glass_card.dart';
import 'status_history_screen.dart';

class StatusUpdateScreen extends StatefulWidget {
  const StatusUpdateScreen({super.key});

  @override
  State<StatusUpdateScreen> createState() => _StatusUpdateScreenState();
}

class _StatusUpdateScreenState extends State<StatusUpdateScreen> {
  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();
  final StatusService _statusService = StatusService();
  final TextEditingController _notesController = TextEditingController();

  DriverStatus? _currentStatus;
  List<StatusOption> _statusOptions = [];
  bool _isLoading = true;
  bool _isUpdating = false;
  String? _error;
  String _selectedStatusType = 'work';
  String? _selectedStatusValue;

  @override
  void initState() {
    super.initState();
    _loadStatusScreen();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadStatusScreen({String? statusType}) async {
    final nextStatusType = statusType ?? _selectedStatusType;

    setState(() {
      _isLoading = true;
      _error = null;
      _selectedStatusType = nextStatusType;
    });

    try {
      final statusOptions = await _statusService.getStatusOptions(
        statusType: nextStatusType,
      );

      DriverStatus? currentStatus;

      if (nextStatusType == 'work') {
        final response = await _apiService.get(AppConfig.statusCurrentEndpoint);

        if (response.statusCode == 200 && response.data['success'] == true) {
          final statusData = response.data['data'];
          if (statusData != null) {
            currentStatus = DriverStatus.fromJson(statusData);
          }
        } else {
          throw Exception('Failed to load current status');
        }
      } else {
        final history = await _statusService.getStatusHistory(
          statusType: nextStatusType,
          limit: 1,
        );

        if (history.isNotEmpty) {
          currentStatus = DriverStatus.fromJson(history.first);
        }
      }

      final defaultValue = currentStatus?.statusValue ??
          (statusOptions.isNotEmpty ? statusOptions.first.value : null);

      setState(() {
        _statusOptions = statusOptions;
        _currentStatus = currentStatus;
        _selectedStatusValue = defaultValue;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load status: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _switchStatusType(String statusType) async {
    if (_isLoading || _selectedStatusType == statusType) {
      return;
    }

    await _loadStatusScreen(statusType: statusType);
  }

  Future<void> _updateStatus() async {
    if (_selectedStatusValue == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a status')),
      );
      return;
    }

    setState(() {
      _isUpdating = true;
      _error = null;
    });

    try {
      final currentLocation = await _locationService.getCurrentLocation();

      final response = await _apiService.post(
        AppConfig.statusEndpoint,
        data: {
          'status_type': _selectedStatusType,
          'status_value': _selectedStatusValue,
          'notes': _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
          if (currentLocation != null) ...currentLocation,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final updatedStatus = DriverStatus.fromJson(response.data['data']);
        final updatedLabel = _statusLabel(updatedStatus.statusValue);

        setState(() {
          _currentStatus = updatedStatus;
          _selectedStatusValue = updatedStatus.statusValue;
          _notesController.clear();
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Status updated to $updatedLabel')),
                ],
              ),
              backgroundColor: AppTheme.successColor,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMD),
              ),
            ),
          );
        }

        Future.delayed(const Duration(milliseconds: 300), () {
          if (mounted) {
            _loadStatusScreen(statusType: _selectedStatusType);
          }
        });
      } else {
        throw Exception(response.data['message'] ?? 'Failed to update status');
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(child: Text('Error: ${e.toString()}')),
              ],
            ),
            backgroundColor: AppTheme.errorColor,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            ),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUpdating = false;
        });
      }
    }
  }

  StatusOption? _statusOption(String? value) {
    if (value == null) {
      return null;
    }

    for (final option in _statusOptions) {
      if (option.value.toLowerCase() == value.toLowerCase()) {
        return option;
      }
    }

    return null;
  }

  bool _isWorkStatusType() => _selectedStatusType == 'work';

  Color _getWorkStatusColor(WorkStatus status) {
    switch (status) {
      case WorkStatus.available:
        return AppTheme.successColor;
      case WorkStatus.onTrip:
        return AppTheme.sky400;
      case WorkStatus.onBreak:
        return AppTheme.warningColor;
      case WorkStatus.offDuty:
        return AppTheme.textSecondary;
    }
  }

  IconData _getWorkStatusIcon(WorkStatus status) {
    switch (status) {
      case WorkStatus.available:
        return Icons.check_circle;
      case WorkStatus.onTrip:
        return Icons.local_shipping;
      case WorkStatus.onBreak:
        return Icons.free_breakfast;
      case WorkStatus.offDuty:
        return Icons.pause_circle;
    }
  }

  String _getWorkStatusDescription(WorkStatus status) {
    switch (status) {
      case WorkStatus.available:
        return 'Ready to receive the next assignment';
      case WorkStatus.onTrip:
        return 'Actively driving or handling delivery work';
      case WorkStatus.onBreak:
        return 'Temporarily paused and unavailable';
      case WorkStatus.offDuty:
        return 'Signed out from work responsibilities';
    }
  }

  Color _statusColor(String? value) {
    final workStatus = WorkStatus.fromString(value);
    if (workStatus != null) {
      return _getWorkStatusColor(workStatus);
    }

    return _isWorkStatusType() ? AppTheme.textSecondary : AppTheme.sky400;
  }

  IconData _statusIcon(String? value) {
    final workStatus = WorkStatus.fromString(value);
    if (workStatus != null) {
      return _getWorkStatusIcon(workStatus);
    }

    return _isWorkStatusType() ? Icons.info_outline : Icons.local_shipping;
  }

  String _statusLabel(String? value) {
    final option = _statusOption(value);
    if (option != null) {
      return option.label;
    }

    final workStatus = WorkStatus.fromString(value);
    if (workStatus != null) {
      return workStatus.label;
    }

    return (value ?? 'Unknown').replaceAll('_', ' ');
  }

  String _statusDescription(String? value) {
    final option = _statusOption(value);
    if (option?.description != null && option!.description!.isNotEmpty) {
      return option.description!;
    }

    final workStatus = WorkStatus.fromString(value);
    if (workStatus != null) {
      return _getWorkStatusDescription(workStatus);
    }

    return _isWorkStatusType()
        ? 'Select the status that best reflects your current work condition.'
        : 'Select the active truck operational status from the configured list.';
  }

  String _formatDateTime(String value) {
    try {
      return DateFormat('dd MMM yyyy, hh:mm a')
          .format(DateTime.parse(value).toLocal());
    } catch (_) {
      return value;
    }
  }

  Widget _buildStatusChip(String label, Color color, {bool selected = false}) {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 180),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: selected ? color.withAlpha(36) : AppTheme.slate700.withAlpha(120),
        borderRadius: BorderRadius.circular(AppTheme.radiusFull),
        border: Border.all(
          color: selected ? color : AppTheme.slate600,
        ),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: selected ? color : AppTheme.textSecondary,
          fontWeight: FontWeight.w600,
          fontSize: 12,
        ),
      ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: AppTheme.paddingScreen,
        child: GlassCard(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(
                Icons.error_outline,
                size: AppTheme.iconSizeXXL,
                color: AppTheme.errorColor,
              ),
              AppTheme.gapLG,
              Text(
                'Something went wrong',
                style: AppTheme.headingLarge(context),
              ),
              AppTheme.gapSM,
              Text(
                _error ?? 'Unknown error',
                style: AppTheme.bodyMedium(context),
                textAlign: TextAlign.center,
              ),
              AppTheme.gapXL,
              FilledButton.icon(
                onPressed: () => _loadStatusScreen(statusType: _selectedStatusType),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatusTypeSelection() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Status Type', style: AppTheme.headingMedium(context)),
          AppTheme.gapSM,
          Row(
            children: [
              Expanded(
                child: _buildTypeButton(
                  label: 'Work',
                  icon: Icons.work_outline,
                  value: 'work',
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildTypeButton(
                  label: 'Truck',
                  icon: Icons.local_shipping_outlined,
                  value: 'truck',
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTypeButton({
    required String label,
    required IconData icon,
    required String value,
  }) {
    final isSelected = _selectedStatusType == value;

    return InkWell(
      onTap: _isUpdating ? null : () => _switchStatusType(value),
      borderRadius: BorderRadius.circular(AppTheme.radiusMD),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
        decoration: BoxDecoration(
          color: isSelected
              ? AppTheme.sky400.withAlpha(26)
              : AppTheme.slate800.withAlpha(150),
          borderRadius: BorderRadius.circular(AppTheme.radiusMD),
          border: Border.all(
            color: isSelected ? AppTheme.sky400 : AppTheme.slate700,
          ),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AppTheme.sky400 : AppTheme.textSecondary,
            ),
            const SizedBox(width: 8),
            Text(
              label,
              style: TextStyle(
                color: isSelected ? AppTheme.sky400 : AppTheme.textPrimary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOverviewCard() {
    final selectedValue = _selectedStatusValue ?? _currentStatus?.statusValue;
    final color = _statusColor(selectedValue);

    return GlassCard(
      useGradient: true,
      color: AppTheme.darkCard,
      borderColor: color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: color.withAlpha(38),
                  borderRadius: BorderRadius.circular(AppTheme.radiusMD),
                ),
                child: Icon(
                  _statusIcon(selectedValue),
                  color: color,
                  size: AppTheme.iconSizeLG,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _isWorkStatusType() ? 'Driver Work Status' : 'Truck Status',
                      style: AppTheme.captionStyle(
                        context,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _statusLabel(selectedValue),
                      style: AppTheme.headingLarge(context),
                    ),
                  ],
                ),
              ),
              _buildStatusChip(_statusLabel(selectedValue), color, selected: true),
            ],
          ),
          AppTheme.gapLG,
          Text(
            _statusDescription(selectedValue),
            style: AppTheme.bodyMedium(context),
          ),
          if (_currentStatus != null) ...[
            AppTheme.gapLG,
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.slate800.withAlpha(170),
                borderRadius: BorderRadius.circular(AppTheme.radiusMD),
                border: Border.all(color: AppTheme.slate700),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(Icons.schedule, size: 18, color: color),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Last updated',
                          style: AppTheme.captionStyle(
                            context,
                            color: AppTheme.textSecondary,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _formatDateTime(_currentStatus!.createdAt),
                          style: const TextStyle(
                            color: AppTheme.textPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        if (_currentStatus!.notes != null &&
                            _currentStatus!.notes!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            _currentStatus!.notes!,
                            style: AppTheme.smallTextStyle(
                              context,
                              color: AppTheme.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildStatusSelection() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Choose Status', style: AppTheme.headingMedium(context)),
          AppTheme.gapSM,
          Text(
            _isWorkStatusType()
                ? 'Select the status that best reflects your current work condition.'
                : 'Select the active truck operational status from the configured list.',
            style: AppTheme.bodyMedium(context),
          ),
          AppTheme.gapLG,
          if (_statusOptions.isEmpty)
            Text(
              'No active status options found.',
              style: AppTheme.bodyMedium(context),
            )
          else
            ..._statusOptions.map(_buildStatusOption),
        ],
      ),
    );
  }

  Widget _buildStatusOption(StatusOption status) {
    final isSelected = _selectedStatusValue == status.value;
    final color = _statusColor(status.value);

    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: _isUpdating
            ? null
            : () {
                setState(() {
                  _selectedStatusValue = status.value;
                });
              },
        borderRadius: BorderRadius.circular(AppTheme.radiusLG),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 180),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected
                ? color.withAlpha(30)
                : AppTheme.slate800.withAlpha(150),
            borderRadius: BorderRadius.circular(AppTheme.radiusLG),
            border: Border.all(
              color: isSelected ? color : AppTheme.slate700,
              width: isSelected ? 1.6 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                width: 46,
                height: 46,
                decoration: BoxDecoration(
                  color: color.withAlpha(28),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(_statusIcon(status.value), color: color),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      status.label,
                      style: TextStyle(
                        color: isSelected ? color : AppTheme.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _statusDescription(status.value),
                      style: AppTheme.smallTextStyle(
                        context,
                        color: AppTheme.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                isSelected
                    ? Icons.check_circle
                    : Icons.radio_button_unchecked,
                color: isSelected ? color : AppTheme.textTertiary,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNotesField() {
    return GlassCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Notes', style: AppTheme.headingMedium(context)),
          AppTheme.gapSM,
          Text(
            'Add an optional note for dispatch or internal tracking.',
            style: AppTheme.bodyMedium(context),
          ),
          AppTheme.gapLG,
          TextField(
            controller: _notesController,
            maxLines: 4,
            enabled: !_isUpdating,
            style: const TextStyle(color: AppTheme.textPrimary),
            decoration: InputDecoration(
              hintText: 'Example: Waiting at checkpoint, back in 10 minutes',
              hintStyle: const TextStyle(color: AppTheme.textTertiary),
              filled: true,
              fillColor: AppTheme.slate800.withAlpha(170),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMD),
                borderSide: const BorderSide(color: AppTheme.slate700),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMD),
                borderSide: const BorderSide(color: AppTheme.slate700),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMD),
                borderSide: const BorderSide(color: AppTheme.sky400),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBottomActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          decoration: AppTheme.gradientButtonDecoration(),
          child: FilledButton.icon(
            onPressed: _isUpdating || _selectedStatusValue == null
                ? null
                : _updateStatus,
            style: FilledButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppTheme.radiusMD),
              ),
            ),
            icon: _isUpdating
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.save_outlined),
            label: Text(_isUpdating ? 'Updating...' : 'Save Status'),
          ),
        ),
        if (_error != null && _currentStatus != null) ...[
          AppTheme.gapMD,
          Text(
            _error!,
            style: const TextStyle(
              color: AppTheme.errorColor,
              fontSize: 13,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(gradient: AppTheme.darkGradient),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: const Text('Update Status'),
          backgroundColor: AppTheme.darkSurface.withAlpha(220),
          elevation: 0,
          actions: [
            IconButton(
              icon: const Icon(Icons.history),
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => const StatusHistoryScreen(),
                  ),
                );
              },
              tooltip: 'View History',
            ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: AppTheme.sky400),
              )
            : _error != null && _currentStatus == null
                ? _buildErrorState()
                : RefreshIndicator(
                    onRefresh: () =>
                        _loadStatusScreen(statusType: _selectedStatusType),
                    color: AppTheme.sky400,
                    backgroundColor: AppTheme.darkCard,
                    child: SingleChildScrollView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: AppTheme.paddingScreen,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildStatusTypeSelection(),
                          AppTheme.gapLG,
                          _buildOverviewCard(),
                          AppTheme.gapLG,
                          _buildStatusSelection(),
                          AppTheme.gapLG,
                          _buildNotesField(),
                          AppTheme.gapXL,
                          _buildBottomActions(),
                        ],
                      ),
                    ),
                  ),
      ),
    );
  }
}
