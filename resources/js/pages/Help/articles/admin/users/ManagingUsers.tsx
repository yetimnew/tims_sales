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

export default function ManagingUsers() {
    return (
        <HelpLayout
            title="User Management Guide"
            description="Learn how to create, edit, and manage user accounts"
        >
            <Head title="User Management Guide - Help & Documentation" />
            
            <HelpArticle
                title="User Management Guide"
                category="Administration"
                subcategory="Users"
                lastUpdated="January 1, 2025"
                readTime="7 min"
            >
                {/* Introduction */}
                <section>
                    <p className="lead text-lg text-muted-foreground mb-6">
                        User management is a critical administrative function that controls who can access your fleet management system and what they can do. This guide covers everything from creating new users to managing permissions, resetting passwords, and maintaining account security.
                    </p>

                    <InfoBox type="warning">
                        <p>
                            <strong>Administrator Access Required:</strong> Most user management functions require administrator or user management permissions. If you don't see these options, contact your system administrator.
                        </p>
                    </InfoBox>
                </section>

                {/* Overview */}
                <section id="overview">
                    <h2>User Management Overview</h2>
                    <p>
                        The system uses a role-based access control (RBAC) model where:
                    </p>
                    <ul>
                        <li><strong>Users</strong> are individual accounts with login credentials</li>
                        <li><strong>Roles</strong> are collections of permissions (e.g., Admin, Manager, Operator)</li>
                        <li><strong>Permissions</strong> are specific rights to perform actions (e.g., create trucks, view reports)</li>
                    </ul>

                    <div className="my-6 p-4 rounded-lg border bg-muted">
                        <p className="font-mono text-sm">
                            User → Assigned Role → Has Permissions → Can Perform Actions
                        </p>
                    </div>

                    <InfoBox type="info">
                        <p>
                            This hierarchical system ensures security while allowing flexibility. Users inherit all permissions from their assigned role, and administrators can fine-tune individual permissions if needed.
                        </p>
                    </InfoBox>
                </section>

                {/* Creating Users */}
                <section id="creating-users">
                    <h2>Creating New Users</h2>

                    <StepByStep number={1} title="Navigate to User Management">
                        <p>
                            From the sidebar, go to <strong>Administration → Users</strong>.
                        </p>
                        <ScreenshotPlaceholder
                            description="Sidebar with Administration section expanded showing Users menu item"
                            fileName="admin/users/sidebar-users.png"
                            width={400}
                            height={600}
                        />
                    </StepByStep>

                    <StepByStep number={2} title="Click 'Create User'">
                        <p>
                            On the Users index page, click the <strong>"Create User"</strong> button in the top right corner.
                        </p>
                        <ScreenshotPlaceholder
                            description="Users index page showing user list with 'Create User' button highlighted"
                            fileName="admin/users/index-create-button.png"
                            width={1920}
                            height={1080}
                            annotations={[
                                { x: 85, y: 12, text: 'Click here', type: 'arrow' },
                            ]}
                        />
                    </StepByStep>

                    <StepByStep number={3} title="Fill in Basic Information">
                        <p>
                            Enter the new user's personal information:
                        </p>
                        <ul>
                            <li><strong>Full Name:</strong> User's complete name (e.g., "John Doe")</li>
                            <li><strong>Email Address:</strong> Must be unique, used for login and notifications</li>
                            <li><strong>Phone Number:</strong> Optional but recommended for contact purposes</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Create user form showing name, email, and phone fields"
                            fileName="admin/users/form-basic-info.png"
                            width={1200}
                            height={500}
                        />
                        <InfoBox type="tip">
                            <p>
                                <strong>Email Validation:</strong> The system validates email format and checks for duplicates. Each user must have a unique email address as it serves as their username.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={4} title="Set Password">
                        <p>
                            Create an initial password for the user:
                        </p>
                        <ul>
                            <li>Enter a strong password (minimum 8 characters)</li>
                            <li>Include uppercase, lowercase, numbers, and symbols</li>
                            <li>Confirm the password by retyping it</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Password fields with strength indicator and requirements list"
                            fileName="admin/users/form-password.png"
                            width={800}
                            height={400}
                        />
                        <InfoBox type="success">
                            <p>
                                <strong>Best Practice:</strong> Generate a strong temporary password and require the user to change it on first login. Some systems have a "Send Password Reset Email" option that lets the user set their own password.
                            </p>
                        </InfoBox>
                    </StepByStep>

                    <StepByStep number={5} title="Assign a Role">
                        <p>
                            Select the appropriate role for this user. The role determines their permissions and what they can access:
                        </p>
                        <ul>
                            <li><strong>Administrator:</strong> Full system access</li>
                            <li><strong>Fleet Manager:</strong> Manage trucks, drivers, assignments</li>
                            <li><strong>Operations Manager:</strong> Create and manage operations</li>
                            <li><strong>Accountant:</strong> View financial reports and data</li>
                            <li><strong>Viewer:</strong> Read-only access to data</li>
                        </ul>
                        <ScreenshotPlaceholder
                            description="Role dropdown showing available roles with descriptions"
                            fileName="admin/users/form-role.png"
                            width={800}
                            height={500}
                            caption="Role selection with hover descriptions"
                        />
                    </StepByStep>

                    <StepByStep number={6} title="Set Account Status">
                        <p>
                            Choose whether the account should be active immediately:
                        </p>
                        <ul>
                            <li><strong>Active:</strong> User can log in immediately</li>
                            <li><strong>Inactive:</strong> Account created but login disabled</li>
                        </ul>
                        <p>
                            Most new users should be set to "Active" unless you're preparing accounts for future use.
                        </p>
                    </StepByStep>

                    <StepByStep number={7} title="Review and Create">
                        <p>
                            Review all information, then click <strong>"Create User"</strong>. The system will:
                        </p>
                        <ul>
                            <li>Validate all inputs</li>
                            <li>Create the user account</li>
                            <li>Assign the selected role</li>
                            <li>Send a welcome email (if configured)</li>
                            <li>Redirect you to the user's profile page</li>
                        </ul>
                        <InfoBox type="success">
                            <p>
                                <strong>Success!</strong> The user can now log in with their email and the password you set. Make sure to securely communicate their credentials to them.
                            </p>
                        </InfoBox>
                    </StepByStep>
                </section>

                {/* Understanding Roles */}
                <section id="roles-permissions">
                    <h2>Understanding Roles and Permissions</h2>

                    <h3>Role Hierarchy and Permissions</h3>
                    <p>
                        Each role has specific permissions. Here's a detailed breakdown:
                    </p>

                    <div className="my-6 space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-primary text-primary-foreground px-4 py-3 font-semibold">
                                👑 Administrator
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                                <p className="font-medium">Full system access including:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>All CRUD operations on all modules</li>
                                    <li>User management (create, edit, delete users)</li>
                                    <li>Role and permission management</li>
                                    <li>System settings and configuration</li>
                                    <li>Backups and data management</li>
                                    <li>Activity logs and audit trails</li>
                                </ul>
                                <p className="mt-2 text-muted-foreground italic">
                                    Use sparingly - only for trusted system administrators
                                </p>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-blue-500 text-white px-4 py-3 font-semibold">
                                👔 Fleet Manager
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                                <p className="font-medium">Fleet management focus:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Create, edit, view, delete trucks</li>
                                    <li>Create, edit, view, delete drivers</li>
                                    <li>Manage driver-truck assignments</li>
                                    <li>Add and manage maintenance records</li>
                                    <li>View operations and performance</li>
                                    <li>Access fleet-related reports</li>
                                </ul>
                                <p className="mt-2 text-red-600 font-medium">Cannot:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                                    <li>Manage users or system settings</li>
                                    <li>Access full financial reports</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-green-500 text-white px-4 py-3 font-semibold">
                                📋 Operations Manager
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                                <p className="font-medium">Operations and dispatch focus:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>Create, edit, view operations</li>
                                    <li>Manage customers</li>
                                    <li>Update operation status</li>
                                    <li>View fleet data (read-only)</li>
                                    <li>Access operation reports</li>
                                    <li>Manage geographic data (places, distances)</li>
                                </ul>
                                <p className="mt-2 text-red-600 font-medium">Cannot:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                                    <li>Delete operations</li>
                                    <li>Modify fleet data (trucks, drivers)</li>
                                    <li>Access full financial details</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-purple-500 text-white px-4 py-3 font-semibold">
                                💰 Accountant
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                                <p className="font-medium">Financial and reporting focus:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>View all financial reports</li>
                                    <li>Access profitability analytics</li>
                                    <li>Export financial data</li>
                                    <li>View operations (read-only)</li>
                                    <li>View expenses and revenue</li>
                                </ul>
                                <p className="mt-2 text-red-600 font-medium">Cannot:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                                    <li>Create or edit operations</li>
                                    <li>Modify fleet data</li>
                                    <li>Access system administration</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border rounded-lg overflow-hidden">
                            <div className="bg-gray-500 text-white px-4 py-3 font-semibold">
                                👀 Viewer
                            </div>
                            <div className="p-4 space-y-2 text-sm">
                                <p className="font-medium">Read-only access:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                    <li>View dashboard and KPIs</li>
                                    <li>View all operational data</li>
                                    <li>View reports (limited)</li>
                                    <li>Export data (limited)</li>
                                </ul>
                                <p className="mt-2 text-red-600 font-medium">Cannot:</p>
                                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                                    <li>Create, edit, or delete anything</li>
                                    <li>Access sensitive financial details</li>
                                    <li>Change any settings</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Editing Users */}
                <section id="editing-users">
                    <h2>Editing User Information</h2>
                    <p>
                        To update a user's information:
                    </p>
                    <ol>
                        <li>Go to <strong>Administration → Users</strong></li>
                        <li>Find the user in the list (use search if needed)</li>
                        <li>Click on their name or the "Edit" button</li>
                        <li>Update any fields (name, email, role, status)</li>
                        <li>Click "Update User" to save changes</li>
                    </ol>

                    <ScreenshotPlaceholder
                        description="Edit user form showing updatable fields with save and cancel buttons"
                        fileName="admin/users/edit-form.png"
                        width={1200}
                        height={900}
                    />

                    <InfoBox type="warning">
                        <p>
                            <strong>Role Changes Take Effect Immediately:</strong> If you change a user's role, their permissions update instantly. They may need to log out and back in to see interface changes.
                        </p>
                    </InfoBox>
                </section>

                {/* Password Management */}
                <section id="password-management">
                    <h2>Password Management</h2>

                    <h3>Resetting User Passwords</h3>
                    <p>
                        As an administrator, you can reset passwords for users who forget them:
                    </p>
                    <ol>
                        <li>Go to the user's profile or edit page</li>
                        <li>Click <strong>"Reset Password"</strong></li>
                        <li>Choose one of two options:
                            <ul>
                                <li><strong>Send Reset Email:</strong> User receives an email with a link to set their own password (recommended)</li>
                                <li><strong>Set Password Manually:</strong> You create a new password and communicate it to them</li>
                            </ul>
                        </li>
                    </ol>

                    <ScreenshotPlaceholder
                        description="Password reset dialog with options for email link or manual reset"
                        fileName="admin/users/password-reset.png"
                        width={600}
                        height={400}
                    />

                    <InfoBox type="tip">
                        <p>
                            <strong>Security Best Practice:</strong> Always use the "Send Reset Email" option. This ensures you never see the user's password, and they can choose their own secure password.
                        </p>
                    </InfoBox>

                    <h3>Password Policies</h3>
                    <p>
                        The system enforces these password requirements:
                    </p>
                    <ul>
                        <li>Minimum 8 characters</li>
                        <li>Must include at least one uppercase letter</li>
                        <li>Must include at least one lowercase letter</li>
                        <li>Must include at least one number</li>
                        <li>Special characters recommended but not required</li>
                        <li>Cannot be the same as the last 3 passwords</li>
                        <li>Cannot contain the user's name or email</li>
                    </ul>
                </section>

                {/* Deactivating vs Deleting */}
                <section id="deactivate-delete">
                    <h2>Deactivating vs. Deleting Users</h2>

                    <h3>Deactivating a User</h3>
                    <p>
                        <strong>Deactivation</strong> disables a user's account without deleting their data:
                    </p>
                    <ul>
                        <li>User cannot log in</li>
                        <li>All their historical data remains intact</li>
                        <li>Reports still show their activities</li>
                        <li>Can be reactivated anytime</li>
                    </ul>
                    <p>
                        <strong>When to use:</strong> Employee leaves temporarily, seasonal workers, suspended accounts
                    </p>

                    <h3>Deleting a User</h3>
                    <p>
                        <strong>Deletion</strong> permanently removes the user account:
                    </p>
                    <ul>
                        <li>User account is deleted</li>
                        <li>Personal information removed</li>
                        <li>Historical records may be anonymized</li>
                        <li>Cannot be undone</li>
                    </ul>
                    <p>
                        <strong>When to use:</strong> Test accounts, duplicate accounts, compliance with data deletion requests
                    </p>

                    <InfoBox type="danger">
                        <p>
                            <strong>Warning:</strong> Deleting a user who has created operations, added trucks, or performed other activities may cause data integrity issues. The system will warn you if the user has associated records. In most cases, deactivation is the safer choice.
                        </p>
                    </InfoBox>

                    <ScreenshotPlaceholder
                        description="Delete user confirmation dialog showing warning about associated records"
                        fileName="admin/users/delete-warning.png"
                        width={600}
                        height={400}
                    />
                </section>

                {/* Activity Logs */}
                <section id="activity-logs">
                    <h2>Viewing User Activity</h2>
                    <p>
                        Track what users are doing in the system:
                    </p>
                    <ol>
                        <li>Go to <strong>Administration → Activity Logs</strong></li>
                        <li>Filter by user to see their specific activities</li>
                        <li>Review actions like logins, data changes, deletions</li>
                    </ol>

                    <ScreenshotPlaceholder
                        description="Activity logs page showing user actions with timestamps and details"
                        fileName="admin/users/activity-logs.png"
                        width={1920}
                        height={1080}
                    />

                    <p>
                        Activity logs help with:
                    </p>
                    <ul>
                        <li>Auditing and compliance</li>
                        <li>Troubleshooting issues</li>
                        <li>Investigating unauthorized changes</li>
                        <li>Understanding user behavior patterns</li>
                    </ul>
                </section>

                {/* Security Best Practices */}
                <section id="security-practices">
                    <h2>Security Best Practices</h2>

                    <InfoBox type="tip">
                        <p>
                            <strong>Principle of Least Privilege:</strong> Give users only the permissions they need for their job. Don't make everyone an administrator "just in case."
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Regular Audits:</strong> Periodically review the user list and deactivate accounts for people who no longer need access (former employees, contractors, etc.).
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Require Two-Factor Authentication:</strong> For sensitive roles (Admin, Accountant), require 2FA for additional security. Users can enable this in their profile settings.
                        </p>
                    </InfoBox>

                    <InfoBox type="tip">
                        <p>
                            <strong>Use Strong Passwords:</strong> Enforce password policies and educate users about creating secure passwords. Consider using a password manager.
                        </p>
                    </InfoBox>

                    <InfoBox type="warning">
                        <p>
                            <strong>Never Share Accounts:</strong> Each person should have their own unique account. Shared accounts make auditing impossible and create security vulnerabilities.
                        </p>
                    </InfoBox>
                </section>

                {/* Common Issues */}
                <section id="common-issues">
                    <h2>Common Issues and Solutions</h2>

                    <h3>"Email address already in use"</h3>
                    <InfoBox type="danger">
                        <p>
                            <strong>Problem:</strong> Trying to create a user with an email that's already registered.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Search the user list for that email. The account may exist but be inactive. Either use a different email address or reactivate the existing account.
                        </p>
                    </InfoBox>

                    <h3>User can't see certain menu items</h3>
                    <InfoBox type="info">
                        <p>
                            <strong>Problem:</strong> User complains they don't have access to features they need.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> Check their assigned role and permissions. They may need a role change or custom permissions added. Have them log out and back in after changes.
                        </p>
                    </InfoBox>

                    <h3>Can't delete a user</h3>
                    <InfoBox type="warning">
                        <p>
                            <strong>Problem:</strong> System won't allow user deletion.
                        </p>
                        <p className="mt-2">
                            <strong>Solution:</strong> The user likely has associated records (operations, maintenance logs, etc.). Use deactivation instead, or contact a developer if deletion is absolutely necessary.
                        </p>
                    </InfoBox>
                </section>

                {/* Related Articles */}
                <section id="related">
                    <h2>Related Articles</h2>
                    <ul>
                        <li><a href="/help/admin/roles/definitions">Understanding Roles and Permissions</a></li>
                        <li><a href="/help/admin/roles/custom">Creating Custom Roles</a></li>
                        <li><a href="/help/admin/activity-logs">Viewing Activity Logs</a></li>
                        <li><a href="/help/profile/security">Account Security for Users</a></li>
                        <li><a href="/help/profile/2fa">Setting Up Two-Factor Authentication</a></li>
                    </ul>
                </section>

                {/* Feedback Widget */}
                <HelpfulFeedback articleId="admin-users-managing" />

                {/* Navigation */}
                <ArticleNavigation
                    previousArticle={{
                        title: 'Administration Overview',
                        href: '/help/admin',
                    }}
                    nextArticle={{
                        title: 'Roles & Permissions',
                        href: '/help/admin/roles',
                    }}
                    categoryName="Administration"
                    categoryUrl="/help/admin"
                />
            </HelpArticle>
        </HelpLayout>
    );
}

