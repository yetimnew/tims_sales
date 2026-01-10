import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/trip.dart';
import '../../services/trip_service.dart';

class TripDetailsScreen extends StatefulWidget {
  final int tripId;

  const TripDetailsScreen({super.key, required this.tripId});

  @override
  State<TripDetailsScreen> createState() => _TripDetailsScreenState();
}

class _TripDetailsScreenState extends State<TripDetailsScreen> {
  final TripService _tripService = TripService();
  final TextEditingController _commentController = TextEditingController();
  Trip? _trip;
  bool _isLoading = true;
  bool _isUpdating = false;
  String? _error;
  String? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadTripDetails();
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _loadTripDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final trip = await _tripService.getTripDetails(widget.tripId);
      setState(() {
        _trip = trip;
        _selectedStatus = trip?.status;
        _commentController.text = trip?.comment ?? '';
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load trip details: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _updateTripStatus() async {
    if (_selectedStatus == null || _trip == null) {
      return;
    }

    if (_selectedStatus == _trip!.status && _commentController.text.trim() == (_trip!.comment ?? '')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No changes to save')),
      );
      return;
    }

    setState(() {
      _isUpdating = true;
    });

    try {
      final updatedTrip = await _tripService.updateTripStatus(
        widget.tripId,
        _selectedStatus!,
        comment: _commentController.text.trim().isEmpty ? null : _commentController.text.trim(),
      );

      if (updatedTrip != null) {
        setState(() {
          _trip = updatedTrip;
          _selectedStatus = updatedTrip.status;
          _commentController.text = updatedTrip.comment ?? '';
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 8),
                  Expanded(child: Text('Trip status updated successfully')),
                ],
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
            ),
          );
        }
      } else {
        throw Exception('Failed to update trip status');
      }
    } catch (e) {
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
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.all(Radius.circular(8))),
          ),
        );
      }
    } finally {
      setState(() {
        _isUpdating = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Trip Details'),
        actions: [
          if (_trip != null && _trip!.status != 'completed' && _trip!.status != 'cancelled')
            IconButton(
              icon: const Icon(Icons.save),
              onPressed: _isUpdating ? null : _updateTripStatus,
              tooltip: 'Save Changes',
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadTripDetails,
        child: _isLoading
            ? _buildLoadingState(context)
            : _error != null
                ? _buildErrorState(context, _error!)
                : _trip == null
                    ? _buildEmptyState(context)
                    : SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Trip Status Card
                            _buildStatusCard(context, _trip!),
                            const SizedBox(height: 16),

                            // Route Information
                            if (_trip!.origin != null || _trip!.destination != null) ...[
                              _buildRouteCard(context, _trip!),
                              const SizedBox(height: 16),
                            ],

                            // Trip Information
                            _buildTripInfoCard(context, _trip!),
                            const SizedBox(height: 16),

                            // Cargo Information
                            if (_trip!.cargoVolumeMt != null ||
                                _trip!.cargoWeightKg != null ||
                                _trip!.cargoType != null) ...[
                              _buildCargoCard(context, _trip!),
                              const SizedBox(height: 16),
                            ],

                            // Fuel Information
                            if (_trip!.fuelLiters != null || _trip!.fuelBirr != null) ...[
                              _buildFuelCard(context, _trip!),
                              const SizedBox(height: 16),
                            ],

                            // Distance Information
                            if (_trip!.distanceWithCargo != null || _trip!.distanceWithoutCargo != null) ...[
                              _buildDistanceCard(context, _trip!),
                              const SizedBox(height: 16),
                            ],

                            // Update Status Section (only for active/open trips)
                            if (_trip!.status != 'completed' && _trip!.status != 'cancelled') ...[
                              _buildUpdateStatusCard(context, _trip!),
                            ],
                          ],
                        ),
                      ),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            'Loading trip details...',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error Loading Trip',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.red[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadTripDetails,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.route_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Trip Not Found',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'The requested trip could not be found.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Trip Status',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: _getStatusColor(trip.status),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    trip.statusLabel,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
            if (trip.foNumber != null) ...[
              const Divider(height: 24),
              _buildDetailRow(context, 'FO Number', trip.foNumber!, Icons.tag),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildRouteCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Route',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: _buildLocationCard(
                    context,
                    'Origin',
                    trip.origin?.name ?? 'N/A',
                    Icons.location_on,
                    Colors.blue,
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 12),
                  child: Icon(Icons.arrow_forward, color: Colors.grey),
                ),
                Expanded(
                  child: _buildLocationCard(
                    context,
                    'Destination',
                    trip.destination?.name ?? 'N/A',
                    Icons.location_on,
                    Colors.green,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 32, color: color),
          const SizedBox(height: 8),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildTripInfoCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Trip Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            if (trip.dispatchDate != null)
              _buildDetailRow(
                context,
                'Dispatch Date',
                DateFormat.yMMMd().add_jm().format(trip.dispatchDate!),
                Icons.calendar_today,
              ),
            if (trip.returnedDate != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Returned Date',
                DateFormat.yMMMd().add_jm().format(trip.returnedDate!),
                Icons.event_available,
              ),
            ],
            if (trip.loadPhase != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(context, 'Load Phase', trip.loadPhase!, Icons.upload),
            ],
            if (trip.loadCompletion != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Load Completion',
                trip.loadCompletion!,
                Icons.check_circle_outline,
              ),
            ],
            if (trip.operation != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Operation',
                trip.operation!.displayName,
                Icons.business,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildCargoCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Cargo Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            if (trip.cargoType != null)
              _buildDetailRow(
                context,
                'Cargo Type',
                trip.cargoType!.name,
                Icons.category,
              ),
            if (trip.cargoWeightKg != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Cargo Weight',
                '${(trip.cargoWeightKg! / 1000).toStringAsFixed(2)} tons',
                Icons.scale,
              ),
            ],
            if (trip.cargoVolumeMt != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Cargo Volume (MT)',
                '${trip.cargoVolumeMt!.toStringAsFixed(2)} MT',
                Icons.inventory,
              ),
            ],
            if (trip.cargoVolumeCubicMeters != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Cargo Volume (m³)',
                '${trip.cargoVolumeCubicMeters!.toStringAsFixed(2)} m³',
                Icons.crop_free,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildFuelCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Fuel Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            if (trip.fuelLiters != null)
              _buildDetailRow(
                context,
                'Fuel (Liters)',
                '${trip.fuelLiters!.toStringAsFixed(2)} L',
                Icons.local_gas_station,
              ),
            if (trip.fuelBirr != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Fuel Cost',
                'ETB ${trip.fuelBirr!.toStringAsFixed(2)}',
                Icons.attach_money,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDistanceCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Distance Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            if (trip.distanceWithCargo != null)
              _buildDetailRow(
                context,
                'Distance with Cargo',
                '${(trip.distanceWithCargo! / 1000).toStringAsFixed(1)} km',
                Icons.local_shipping,
              ),
            if (trip.distanceWithoutCargo != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Distance without Cargo',
                '${(trip.distanceWithoutCargo! / 1000).toStringAsFixed(1)} km',
                Icons.directions_car,
              ),
            ],
            if (trip.totalDistance != null) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.straighten, color: Colors.blue[700]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total Distance',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.blue[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            '${(trip.totalDistance! / 1000).toStringAsFixed(1)} km',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildUpdateStatusCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Update Trip Status',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            Text(
              'Status',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: [
                _buildStatusChip('active', 'Active', Colors.green),
                _buildStatusChip('completed', 'Completed', Colors.grey),
                _buildStatusChip('cancelled', 'Cancelled', Colors.red),
              ],
            ),
            const SizedBox(height: 24),
            Text(
              'Comment',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _commentController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: 'Add any comments or notes about this trip...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isUpdating ? null : _updateTripStatus,
                icon: _isUpdating
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Icon(Icons.save),
                label: Text(_isUpdating ? 'Saving...' : 'Save Changes'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status, String label, Color color) {
    final isSelected = _selectedStatus == status;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _selectedStatus = status;
          });
        }
      },
      selectedColor: color,
      checkmarkColor: Colors.white,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : color,
        fontWeight: FontWeight.bold,
      ),
      side: BorderSide(
        color: color,
        width: 2,
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
            ),
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w500,
              ),
          textAlign: TextAlign.end,
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'active':
        return Colors.green;
      case 'open':
        return Colors.blue;
      case 'completed':
        return Colors.grey;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

