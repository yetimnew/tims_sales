import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/fuel_record.dart';
import '../../services/fuel_service.dart';

class FuelRecordDetailsScreen extends StatefulWidget {
  final int fuelRecordId;

  const FuelRecordDetailsScreen({super.key, required this.fuelRecordId});

  @override
  State<FuelRecordDetailsScreen> createState() => _FuelRecordDetailsScreenState();
}

class _FuelRecordDetailsScreenState extends State<FuelRecordDetailsScreen> {
  final FuelService _fuelService = FuelService();
  FuelRecord? _fuelRecord;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadFuelRecord();
  }

  Future<void> _loadFuelRecord() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final record = await _fuelService.getFuelRecord(widget.fuelRecordId);
      setState(() {
        _fuelRecord = record;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fuel Record Details')),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorState()
              : _fuelRecord == null
                  ? _buildEmptyState()
                  : _buildContent(),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
          const SizedBox(height: 16),
          Text(
            'Error loading fuel record',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[800]),
          ),
          const SizedBox(height: 8),
          Text(
            _error ?? 'Unknown error',
            style: TextStyle(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadFuelRecord,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: Text('Fuel record not found'),
    );
  }

  Widget _buildContent() {
    final record = _fuelRecord!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
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
                            Text(
                              record.fuelStation,
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              DateFormat('MMM d, y • h:mm a').format(DateTime.parse(record.fuelDate)),
                              style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(
                          color: _getFuelTypeColor(record.fuelType).withAlpha(25),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          record.fuelTypeLabel,
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: _getFuelTypeColor(record.fuelType),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Details Section
          _buildSectionHeader('Fuel Details'),
          _buildDetailCard([
            _buildDetailRow(Icons.local_gas_station, 'Quantity', '${record.fuelQuantityLiters.toStringAsFixed(2)} L'),
            _buildDetailRow(Icons.attach_money, 'Price Per Liter', '${record.fuelPricePerLiter.toStringAsFixed(2)} ETB/L'),
            _buildDetailRow(Icons.calculate, 'Total Cost', '${record.totalCost.toStringAsFixed(2)} ETB'),
          ]),
          const SizedBox(height: 16),

          // Additional Information
          if (record.odometerReading != null || record.receiptNumber != null || record.notes != null)
            _buildSectionHeader('Additional Information'),
          if (record.odometerReading != null)
            _buildDetailCard([
              _buildDetailRow(Icons.speed, 'Odometer Reading', '${record.odometerReading} km'),
            ]),
          if (record.receiptNumber != null) ...[
            const SizedBox(height: 8),
            _buildDetailCard([
              _buildDetailRow(Icons.receipt, 'Receipt Number', record.receiptNumber!),
            ]),
          ],
          if (record.notes != null) ...[
            const SizedBox(height: 8),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.note, size: 20, color: Colors.grey[700]),
                        const SizedBox(width: 8),
                        Text(
                          'Notes',
                          style: TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.grey[700],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      record.notes!,
                      style: TextStyle(fontSize: 14, color: Colors.grey[800], height: 1.5),
                    ),
                  ],
                ),
              ),
            ),
          ],
          const SizedBox(height: 16),

          if (record.receiptImage != null) ...[
            _buildSectionHeader('Receipt Image'),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Image.network(
                    record.receiptImage!,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox(
                      height: 120,
                      child: Center(child: Text('Unable to load receipt image')),
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],

          if (record.latitude != null && record.longitude != null) ...[
            _buildSectionHeader('Location Snapshot'),
            _buildDetailCard([
              _buildDetailRow(Icons.place, 'Coordinates', '${record.latitude}, ${record.longitude}'),
              if (record.locationAccuracyM != null)
                _buildDetailRow(Icons.my_location, 'Accuracy', '${record.locationAccuracyM!.toStringAsFixed(2)} m'),
              if (record.locationTimestamp != null)
                _buildDetailRow(
                  Icons.schedule,
                  'Captured At',
                  DateFormat('MMM d, y • h:mm a').format(DateTime.parse(record.locationTimestamp!)),
                ),
            ]),
            const SizedBox(height: 16),
          ],

          if (record.reviewedAt != null || record.reviewNote != null) ...[
            _buildSectionHeader('Review'),
            _buildDetailCard([
              if (record.reviewedAt != null)
                _buildDetailRow(
                  Icons.verified,
                  'Reviewed At',
                  DateFormat('MMM d, y • h:mm a').format(DateTime.parse(record.reviewedAt!)),
                ),
              if (record.reviewNote != null && record.reviewNote!.isNotEmpty)
                _buildDetailRow(Icons.comment, 'Review Note', record.reviewNote!),
            ]),
            const SizedBox(height: 16),
          ],

          // Truck Information
          if (record.truck != null) ...[
            _buildSectionHeader('Truck Information'),
            _buildDetailCard([
              _buildDetailRow(Icons.local_shipping, 'Truck Plate', record.truck!.plate),
            ]),
            const SizedBox(height: 16),
          ],

          // Timestamps
          _buildSectionHeader('Record Information'),
          _buildDetailCard([
            _buildDetailRow(
              Icons.access_time,
              'Created',
              DateFormat('MMM d, y • h:mm a').format(DateTime.parse(record.createdAt)),
            ),
            _buildDetailRow(
              Icons.update,
              'Last Updated',
              DateFormat('MMM d, y • h:mm a').format(DateTime.parse(record.updatedAt)),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 8),
      child: Text(
        title.toUpperCase(),
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.grey[600],
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildDetailCard(List<Widget> children) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: children,
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Colors.grey[700]),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Color _getFuelTypeColor(String fuelType) {
    switch (fuelType.toLowerCase()) {
      case 'diesel':
        return Colors.blue;
      case 'petrol':
        return Colors.orange;
      case 'gas':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }
}

