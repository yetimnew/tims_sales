# Capacity Planning & Fleet Optimization - Implementation Summary

## Overview
The **Capacity Planning & Fleet Optimization** report provides comprehensive analysis of fleet utilization, identifies overcapacity or undercapacity situations, and generates data-driven recommendations to right-size the fleet for optimal performance and cost efficiency.

## Implementation Date
December 31, 2025

## Files Created/Modified

### Backend Services
1. **`app/Services/Reports/CapacityPlanningReport.php`**
   - Comprehensive capacity analysis service
   - Metrics calculated:
     - **Fleet Overview**: Total trucks, active/inactive breakdown, utilization rate, idle days
     - **Utilization Analysis**: Distribution across utilization buckets (high, optimal, moderate, low, very low, unused)
     - **Demand Analysis**: Trip patterns, outsource rate, demand variability, peak/min demand
     - **Productivity Metrics**: Trips, distance, tonnage, revenue per truck per day
     - **Idle Capacity**: Cost of idle capacity, opportunity cost, potential revenue loss
     - **Truck Performance**: Individual truck-level utilization and productivity breakdown
     - **Recommendations**: AI-generated optimization recommendations with potential savings/revenue
     - **Monthly Trend**: Utilization trends over time
     - **Weekday Pattern**: Day-of-week demand analysis

### Request Validation
2. **`app/Http/Requests/Reports/CapacityPlanningRequest.php`**
   - Validates date range filters
   - Default: Last 90 days
   - Permissions: `reports.capacity-planning.view` and `reports.capacity-planning.export`

### Export Functionality
3. **`app/Exports/Reports/CapacityPlanningExport.php`**
   - Multi-sheet Excel export (Overview, Truck Performance, Recommendations, Monthly Trend)
   - CSV export support
   - Professional formatting with color coding and borders

### Controller Updates
4. **`app/Http/Controllers/ReportController.php`**
   - Added `capacityPlanning()` method for report rendering
   - Added `capacityPlanningExport()` method for CSV/XLSX exports
   - Injected `CapacityPlanningReport` service in constructor

### Routes
5. **`routes/web.php`**
   - `GET /reports/capacity-planning` - View dashboard
   - `GET /reports/capacity-planning/export/{format}` - Export (CSV/XLSX)
   - Protected by permissions middleware

### Frontend Components
6. **`resources/js/pages/Reports/CapacityPlanning.tsx`**
   - Comprehensive capacity planning UI
   - Key features:
     - 4 executive summary cards (Utilization, Active Trucks, Idle Cost, Outsource Rate)
     - Prioritized optimization recommendations section
     - Utilization distribution with 6 buckets (visual breakdown)
     - Demand analysis metrics
     - Productivity metrics dashboard
     - Individual truck performance table (top 20)
     - Monthly capacity trend table
     - Weekday demand pattern visualization
   - Date range filtering
   - Export to CSV/XLSX
   - Responsive design with Tailwind CSS
   - Dark mode support
   - Color-coded utilization indicators

## Key Metrics Provided

### Fleet Overview
- Total Trucks (all statuses)
- Active Trucks
- Maintenance Trucks
- Inactive Trucks
- Days in Period
- Active Truck-Days
- Total Possible Truck-Days
- Fleet Utilization Rate
- Idle Truck-Days
- Total Trips
- Total Revenue
- Avg Trips per Truck
- Avg Revenue per Truck

### Utilization Analysis
- **Utilization Buckets**:
  - High (>80%): May indicate overworked fleet
  - Optimal (60-80%): Ideal utilization range
  - Moderate (40-60%): Room for improvement
  - Low (20-40%): Underutilized
  - Very Low (<20%): Rarely used
  - Unused (0%): Not deployed
- Average Utilization
- Count in each bucket
- Individual truck utilization details (plate, utilization %, active/idle days)

### Demand Analysis
- Total Trips (internal + outsource)
- Internal vs Outsource Trip Split
- Outsource Rate %
- Total Tonnage
- Total Ton-KM
- Total Distance
- Average Trips per Day
- Average Tonnage per Day
- Peak Daily Trips
- Minimum Daily Trips
- Demand Variability % (how much peak exceeds average)

### Productivity Metrics
- Distance per Truck per Day
- Trips per Truck per Day
- Tonnage per Truck per Day
- Revenue per Truck per Day
- Average Distance per Trip
- Average Tonnage per Trip
- Average Revenue per Trip

### Idle Capacity Analysis
- Total Possible Truck-Days
- Active Truck-Days
- Idle Truck-Days
- Idle Rate %
- Fixed Cost per Truck per Day (depreciation + insurance + financing)
- Total Idle Cost
- Average Revenue per Truck-Day
- Potential Revenue from Idle Capacity
- **Total Opportunity Cost** (idle costs + lost revenue)
- Average Truck Value

### Individual Truck Performance
For each active truck:
- Plate Number
- Vehicle Type
- Active Days
- Idle Days
- Utilization %
- Total Trips
- Distance (KM)
- Tonnage (MT)
- Revenue
- Trips per Day
- Revenue per Day

### AI-Generated Recommendations
Intelligent recommendations based on data analysis:

**Categories**:
- Fleet Sizing (expand/reduce recommendations)
- Idle Capacity (reduce idle costs)
- Productivity (improve trip frequency)
- Demand Management (handle variability)

**Priority Levels**:
- High: Critical actions with significant impact
- Medium: Important improvements
- Low: Nice-to-have optimizations

**For Each Recommendation**:
- Title
- Description
- Potential Savings (ETB)
- Potential Revenue (ETB)
- Optimal Fleet Size (if applicable)
- Expected Utilization after implementation

### Time-Based Analysis
- **Monthly Trend**: Utilization, active days, trips over months
- **Weekday Pattern**: Average trips per day for each day of week

## Recommendation Logic

### 1. Significant Overcapacity (Utilization < 50%)
- **Trigger**: Fleet utilization below 50%
- **Recommendation**: Reduce fleet size or increase marketing
- **Suggested Reduction**: ~50% of underutilized trucks
- **Potential Savings**: 50% of total opportunity cost

### 2. Moderate Overcapacity (Utilization < 65%)
- **Trigger**: Fleet utilization between 50-65%
- **Recommendation**: Optimize fleet size or improve load matching
- **Potential Savings**: 30% of total opportunity cost

### 3. Fleet Expansion Opportunity (Utilization > 85% + Outsource > 15%)
- **Trigger**: High utilization AND high outsource rate
- **Recommendation**: Expand fleet to capture outsourced demand
- **Suggested Addition**: Number of trucks to handle outsourced trips
- **Potential Revenue**: Outsourced trips × avg revenue per trip

### 4. Unused Trucks (0% utilization)
- **Trigger**: Trucks with zero active days
- **Recommendation**: Sell, lease out, or reassign
- **Potential Savings**: Fixed costs × days × unused truck count

### 5. High Idle Capacity Cost (Idle Rate > 30%)
- **Trigger**: More than 30% of truck-days are idle
- **Recommendation**: Improve scheduling and load matching
- **Potential Savings**: 40% of total opportunity cost

### 6. Low Trip Frequency (< 0.5 trips/truck/day)
- **Trigger**: Trucks average less than 0.5 trips per day
- **Recommendation**: Improve route planning and reduce turnaround times
- **Potential Revenue**: 30% increase in trip frequency

### 7. High Demand Variability (> 50%)
- **Trigger**: Peak demand exceeds average by >50%
- **Recommendation**: Flexible capacity arrangements (spot leasing, partnerships)
- **Potential Savings**: 20% of idle costs

### 8. Optimal Fleet Size Calculation
- **Formula**: `(avg trips per day / trips per truck per day) / target utilization (75%)`
- **Threshold**: Only recommend if change is >10% of fleet or >2 trucks
- **Expected Utilization**: Projects utilization after change

## Data Sources
- **Trucks**: Fleet inventory, status, purchase price
- **DriverTrucks**: Active assignments for utilization calculation
- **Performances**: Trips, distance, tonnage data
- **Operations**: Revenue, outsource information

## Permissions Required
- **View**: `reports.capacity-planning.view`
- **Export**: `reports.capacity-planning.export`

## Usage Instructions

### Accessing the Report
1. Navigate to `/reports/capacity-planning`
2. Report loads with default last 90 days of data
3. Use filters to adjust date range
4. Review fleet overview, utilization distribution, and recommendations

### Understanding Utilization Buckets
- **High (>80%)**: Trucks working extensively - watch for driver fatigue and maintenance needs
- **Optimal (60-80%)**: Sweet spot - good utilization with flexibility for demand spikes
- **Moderate (40-60%)**: Acceptable but room to improve - focus on better load matching
- **Low (20-40%)**: Underutilized - investigate why these trucks aren't being used
- **Very Low (<20%)**: Rarely used - strong candidates for reassignment or disposal
- **Unused (0%)**: Not deployed - immediate action needed

### Acting on Recommendations
Each recommendation includes:
- Priority level (high/medium/low)
- Specific actions to take
- Potential financial impact
- Expected outcomes

**High Priority**: Act within 30 days
**Medium Priority**: Plan for next quarter
**Low Priority**: Consider for annual planning

### Interpreting Opportunity Cost
**Total Opportunity Cost** = Idle Costs + Lost Revenue
- **Idle Costs**: Fixed expenses (depreciation, insurance, financing) on idle trucks
- **Lost Revenue**: Revenue that could have been earned if idle trucks were working

This represents the true cost of excess capacity.

### Optimal Fleet Size
The report calculates optimal fleet size targeting 75% utilization:
- **Below 75%**: You may have excess capacity
- **Above 75%**: Good utilization with flexibility
- **Above 85%**: Risk of not meeting demand spikes

### Weekday Patterns
Use weekday demand patterns to:
- Schedule maintenance on low-demand days
- Plan marketing campaigns for low-demand days
- Ensure adequate capacity on high-demand days
- Consider day-of-week pricing strategies

## Technical Notes

### Performance Considerations
- Report aggregates data from multiple tables
- Date range filtering applied to minimize data load
- Truck performance table limited to top 20 on UI (full data in export)
- Efficient SQL queries with proper joins

### Calculation Details

**Utilization Rate**:
```
Utilization % = (Active Truck-Days / Total Possible Truck-Days) × 100
```

**Fixed Cost per Truck per Day**:
```
Depreciation: 10% of truck value per year / 365
Insurance: 3% of truck value per year / 365
Financing: 5% of truck value per year / 365
Total: ~18% of truck value per year / 365
```

**Opportunity Cost**:
```
Idle Cost = Idle Truck-Days × Fixed Cost per Truck per Day
Lost Revenue = Idle Truck-Days × Avg Revenue per Active Truck-Day
Total Opportunity Cost = Idle Cost + Lost Revenue
```

**Demand Variability**:
```
Variability % = ((Peak Daily Trips - Avg Daily Trips) / Avg Daily Trips) × 100
```

### Recommendation Thresholds
All thresholds are configurable in the service:
- Significant overcapacity: <50% utilization
- Moderate overcapacity: <65% utilization
- Expansion opportunity: >85% utilization + >15% outsource
- Unused threshold: 0% utilization
- High idle rate: >30%
- Low trip frequency: <0.5 trips/day
- High variability: >50%
- Fleet size change threshold: >10% or >2 trucks

## Business Impact

### Cost Reduction Opportunities
1. **Reduce Idle Capacity**: Sell or lease unused trucks
2. **Optimize Fleet Size**: Right-size to eliminate excess fixed costs
3. **Improve Scheduling**: Better load matching reduces idle time
4. **Flexible Capacity**: Use spot leasing for demand peaks instead of owning excess capacity

### Revenue Growth Opportunities
1. **Capture Outsourced Demand**: Expand fleet when utilization is high and outsourcing is prevalent
2. **Increase Trip Frequency**: Better route planning increases revenue per truck
3. **Demand Management**: Target marketing on low-demand days

### Strategic Insights
1. **Investment Decisions**: Data-driven fleet expansion/reduction decisions
2. **Resource Allocation**: Focus resources on high-performing trucks
3. **Operational Efficiency**: Identify bottlenecks preventing better utilization
4. **Market Positioning**: Understand if you're capacity-constrained or have excess capacity

## Testing Checklist

### Backend Testing
- [ ] Service calculates fleet overview correctly
- [ ] Utilization buckets categorize trucks accurately
- [ ] Demand analysis metrics compute correctly
- [ ] Productivity metrics are accurate
- [ ] Idle capacity cost calculations are correct
- [ ] Truck performance breakdown generates for all active trucks
- [ ] Recommendations are generated based on thresholds
- [ ] Optimal fleet size calculation is accurate
- [ ] Monthly trend retrieves correct historical data
- [ ] Weekday pattern aggregates correctly
- [ ] Date range validation works correctly
- [ ] Export generates multi-sheet Excel file
- [ ] CSV export contains all data

### Frontend Testing
- [ ] Dashboard loads without errors
- [ ] All KPI cards display correct values
- [ ] Utilization buckets show correct color coding
- [ ] Recommendations display with correct priority badges
- [ ] Truck performance table shows top 20 trucks
- [ ] Monthly trend table displays correctly
- [ ] Weekday pattern displays all 7 days
- [ ] Date range filter works
- [ ] Export buttons function properly
- [ ] Reset button clears filters
- [ ] Color coding for utilization is correct
- [ ] Responsive design works on all screen sizes
- [ ] Dark mode displays correctly
- [ ] Permission checks prevent unauthorized access

### Integration Testing
- [ ] Route `/reports/capacity-planning` accessible with permission
- [ ] Export routes work with proper permissions
- [ ] Data flows correctly from database through service to frontend
- [ ] Filters persist across page reloads
- [ ] Export includes filtered data

### Business Logic Testing
- [ ] Overcapacity recommendation triggers at <50% utilization
- [ ] Expansion recommendation triggers at >85% util + >15% outsource
- [ ] Unused truck recommendation identifies 0% utilization trucks
- [ ] Optimal fleet size calculation produces reasonable results
- [ ] Potential savings/revenue estimates are realistic
- [ ] Recommendations are prioritized correctly

## Future Enhancements (Optional)
1. Add graphical visualizations (charts for utilization distribution, trend lines)
2. Add predictive analytics (forecast future demand and optimal fleet size)
3. Add scenario analysis ("what-if" tool to model fleet changes)
4. Add cost-benefit analysis for each recommendation
5. Add alerts when utilization falls outside optimal range
6. Add comparison to previous periods
7. Add benchmarking against industry standards
8. Add driver assignment optimization suggestions
9. Add maintenance scheduling optimization based on utilization
10. Add seasonality detection and planning
11. Export recommendations as action plan (PDF)

## Migration/Deployment Notes
No database migrations required - uses existing tables.

**Permissions to add** (via seeder or manual):
```php
// Add these permissions to your permission seeder:
'reports.capacity-planning.view',
'reports.capacity-planning.export',
```

## Support & Maintenance
- Monitor recommendation accuracy and adjust thresholds as needed
- Review fixed cost assumptions periodically (depreciation, insurance, financing rates)
- Gather feedback from fleet managers on recommendation usefulness
- Update optimal utilization target (currently 75%) based on business needs
- Track implementation of recommendations and measure actual vs. predicted savings

## Use Cases

### 1. Fleet Manager
**Goal**: Optimize day-to-day operations
- Check daily/weekly utilization
- Identify underutilized trucks for reassignment
- Balance workload across fleet
- Schedule maintenance on low-utilization days

### 2. CFO / Financial Controller
**Goal**: Reduce costs and improve ROI
- Quantify opportunity cost of idle capacity
- Evaluate fleet size optimization recommendations
- Build business case for fleet expansion/reduction
- Track financial impact of capacity decisions

### 3. Operations Director
**Goal**: Plan strategic capacity
- Understand demand patterns (monthly, weekly trends)
- Plan for seasonal variations
- Decide when to use outsourcing vs. fleet expansion
- Optimize productivity metrics (trips/truck/day)

### 4. Business Development Manager
**Goal**: Capture growth opportunities
- Identify if fleet can handle more business
- Quantify revenue potential from reducing outsourcing
- Understand peak demand capacity constraints
- Plan sales targets based on capacity availability

---

**Status**: ✅ Complete and ready for testing
**Author**: AI Assistant
**Date**: December 31, 2025

