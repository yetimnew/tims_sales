# Outsource Performance Show Page Guide

This guide explains how to read and interpret the outsource performance detail view (`resources/js/Pages/OutsourcePerformances/Show.tsx`) using transport economics language. It is written for operations leads, transport economists, and analysts responsible for vendor oversight.

## 1. Scope and Objectives
- **Purpose**: Provide a decision-ready summary of a single outsourced trip alongside historical vendor benchmarks.
- **Audience**: Fleet operations, finance, vendor management, and performance analysts.
- **Source Modules**: Outsource performance records, operations, places, users, and vendor aggregates computed server-side.

## 2. Page Layout at a Glance
| Section | Description | Primary Questions Answered |
| --- | --- | --- |
| Header + Status Badges | Trip number, current lifecycle status, dispatch date, author metadata | "What run am I looking at and is it still active?" |
| Route Banner | Origin/destination pair with directional visualization | "Where did this load move?" |
| Trip Snapshot Cards | Distance, cargo mass, ton-kilometres, direct cost | "What is the productivity and spend footprint of this movement?" |
| Operational Context | Linked operation, customer, vendor, route status | "Which commercial commitment does this fulfill?" |
| Vendor Performance Benchmarks | Aggregated KPIs across all historical trips with the same vendor | "How does this trip compare with the vendor's long-run performance?" |
| Recent Trip Timeline | Table of latest vendor trips highlighting the current record | "Are there emerging trends or anomalies in recent assignments?" |
| Trip Notes | Free-form operational commentary | "What qualitative context should accompany the numbers?" |

## 3. Input Data and Calculations
### 3.1 Direct Inputs
- `distance_km`: GPS or route-book kilometre reading for the loaded leg.
- `cargo_volume_mt`: Metric tonnes carried.
- `tonkm`: Stored (or recomputed) ton-kilometre product.
- `cost`: Vendor payout or invoice for the single trip.
- `status`: Life-cycle state (`completed`, `in_transit`, `cancelled`, etc.).
- `dispatch_date`: Date the load departed.
- References: vendor (`outsource`), operation, customer, origin, destination, author, timestamps.

### 3.2 Derived Indicators (Trip Snapshot)
| Metric | Formula | Interpretation |
| --- | --- | --- |
| Distance | Recorded `distance_km` | Transport work measured in kilometres under load. |
| Cargo Volume | Recorded `cargo_volume_mt` | Payload mass; verify against operation commitment. |
| Ton-Kilometres | `distance_km × cargo_volume_mt` | Core productivity unit; combine spatial and mass dimensions. |
| Trip Cost | Recorded `cost` | Cash outlay tied to this vendor dispatch. |

### 3.3 Vendor Benchmarks (Aggregates)
| Metric | Formula | Transport Economics Lens |
| --- | --- | --- |
| Vendor Trips | Count of historical outsource records for vendor | Utilisation frequency. |
| Distance Logged | Sum of `distance_km` | Network coverage and exposure. |
| Cargo Moved | Sum of `cargo_volume_mt` | Mass throughput. |
| Average Ton-Km | `(Sum tonkm) ÷ Vendor Trips` | Productivity per assignment. |
| Total Spend | Sum of `cost` | Total vendor ledger exposure. |
| Average Cost | `(Sum cost) ÷ Vendor Trips` | Mean spend per trip; compare with current trip cost. |

## 4. Transport Economics Glossary
- **Ton-Kilometre (ton-km)**: Mass-distance product summarising freight work. Higher ton-km at constant cost indicates efficiency gains.
- **Cost per Ton-Km** *(not displayed but inferable)*: `Trip Cost ÷ Ton-Kilometres`. Use for benchmarking across vendors or routes.
- **Load Factor**: `Cargo Mass ÷ Vehicle Capacity`. For outsourced fleets, obtain rated capacity to evaluate underutilisation.
- **Empty Backhaul Share**: Percentage of distance without payload; for outsource runs this is typically captured in supporting datasets (not surfaced on the page but relevant in interpretation).
- **Yield per Ton**: `Trip Revenue ÷ Cargo Volume`. When the operation exposes tariff data, compare outsource cost to tariff-driven revenue to monitor gross margin.
- **Fuel Efficiency**: `Distance ÷ Litres`. Not tracked for outsource providers unless telemetry is shared; highlight as a data gap when negotiating SLAs.

## 5. Interpreting the Page
1. **Confirm Trip Identity**
   - Cross-check trip number, operation name, and customer label before actioning feedback.
2. **Validate Core KPIs**
   - Ensure ton-km aligns with contract expectations; large deviations may signal incorrect distance capture or partial loads.
3. **Benchmark Against Vendor History**
   - Compare current trip cost with `Average Cost`. A material variance (>±15%) prompts a check for surcharges or billing errors.
   - Use `Average Ton-Km` to judge whether productivity is improving. Persistent underperformance can indicate vehicle mismatch or routing issues.
4. **Analyse Recent Trend Table**
   - Sort anomalies (e.g., sudden spike in cost or declining cargo mass) by tracing the row links to peer trips.
   - The "Current" badge ensures the analyst stays anchored on the record in focus.
5. **Document Exceptions**
   - Add or review trip notes for qualitative drivers (road closures, partial load acceptance, wet lease adjustments).

## 6. Operational and Financial Workflow
1. **Planning**: Operations planners vet vendor availability and expected ton-km delivery by referencing historical averages before dispatching.
2. **Execution Monitoring**: During transit (`status = in_transit`), real-time cost exposure is compared with planned budgets using the snapshot cards.
3. **Post-Trip Settlement**: Finance teams reconcile vendor invoices against the recorded `Trip Cost` and vendor averages. Discrepancies route through exception handling.
4. **Vendor Performance Review**: Monthly or quarterly reviews aggregate the vendor benchmark panel to inform contract renewals or rate negotiations.

## 7. Data Integrity Checklist
- **Distance Verification**: Ensure the dispatch team uploads route sheets or GPS exports. Incorrect distance skews ton-km and yield analyses.
- **Cargo Mass Accuracy**: Cross-check weighbridge slips; under-reported mass inflates cost per ton-km.
- **Cost Categorisation**: Confirm if the cost field includes ancillary charges (escort fees, tolls). If so, annotate in notes for transparency.
- **Status Harmony**: Keep statuses in sync with operational reality to avoid misleading analytics (e.g., mark cancelled loads promptly).

## 8. Testing and Validation
- Feature coverage resides in `tests/Feature/OutsourcePerformance/ShowOutsourcePerformanceTest.php`.
- Run targeted regression after UI or payload changes:
  ```bash
  php artisan test --filter=Outsource
  ```
- Consider adding scenario-based tests for new calculations (e.g., cost variance flags) when extending the page.

## 9. Extending the Page
- **Cost Efficiency Chip**: Introduce cost-per-ton-km comparison to reference tariffs.
- **Backhaul Insights**: If empty-leg data becomes available, surface empty share to highlight optimisation opportunities.
- **Margin Overlay**: When revenue data is exposed, display gross margin per trip to align with transport economist reporting.

_Last updated: November 17, 2025_
