import * as React from 'react';
import { Head } from '@inertiajs/react';
import HelpLayout from '../../HelpLayout';
import { HelpArticle } from '@/components/help/HelpArticle';
import { ScreenshotPlaceholder } from '@/components/help/ScreenshotPlaceholder';
import { InfoBox } from '@/components/help/InfoBox';
import { StepByStep } from '@/components/help/StepByStep';
import { HelpfulFeedback } from '@/components/help/HelpfulFeedback';
import { ArticleNavigation } from '@/components/help/ArticleNavigation';

export default function CreatingOperations() {
    return (
        <HelpLayout
            title="Creating and Managing Operations"
            description="Complete guide to creating operations from start to finish"
        >
            <Head title="Creating Operations - Help & Documentation" />
            
            <HelpArticle
                title="Creating and Managing Operations"
                category="Operations"
                lastUpdated="January 1, 2025"
                readTime="8 min"
            >
                {/* Introduction */}
                <section>
                    <p className="lead text-lg text-muted-foreground mb-6">
                        Operations are the core of your fleet management system. An operation represents a dispatch job from one location to another, including all details about the cargo, route, driver, truck, and finances. This comprehensive guide covers everything you need to know about creating and managing operations.
                    </p>
                </section>

                {/* What is an Operation */}
                <section id="what-is-operation">
                    <h2>What is an Operation?</h2>
                    <p>
                        An operation is a complete record of a transportation job. It includes:
                    </p>

                    <ul>
                        <li><strong>Route Information:</strong> Origin, destination, and distance</li>
                        <li><strong>Assignment:</strong> Which driver and truck are performing the job</li>
                        <li><strong>Customer:</strong> Who requested the transport</li>
                        <li><strong>Cargo Details:</strong> Type, quantity, and weight of goods being transported</li>
                        <li><strong>Financial Data:</strong> Freight rate, revenue, and expenses</li>
                        <li><strong>Timeline:</strong> Start date, estimated completion, and actual completion</li>
                        <li><strong>Status Tracking:</strong> Current status from dispatch to delivery</li>
                    </ul>

                    <InfoBox type="info">
                        <p>
                            Operations are the primary way to track fleet performance, calculate profitability, and generate reports. Every completed operation contributes to your analytics and driver/truck performance metrics.
                        </p>
                    </InfoBox>
                </section>

                {/* Prerequisites */}
                <section id="prerequisites">
                    <h2>Before Creating an Operation</h2>
                    <p>
                        Make sure these prerequisites are in place:
                    </p>

                    <div className="space-y-4 my-6">
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                            <div>
                                <strong>Driver-Truck Assignment Must Exist</strong>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You cannot create an operation without an active driver-truck assignment. First, go to <strong>Fleet Management → Driver-Truck Assignments</strong> and assign a driver to a truck.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                            <div>
                                <strong>Locations Must Be Defined</strong>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Origin and destination locations should exist in your system. Check <strong>Geographic → Places</strong> to add any missing locations.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                            <div>
                                <strong>Customer Exists (if applicable)</strong>
                                <p className="text-sm text-muted-foreground mt-1">
                                    If this is a customer job, make sure the customer is registered in <strong>Operations → Customers</strong>.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">4</div>
                            <div>
                                <strong>Required Permission</strong>
                                <p className="text-sm text-muted-foreground mt-1">
                                    You need <code>operations.create</code> permission. If you don't see the "Create Operation" button, contact your administrator.
                                </p>
                            </div>
                        </div>
                    </div>

                    <InfoBox type="warning">
                        <p>
                            <strong>Important:</strong> The driver-truck assignment is the most critical prerequisite. Without an assignment, the system cannot track who is responsible for the operation or which vehicle is being used.
                        </p>
                    </InfoBox>
                </section>

                {/* Step by Step Guide */}
                <section id="step-by-step">
                    <h2>Complete Step-by-Step Workflow</h2>

                    <StepByStep number={1} title="Navigate to Operations">
                        <p>
                            Click <strong>Operations</strong> in the sidebar to go to the operations index page.
                        </p>
                        <ScreenshotPlaceholder
                            description="Sidebar with Operations menu item highlighted"
                            fileName="operations/sidebar-operations.png"
                            width={400}
                            height={600}
                        />
                    </StepByStep>

                    <StepByStep number={2} title="Click 'Create Operation'">
                        <p>
                            On the operations index page, click the <strong>"Create Operation"</strong> button in the top right corner.
                        </p>
                        <ScreenshotPlaceholder
                            description="Operations index page showing list of operations with 'Create Operation' button highlighted"
                            fileName="operations/index-create-button.png"
                            width={1920}
                            height={1080}
                            annotations={[
                                { x: 85, y: 12, text: 'Click here', type: 'arrow' },
                            ]}
                        />
                    </StepByStep>

                    <StepByStep number={3} title="Select Customer">
                        <p>
                            Choose the customer for this operation from the dropdown. If this is an internal operation (not for a customer), you can leave this blank or select "Internal".
                        </p>
                        <ScreenshotPlaceholder
                            description="Customer dropdown field showing list of registered customers"
                            fileName="operations/form-customer.png"
                            width={800}
                            height={400}
                        />
                        <InfoBox type="tip">
                            <p>
                                Customer selection affects pricing and reporting. Operations for specific customers appear in customer profitability reports.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={4} title="Choose Origin and Destination">
                        <p>
                            Select the starting point (origin) and ending point (destination) for this operation:
                        </p>
                        <ul>
                            <li><strong>Origin:</strong> Where the truck will pick up the cargo</li>
                            <li><strong>Destination:</strong> Where the cargo will be delivered</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Origin and destination dropdowns with autocomplete search functionality"
                            fileName="operations/form-origin-destination.png"
                            width={1200}
                            height={500}
                        />
                        <InfoBox type="info">
                            <p>
                                The system automatically calculates the distance based on your distance matrix. If no distance is found, you'll be prompted to enter it manually or add it to the distance matrix for future use.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={5} title="Select Driver-Truck Assignment">
                        <p>
                            Choose which driver-truck assignment will perform this operation. The dropdown shows currently active assignments in the format: "Driver Name - Truck Plate Number".
                        </p>
                        <ScreenshotPlaceholder
                            description="Driver-truck assignment dropdown showing active assignments"
                            fileName="operations/form-driver-truck.png"
                            width={1000}
                            height={400}
                        />
                        <InfoBox type="warning">
                            <p>
                                <strong>No assignments available?</strong> If the dropdown is empty, you need to create a driver-truck assignment first. Go to <strong>Fleet Management → Driver-Truck Assignments → Attach Driver</strong>.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={6} title="Choose Cargo Type">
                        <p>
                            Select the type of cargo being transported (e.g., "General Cargo", "Perishables", "Construction Materials", etc.). This helps with categorization and reporting.
                        </p>
                        <ScreenshotPlaceholder
                            description="Cargo type dropdown with various cargo categories"
                            fileName="operations/form-cargo-type.png"
                            width={800}
                            height={400}
                        />
                    </StepByStep>

                    <StepByStep number={7} title="Enter Cargo Details">
                        <p>
                            Provide specific information about the cargo:
                        </p>
                        <ul>
                            <li><strong>Quantity:</strong> Number of items/units</li>
                            <li><strong>Weight (tons):</strong> Total weight of the cargo</li>
                            <li><strong>Description:</strong> Brief description of the cargo (optional)</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Cargo details fields showing quantity, weight, and description"
                            fileName="operations/form-cargo-details.png"
                            width={1200}
                            height={400}
                        />
                        <InfoBox type="tip">
                            <p>
                                <strong>Weight Validation:</strong> The system will warn you if the cargo weight exceeds the truck's capacity. This helps prevent overloading and ensures compliance with regulations.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={8} title="Calculate Freight Rate">
                        <p>
                            Enter the freight rate for this operation. This is the amount you'll charge (or have been quoted) for the transportation:
                        </p>
                        <ul>
                            <li><strong>Freight Rate:</strong> Total amount in your currency</li>
                            <li><strong>Unit:</strong> Per ton, per kilometer, or flat rate</li>
                            <li><strong>Total Revenue:</strong> System calculates based on distance and rate</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Freight rate fields with calculation preview showing total revenue"
                            fileName="operations/form-freight-rate.png"
                            width={1200}
                            height={500}
                        />
                        <InfoBox type="info">
                            <p>
                                <strong>Suggested Rates:</strong> Some setups show suggested rates based on historical data for similar routes. Use these as guidance but adjust based on current market conditions and cargo type.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={9} title="Add Expenses (Optional)">
                        <p>
                            You can add known expenses for this operation, such as:
                        </p>
                        <ul>
                            <li>Toll fees</li>
                            <li>Loading/unloading charges</li>
                            <li>Estimated fuel cost</li>
                            <li>Other operational expenses</li>
                        </ul>
                        <p>
                            Click <strong>"Add Expense"</strong> to add multiple expense items. You can also add expenses later from the operation detail page.
                        </p>
                        <ScreenshotPlaceholder
                            description="Expenses section with table showing expense type, amount, and description"
                            fileName="operations/form-expenses.png"
                            width={1200}
                            height={600}
                        />
                        <InfoBox type="tip">
                            <p>
                                Adding expenses upfront helps with accurate profitability calculations. However, you can always add or update expenses as the operation progresses.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={10} title="Set Operation Dates">
                        <p>
                            Specify the timeline for this operation:
                        </p>
                        <ul>
                            <li><strong>Start Date:</strong> When the operation begins (usually pickup date)</li>
                            <li><strong>Estimated Completion:</strong> Expected delivery date</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Date pickers for start date and estimated completion date"
                            fileName="operations/form-dates.png"
                            width={1000}
                            height={400}
                        />
                    </StepByStep>

                    <StepByStep number={11} title="Review Operation Summary">
                        <p>
                            Before submitting, review the operation summary panel that shows:
                        </p>
                        <ul>
                            <li>Route: Origin → Destination (Distance)</li>
                            <li>Assignment: Driver and Truck</li>
                            <li>Cargo: Type, Quantity, Weight</li>
                            <li>Revenue: Total freight amount</li>
                            <li>Expenses: Sum of all expenses</li>
                            <li>Estimated Profit: Revenue minus expenses</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Operation summary panel showing all key information and calculated profit"
                            fileName="operations/form-summary.png"
                            width={600}
                            height={800}
                            caption="Summary panel - review before submitting"
                        />
                        <InfoBox type="tip">
                            <p>
                                <strong>Negative Profit Warning:</strong> If the estimated profit is negative or very low, double-check your freight rate and expenses. The system will warn you but won't prevent submission.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={12} title="Submit the Operation">
                        <p>
                            When everything looks correct, click <strong>"Create Operation"</strong> to submit.
                        </p>
                        <p>
                            The operation will be created with an initial status of <strong>"Pending"</strong> or <strong>"Dispatched"</strong> (depending on your system configuration).
                        </p>
                        <ScreenshotPlaceholder
                            description="Submit buttons showing 'Save as Draft' and 'Create Operation'"
                            fileName="operations/form-submit.png"
                            width={800}
                            height={200}
                        />
                    </StepByStep>
                </section>

                {/* After Creation */}
                <section id="after-creation">
                    <h2>What Happens After Creation?</h2>
                    <p>
                        Once you submit the operation:
                    </p>

                    <ol>
                        <li><strong>Operation is Created:</strong> A unique operation ID is assigned</li>
                        <li><strong>Status is Set:</strong> Initial status is "Dispatched" or "Pending"</li>
                        <li><strong>Notifications Sent:</strong> Driver may receive notification (if configured)</li>
                        <li><strong>Performance Tracking Begins:</strong> Operation appears in real-time dashboards</li>
                        <li><strong>You're Redirected:</strong> Taken to the operation detail page</li>
                    </ol>

                    <ScreenshotPlaceholder
                        description="Operation detail page showing all operation information with action buttons"
                        fileName="operations/detail-page.png"
                        width={1920}
                        height={1200}
                        caption="Operation detail page after successful creation"
                    />
                </section>

                {/* Managing Status */}
                <section id="status-management">
                    <h2>Managing Operation Status</h2>
                    <p>
                        As the operation progresses, you'll update its status to reflect the current stage:
                    </p>

                    <div className="space-y-3 my-6">
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 w-20 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">PENDING</span>
                            </div>
                            <div className="text-sm">
                                Operation created but not yet started. Waiting for dispatch or approval.
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 w-20 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">DISPATCHED</span>
                            </div>
                            <div className="text-sm">
                                Driver has been assigned and operation is active. Truck is en route to pick up cargo.
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 w-20 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">LOADING</span>
                            </div>
                            <div className="text-sm">
                                Cargo is being loaded at the origin. Driver has reached pickup location.
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 w-20 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">IN TRANSIT</span>
                            </div>
                            <div className="text-sm">
                                Cargo loaded, truck is traveling to destination. This is the main transport phase.
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 w-20 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">ARRIVED</span>
                            </div>
                            <div className="text-sm">
                                Truck has arrived at destination. Ready for unloading.
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 w-20 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">COMPLETED</span>
                            </div>
                            <div className="text-sm">
                                Cargo delivered successfully. Operation finished. Performance metrics are calculated.
                            </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg border">
                            <div className="flex-shrink-0 w-20 text-center">
                                <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">CANCELLED</span>
                            </div>
                            <div className="text-sm">
                                Operation was cancelled before completion. Does not count in performance metrics.
                            </div>
                        </div>
                    </div>

                    <InfoBox type="info">
                        <p>
                            Status updates can be made from the operation detail page using the "Update Status" button. Some organizations automate status updates through driver mobile apps or GPS tracking integrations.
                        </p>
                    </InfoBox>
                </section>

                {/* Best Practices */}
                <section id="best-practices">
                    <h2>Route Planning Best Practices</h2>

                    <InfoBox type="tip">
                        <p>
                            <strong>Check Truck Capacity:</strong> Always verify the cargo weight doesn't exceed the truck's capacity. Overloading can result in fines, accidents, and vehicle damage.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Realistic Freight Rates:</strong> Base your freight rates on distance, cargo type, and market conditions. Review historical operations for similar routes to ensure competitive pricing.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Track All Expenses:</strong> Record every expense, even small ones. This ensures accurate profitability calculations and helps identify cost-saving opportunities.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Regular Status Updates:</strong> Update operation status in real-time or at least daily. This keeps stakeholders informed and helps with performance tracking.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Use Comments:</strong> Add comments or notes to operations for important information like special delivery instructions, delays, or issues encountered.
                        </p>
                    </InfoBox>
                </section>

                {/* Common Issues */}
                <section id="common-issues">
                    <h2>Common Issues and Solutions</h2>

                    <h3>"No driver-truck assignments available"</h3>
                    <InfoBox type="danger">
                        <p>
                            <strong>Problem:</strong> The assignment dropdown is empty.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Go to <strong>Fleet Management → Driver-Truck Assignments</strong> and create an assignment by attaching a driver to a truck. At least one active assignment is required to create operations.
                        </p>
                    </InfoBox>

                    <h3>"Origin and destination cannot be the same"</h3>
                    <InfoBox type="warning">
                        <p>
                            <strong>Problem:</strong> You selected the same location for both origin and destination.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Choose different locations. If you need to move goods within the same location, this might not require an operation in the system.
                        </p>
                    </InfoBox>

                    <h3>"Cargo weight exceeds truck capacity"</h3>
                    <InfoBox type="warning">
                        <p>
                            <strong>Problem:</strong> The cargo is too heavy for the selected truck.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Either reduce the cargo weight, split into multiple operations, or select a truck with higher capacity. The system will allow submission with a warning, but overloading should be avoided for safety and legal compliance.
                        </p>
                    </InfoBox>
                </section>

                {/* Related Articles */}
                <section id="related">
                    <h2>Related Articles</h2>
                    <ul>
                        <li><a href="/help/operations/routes">Route Planning and Optimization</a></li>
                        <li><a href="/help/operations/status">Understanding Operation Status</a></li>
                        <li><a href="/help/operations/tracking">Real-time Operation Tracking</a></li>
                        <li><a href="/help/operations/metrics">Operation Performance Metrics</a></li>
                        <li><a href="/help/fleet/assignments/assign">Creating Driver-Truck Assignments</a></li>
                    </ul>
                </section>

                {/* Feedback Widget */}
                <HelpfulFeedback articleId="operations-creating" />

                {/* Navigation */}
                <ArticleNavigation
                    previousArticle={{
                        title: 'Operations Overview',
                        href: '/help/operations',
                    }}
                    nextArticle={{
                        title: 'Route Planning',
                        href: '/help/operations/routes',
                    }}
                    categoryName="Operations"
                    categoryUrl="/help/operations"
                />
            </HelpArticle>
        </HelpLayout>
    );
}

