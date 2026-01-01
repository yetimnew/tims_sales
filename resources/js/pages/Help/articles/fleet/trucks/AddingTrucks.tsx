import * as React from 'react';
import { Head } from '@inertiajs/react';
import HelpLayout from '../../../HelpLayout';
import { HelpArticle } from '@/components/help/HelpArticle';
import { ScreenshotPlaceholder } from '@/components/help/ScreenshotPlaceholder';
import { InfoBox } from '@/components/help/InfoBox';
import { StepByStep } from '@/components/help/StepByStep';
import { HelpfulFeedback } from '@/components/help/HelpfulFeedback';
import { ArticleNavigation } from '@/components/help/ArticleNavigation';
import { CodeBlock } from '@/components/help/CodeBlock';

export default function AddingTrucks() {
    return (
        <HelpLayout
            title="How to Add a New Truck"
            description="Step-by-step guide to adding trucks to your fleet"
        >
            <Head title="How to Add a New Truck - Help & Documentation" />
            
            <HelpArticle
                title="How to Add a New Truck"
                category="Fleet Management"
                subcategory="Trucks"
                lastUpdated="January 1, 2025"
                readTime="6 min"
            >
                {/* Introduction */}
                <section>
                    <p className="lead text-lg text-muted-foreground mb-6">
                        Adding trucks to your fleet is the foundation of your operations. This guide walks you through every step of the process, from navigating to the form to understanding each field and avoiding common errors.
                    </p>
                </section>

                {/* Prerequisites */}
                <section id="prerequisites">
                    <h2>Before You Begin</h2>
                    <p>
                        Make sure you have the following before adding a truck:
                    </p>

                    <ul>
                        <li><strong>Required Permission:</strong> You need the <code>trucks.create</code> permission. If you don't see the "Add New Truck" button, contact your administrator.</li>
                        <li><strong>Vehicle Information:</strong> Have the truck's plate number, make, model, and year ready.</li>
                        <li><strong>Vehicle Type:</strong> Ensure the appropriate vehicle type has been created (e.g., "Semi-Truck", "Box Truck", "Flatbed").</li>
                        <li><strong>Registration Documents:</strong> Optional but recommended - have registration and insurance documents for reference.</li>
                    </ul>

                    <InfoBox type="warning">
                        <p>
                            <strong>Important:</strong> Plate numbers must be unique in the system. You cannot add a truck with a plate number that already exists. Make sure to verify the plate number before proceeding.
                        </p>
                    </InfoBox>
                </section>

                {/* Step-by-Step Guide */}
                <section id="step-by-step">
                    <h2>Step-by-Step Guide</h2>

                    <StepByStep number={1} title="Navigate to Trucks Page">
                        <p>
                            From the sidebar, click on <strong>Fleet Management</strong> to expand the menu, then click on <strong>Trucks</strong>.
                        </p>
                        <ScreenshotPlaceholder
                            description="Sidebar with Fleet Management expanded, showing Trucks menu item highlighted"
                            fileName="fleet/trucks/sidebar-navigation.png"
                            width={400}
                            height={600}
                            annotations={[
                                { x: 30, y: 45, text: 'Click here', type: 'arrow' },
                            ]}
                        />
                    </StepByStep>

                    <StepByStep number={2} title="Click 'Add New Truck' Button">
                        <p>
                            On the Trucks index page, look for the green <strong>"Add New Truck"</strong> button in the top right corner of the page header.
                        </p>
                        <ScreenshotPlaceholder
                            description="Trucks index page showing list of trucks with 'Add New Truck' button highlighted in the top right"
                            fileName="fleet/trucks/index-add-button.png"
                            width={1920}
                            height={1080}
                            annotations={[
                                { x: 85, y: 12, text: 'Click this button', type: 'arrow' },
                            ]}
                            caption="The Trucks index page with the Add New Truck button"
                        />
                    </StepByStep>

                    <StepByStep number={3} title="Fill in Basic Information">
                        <p>
                            You'll be taken to the "Create Truck" form. Start by filling in the basic information section:
                        </p>

                        <ul>
                            <li><strong>Plate Number:</strong> Enter the unique plate number (e.g., "AA-12345"). This is required and must be unique.</li>
                            <li><strong>Make:</strong> Enter the manufacturer (e.g., "Volvo", "Mercedes", "Isuzu").</li>
                            <li><strong>Model:</strong> Enter the specific model (e.g., "FH16", "Actros", "NQR").</li>
                            <li><strong>Year:</strong> Enter the manufacturing year (e.g., 2020).</li>
                        </ul>

                        <ScreenshotPlaceholder
                            description="Create Truck form showing basic information fields: plate number, make, model, and year filled out"
                            fileName="fleet/trucks/form-basic-info.png"
                            width={1200}
                            height={800}
                            caption="Basic information section of the truck form"
                        />

                        <InfoBox type="tip">
                            <p>
                                <strong>Plate Number Format:</strong> While there's no strict format requirement, it's best to follow your country's standard format. Use uppercase letters and include any dashes or spaces as they appear on the actual plate.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={4} title="Select Vehicle Type">
                        <p>
                            From the <strong>Vehicle Type</strong> dropdown, select the appropriate type for this truck. Vehicle types categorize trucks by their configuration and capabilities.
                        </p>

                        <ScreenshotPlaceholder
                            description="Vehicle Type dropdown opened showing options like 'Semi-Truck', 'Box Truck', 'Flatbed', 'Tanker', etc."
                            fileName="fleet/trucks/form-vehicle-type.png"
                            width={800}
                            height={500}
                            caption="Selecting a vehicle type from the dropdown"
                        />

                        <InfoBox type="info">
                            <p>
                                If you don't see the vehicle type you need, you'll need to create it first. Go to <strong>Fleet Management → Vehicle Types</strong> to add new types. You may need admin permissions for this.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={5} title="Enter Engine and Chassis Details">
                        <p>
                            Fill in the identification details for the vehicle:
                        </p>

                        <ul>
                            <li><strong>Engine Number:</strong> The unique engine identification number (optional but recommended).</li>
                            <li><strong>Chassis Number:</strong> The vehicle identification number (VIN) or chassis number (optional but recommended).</li>
                        </ul>

                        <ScreenshotPlaceholder
                            description="Engine and chassis number fields in the form"
                            fileName="fleet/trucks/form-engine-chassis.png"
                            width={1200}
                            height={400}
                        />

                        <InfoBox type="note">
                            <p>
                                These fields are optional but highly recommended for insurance claims, warranty tracking, and asset management. The information can usually be found in the vehicle's registration documents.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={6} title="Set Cargo Capacity">
                        <p>
                            Enter the truck's cargo capacity specifications:
                        </p>

                        <ul>
                            <li><strong>Cargo Capacity (tons):</strong> Maximum weight the truck can carry in metric tons (e.g., 10, 20, 30).</li>
                            <li><strong>Length (m):</strong> Cargo bed length in meters (optional).</li>
                            <li><strong>Width (m):</strong> Cargo bed width in meters (optional).</li>
                            <li><strong>Height (m):</strong> Maximum cargo height in meters (optional).</li>
                        </ul>

                        <ScreenshotPlaceholder
                            description="Cargo capacity and dimensions fields showing example values"
                            fileName="fleet/trucks/form-cargo-capacity.png"
                            width={1200}
                            height={600}
                            caption="Cargo capacity and dimension fields"
                        />

                        <InfoBox type="tip">
                            <p>
                                <strong>Why This Matters:</strong> Cargo capacity is used for operation planning and to prevent overloading. The system can warn you if you try to assign cargo that exceeds the truck's capacity.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={7} title="Upload Truck Photo (Optional)">
                        <p>
                            You can optionally upload a photo of the truck. Click the <strong>"Choose File"</strong> button or drag and drop an image. Supported formats: JPG, PNG, up to 5MB.
                        </p>

                        <ScreenshotPlaceholder
                            description="File upload area with drag-and-drop zone and sample truck image thumbnail"
                            fileName="fleet/trucks/form-photo-upload.png"
                            width={800}
                            height={400}
                        />

                        <InfoBox type="tip">
                            <p>
                                A photo helps with quick visual identification in the system, especially useful when you have many similar trucks. Take a clear photo from the front or side showing the plate number.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={8} title="Add Registration Details">
                        <p>
                            Enter registration and insurance information:
                        </p>

                        <ul>
                            <li><strong>Registration Number:</strong> Official vehicle registration number (may be the same as plate number).</li>
                            <li><strong>Registration Expiry:</strong> When the registration expires (use date picker).</li>
                            <li><strong>Insurance Expiry:</strong> When insurance coverage expires (optional).</li>
                        </ul>

                        <ScreenshotPlaceholder
                            description="Registration details section with date pickers for expiry dates"
                            fileName="fleet/trucks/form-registration.png"
                            width={1200}
                            height={500}
                            caption="Registration and insurance information fields"
                        />

                        <InfoBox type="warning">
                            <p>
                                <strong>Expiry Alerts:</strong> The system can send you notifications before registrations or insurance expire. Make sure to enter accurate dates to stay compliant with regulations.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={9} title="Set Initial Status">
                        <p>
                            Choose the truck's initial status from the dropdown:
                        </p>

                        <ul>
                            <li><strong>Active:</strong> Truck is operational and available for assignments</li>
                            <li><strong>Inactive:</strong> Truck is not currently in use</li>
                            <li><strong>Maintenance:</strong> Truck is under maintenance or repair</li>
                            <li><strong>Reserved:</strong> Truck is reserved for a specific purpose</li>
                        </ul>

                        <p>
                            For most new trucks, select <strong>"Active"</strong> so they're immediately available for driver assignments and operations.
                        </p>

                        <ScreenshotPlaceholder
                            description="Status dropdown showing Active, Inactive, Maintenance, and Reserved options"
                            fileName="fleet/trucks/form-status.png"
                            width={600}
                            height={350}
                        />
                    </StepByStep>

                    <StepByStep number={10} title="Review and Submit">
                        <p>
                            Before submitting, review all the information you've entered. Make sure:
                        </p>

                        <ul>
                            <li>✓ Plate number is correct and unique</li>
                            <li>✓ Vehicle type is appropriate</li>
                            <li>✓ Cargo capacity is accurate</li>
                            <li>✓ Expiry dates are correct</li>
                        </ul>

                        <p>
                            When you're ready, click the green <strong>"Create Truck"</strong> button at the bottom of the form.
                        </p>

                        <ScreenshotPlaceholder
                            description="Bottom of form showing 'Cancel' and 'Create Truck' buttons with Create Truck highlighted"
                            fileName="fleet/trucks/form-submit-buttons.png"
                            width={800}
                            height={200}
                            annotations={[
                                { x: 70, y: 50, text: 'Click to save', type: 'arrow' },
                            ]}
                        />

                        <InfoBox type="success">
                            <p>
                                <strong>Success!</strong> After submitting, you'll see a success message and be redirected to the truck's detail page. From there, you can assign a driver, add maintenance records, or view the truck's information.
                            </p>
                        </InfoBox>
                    </StepByStep>
                </section>

                {/* Form Fields Reference */}
                <section id="field-reference">
                    <h2>Complete Form Fields Reference</h2>
                    <p>
                        Here's a complete reference of all fields in the Create Truck form:
                    </p>

                    <div className="overflow-x-auto my-6">
                        <table className="min-w-full divide-y divide-border">
                            <thead>
                                <tr className="bg-muted">
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Field</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Required</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Description</th>
                                    <th className="px-4 py-3 text-left text-sm font-semibold">Validation</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Plate Number</td>
                                    <td className="px-4 py-3 text-sm">✓ Yes</td>
                                    <td className="px-4 py-3 text-sm">Unique vehicle plate number</td>
                                    <td className="px-4 py-3 text-sm">Must be unique, max 20 characters</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Make</td>
                                    <td className="px-4 py-3 text-sm">✓ Yes</td>
                                    <td className="px-4 py-3 text-sm">Vehicle manufacturer</td>
                                    <td className="px-4 py-3 text-sm">Max 50 characters</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Model</td>
                                    <td className="px-4 py-3 text-sm">✓ Yes</td>
                                    <td className="px-4 py-3 text-sm">Vehicle model</td>
                                    <td className="px-4 py-3 text-sm">Max 50 characters</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Year</td>
                                    <td className="px-4 py-3 text-sm">No</td>
                                    <td className="px-4 py-3 text-sm">Manufacturing year</td>
                                    <td className="px-4 py-3 text-sm">Must be between 1900 and current year</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Vehicle Type</td>
                                    <td className="px-4 py-3 text-sm">✓ Yes</td>
                                    <td className="px-4 py-3 text-sm">Type/category of vehicle</td>
                                    <td className="px-4 py-3 text-sm">Must select from existing types</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Engine Number</td>
                                    <td className="px-4 py-3 text-sm">No</td>
                                    <td className="px-4 py-3 text-sm">Unique engine identification</td>
                                    <td className="px-4 py-3 text-sm">Max 100 characters</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Chassis Number</td>
                                    <td className="px-4 py-3 text-sm">No</td>
                                    <td className="px-4 py-3 text-sm">Vehicle VIN or chassis number</td>
                                    <td className="px-4 py-3 text-sm">Max 100 characters</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Cargo Capacity</td>
                                    <td className="px-4 py-3 text-sm">No</td>
                                    <td className="px-4 py-3 text-sm">Maximum cargo weight in tons</td>
                                    <td className="px-4 py-3 text-sm">Must be positive number</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Dimensions (L×W×H)</td>
                                    <td className="px-4 py-3 text-sm">No</td>
                                    <td className="px-4 py-3 text-sm">Cargo area dimensions in meters</td>
                                    <td className="px-4 py-3 text-sm">Must be positive numbers</td>
                                </tr>
                                <tr>
                                    <td className="px-4 py-3 text-sm font-medium">Status</td>
                                    <td className="px-4 py-3 text-sm">✓ Yes</td>
                                    <td className="px-4 py-3 text-sm">Current operational status</td>
                                    <td className="px-4 py-3 text-sm">Must select one option</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Common Errors */}
                <section id="common-errors">
                    <h2>Common Errors and Solutions</h2>

                    <h3>Error: "The plate number has already been taken"</h3>
                    <InfoBox type="danger">
                        <p>
                            <strong>Problem:</strong> A truck with this plate number already exists in the system.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Double-check the plate number. If it's correct and you believe this is an error, search for the existing truck in the Trucks index page. You may need to edit the existing truck instead of creating a new one, or the existing entry might be a duplicate that should be deleted.
                        </p>
                    </InfoBox>

                    <h3>Error: "You do not have permission to create trucks"</h3>
                    <InfoBox type="danger">
                        <p>
                            <strong>Problem:</strong> Your user account doesn't have the <code>trucks.create</code> permission.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Contact your system administrator to request the necessary permission. Explain which tasks you need to perform so they can assign the appropriate role.
                        </p>
                    </InfoBox>

                    <h3>Error: "The cargo capacity must be a positive number"</h3>
                    <InfoBox type="warning">
                        <p>
                            <strong>Problem:</strong> Invalid value entered for cargo capacity.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Enter a positive number without units. For example, enter "20" for 20 tons, not "20 tons" or "-20".
                        </p>
                    </InfoBox>

                    <h3>Form Doesn't Submit / No Feedback</h3>
                    <InfoBox type="info">
                        <p>
                            <strong>Problem:</strong> Clicking "Create Truck" doesn't do anything.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Check for error messages in red text near each field. At least one required field (plate number, make, model, or vehicle type) is likely missing or invalid. Scroll through the form to find highlighted errors.
                        </p>
                    </InfoBox>
                </section>

                {/* Tips and Best Practices */}
                <section id="best-practices">
                    <h2>Tips and Best Practices</h2>

                    <InfoBox type="tip">
                        <p>
                            <strong>Naming Conventions:</strong> Establish consistent naming for make and model. For example, always use "Mercedes" instead of sometimes "Mercedes-Benz" or "Merc". This makes searching and filtering more reliable.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Bulk Import:</strong> If you need to add many trucks at once, ask your administrator about the bulk import feature (if available). You can prepare a CSV file with all truck data and import it in one go.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Take Photos Immediately:</strong> Upload truck photos as soon as you add them. It's easy to forget later, and photos are very helpful for quick identification.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Set Expiry Reminders:</strong> After adding trucks, check your notification settings to ensure you'll receive alerts before registration or insurance expiry.
                        </p>
                    </InfoBox>
                </section>

                {/* What Happens Next */}
                <section id="what-next">
                    <h2>What Happens After Creation?</h2>
                    <p>
                        Once you successfully create a truck, the system will:
                    </p>

                    <ol>
                        <li><strong>Redirect to Truck Detail Page:</strong> You'll see all the information you just entered.</li>
                        <li><strong>Display Success Message:</strong> A green notification confirms the truck was created.</li>
                        <li><strong>Make Truck Available:</strong> The truck appears in the Trucks index and can be assigned to drivers.</li>
                        <li><strong>Enable Further Actions:</strong> From the detail page, you can:
                            <ul>
                                <li>Edit truck information</li>
                                <li>Assign a driver</li>
                                <li>Add maintenance records</li>
                                <li>View assignment history</li>
                                <li>Change truck status</li>
                                <li>Delete the truck (if permitted)</li>
                            </ul>
                        </li>
                    </ol>

                    <ScreenshotPlaceholder
                        description="Truck detail page showing all truck information with action buttons for Edit, Assign Driver, Add Maintenance, etc."
                        fileName="fleet/trucks/detail-page.png"
                        width={1920}
                        height={1200}
                        caption="The truck detail page after successful creation"
                    />
                </section>

                {/* Related Articles */}
                <section id="related">
                    <h2>Related Articles</h2>
                    <ul>
                        <li><a href="/help/fleet/trucks/information">Truck Information Management</a> - Learn how to edit and update truck details</li>
                        <li><a href="/help/fleet/trucks/status">Understanding Truck Status</a> - Learn about different truck statuses and when to use them</li>
                        <li><a href="/help/fleet/assignments/assign">Assigning Drivers to Trucks</a> - Next step: assign a driver to your new truck</li>
                        <li><a href="/help/fleet/vehicle-types">Managing Vehicle Types</a> - Learn how to create and manage vehicle type categories</li>
                    </ul>
                </section>

                {/* Feedback Widget */}
                <HelpfulFeedback articleId="fleet-trucks-adding" />

                {/* Navigation */}
                <ArticleNavigation
                    previousArticle={{
                        title: 'Fleet Management Overview',
                        href: '/help/fleet',
                    }}
                    nextArticle={{
                        title: 'Truck Information Management',
                        href: '/help/fleet/trucks/information',
                    }}
                    categoryName="Fleet Management"
                    categoryUrl="/help/fleet"
                />
            </HelpArticle>
        </HelpLayout>
    );
}

