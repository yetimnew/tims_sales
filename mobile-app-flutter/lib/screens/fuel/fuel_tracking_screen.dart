import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/fuel_record.dart';
import '../../services/fuel_service.dart';
import '../../theme/app_theme.dart';
import 'add_fuel_record_screen.dart';
import 'fuel_record_details_screen.dart';

class FuelTrackingScreen extends StatefulWidget {
  const FuelTrackingScreen({super.key});

  @override
  State<FuelTrackingScreen> createState() => _FuelTrackingScreenState();
}

class _FuelTrackingScreenState extends State<FuelTrackingScreen> {
  final FuelService _fuelService = FuelService();
  final GlobalKey<RefreshIndicatorState> _refreshIndicatorKey = GlobalKey<RefreshIndicatorState>();

  List<FuelRecord> _fuelRecords = [];
  bool _isLoading = true;
  String? _error;
  DateTime? _startDate;
  DateTime? _endDate;

  @override
  void initState() {
    super.initState();
    _loadFuelRecords();
  }

  Future<void> _loadFuelRecords({bool showRefreshIndicator = false}) async {
    if (!showRefreshIndicator) {
      setState(() {
        _isLoading = true;
        _error = null;
      });
    }

    try {
      final response = await _fuelService.getFuelRecords(
        startDate: _startDate?.toIso8601String().split('T')[0],
        endDate: _endDate?.toIso8601String().split('T')[0],
      );

      setState(() {
        _fuelRecords = response.records;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _startDate != null && _endDate != null
          ? DateTimeRange(start: _startDate!, end: _endDate!)
          : null,
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _loadFuelRecords();
    }
  }

  void _clearDateFilter() {
    setState(() {
      _startDate = null;
      _endDate = null;
    });
    _loadFuelRecords();
  }

  double _calculateTotalCost() {
    return _fuelRecords.fold(0.0, (sum, record) => sum + record.totalCost);
  }

  double _calculateTotalLiters() {
    return _fuelRecords.fold(0.0, (sum, record) => sum + record.fuelQuantityLiters);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Fuel Tracking'),
        actions: [
          if (_startDate != null || _endDate != null)
            IconButton(
              icon: const Icon(Icons.filter_alt_off),
              tooltip: 'Clear filter',
              onPressed: _clearDateFilter,
            ),
          IconButton(
            icon: const Icon(Icons.date_range),
            tooltip: 'Filter by date',
            onPressed: _selectDateRange,
          ),
        ],
      ),
      body: RefreshIndicator(
        key: _refreshIndicatorKey,
        onRefresh: () => _loadFuelRecords(showRefreshIndicator: true),
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
                ? _buildErrorState()
                : _fuelRecords.isEmpty
                    ? _buildEmptyState()
                    : _buildContent(),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddFuelRecordScreen()),
          );
          if (result == true) {
            _loadFuelRecords();
          }
        },
        icon: const Icon(Icons.add),
        label: const Text('Add Fuel Record'),
      ),
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
            'Error loading fuel records',
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
            onPressed: _loadFuelRecords,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.local_gas_station, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No fuel records found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[800]),
          ),
          const SizedBox(height: 8),
          Text(
            _startDate != null || _endDate != null
                ? 'Try adjusting your date filter'
                : 'Start by adding your first fuel record',
            style: TextStyle(color: Colors.grey[600]),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    final totalCost = _calculateTotalCost();
    final totalLiters = _calculateTotalLiters();
    final avgPrice = totalLiters > 0 ? totalCost / totalLiters : 0.0;

    return Column(
      children: [
        // Summary Cards
        Container(
          padding: const EdgeInsets.all(16),
          color: Theme.of(context).primaryColor.withAlpha(25),
          child: Row(
            children: [
              Expanded(
                child: _buildSummaryCard(
                  'Total Cost',
                  '${totalCost.toStringAsFixed(2)} ETB',
                  Icons.attach_money,
                  Colors.green,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSummaryCard(
                  'Total Liters',
                  '${totalLiters.toStringAsFixed(2)} L',
                  Icons.local_gas_station,
                  Colors.blue,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildSummaryCard(
                  'Avg Price',
                  '${avgPrice.toStringAsFixed(2)} ETB/L',
                  Icons.trending_up,
                  Colors.orange,
                ),
              ),
            ],
          ),
        ),

        // Date Filter Info
        if (_startDate != null || _endDate != null)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.blue.withAlpha(25),
            child: Row(
              children: [
                const Icon(Icons.filter_alt, size: 16, color: Colors.blue),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Showing records from ${_startDate != null ? DateFormat('MMM d, y').format(_startDate!) : 'start'} to ${_endDate != null ? DateFormat('MMM d, y').format(_endDate!) : 'end'}',
                    style: const TextStyle(fontSize: 12, color: Colors.blue),
                  ),
                ),
              ],
            ),
          ),

        // Fuel Records List
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: _fuelRecords.length,
            itemBuilder: (context, index) {
              final record = _fuelRecords[index];
              return _buildFuelRecordCard(record);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(25),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
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
                style: TextStyle(fontSize: 11, color: Colors.grey[600]),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFuelRecordCard(FuelRecord record) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () async {
          await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => FuelRecordDetailsScreen(fuelRecordId: record.id),
            ),
          );
          _loadFuelRecords();
        },
        borderRadius: BorderRadius.circular(12),
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
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          DateFormat('MMM d, y • h:mm a').format(DateTime.parse(record.fuelDate)),
                          style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: _getFuelTypeColor(record.fuelType).withAlpha(25),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      record.fuelTypeLabel,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: _getFuelTypeColor(record.fuelType),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: _buildRecordDetail(
                      Icons.local_gas_station,
                      '${record.fuelQuantityLiters.toStringAsFixed(2)} L',
                    ),
                  ),
                  Expanded(
                    child: _buildRecordDetail(
                      Icons.attach_money,
                      '${record.totalCost.toStringAsFixed(2)} ETB',
                    ),
                  ),
                  Expanded(
                    child: _buildRecordDetail(
                      Icons.speed,
                      '${record.fuelPricePerLiter.toStringAsFixed(2)} ETB/L',
                    ),
                  ),
                ],
              ),
              if (record.odometerReading != null) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(Icons.speed, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 4),
                    Text(
                      'Odometer: ${record.odometerReading} km',
                      style: TextStyle(fontSize: 12, color: Colors.grey[600]),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRecordDetail(IconData icon, String value) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 4),
        Expanded(
          child: Text(
            value,
            style: TextStyle(fontSize: 12, color: Colors.grey[800]),
            overflow: TextOverflow.ellipsis,
          ),
        ),
      ],
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

