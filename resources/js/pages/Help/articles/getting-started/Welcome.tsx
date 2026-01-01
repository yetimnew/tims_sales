import * as React from 'react';
import { Head } from '@inertiajs/react';
import HelpLayout from '../../HelpLayout';
import { HelpArticle } from '@/components/help/HelpArticle';
import { ScreenshotPlaceholder } from '@/components/help/ScreenshotPlaceholder';
import { InfoBox } from '@/components/help/InfoBox';
import { StepByStep } from '@/components/help/StepByStep';
import { VideoEmbed } from '@/components/help/VideoEmbed';
import { HelpfulFeedback } from '@/components/help/HelpfulFeedback';
import { ArticleNavigation } from '@/components/help/ArticleNavigation';
import { CheckCircle2 } from 'lucide-react';

export default function Welcome() {
    return (
        <HelpLayout
            title="Welcome Guide"
            description="Get started with your Fleet Management System"
        >
            <Head title="Welcome Guide - Help & Documentation" />
            
            <HelpArticle
                title="Welcome to Your Fleet Management System"
                category="Getting Started"
                lastUpdated="January 1, 2025"
                readTime="5 min"
            >
                {/* Introduction */}
                <section>
                    <p className="lead text-lg text-muted-foreground mb-6">
                        Welcome! This comprehensive fleet management system helps you manage your trucks, drivers, operations, and performance from a single, powerful platform. This guide will help you understand the key features and get you started quickly.
                    </p>

                    <VideoEmbed
                        title="5-Minute Platform Tour"
                        description="Watch this quick video to get an overview of the entire system"
                        duration="5:32"
                    />
                </section>

                {/* What is this System? */}
                <section id="overview">
                    <h2>What is This System?</h2>
                    <p>
                        Your Fleet Management System is an all-in-one solution designed to streamline every aspect of transportation and logistics operations. It combines fleet tracking, driver management, operations planning, maintenance scheduling, and financial analytics into one integrated platform.
                    </p>

                    <ScreenshotPlaceholder
                        description="Dashboard overview showing main navigation sidebar, KPI cards at the top, and charts displaying fleet performance metrics"
                        fileName="getting-started/dashboard-overview.png"
                        width={1920}
                        height={1080}
                        caption="Your dashboard - the central hub for all fleet operations"
                    />

                    <InfoBox type="tip">
                        <p>
                            <strong>Tip:</strong> The dashboard provides real-time insights into your fleet's performance. You can customize which metrics are displayed based on your role and preferences.
                        </p>
                    </InfoBox>
                </section>

                {/* Key Features */}
                <section id="key-features">
                    <h2>Key Features and Capabilities</h2>
                    <p>
                        The system is designed around several core modules that work together seamlessly:
                    </p>

                    <h3>🚛 Fleet Management</h3>
                    <ul>
                        <li><strong>Truck Management:</strong> Add, track, and manage your entire vehicle fleet with detailed information including plate numbers, make, model, capacity, and current status.</li>
                        <li><strong>Driver Management:</strong> Maintain driver profiles with license information, contact details, performance history, and safety records.</li>
                        <li><strong>Driver-Truck Assignments:</strong> Assign drivers to trucks and track assignment history for accountability and performance analysis.</li>
                        <li><strong>Vehicle Types & Cargo Types:</strong> Categorize your fleet and cargo for better organization and reporting.</li>
                    </ul>

                    <h3>📍 Operations Management</h3>
                    <ul>
                        <li><strong>Operation Creation:</strong> Plan and dispatch operations with detailed route information, cargo details, and freight calculations.</li>
                        <li><strong>Real-time Tracking:</strong> Monitor operation status from dispatch to delivery.</li>
                        <li><strong>Performance Metrics:</strong> Track key performance indicators like on-time delivery, fuel efficiency, and profitability per operation.</li>
                        <li><strong>Customer Management:</strong> Manage customer relationships and track customer-specific performance.</li>
                    </ul>

                    <h3>🔧 Maintenance & Safety</h3>
                    <ul>
                        <li><strong>Maintenance Records:</strong> Track all maintenance activities, costs, and schedules.</li>
                        <li><strong>Preventive Maintenance:</strong> Set up schedules and receive alerts for upcoming maintenance.</li>
                        <li><strong>Driver Safety:</strong> Record and monitor safety incidents, training, and compliance.</li>
                        <li><strong>Maintenance Alerts:</strong> Get notified when maintenance is due or overdue.</li>
                    </ul>

                    <h3>📊 Analytics & Reports</h3>
                    <ul>
                        <li><strong>Performance Reports:</strong> Detailed reports by truck, driver, route, and customer.</li>
                        <li><strong>Financial Analytics:</strong> Track revenue, expenses, profit margins, and cost per kilometer.</li>
                        <li><strong>Fuel Efficiency:</strong> Monitor fuel consumption and identify areas for improvement.</li>
                        <li><strong>Custom Filters:</strong> Filter reports by date range, specific vehicles, drivers, or routes.</li>
                        <li><strong>Export Capabilities:</strong> Download reports as Excel or PDF for external analysis.</li>
                    </ul>

                    <h3>🌍 Geographic Management</h3>
                    <ul>
                        <li><strong>Regions, Zones, Woredas:</strong> Organize locations by administrative boundaries.</li>
                        <li><strong>Places:</strong> Maintain a database of origin and destination points with GPS coordinates.</li>
                        <li><strong>Distance Matrix:</strong> Store and manage distances between locations for accurate freight calculations.</li>
                        <li><strong>Route Optimization:</strong> Use geographic data to plan efficient routes.</li>
                    </ul>

                    <h3>👥 User Management & Security</h3>
                    <ul>
                        <li><strong>Role-Based Access:</strong> Control what each user can see and do based on their role (Admin, Manager, Operator, Viewer).</li>
                        <li><strong>Activity Logs:</strong> Track all user actions for accountability and audit trails.</li>
                        <li><strong>Custom Permissions:</strong> Fine-tune access control for specific features.</li>
                        <li><strong>Two-Factor Authentication:</strong> Enhanced security for sensitive operations.</li>
                    </ul>

                    <ScreenshotPlaceholder
                        description="Sidebar navigation showing all main modules: Dashboard, Fleet Management, Operations, Maintenance, Reports, etc."
                        fileName="getting-started/sidebar-navigation.png"
                        width={400}
                        height={900}
                        caption="Complete navigation structure - all features at your fingertips"
                    />
                </section>

                {/* User Roles */}
                <section id="user-roles">
                    <h2>Understanding User Roles</h2>
                    <p>
                        The system uses role-based access control to ensure users have appropriate permissions. Here are the main roles:
                    </p>

                    <div className="grid gap-4 md:grid-cols-2 my-6">
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">👑 Administrator</h4>
                            <p className="text-sm text-muted-foreground">
                                Full system access. Can manage users, configure settings, view all data, and perform any action. Typically for system administrators and business owners.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">👔 Fleet Manager</h4>
                            <p className="text-sm text-muted-foreground">
                                Manages fleet operations, trucks, drivers, and assignments. Can create and edit most records but cannot manage users or system settings.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">📋 Operations Manager</h4>
                            <p className="text-sm text-muted-foreground">
                                Focuses on creating and managing operations, dispatches, and tracking. Can view fleet data but has limited edit capabilities.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">💰 Accountant</h4>
                            <p className="text-sm text-muted-foreground">
                                Access to financial reports, expenses, and revenue tracking. Can view operations and generate financial analytics but cannot create or edit operational data.
                            </p>
                        </div>
                        <div className="border rounded-lg p-4 bg-card">
                            <h4 className="font-semibold text-primary mb-2">👀 Viewer</h4>
                            <p className="text-sm text-muted-foreground">
                                Read-only access to view data and reports. Cannot create, edit, or delete any records. Suitable for stakeholders who need visibility without operational control.
                            </p>
                        </div>
                    </div>

                    <InfoBox type="info">
                        <p>
                            Your current role determines which menu items you see and which actions you can perform. If you need additional permissions, contact your system administrator.
                        </p>
                    </InfoBox>
                </section>

                {/* First Steps */}
                <section id="first-steps">
                    <h2>Your First Steps</h2>
                    <p>
                        Ready to get started? Follow this checklist to begin using the system effectively:
                    </p>

                    <StepByStep number={1} title="Complete Your Profile">
                        <p>
                            Click on your avatar in the top right corner and select "Profile Settings". Add your contact information, set up two-factor authentication for security, and customize your appearance preferences (light/dark theme).
                        </p>
                        <ScreenshotPlaceholder
                            description="User menu dropdown showing Profile Settings, Password, Two-Factor Auth, and Logout options"
                            fileName="getting-started/user-menu.png"
                            width={320}
                            height={280}
                        />
                    </StepByStep>

                    <StepByStep number={2} title="Explore the Dashboard">
                        <p>
                            Familiarize yourself with the dashboard. It shows key metrics like active trucks, operations in progress, fuel efficiency, and revenue. Each card is clickable and will take you to more detailed views.
                        </p>
                    </StepByStep>

                    <StepByStep number={3} title="Review Fleet Data">
                        <p>
                            Navigate to <strong>Fleet Management → Trucks</strong> and <strong>Fleet Management → Drivers</strong> to see your current fleet. This data forms the foundation for all operations.
                        </p>
                    </StepByStep>

                    <StepByStep number={4} title="Check Permissions">
                        <p>
                            Try creating a test record (like a new truck or operation) to understand your permission level. If you encounter permission errors, note which features you need and request access from your administrator.
                        </p>
                    </StepByStep>

                    <StepByStep number={5} title="Explore Reports">
                        <p>
                            Visit the <strong>Reports</strong> section to see available analytics. Try different filters to understand how data can be sliced and analyzed.
                        </p>
                    </StepByStep>

                    <StepByStep number={6} title="Enable Notifications">
                        <p>
                            Go to <strong>Settings → Notification Preferences</strong> to configure which alerts you want to receive. This helps you stay informed about important events without being overwhelmed.
                        </p>
                    </StepByStep>

                    <div className="my-6 rounded-lg border border-green-500 bg-green-50 dark:bg-green-950/30 p-4">
                        <div className="flex items-start gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
                            <div>
                                <p className="font-semibold text-green-900 dark:text-green-300 mb-1">
                                    Quick Win!
                                </p>
                                <p className="text-sm text-green-800 dark:text-green-200">
                                    Once you've completed these steps, you'll have a solid foundation for using the system effectively. Consider bookmarking pages you visit frequently for quick access.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Navigation Basics */}
                <section id="navigation">
                    <h2>Navigation Basics</h2>
                    <p>
                        The system is organized into logical sections accessible from the sidebar:
                    </p>

                    <ul>
                        <li><strong>Dashboard:</strong> Your home base with overview metrics</li>
                        <li><strong>Fleet Management:</strong> Trucks, drivers, assignments, vehicle types, cargo types</li>
                        <li><strong>Operations:</strong> Create and manage dispatches, track performance</li>
                        <li><strong>Maintenance:</strong> Maintenance records, schedules, alerts, and types</li>
                        <li><strong>Fuel Management:</strong> Track fuel consumption and costs</li>
                        <li><strong>Geographic:</strong> Regions, zones, woredas, places, distances</li>
                        <li><strong>Outsourcing:</strong> Manage outsourced operations and performance</li>
                        <li><strong>Reports:</strong> All analytics and reporting features</li>
                        <li><strong>Settings:</strong> Grading systems, backups, and configurations</li>
                        <li><strong>Administration:</strong> Users, roles, permissions, activity logs (admin only)</li>
                    </ul>

                    <InfoBox type="tip">
                        <p>
                            <strong>Pro Tip:</strong> Use the search function (⌘K or Ctrl+K) to quickly find any page or feature. You can also use breadcrumbs at the top of each page to navigate back to parent sections.
                        </p>
                    </InfoBox>
                </section>

                {/* Getting Help */}
                <section id="getting-help">
                    <h2>Getting Help When You Need It</h2>
                    <p>
                        You're already in the right place! This documentation system provides comprehensive guides for every feature:
                    </p>

                    <ul>
                        <li><strong>Browse by Category:</strong> Use the sidebar to explore topics by feature area</li>
                        <li><strong>Search:</strong> Use the search bar at the top to find specific topics</li>
                        <li><strong>FAQ:</strong> Check the Frequently Asked Questions for quick answers to common issues</li>
                        <li><strong>Contact Support:</strong> If you can't find what you need, use the Contact page to reach our support team</li>
                    </ul>

                    <ScreenshotPlaceholder
                        description="Help center homepage showing search bar, category cards, and featured articles"
                        fileName="getting-started/help-center.png"
                        width={1920}
                        height={1080}
                        caption="The help center - always available when you need guidance"
                    />
                </section>

                {/* Next Steps */}
                <section id="next-steps">
                    <h2>What's Next?</h2>
                    <p>
                        Now that you understand the basics, here are recommended articles based on your role:
                    </p>

                    <h3>For Fleet Managers:</h3>
                    <ul>
                        <li>How to Add a New Truck</li>
                        <li>Driver Registration and Management</li>
                        <li>Creating Driver-Truck Assignments</li>
                        <li>Managing Maintenance Records</li>
                    </ul>

                    <h3>For Operations Managers:</h3>
                    <ul>
                        <li>Creating and Managing Operations</li>
                        <li>Route Planning Best Practices</li>
                        <li>Tracking Operation Status</li>
                        <li>Customer Management</li>
                    </ul>

                    <h3>For Accountants:</h3>
                    <ul>
                        <li>Understanding Financial Reports</li>
                        <li>Using Report Filters Effectively</li>
                        <li>Analyzing Cost Per Kilometer</li>
                        <li>Customer Profitability Reports</li>
                    </ul>

                    <h3>For Administrators:</h3>
                    <ul>
                        <li>User Management Guide</li>
                        <li>Roles and Permissions Overview</li>
                        <li>System Configuration</li>
                        <li>Backup and Security Best Practices</li>
                    </ul>
                </section>

                {/* Feedback Widget */}
                <HelpfulFeedback articleId="getting-started-welcome" />

                {/* Navigation to other articles */}
                <ArticleNavigation
                    nextArticle={{
                        title: 'Dashboard Overview',
                        href: '/help/getting-started/dashboard-overview',
                    }}
                    categoryName="Getting Started"
                    categoryUrl="/help/getting-started"
                />
            </HelpArticle>
        </HelpLayout>
    );
}

