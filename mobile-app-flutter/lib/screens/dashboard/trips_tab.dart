import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../../models/trip.dart';
import '../../services/trip_service.dart';
import '../trips/trip_details_screen.dart';

class TripsTab extends StatefulWidget {
  const TripsTab({super.key});

  @override
  State<TripsTab> createState() => _TripsTabState();
}

class _TripsTabState extends State<TripsTab> {
  final TripService _tripService = TripService();
  Trip? _currentTrip;
  List<Trip> _upcomingTrips = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTrips();
  }

  Future<void> _loadTrips() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final tripsResponse = await _tripService.getTrips();
      setState(() {
        _currentTrip = tripsResponse.current;
        _upcomingTrips = tripsResponse.upcoming;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load trips: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _loadTrips,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              // Header
              Text(
                'My Trips',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'View your current and upcoming trips',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 24),

              if (_isLoading) ...[
                _buildLoadingState(context),
              ] else if (_error != null) ...[
                _buildErrorState(context, _error!),
              ] else ...[
                // Current Trip Section
                if (_currentTrip != null) ...[
                  _buildCurrentTripCard(context, _currentTrip!),
                  const SizedBox(height: 24),
                ] else ...[
                  _buildNoCurrentTripCard(context),
                  const SizedBox(height: 24),
                ],

                // Upcoming Trips Section
                if (_upcomingTrips.isNotEmpty) ...[
                  _buildUpcomingTripsSection(context, _upcomingTrips),
                ] else ...[
                  _buildNoUpcomingTripsCard(context),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return Column(
      children: [
        _buildShimmerCard(context),
        const SizedBox(height: 16),
        _buildShimmerCard(context),
      ],
    );
  }

  Widget _buildShimmerCard(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Container(
          height: 200,
          padding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: Colors.red[50],
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error Loading Trips',
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
              onPressed: _loadTrips,
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

  Widget _buildNoCurrentTripCard(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(Icons.route_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Active Trip',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'You currently do not have an active trip. Check upcoming trips below.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentTripCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TripDetailsScreen(tripId: trip.id),
            ),
          ).then((_) => _loadTrips()); // Refresh after returning
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Current Trip',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getStatusColor(trip.status),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      trip.statusLabel,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
              const Divider(height: 24),
              
              // Route Information
              if (trip.origin != null || trip.destination != null) ...[
                Row(
                  children: [
                    Expanded(
                      child: _buildLocationBox(
                        context,
                        'Origin',
                        trip.origin?.name ?? 'N/A',
                        Icons.location_on,
                        Colors.blue,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Icon(Icons.arrow_forward, color: Colors.grey[400]),
                    const SizedBox(width: 16),
                    Expanded(
                      child: _buildLocationBox(
                        context,
                        'Destination',
                        trip.destination?.name ?? 'N/A',
                        Icons.location_on,
                        Colors.green,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
              ],

              // Trip Details
              if (trip.foNumber != null) ...[
                _buildInfoRow(context, 'FO Number', trip.foNumber!, Icons.tag),
                const SizedBox(height: 8),
              ],
              if (trip.dispatchDate != null) ...[
                _buildInfoRow(
                  context,
                  'Dispatch Date',
                  DateFormat.yMMMd().add_jm().format(trip.dispatchDate!),
                  Icons.calendar_today,
                ),
                const SizedBox(height: 8),
              ],
              if (trip.totalDistance != null) ...[
                _buildInfoRow(
                  context,
                  'Distance',
                  '${(trip.totalDistance! / 1000).toStringAsFixed(1)} km',
                  Icons.straighten,
                ),
                const SizedBox(height: 8),
              ],
              if (trip.cargoType != null) ...[
                _buildInfoRow(
                  context,
                  'Cargo Type',
                  trip.cargoType!.name,
                  Icons.inventory,
                ),
                const SizedBox(height: 8),
              ],
              if (trip.cargoVolumeMt != null || trip.cargoWeightKg != null) ...[
                _buildInfoRow(
                  context,
                  'Cargo',
                  trip.cargoWeightKg != null
                      ? '${(trip.cargoWeightKg! / 1000).toStringAsFixed(2)} tons'
                      : trip.cargoVolumeMt != null
                          ? '${trip.cargoVolumeMt!.toStringAsFixed(2)} MT'
                          : 'N/A',
                  Icons.local_shipping,
                ),
                const SizedBox(height: 8),
              ],

              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => TripDetailsScreen(tripId: trip.id),
                      ),
                    ).then((_) => _loadTrips());
                  },
                  icon: const Icon(Icons.arrow_forward),
                  label: const Text('View Details'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationBox(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 11,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) {
    return Row(
      children: [
        Icon(icon, size: 18, color: Colors.grey[600]),
        const SizedBox(width: 8),
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            color: Colors.grey[600],
          ),
        ),
        const Spacer(),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
        ),
      ],
    );
  }

  Widget _buildUpcomingTripsSection(BuildContext context, List<Trip> trips) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Upcoming Trips',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
        ),
        const SizedBox(height: 12),
        ...trips.map((trip) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _buildUpcomingTripCard(context, trip),
            )),
      ],
    );
  }

  Widget _buildUpcomingTripCard(BuildContext context, Trip trip) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => TripDetailsScreen(tripId: trip.id),
            ),
          ).then((_) => _loadTrips());
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (trip.foNumber != null) ...[
                          Text(
                            'FO: ${trip.foNumber}',
                            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                  color: Colors.grey[600],
                                ),
                          ),
                          const SizedBox(height: 4),
                        ],
                        if (trip.origin != null && trip.destination != null) ...[
                          Text(
                            '${trip.origin!.name} → ${trip.destination!.name}',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ] else if (trip.origin != null || trip.destination != null) ...[
                          Text(
                            trip.origin?.name ?? trip.destination?.name ?? 'Trip',
                            style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: _getStatusColor(trip.status).withAlpha(51),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: _getStatusColor(trip.status),
                        width: 1,
                      ),
                    ),
                    child: Text(
                      trip.statusLabel,
                      style: TextStyle(
                        color: _getStatusColor(trip.status),
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              if (trip.dispatchDate != null) ...[
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 14, color: Colors.grey[600]),
                    const SizedBox(width: 6),
                    Text(
                      DateFormat.yMMMd().add_jm().format(trip.dispatchDate!),
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                    if (trip.totalDistance != null) ...[
                      const SizedBox(width: 16),
                      Icon(Icons.straighten, size: 14, color: Colors.grey[600]),
                      const SizedBox(width: 4),
                      Text(
                        '${(trip.totalDistance! / 1000).toStringAsFixed(1)} km',
                        style: TextStyle(
                          fontSize: 13,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNoUpcomingTripsCard(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(Icons.schedule_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Upcoming Trips',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'You do not have any scheduled trips. New trips will appear here when assigned.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
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

