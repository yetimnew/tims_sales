import * as React from 'react';
import { Head } from '@inertiajs/react';
import HelpLayout from '../../HelpLayout';
import { HelpArticle } from '@/components/help/HelpArticle';
import { ScreenshotPlaceholder } from '@/components/help/ScreenshotPlaceholder';
import { InfoBox } from '@/components/help/InfoBox';
import { StepByStep } from '@/components/help/StepByStep';
import { HelpfulFeedback } from '@/components/help/HelpfulFeedback';
import { ArticleNavigation } from '@/components/help/ArticleNavigation';

export default function UsingFilters() {
    return (
        <HelpLayout
            title="How to Use Report Filters"
            description="Master report filtering for better insights and analysis"
        >
            <Head title="Using Report Filters - Help & Documentation" />
            
            <HelpArticle
                title="How to Use Report Filters Effectively"
                category="Reports"
                lastUpdated="January 1, 2025"
                readTime="5 min"
            >
                {/* Introduction */}
                <section>
                    <p className="lead text-lg text-muted-foreground mb-6">
                        Report filters are powerful tools that help you analyze specific segments of your data. Instead of viewing all operations or performance metrics at once, filters let you focus on exactly what matters - specific time periods, trucks, drivers, routes, or customers. This guide teaches you how to use filters effectively.
                    </p>
                </section>

                {/* Overview */}
                <section id="overview">
                    <h2>Filter Types Overview</h2>
                    <p>
                        The reporting system offers several types of filters:
                    </p>

                    <div className="grid gap-4 md:grid-cols-2 my-6">
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">📅 Date Range Filters</h4>
                            <p className="text-sm text-muted-foreground">
                                Filter data by specific time periods: last 7 days, last 30 days, this month, custom range, or year-to-date.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">🚛 Fleet Filters</h4>
                            <p className="text-sm text-muted-foreground">
                                Filter by specific trucks, drivers, or vehicle types. Select multiple items to compare performance.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">📍 Geographic Filters</h4>
                            <p className="text-sm text-muted-foreground">
                                Filter by regions, zones, origin/destination places to analyze route-specific performance.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">👥 Customer Filters</h4>
                            <p className="text-sm text-muted-foreground">
                                View performance for specific customers to analyze profitability and service levels.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">📊 Status Filters</h4>
                            <p className="text-sm text-muted-foreground">
                                Filter by operation status: completed, in-transit, pending, or cancelled operations.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">📦 Cargo Filters</h4>
                            <p className="text-sm text-muted-foreground">
                                Analyze performance by cargo type to understand which goods are most profitable.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Accessing Filters */}
                <section id="accessing-filters">
                    <h2>How to Access Filters</h2>

                    <StepByStep number={1} title="Navigate to Any Report">
                        <p>
                            Go to <strong>Reports</strong> in the sidebar and select any report (e.g., "Performance by Truck", "Customer Profitability", "Fuel Efficiency").
                        </p>
                        <ScreenshotPlaceholder
                            description="Reports menu in sidebar with various report options"
                            fileName="reports/sidebar-reports.png"
                            width={400}
                            height={700}
                        />
                    </StepByStep>

                    <StepByStep number={2} title="Click the 'Filter' Button">
                        <p>
                            On the report page, look for the <strong>"Filter"</strong> or <strong>"Apply Filters"</strong> button, usually located near the top of the page with a filter icon (⚙️ or 🔍).
                        </p>
                        <ScreenshotPlaceholder
                            description="Report page header showing 'Filter' button highlighted"
                            fileName="reports/filter-button.png"
                            width={1920}
                            height={200}
                            annotations={[
                                { x: 85, y: 50, text: 'Click here', type: 'arrow' },
                            ]}
                            caption="The Filter button opens the filter dialog"
                        />
                    </StepByStep>

                    <StepByStep number={3} title="Filter Dialog Opens">
                        <p>
                            A modal dialog or sidebar panel will appear showing all available filters for that specific report. Different reports have different filter options based on their data.
                        </p>
                        <ScreenshotPlaceholder
                            description="Filter modal dialog with multiple filter sections: date range, trucks, drivers, status, etc."
                            fileName="reports/filter-modal.png"
                            width={800}
                            height={900}
                            caption="The filter dialog with all available options"
                        />
                    </StepByStep>
                </section>

                {/* Using Date Range Filters */}
                <section id="date-range">
                    <h2>Using Date Range Filters</h2>
                    <p>
                        Date ranges are the most commonly used filters. They determine which time period the report covers.
                    </p>

                    <h3>Quick Presets</h3>
                    <p>
                        Most reports offer quick preset options:
                    </p>
                    <ul>
                        <li><strong>Last 7 Days:</strong> Shows data from the past week</li>
                        <li><strong>Last 30 Days:</strong> Shows data from the past month</li>
                        <li><strong>This Month:</strong> Current calendar month to date</li>
                        <li><strong>Last Month:</strong> Previous complete calendar month</li>
                        <li><strong>This Quarter:</strong> Current quarter (Q1, Q2, Q3, or Q4)</li>
                        <li><strong>This Year:</strong> Current calendar year to date</li>
                        <li><strong>Custom Range:</strong> Select specific start and end dates</li>
                    </ul>

                    <ScreenshotPlaceholder
                        description="Date range filter with preset buttons and custom date picker showing calendar"
                        fileName="reports/date-range-filter.png"
                        width={700}
                        height={500}
                        caption="Date range selector with presets and custom options"
                    />

                    <InfoBox type="tip">
                        <p>
                            <strong>Pro Tip:</strong> For comparative analysis, run the same report with different date ranges (e.g., this month vs. last month) to identify trends and improvements.
                        </p>
                    </InfoBox>
                </section>

                {/* Using Multi-Select Filters */}
                <section id="multi-select">
                    <h2>Using Multi-Select Filters</h2>
                    <p>
                        Many filters allow you to select multiple items at once, perfect for comparing performance across different trucks, drivers, or customers.
                    </p>

                    <h3>How to Use Multi-Select</h3>
                    <ol>
                        <li>Click on the filter dropdown (e.g., "Trucks")</li>
                        <li>You'll see a list with checkboxes next to each item</li>
                        <li>Check the boxes for items you want to include</li>
                        <li>Use the search box to quickly find specific items</li>
                        <li>Click "Select All" to include everything, or "Clear" to start over</li>
                        <li>Selected items appear as badges/chips below the dropdown</li>
                    </ol>

                    <ScreenshotPlaceholder
                        description="Multi-select dropdown opened showing checkboxes for trucks with search box and select all option"
                        fileName="reports/multi-select-filter.png"
                        width={600}
                        height={500}
                        caption="Multi-select filter with checkboxes and search"
                    />

                    <InfoBox type="info">
                        <p>
                            If you don't select any items in a multi-select filter, the report will include all items by default. Selecting specific items narrows the results.
                        </p>
                    </InfoBox>
                </section>

                {/* Combining Filters */}
                <section id="combining">
                    <h2>Combining Multiple Filters</h2>
                    <p>
                        The real power of filters comes from combining them. All selected filters work together using "AND" logic, meaning results must match all applied filters.
                    </p>

                    <h3>Example: Analyzing Specific Performance</h3>
                    <div className="my-6 p-4 rounded-lg bg-muted">
                        <p className="font-semibold mb-3">Scenario: Find profitable operations for Customer ABC in December</p>
                        <ol>
                            <li><strong>Date Range:</strong> Select "December 2024" or custom range (Dec 1 - Dec 31)</li>
                            <li><strong>Customer:</strong> Select "Customer ABC"</li>
                            <li><strong>Status:</strong> Select "Completed" (only finished operations)</li>
                            <li><strong>Result:</strong> Report shows only completed operations for Customer ABC in December</li>
                        </ol>
                    </div>

                    <ScreenshotPlaceholder
                        description="Filter modal with multiple filters applied: date range, customer, and status selected"
                        fileName="reports/combined-filters.png"
                        width={800}
                        height={900}
                        caption="Multiple filters applied together"
                    />

                    <InfoBox type="tip">
                        <p>
                            <strong>Start Broad, Then Narrow:</strong> Begin with a wide date range and fewer filters. If you get too many results, add more filters to narrow down. If you get no results, remove some filters to broaden the search.
                        </p>
                    </InfoBox>
                </section>

                {/* Applying and Resetting */}
                <section id="applying">
                    <h2>Applying and Resetting Filters</h2>

                    <h3>Applying Filters</h3>
                    <p>
                        After selecting your desired filters:
                    </p>
                    <ol>
                        <li>Review your selections in the filter dialog</li>
                        <li>Click the <strong>"Apply Filters"</strong> or <strong>"Update"</strong> button</li>
                        <li>The dialog closes and the report refreshes with filtered data</li>
                        <li>Active filters are shown as badges above the report</li>
                        <li>Charts and tables update to reflect only the filtered data</li>
                    </ol>

                    <ScreenshotPlaceholder
                        description="Report page with active filter badges shown at top and filtered data in table"
                        fileName="reports/active-filters.png"
                        width={1920}
                        height={1080}
                        caption="Report showing active filters and filtered results"
                    />

                    <h3>Resetting Filters</h3>
                    <p>
                        To clear all filters and see all data:
                    </p>
                    <ul>
                        <li>Click the <strong>"Reset Filters"</strong> or <strong>"Clear All"</strong> button</li>
                        <li>Or click the "X" on individual filter badges to remove them one by one</li>
                        <li>The report will refresh to show unfiltered data</li>
                    </ul>

                    <InfoBox type="tip">
                        <p>
                            If a report seems to show no data or unexpected results, check if filters are applied. Overly restrictive filters can result in empty datasets.
                        </p>
                    </InfoBox>
                </section>

                {/* Exporting Filtered Data */}
                <section id="exporting">
                    <h2>Exporting Filtered Data</h2>
                    <p>
                        Once you've applied filters to get exactly the data you need, you can export it:
                    </p>

                    <h3>Export Options</h3>
                    <ul>
                        <li><strong>Excel (.xlsx):</strong> Spreadsheet format, best for further analysis</li>
                        <li><strong>PDF:</strong> Document format, best for sharing or printing</li>
                        <li><strong>CSV:</strong> Comma-separated values, universal format for import into other tools</li>
                    </ul>

                    <StepByStep number={1} title="Apply Your Desired Filters">
                        <p>
                            Set up all filters to show exactly the data you want to export.
                        </p>
                    </StepByStep>

                    <StepByStep number={2} title="Click Export Button">
                        <p>
                            Look for the <strong>"Export"</strong> button, usually near the filter button.
                        </p>
                        <ScreenshotPlaceholder
                            description="Report toolbar showing Export button with dropdown for Excel, PDF, CSV options"
                            fileName="reports/export-button.png"
                            width={600}
                            height={200}
                        />
                    </StepByStep>

                    <StepByStep number={3} title="Choose Format">
                        <p>
                            Select your preferred export format from the dropdown menu.
                        </p>
                    </StepByStep>

                    <StepByStep number={4} title="Download File">
                        <p>
                            The file will be generated with your filtered data and downloaded automatically. The filename includes the report name and current date.
                        </p>
                    </StepByStep>

                    <InfoBox type="success">
                        <p>
                            <strong>Exported Data Includes:</strong> All visible columns, filtered rows only, current sort order, and report metadata (date range, filters applied). Charts are included in PDF exports.
                        </p>
                    </InfoBox>
                </section>

                {/* Common Use Cases */}
                <section id="use-cases">
                    <h2>Common Filter Use Cases</h2>

                    <div className="space-y-4 my-6">
                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">🎯 Analyze Driver Performance</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                <strong>Goal:</strong> See how Driver John performed last month
                            </p>
                            <p className="text-sm">
                                <strong>Filters:</strong> Date Range = "Last Month", Driver = "John Smith", Status = "Completed"
                            </p>
                        </div>

                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">💰 Calculate Route Profitability</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                <strong>Goal:</strong> Find most profitable route this year
                            </p>
                            <p className="text-sm">
                                <strong>Filters:</strong> Date Range = "This Year", Status = "Completed", sort by profit margin
                            </p>
                        </div>

                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">⛽ Track Fuel Efficiency</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                <strong>Goal:</strong> Compare fuel consumption between two truck types
                            </p>
                            <p className="text-sm">
                                <strong>Filters:</strong> Date Range = "Last Quarter", Vehicle Type = "Semi-Truck" and "Box Truck"
                            </p>
                        </div>

                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">📈 Customer Service Analysis</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                <strong>Goal:</strong> Review all operations for top customer
                            </p>
                            <p className="text-sm">
                                <strong>Filters:</strong> Date Range = "Year to Date", Customer = "ABC Corp", sort by date
                            </p>
                        </div>

                        <div className="border rounded-lg p-4">
                            <h4 className="font-semibold mb-2">🔧 Maintenance Impact</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                                <strong>Goal:</strong> See which trucks were in maintenance most often
                            </p>
                            <p className="text-sm">
                                <strong>Filters:</strong> Date Range = "This Year", Status Type = "Maintenance", group by truck
                            </p>
                        </div>
                    </div>
                </section>

                {/* Tips and Best Practices */}
                <section id="best-practices">
                    <h2>Filtering Best Practices</h2>

                    <InfoBox type="tip">
                        <p>
                            <strong>Save Your View:</strong> Some reports allow you to save your filter combinations as presets for quick access later. Look for a "Save Filter" or "Create Preset" option.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Use Relative Dates:</strong> Prefer "Last 30 Days" over specific dates when possible. Relative dates automatically update, so you can bookmark reports and always see current data.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Filter First, Then Sort:</strong> Apply filters to narrow down data, then use column sorting to arrange results. This makes it easier to find specific insights.
                        </p>
                    </InfoBox>

                    <InfoBox type="warning">
                        <p>
                            <strong>Watch for Empty Results:</strong> If you apply too many restrictive filters, you might get no results. Start with fewer filters and add more as needed.
                        </p>
                    </InfoBox>
                </section>

                {/* Troubleshooting */}
                <section id="troubleshooting">
                    <h2>Troubleshooting Filter Issues</h2>

                    <h3>"No data available"</h3>
                    <InfoBox type="info">
                        <p>
                            <strong>Cause:</strong> Your filter combination is too restrictive, or there's no data matching your criteria.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Click "Reset Filters" to clear all, then apply filters one at a time to see where the data disappears. Expand your date range first.
                        </p>
                    </InfoBox>

                    <h3>Filters not applying</h3>
                    <InfoBox type="warning">
                        <p>
                            <strong>Cause:</strong> You may have selected filters but not clicked "Apply" or "Update".
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Make sure to click the "Apply Filters" button after making selections. The report won't update until you apply.
                        </p>
                    </InfoBox>

                    <h3>Can't find a specific truck/driver in filter list</h3>
                    <InfoBox type="info">
                        <p>
                            <strong>Cause:</strong> Inactive trucks or drivers may not appear in filter lists by default.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Look for a "Show Inactive" toggle in the filter options, or check if the item exists in the master data (Fleet Management section).
                        </p>
                    </InfoBox>
                </section>

                {/* Related Articles */}
                <section id="related">
                    <h2>Related Articles</h2>
                    <ul>
                        <li><a href="/help/reports/performance-all">All Performance Report</a></li>
                        <li><a href="/help/reports/customer-profitability">Customer Profitability Report</a></li>
                        <li><a href="/help/reports/fuel-efficiency">Fuel Efficiency Report</a></li>
                        <li><a href="/help/reports/export">Exporting and Scheduling Reports</a></li>
                    </ul>
                </section>

                {/* Feedback Widget */}
                <HelpfulFeedback articleId="reports-filters" />

                {/* Navigation */}
                <ArticleNavigation
                    previousArticle={{
                        title: 'Reports Overview',
                        href: '/help/reports',
                    }}
                    nextArticle={{
                        title: 'Exporting Data',
                        href: '/help/reports/export',
                    }}
                    categoryName="Reports"
                    categoryUrl="/help/reports"
                />
            </HelpArticle>
        </HelpLayout>
    );
}

