import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../../config/app_config.dart';
import '../../models/location.dart';
import '../../services/location_service.dart';

class LocationTrackingScreen extends StatefulWidget {
  const LocationTrackingScreen({super.key});

  @override
  State<LocationTrackingScreen> createState() => _LocationTrackingScreenState();
}

class _LocationTrackingScreenState extends State<LocationTrackingScreen> {
  final LocationService _locationService = LocationService();
  
  bool _isTracking = false;
  bool _isLoading = false;
  bool _isLoadingHistory = false;
  String? _error;
  String? _permissionError;
  Map<String, double>? _currentLocation;
  List<DriverLocation> _locationHistory = [];

  @override
  void initState() {
    super.initState();
    _checkPermissions();
    _checkTrackingStatus();
    _loadLocationHistory();
  }

  Future<void> _checkTrackingStatus() async {
    setState(() {
      _isTracking = _locationService.isTracking;
    });
  }

  Future<void> _checkPermissions() async {
    try {
      final hasPermission = await _locationService.checkPermission();
      if (!hasPermission && mounted) {
        setState(() {
          _permissionError = 'Location permission not granted. Please enable location permissions in your device settings.';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _permissionError = 'Error checking permissions: ${e.toString()}';
        });
      }
    }
  }

  Future<void> _loadCurrentLocation() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final location = await _locationService.getCurrentLocation();
      setState(() {
        _currentLocation = location;
        _isLoading = false;
      });

      // Send location to backend if available
      if (location != null) {
        final sent = await _locationService.sendLocation(
          location['latitude']!,
          location['longitude']!,
          accuracy: location['accuracy'],
          speed: location['speed'],
          heading: location['heading'],
        );

        if (sent && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white),
                  SizedBox(width: 8),
                  Expanded(child: Text('Location sent successfully')),
                ],
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
          _loadLocationHistory(); // Refresh history
        } else if (!sent && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.error_outline, color: Colors.white),
                  SizedBox(width: 8),
                  Expanded(child: Text('Failed to send location')),
                ],
              ),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } else {
        setState(() {
          _error = 'Unable to get current location. Please check your location settings.';
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Error getting location: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleTracking() async {
    if (_isTracking) {
      // Stop tracking
      try {
        await _locationService.stopBackgroundTracking();
        setState(() {
          _isTracking = _locationService.isTracking;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Location tracking stopped'),
              backgroundColor: Colors.orange,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error stopping tracking: ${e.toString()}'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } else {
      // Start tracking
      try {
        await _locationService.startBackgroundTracking();
        setState(() {
          _isTracking = _locationService.isTracking;
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Row(
                children: [
                  Icon(Icons.location_on, color: Colors.white),
                  SizedBox(width: 8),
                  Expanded(child: Text('Background location tracking started')),
                ],
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      } catch (e) {
        setState(() {
          _error = e.toString();
        });
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Error starting tracking: ${e.toString()}'),
              backgroundColor: Colors.red,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    }
  }

  Future<void> _loadLocationHistory() async {
    setState(() {
      _isLoadingHistory = true;
    });

    try {
      final history = await _locationService.getLocationHistory(limit: 50);
      setState(() {
        _locationHistory = history;
        _isLoadingHistory = false;
      });
    } catch (e) {
      setState(() {
        _isLoadingHistory = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Location Tracking'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              _loadCurrentLocation();
              _loadLocationHistory();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await _loadCurrentLocation();
          await _loadLocationHistory();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Permission Error
              if (_permissionError != null)
                _buildErrorCard(context, _permissionError!),
              if (_permissionError != null) const SizedBox(height: 16),

              // Current Location Section
              _buildCurrentLocationCard(context),
              const SizedBox(height: 24),

              // Tracking Controls
              _buildTrackingControlsCard(context),
              const SizedBox(height: 24),

              // Location History
              _buildLocationHistorySection(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildErrorCard(BuildContext context, String error) {
    return Card(
      elevation: 2,
      color: Colors.red[50],
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          children: [
            Icon(Icons.error_outline, color: Colors.red[700]),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                error,
                style: TextStyle(color: Colors.red[700]),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentLocationCard(BuildContext context) {
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
                  'Current Location',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                if (_isLoading)
                  const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  ),
              ],
            ),
            const Divider(height: 24),
            if (_error != null) ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, size: 20, color: Colors.red[700]),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: TextStyle(color: Colors.red[700], fontSize: 13),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
            ],
            if (_currentLocation != null) ...[
              _buildLocationInfoRow(
                context,
                'Latitude',
                _currentLocation!['latitude']!.toStringAsFixed(6),
                Icons.my_location,
              ),
              const SizedBox(height: 12),
              _buildLocationInfoRow(
                context,
                'Longitude',
                _currentLocation!['longitude']!.toStringAsFixed(6),
                Icons.my_location,
              ),
              if (_currentLocation!['accuracy'] != null) ...[
                const SizedBox(height: 12),
                _buildLocationInfoRow(
                  context,
                  'Accuracy',
                  '${_currentLocation!['accuracy']!.toStringAsFixed(0)} m',
                  Icons.gps_fixed,
                ),
              ],
              if (_currentLocation!['speed'] != null && _currentLocation!['speed']! > 0) ...[
                const SizedBox(height: 12),
                _buildLocationInfoRow(
                  context,
                  'Speed',
                  '${(_currentLocation!['speed']! * 3.6).toStringAsFixed(1)} km/h',
                  Icons.speed,
                ),
              ],
              if (_currentLocation!['heading'] != null) ...[
                const SizedBox(height: 12),
                _buildLocationInfoRow(
                  context,
                  'Heading',
                  _formatHeading(_currentLocation!['heading']!),
                  Icons.explore,
                ),
              ],
            ] else if (!_isLoading) ...[
              Container(
                padding: const EdgeInsets.all(24),
                alignment: Alignment.center,
                child: Column(
                  children: [
                    Icon(Icons.location_off, size: 64, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'No location data',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Tap "Get Current Location" to fetch your location',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.grey[500],
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _isLoading ? null : _loadCurrentLocation,
                icon: const Icon(Icons.my_location),
                label: const Text('Get Current Location'),
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

  Widget _buildLocationInfoRow(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 12),
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
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.w500,
              ),
        ),
      ],
    );
  }

  String _formatHeading(double heading) {
    final directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    final index = ((heading + 22.5) / 45.0).floor() % 8;
    return '${directions[index]} (${heading.toStringAsFixed(0)}°)';
  }

  Widget _buildTrackingControlsCard(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Background Tracking',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Automatically send location updates every ${AppConfig.locationUpdateInterval ~/ 60} minutes',
              style: TextStyle(
                fontSize: 13,
                color: Colors.grey[600],
              ),
            ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Status',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: _isTracking ? Colors.green : Colors.grey,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _isTracking ? 'Tracking Active' : 'Tracking Inactive',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: _isTracking ? Colors.green : Colors.grey,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Switch(
                  value: _isTracking,
                  onChanged: (value) => _toggleTracking(),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationHistorySection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Location History',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            if (_locationHistory.isNotEmpty)
              TextButton(
                onPressed: _loadLocationHistory,
                child: const Text('Refresh'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_isLoadingHistory)
          _buildHistoryLoadingShimmer(context)
        else if (_locationHistory.isEmpty)
          _buildEmptyHistoryCard(context)
        else
          ..._locationHistory.map((location) => _buildLocationHistoryItem(context, location)),
      ],
    );
  }

  Widget _buildHistoryLoadingShimmer(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Column(
        children: List.generate(3, (index) => _buildShimmerCard(context)),
      ),
    );
  }

  Widget _buildShimmerCard(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 12),
      child: Container(
        height: 100,
        padding: const EdgeInsets.all(16),
      ),
    );
  }

  Widget _buildEmptyHistoryCard(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(Icons.history, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Location History',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Location history will appear here once you start sending locations.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationHistoryItem(BuildContext context, DriverLocation location) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(Icons.location_on, color: Theme.of(context).colorScheme.primary),
                    const SizedBox(width: 8),
                    Text(
                      DateFormat.yMMMd().add_jm().format(location.timestamp),
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                  ],
                ),
                Text(
                  DateFormat('HH:mm').format(location.timestamp),
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildHistoryInfo(
                    'Latitude',
                    location.latitude.toStringAsFixed(6),
                    Icons.my_location,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildHistoryInfo(
                    'Longitude',
                    location.longitude.toStringAsFixed(6),
                    Icons.my_location,
                  ),
                ),
              ],
            ),
            if (location.accuracy != null || location.speed != null || location.heading != null) ...[
              const SizedBox(height: 12),
              const Divider(height: 1),
              const SizedBox(height: 12),
              Wrap(
                spacing: 16,
                runSpacing: 8,
                children: [
                  if (location.accuracy != null)
                    _buildHistoryInfo(
                      'Accuracy',
                      location.accuracyFormatted,
                      Icons.gps_fixed,
                    ),
                  if (location.speed != null && location.speed! > 0)
                    _buildHistoryInfo(
                      'Speed',
                      location.speedFormatted,
                      Icons.speed,
                    ),
                  if (location.heading != null)
                    _buildHistoryInfo(
                      'Heading',
                      location.headingFormatted,
                      Icons.explore,
                    ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildHistoryInfo(String label, String value, IconData icon) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Text(
          '$label: ',
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}

