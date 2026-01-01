import * as React from 'react';
import { Head, Link } from '@inertiajs/react';
import { HelpSidebar } from '@/components/help/help-sidebar';
import { SidebarProvider } from '@/components/ui/sidebar';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, HelpCircle } from 'lucide-react';

interface FAQ {
    question: string;
    answer: string;
    category: string;
}

const faqs: FAQ[] = [
    // Getting Started
    {
        category: 'Getting Started',
        question: 'How do I log in to the system?',
        answer: 'Visit the login page and enter your email address and password. If you forgot your password, click "Forgot Password" to receive a reset link via email. Contact your administrator if you don\'t have login credentials yet.',
    },
    {
        category: 'Getting Started',
        question: 'What are the different user roles?',
        answer: 'The system has five main roles: Administrator (full access), Fleet Manager (manage trucks and drivers), Operations Manager (create operations and dispatches), Accountant (view financial reports), and Viewer (read-only access). Your role determines which features you can access.',
    },
    {
        category: 'Getting Started',
        question: 'How do I change my password?',
        answer: 'Click your avatar in the top right corner, select "Profile Settings", then "Password". Enter your current password and your new password twice. Click "Update Password" to save. Your new password must be at least 8 characters long.',
    },
    {
        category: 'Getting Started',
        question: 'Can I customize the dashboard?',
        answer: 'The dashboard displays metrics based on your role and permissions. While you cannot add or remove cards, you can filter data using the date range selectors at the top. Administrators can configure system-wide dashboard settings.',
    },

    // Fleet Management
    {
        category: 'Fleet Management',
        question: 'How do I add a new truck?',
        answer: 'Go to Fleet Management → Trucks, click "Add New Truck", and fill in the required information: plate number, make, model, and vehicle type. You can also add optional details like cargo capacity and dimensions. See the "Adding Trucks" help article for a detailed guide.',
    },
    {
        category: 'Fleet Management',
        question: 'Can I add multiple trucks at once?',
        answer: 'Yes, contact your administrator about bulk import functionality. You can prepare a CSV file with all truck data and import multiple vehicles at once, which is much faster than adding them individually.',
    },
    {
        category: 'Fleet Management',
        question: 'What does "Truck Status" mean?',
        answer: 'Truck status indicates availability: Active (operational and available), Inactive (not currently in use), Maintenance (under repair), or Reserved (designated for specific purposes). Only active trucks can be assigned to drivers.',
    },
    {
        category: 'Fleet Management',
        question: 'How do I assign a driver to a truck?',
        answer: 'Go to Fleet Management → Driver-Truck Assignments, click "Attach Driver", select both driver and truck from the dropdowns, then click "Create Assignment". This creates an active assignment that can be used for operations.',
    },
    {
        category: 'Fleet Management',
        question: 'Can one driver be assigned to multiple trucks?',
        answer: 'No, a driver can only have one active truck assignment at a time. To assign them to a different truck, you must first detach them from their current truck, then create a new assignment.',
    },
    {
        category: 'Fleet Management',
        question: 'What information is required to add a driver?',
        answer: 'Required fields include full name, license number, license type, license expiry date, and phone number. Optional information includes emergency contact, address, and photo. Accurate license information is critical for compliance.',
    },

    // Operations
    {
        category: 'Operations',
        question: 'What is an operation?',
        answer: 'An operation represents a transportation job from origin to destination. It includes route details, assigned driver-truck, cargo information, customer, freight rate, expenses, and status tracking from dispatch to delivery.',
    },
    {
        category: 'Operations',
        question: 'Why can\'t I create an operation?',
        answer: 'The most common reason is no active driver-truck assignments exist. You must first assign a driver to a truck before creating operations. Also check that you have "operations.create" permission and that required locations exist in the system.',
    },
    {
        category: 'Operations',
        question: 'Can I edit an operation after it\'s created?',
        answer: 'Yes, but only certain fields depending on the operation status. For pending operations, you can edit most details. For in-progress operations, you can update status and add expenses. Completed operations have limited editing to maintain historical accuracy.',
    },
    {
        category: 'Operations',
        question: 'How do I update operation status?',
        answer: 'Open the operation detail page and click "Update Status" button. Select the new status (Dispatched, Loading, In Transit, Arrived, Completed) and optionally add notes. Status updates are logged with timestamps for tracking.',
    },
    {
        category: 'Operations',
        question: 'What happens to operation data when I delete it?',
        answer: 'Deleting an operation removes it from the system and excludes it from performance metrics and reports. This action cannot be undone. Consider cancelling instead of deleting to maintain historical records.',
    },
    {
        category: 'Operations',
        question: 'How is freight rate calculated?',
        answer: 'Freight rates are entered manually based on your pricing model. You can calculate per kilometer, per ton, or as a flat rate. The system displays total revenue based on your inputs but doesn\'t auto-calculate rates.',
    },

    // Maintenance
    {
        category: 'Maintenance',
        question: 'How do I schedule maintenance?',
        answer: 'Go to Maintenance → Maintenance Records, click "Create Record", select the truck, choose maintenance type, and set the scheduled date. You can also add estimated cost and notes. The system will track completion and alert for overdue maintenance.',
    },
    {
        category: 'Maintenance',
        question: 'Will I be notified when maintenance is due?',
        answer: 'Yes, if notifications are enabled. The system sends alerts before maintenance due dates and for overdue maintenance. Check Settings → Notification Preferences to configure when and how you receive alerts.',
    },
    {
        category: 'Maintenance',
        question: 'Can I track maintenance costs?',
        answer: 'Yes, every maintenance record can include cost information. View individual truck maintenance history to see cost trends, or use the Maintenance Reports to analyze costs across your fleet.',
    },

    // Reports
    {
        category: 'Reports',
        question: 'How do I filter reports?',
        answer: 'Click the "Filter" button on any report page. Select your desired filters (date range, trucks, drivers, etc.), then click "Apply". Active filters appear as badges and all charts/tables update to show only filtered data.',
    },
    {
        category: 'Reports',
        question: 'Can I export report data?',
        answer: 'Yes, click the "Export" button and choose Excel, PDF, or CSV format. The exported file includes all filtered data currently visible in the report, maintaining your sort order and filter selections.',
    },
    {
        category: 'Reports',
        question: 'Why does my report show no data?',
        answer: 'Check if filters are too restrictive. Try resetting all filters to see all available data, then apply filters one at a time. Also verify that data exists for your selected date range and criteria.',
    },
    {
        category: 'Reports',
        question: 'What\'s the difference between Performance reports?',
        answer: '"Performance All" shows all operations. "By Truck" groups by vehicle. "By Driver" groups by driver. "By Status" groups by operation status. Each offers different perspectives on the same underlying operation data.',
    },

    // Account & Permissions
    {
        category: 'Account & Permissions',
        question: 'Why can\'t I see certain menu items?',
        answer: 'Menu items are restricted based on your role and permissions. If you need access to a feature, contact your administrator to request the necessary permissions or role change.',
    },
    {
        category: 'Account & Permissions',
        question: 'How do I enable two-factor authentication?',
        answer: 'Go to Profile Settings → Two-Factor Authentication, click "Enable 2FA", scan the QR code with an authenticator app (Google Authenticator, Authy, etc.), and enter the verification code. Store recovery codes safely.',
    },
    {
        category: 'Account & Permissions',
        question: 'Can I change my email address?',
        answer: 'Yes, go to Profile Settings and update your email. You\'ll need to verify the new email address. Your email serves as your username, so ensure you remember it for future logins.',
    },
    {
        category: 'Account & Permissions',
        question: 'What if I forget my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email, and you\'ll receive a password reset link. Follow the link to create a new password. If you don\'t receive the email, check spam or contact your administrator.',
    },

    // Common Errors
    {
        category: 'Common Errors',
        question: 'Error: "You do not have permission..."',
        answer: 'This error means your account lacks the required permission for that action. Contact your system administrator to request access. Specify which feature you need and what task you\'re trying to perform.',
    },
    {
        category: 'Common Errors',
        question: 'Error: "Plate number already taken"',
        answer: 'A truck with this plate number already exists. Search the trucks list to find the existing entry. If it\'s a duplicate, you may need to edit or delete the existing record (requires permission).',
    },
    {
        category: 'Common Errors',
        question: 'Why does the page keep loading?',
        answer: 'This usually indicates a connectivity issue or server problem. Refresh the page (F5 or Ctrl+R). If it persists, check your internet connection or contact support. Some reports with large datasets may take longer to load.',
    },
    {
        category: 'Common Errors',
        question: 'My data disappeared after filtering',
        answer: 'Data isn\'t gone - filters are hiding it. Click "Reset Filters" or "Clear All" to see all data again. Check the filter badges at the top of the report to see what filters are active.',
    },

    // Data Entry
    {
        category: 'Data Entry',
        question: 'Are there required fields?',
        answer: 'Yes, fields marked with an asterisk (*) are required. The form won\'t submit until all required fields are filled. Hover over field labels for additional information about what\'s needed.',
    },
    {
        category: 'Data Entry',
        question: 'Can I save a form as draft?',
        answer: 'Some forms have a "Save as Draft" option that saves your work without submitting. Drafts can be completed later. If you don\'t see this option, the form requires all information at once.',
    },
    {
        category: 'Data Entry',
        question: 'What date format should I use?',
        answer: 'The system uses date pickers, so you don\'t need to worry about format. Click the calendar icon and select the date. The system automatically formats dates based on your locale settings.',
    },

    // Best Practices
    {
        category: 'Best Practices',
        question: 'How often should I update truck status?',
        answer: 'Update truck status whenever it changes (going into maintenance, becoming active again, etc.). Accurate status ensures operations are only assigned to available trucks and maintenance schedules are respected.',
    },
    {
        category: 'Best Practices',
        question: 'Should I delete old records?',
        answer: 'No, keep historical records for reporting and analysis. Old data doesn\'t slow down the system. Only delete true duplicates or test data. Use filters to view recent data without deleting history.',
    },
    {
        category: 'Best Practices',
        question: 'How can I improve report performance?',
        answer: 'Use date range filters to limit data volume. Export large datasets rather than viewing them all on-screen. Schedule automatic reports during off-peak hours if the feature is available.',
    },

    // Troubleshooting
    {
        category: 'Troubleshooting',
        question: 'The system is running slowly',
        answer: 'Clear your browser cache and cookies. Close unnecessary browser tabs. If using reports with large date ranges, narrow the range. Contact support if performance issues persist.',
    },
    {
        category: 'Troubleshooting',
        question: 'Changes I made aren\'t saving',
        answer: 'Check for error messages near form fields. Ensure all required fields are filled. Check your internet connection. If the problem continues, try a different browser or contact support.',
    },
    {
        category: 'Troubleshooting',
        question: 'I can\'t find a truck/driver I just added',
        answer: 'Refresh the page (F5). Check if filters are active that might be hiding the new entry. Verify the record was actually saved by checking for a success message. Search by plate number or name.',
    },
];

export default function HelpFAQ() {
    const [searchQuery, setSearchQuery] = React.useState('');
    const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);

    const categories = React.useMemo(() => {
        const cats = Array.from(new Set(faqs.map(faq => faq.category)));
        return cats;
    }, []);

    const filteredFAQs = React.useMemo(() => {
        let filtered = faqs;

        if (selectedCategory) {
            filtered = filtered.filter(faq => faq.category === selectedCategory);
        }

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                faq =>
                    faq.question.toLowerCase().includes(query) ||
                    faq.answer.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [searchQuery, selectedCategory]);

    const groupedFAQs = React.useMemo(() => {
        const groups: Record<string, FAQ[]> = {};
        filteredFAQs.forEach(faq => {
            if (!groups[faq.category]) {
                groups[faq.category] = [];
            }
            groups[faq.category].push(faq);
        });
        return groups;
    }, [filteredFAQs]);

    return (
        <>
            <Head title="Frequently Asked Questions - Help & Documentation" />
            <SidebarProvider>
                <HelpSidebar />
                <main className="flex-1 overflow-auto">
                    {/* Header */}
                    <div className="border-b bg-gradient-to-b from-primary/5 to-background">
                        <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                                    <HelpCircle className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <h1 className="text-4xl font-bold tracking-tight">
                                    Frequently Asked Questions
                                </h1>
                            </div>
                            <p className="text-lg text-muted-foreground mb-6">
                                Quick answers to common questions. Can't find what you're looking for? <Link href="/help/contact" className="text-primary hover:underline">Contact support</Link>.
                            </p>

                            {/* Search */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Search FAQs..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Category Filter */}
                    <div className="border-b bg-muted/30">
                        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
                            <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">Category:</span>
                                <Button
                                    variant={selectedCategory === null ? 'default' : 'outline'}
                                    size="sm"
                                    onClick={() => setSelectedCategory(null)}
                                >
                                    All ({faqs.length})
                                </Button>
                                {categories.map((category) => {
                                    const count = faqs.filter(faq => faq.category === category).length;
                                    return (
                                        <Button
                                            key={category}
                                            variant={selectedCategory === category ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setSelectedCategory(category)}
                                        >
                                            {category} ({count})
                                        </Button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* FAQ Content */}
                    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
                        {filteredFAQs.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground mb-4">
                                    No FAQs found matching "{searchQuery}"
                                </p>
                                <Button onClick={() => setSearchQuery('')} variant="outline">
                                    Clear Search
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => (
                                    <div key={category}>
                                        <h2 className="text-2xl font-bold mb-4">{category}</h2>
                                        <Accordion type="multiple" className="space-y-2">
                                            {categoryFAQs.map((faq, index) => (
                                                <AccordionItem
                                                    key={`${category}-${index}`}
                                                    value={`${category}-${index}`}
                                                    className="border rounded-lg px-4"
                                                >
                                                    <AccordionTrigger className="text-left hover:no-underline">
                                                        <span className="font-medium">{faq.question}</span>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-muted-foreground">
                                                        {faq.answer}
                                                    </AccordionContent>
                                                </AccordionItem>
                                            ))}
                                        </Accordion>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Footer CTA */}
                    <div className="border-t bg-muted/50 py-8">
                        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
                            <h3 className="text-lg font-semibold mb-2">Still have questions?</h3>
                            <p className="text-muted-foreground mb-4">
                                Can't find the answer you're looking for? Our support team is here to help.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Link href="/help/search">
                                    <Button variant="outline">
                                        Search Documentation
                                    </Button>
                                </Link>
                                <Link href="/help/contact">
                                    <Button>
                                        Contact Support
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </main>
            </SidebarProvider>
        </>
    );
}

