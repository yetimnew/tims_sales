import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../../models/performance.dart';
import '../../services/performance_service.dart';

class PerformanceTab extends StatefulWidget {
  const PerformanceTab({super.key});

  @override
  State<PerformanceTab> createState() => _PerformanceTabState();
}

class _PerformanceTabState extends State<PerformanceTab> {
  final PerformanceService _performanceService = PerformanceService();
  DriverPerformance? _performance;
  List<PerformanceRecord> _history = [];
  bool _isLoading = true;
  bool _isLoadingHistory = false;
  bool _showHistory = false;
  String? _error;
  String? _selectedPeriodType;

  @override
  void initState() {
    super.initState();
    _loadPerformance();
  }

  Future<void> _loadPerformance() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final performance = await _performanceService.getPerformance();
      setState(() {
        _performance = performance;
        _isLoading = false;
      });
      
      // Load history if performance data exists
      if (performance != null && _showHistory) {
        _loadHistory();
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load performance data: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _loadHistory() async {
    setState(() {
      _isLoadingHistory = true;
    });

    try {
      final history = await _performanceService.getHistory(
        periodType: _selectedPeriodType,
        limit: 10,
      );
      setState(() {
        _history = history;
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
      body: RefreshIndicator(
        onRefresh: _loadPerformance,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              // Header
              Text(
                'Performance Overview',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: 4),
              Text(
                'Track your driving performance metrics',
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
              ] else if (_performance != null) ...[
                // Latest Record Section
                if (_performance!.latestRecord != null) ...[
                  _buildLatestRecordCard(context, _performance!.latestRecord!),
                  const SizedBox(height: 16),
                  
                  // Score Breakdown Section
                  if (_performance!.latestRecord!.scoreBreakdown != null) ...[
                    _buildScoreBreakdownCard(context, _performance!.latestRecord!.scoreBreakdown!),
                    const SizedBox(height: 16),
                  ],
                ],

                // Summary Section
                _buildSummaryCard(context, _performance!.summary),
                const SizedBox(height: 16),

                // Key Metrics Grid
                _buildMetricsGrid(context, _performance!.summary),
                const SizedBox(height: 16),

                // Performance History Section
                _buildHistorySection(context),
              ] else ...[
                _buildEmptyState(context),
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
        const SizedBox(height: 16),
        _buildShimmerGrid(context),
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

  Widget _buildShimmerGrid(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: GridView.count(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.5,
        children: List.generate(4, (index) => Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
          ),
        )),
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
              'Error Loading Performance',
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
              onPressed: _loadPerformance,
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
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(Icons.assessment_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Performance Data',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Performance data will appear here once trips are completed.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLatestRecordCard(BuildContext context, PerformanceRecord record) {
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
                Expanded(
                  child: Text(
                    'Latest Performance Record',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                  ),
                ),
                Row(
                  children: [
                    // Period Type Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getPeriodTypeColor(record.periodType),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        record.periodType.toUpperCase(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    // Grade Badge
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: _getGradeColor(record.performanceGrade),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        record.performanceGrade,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const Divider(height: 24),
            
            // Record Date and Truck Info
            Row(
              children: [
                Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                const SizedBox(width: 8),
                Text(
                  DateFormat.yMMMd().format(record.recordDate),
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (record.truck != null) ...[
                  const SizedBox(width: 16),
                  Icon(Icons.local_shipping, size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    record.truck!.plate,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 16),
            
            // Performance Score (Large Display)
            Center(
              child: Column(
                children: [
                  Text(
                    '${record.performanceScore.toStringAsFixed(1)}%',
                    style: TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: _getScoreColor(record.performanceScore),
                    ),
                  ),
                  Text(
                    'Performance Score',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 16),
            
            // Metrics Grid
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Trips',
                    '${record.totalTrips}',
                    Icons.route,
                    Colors.blue,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Distance',
                    '${(record.totalDistanceKm / 1000).toStringAsFixed(1)}k km',
                    Icons.straighten,
                    Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Cargo',
                    '${(record.totalCargoTonnage / 1000).toStringAsFixed(2)}k tons',
                    Icons.inventory,
                    Colors.purple,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricItem(
                    context,
                    'Rating',
                    record.customerRating != null
                        ? '${record.customerRating!.toStringAsFixed(1)} ⭐'
                        : 'N/A',
                    Icons.star,
                    Colors.amber,
                  ),
                ),
              ],
            ),
            if (record.fuelEfficiency != null) ...[
              const SizedBox(height: 12),
              _buildMetricItem(
                context,
                'Fuel Efficiency',
                '${record.fuelEfficiency!.toStringAsFixed(2)} km/L',
                Icons.local_gas_station,
                Colors.orange,
              ),
            ],
            if (record.safetyViolations > 0 || record.accidents > 0) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.red[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.red[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.red[700], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Safety: ${record.safetyViolations} violation(s), ${record.accidents} accident(s)',
                        style: TextStyle(
                          color: Colors.red[700],
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            // Performance Notes
            if (record.performanceNotes != null && record.performanceNotes!.isNotEmpty) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.note, color: Colors.blue[700], size: 18),
                        const SizedBox(width: 8),
                        Text(
                          'Notes',
                          style: TextStyle(
                            color: Colors.blue[700],
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      record.performanceNotes!,
                      style: TextStyle(
                        color: Colors.blue[900],
                        fontSize: 13,
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

  Widget _buildScoreBreakdownCard(BuildContext context, ScoreBreakdown breakdown) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Score Breakdown',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Total: ${breakdown.totalScore}/100 points',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
                fontWeight: FontWeight.w500,
              ),
            ),
            const Divider(height: 24),
            _buildBreakdownItem(
              context,
              'Fuel Efficiency',
              breakdown.fuelEfficiency,
              Colors.orange,
              Icons.local_gas_station,
            ),
            const SizedBox(height: 16),
            _buildBreakdownItem(
              context,
              'Safety',
              breakdown.safety,
              Colors.red,
              Icons.security,
            ),
            const SizedBox(height: 16),
            _buildBreakdownItem(
              context,
              'Customer Rating',
              breakdown.customerRating,
              Colors.amber,
              Icons.star,
            ),
            const SizedBox(height: 16),
            _buildBreakdownItem(
              context,
              'Productivity',
              breakdown.productivity,
              Colors.blue,
              Icons.trending_up,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBreakdownItem(
    BuildContext context,
    String label,
    CategoryScore category,
    Color color,
    IconData icon,
  ) {
    final percentage = category.max > 0 ? (category.points / category.max) : 0.0;
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Icon(icon, size: 18, color: color),
                const SizedBox(width: 8),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ],
            ),
            Text(
              '${category.score}/${category.max}',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            minHeight: 8,
            backgroundColor: color.withAlpha(51),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildMetricItem(
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
      child: Row(
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(width: 8),
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
                const SizedBox(height: 4),
                Text(
                  value,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: color,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context, PerformanceSummary summary) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Overall Summary',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              '${summary.totalRecords} record(s)',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            const Divider(height: 24),
            _buildSummaryRow(
              context,
              Icons.route,
              'Total Trips',
              '${summary.totalTrips}',
              Colors.blue,
            ),
            const SizedBox(height: 12),
            _buildSummaryRow(
              context,
              Icons.straighten,
              'Total Distance',
              '${(summary.totalDistanceKm / 1000).toStringAsFixed(1)}k km',
              Colors.green,
            ),
            const SizedBox(height: 12),
            _buildSummaryRow(
              context,
              Icons.inventory,
              'Total Cargo',
              '${(summary.totalCargoTonnage / 1000).toStringAsFixed(2)}k tons',
              Colors.purple,
            ),
            if (summary.avgFuelEfficiency != null) ...[
              const SizedBox(height: 12),
              _buildSummaryRow(
                context,
                Icons.local_gas_station,
                'Avg Fuel Efficiency',
                '${summary.avgFuelEfficiency!.toStringAsFixed(2)} km/L',
                Colors.orange,
              ),
            ],
            if (summary.avgCustomerRating != null) ...[
              const SizedBox(height: 12),
              _buildSummaryRow(
                context,
                Icons.star,
                'Avg Customer Rating',
                '${summary.avgCustomerRating!.toStringAsFixed(1)} ⭐',
                Colors.amber,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryRow(
    BuildContext context,
    IconData icon,
    String label,
    String value,
    Color color,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            label,
            style: Theme.of(context).textTheme.bodyLarge,
          ),
        ),
        Text(
          value,
          style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
      ],
    );
  }

  Widget _buildMetricsGrid(BuildContext context, PerformanceSummary summary) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.3,
      children: [
        _buildMetricCard(
          context,
          'Safety Violations',
          '${summary.totalSafetyViolations}',
          Icons.warning,
          summary.totalSafetyViolations > 0 ? Colors.red : Colors.green,
        ),
        _buildMetricCard(
          context,
          'Accidents',
          '${summary.totalAccidents}',
          Icons.error_outline,
          summary.totalAccidents > 0 ? Colors.red : Colors.green,
        ),
      ],
    );
  }

  Widget _buildMetricCard(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              color.withAlpha(38),
              color.withAlpha(25),
            ],
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 32, color: color),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHistorySection(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Column(
        children: [
          InkWell(
            onTap: () {
              setState(() {
                _showHistory = !_showHistory;
                if (_showHistory && _history.isEmpty) {
                  _loadHistory();
                }
              });
            },
            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Performance History',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                  ),
                  Icon(
                    _showHistory ? Icons.expand_less : Icons.expand_more,
                    color: Theme.of(context).colorScheme.primary,
                  ),
                ],
              ),
            ),
          ),
          if (_showHistory) ...[
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  // Period Type Filter
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('All'),
                        selected: _selectedPeriodType == null,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedPeriodType = null;
                              _loadHistory();
                            });
                          }
                        },
                      ),
                      FilterChip(
                        label: const Text('Daily'),
                        selected: _selectedPeriodType == 'daily',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedPeriodType = 'daily';
                              _loadHistory();
                            });
                          }
                        },
                      ),
                      FilterChip(
                        label: const Text('Weekly'),
                        selected: _selectedPeriodType == 'weekly',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedPeriodType = 'weekly';
                              _loadHistory();
                            });
                          }
                        },
                      ),
                      FilterChip(
                        label: const Text('Monthly'),
                        selected: _selectedPeriodType == 'monthly',
                        onSelected: (selected) {
                          if (selected) {
                            setState(() {
                              _selectedPeriodType = 'monthly';
                              _loadHistory();
                            });
                          }
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  if (_isLoadingHistory)
                    const Center(child: CircularProgressIndicator())
                  else if (_history.isEmpty)
                    Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Text(
                        'No performance history found',
                        style: TextStyle(color: Colors.grey[600]),
                      ),
                    )
                  else
                    ..._history.map((record) => _buildHistoryItem(context, record)),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHistoryItem(BuildContext context, PerformanceRecord record) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
      child: Padding(
        padding: const EdgeInsets.all(12.0),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: _getGradeColor(record.performanceGrade),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Center(
                child: Text(
                  record.performanceGrade,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getPeriodTypeColor(record.periodType),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          record.periodType.toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        DateFormat.yMMMd().format(record.recordDate),
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        '${record.totalTrips} trips',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${(record.totalDistanceKm / 1000).toStringAsFixed(1)}k km',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        '${record.performanceScore.toStringAsFixed(0)}%',
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: _getScoreColor(record.performanceScore),
                        ),
                      ),
                    ],
                  ),
                  if (record.truck != null) ...[
                    const SizedBox(height: 4),
                    Text(
                      'Truck: ${record.truck!.plate}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getPeriodTypeColor(String periodType) {
    switch (periodType.toLowerCase()) {
      case 'daily':
        return Colors.green;
      case 'weekly':
        return Colors.blue;
      case 'monthly':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  Color _getGradeColor(String grade) {
    switch (grade.toUpperCase()) {
      case 'A+':
      case 'A':
        return Colors.green;
      case 'B+':
      case 'B':
        return Colors.blue;
      case 'C+':
      case 'C':
        return Colors.orange;
      default:
        return Colors.red;
    }
  }

  Color _getScoreColor(double score) {
    if (score >= 80) return Colors.green;
    if (score >= 60) return Colors.blue;
    if (score >= 40) return Colors.orange;
    return Colors.red;
  }
}
