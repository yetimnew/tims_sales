# Help System Architecture & Technical Specification

## 🏗️ System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    HELP SYSTEM MAIN INTERFACE               │
├─────────────────────────────────────────────────────────────┤
│  Search Bar                                    [Filters] [?]  │
├─────────┬─────────────────────────────────────────────────┬─┤
│         │                                                   │ │
│  HELP   │          MAIN CONTENT AREA                       │X│
│  NAV    │                                                   │ │
│         │  • Featured Articles                             │ │
│ • Dash  │  • Article Content with Images                  │ │
│ • Ops   │  • Code Examples                                │ │
│ • Fleet │  • Step-by-step Guides                          │ │
│ • Loca  │  • Video Embeds                                 │ │
│ • Maint │  • Related Links                                │ │
│ • Fuel  │                                                   │ │
│ • Perf  │          ┌──────────────────────┐               │ │
│ • Repo  │          │ SIDEBAR FEATURES     │               │ │
│ • Admin │          ├──────────────────────┤               │ │
│ • FAQ   │          │ • Related Articles   │               │ │
│ • Cont  │          │ • Quick Links        │               │ │
│         │          │ • Contact Support    │               │ │
│         │          │ • Feedback           │               │ │
│         │          └──────────────────────┘               │ │
│         │                                                   │ │
└─────────┴─────────────────────────────────────────────────┴─┘
│ Breadcrumbs: Home > Help > Operations > Creating Dispatch   │
│ Footer: Last Updated | Version | Helpful? | Print | Share   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```
project-root/
├── resources/
│   ├── js/
│   │   ├── pages/
│   │   │   └── Help/
│   │   │       ├── HelpIndex.tsx                 # Main help page
│   │   │       ├── HelpDetail.tsx                # Help article detail page
│   │   │       └── HelpSearch.tsx                # Search results page
│   │   │
│   │   ├── components/
│   │   │   └── help/
│   │   │       ├── HelpSidebar.tsx               # Navigation sidebar
│   │   │       ├── HelpBreadcrumbs.tsx           # Breadcrumb navigation
│   │   │       ├── HelpSearch.tsx                # Search component
│   │   │       ├── ScreenshotViewer.tsx          # Image gallery/viewer
│   │   │       ├── VideoPlayer.tsx               # Video player component
│   │   │       ├── FAQAccordion.tsx              # Expandable FAQ
│   │   │       ├── RelatedArticles.tsx           # Related content
│   │   │       ├── HelpFeedback.tsx              # Feedback form
│   │   │       ├── ContactSupport.tsx            # Support CTA
│   │   │       ├── ContentRenderer.tsx           # Markdown to React
│   │   │       └── HelpLayout.tsx                # Main layout wrapper
│   │   │
│   │   └── hooks/
│   │       ├── useHelpSearch.ts                  # Search logic
│   │       ├── useHelpNavigation.ts              # Navigation tracking
│   │       └── useHelpContent.ts                 # Content fetching
│   │
│   ├── docs/
│   │   └── help-content/
│   │       ├── meta.json                         # Content metadata
│   │       ├── modules/
│   │       │   ├── dashboard.md
│   │       │   ├── operations.md
│   │       │   ├── drivers.md
│   │       │   ├── trucks.md
│   │       │   ├── assignments.md
│   │       │   ├── cargo-types.md
│   │       │   ├── customers.md
│   │       │   ├── regions.md
│   │       │   ├── woredas.md
│   │       │   ├── zones.md
│   │       │   ├── places.md
│   │       │   ├── distances.md
│   │       │   ├── maintenance.md
│   │       │   ├── maintenance-types.md
│   │       │   ├── fuel-records.md
│   │       │   ├── fuel.md
│   │       │   ├── driver-performance.md
│   │       │   ├── driver-safety.md
│   │       │   ├── vehicle-performance.md
│   │       │   ├── outsource-performance.md
│   │       │   ├── financial.md
│   │       │   ├── reports.md
│   │       │   ├── users.md
│   │       │   ├── roles-permissions.md
│   │       │   ├── notifications.md
│   │       │   └── activity-logs.md
│   │       │
│   │       ├── system-guides/
│   │       │   ├── getting-started.md
│   │       │   ├── user-profile.md
│   │       │   ├── appearance.md
│   │       │   ├── two-factor-auth.md
│   │       │   └── keyboard-shortcuts.md
│   │       │
│   │       ├── faqs/
│   │       │   ├── general.md
│   │       │   ├── troubleshooting.md
│   │       │   ├── permissions.md
│   │       │   └── data-management.md
│   │       │
│   │       └── best-practices/
│   │           ├── fleet-management.md
│   │           ├── driver-management.md
│   │           ├── maintenance.md
│   │           └── reporting.md
│   │
│   └── public/
│       └── help/
│           ├── screenshots/
│           │   ├── dashboard/
│           │   │   ├── overview.png
│           │   │   ├── kpi-cards.png
│           │   │   └── charts.png
│           │   ├── operations/
│           │   │   ├── list-view.png
│           │   │   ├── create-form.png
│           │   │   ├── detail-view.png
│           │   │   └── dispatch-map.png
│           │   ├── drivers/
│           │   ├── trucks/
│           │   ├── maintenance/
│           │   ├── reports/
│           │   └── ... (one folder per major module)
│           │
│           ├── videos/
│           │   ├── quick-tours/
│           │   │   ├── dashboard-tour.mp4
│           │   │   ├── operations-tour.mp4
│           │   │   └── ...
│           │   ├── how-to/
│           │   │   ├── create-operation.mp4
│           │   │   ├── assign-driver.mp4
│           │   │   └── ...
│           │   └── troubleshooting/
│           │
│           ├── guides/
│           │   ├── pdf/
│           │   │   ├── quick-start.pdf
│           │   │   ├── admin-guide.pdf
│           │   │   └── ...
│           │   └── checklists/
│           │       ├── daily-checklist.pdf
│           │       └── ...
│           │
│           └── icons/
│               ├── dashboard.svg
│               ├── operations.svg
│               └── ... (module icons)
│
├── app/Http/Controllers/HelpController.php         # Backend help API
├── routes/help.php                                 # Help routes
└── tests/Feature/HelpTest.php                      # Help system tests
```

---

## 🔗 Route Structure

```php
// routes/help.php
Route::prefix('help')->name('help.')->group(function () {
    // Main help pages
    Route::get('/', 'HelpController@index')->name('index');
    Route::get('/search', 'HelpController@search')->name('search');
    Route::get('/{category}/{slug}', 'HelpController@show')->name('show');
    
    // API endpoints
    Route::prefix('api')->group(function () {
        Route::get('/articles', 'HelpController@getArticles');
        Route::get('/search', 'HelpController@apiSearch');
        Route::post('/feedback', 'HelpController@submitFeedback');
    });
    
    // Contact & Support
    Route::post('/contact', 'HelpController@contact')->name('contact');
});

// Example URLs:
/help                                  # Help index/dashboard
/help/dashboard/overview               # Dashboard help
/help/operations/creating-dispatch     # Operations help
/help/search?q=driver+assignment       # Search results
/api/help/articles                     # Get all articles
/api/help/search?q=maintenance         # API search
```

---

## 📄 Markdown Content Structure

### Example: operations.md

```markdown
---
title: "Operations Management"
description: "Complete guide to managing operations and dispatches"
category: "Fleet Operations"
icon: "Truck"
readTime: "8 min"
updated: "2024-12-16"
difficulty: "Intermediate"
tags: ["operations", "dispatch", "routes", "tracking"]
---

# Operations Management Guide

## Table of Contents
1. Overview
2. Getting Started
3. Creating Operations
4. Managing Dispatches
5. Route Planning
6. Real-time Tracking
7. Status Management
8. Dispute Resolution
9. FAQs
10. Best Practices

## 1. Overview

### What is the Operations Module?
[Content...]

### Key Features
- Fleet overview dashboard
- Real-time dispatch tracking
- Route optimization
- Status management
- Performance analytics

![Dashboard Overview](../../public/help/screenshots/operations/overview.png)

## 2. Getting Started

### Accessing Operations
1. Click "Operations" in the sidebar
2. You'll see the operations list with filters
3. Use the search bar to find specific operations

![Operations List](../../public/help/screenshots/operations/list.png)

## 3. Creating Operations

### Step 1: Navigate to Create
Click the "New Operation" or "+" button at the top

![Create Button](../../public/help/screenshots/operations/create-btn.png)

### Step 2: Fill Operation Details
- **Title**: Give your operation a unique name
- **Description**: Add details about the shipment
- **Pickup Location**: Select from locations or add new
- **Delivery Location**: Where the cargo should go
- **Cargo Type**: Select what's being transported
- **Assigned Driver**: Choose the driver
- **Assigned Truck**: Choose the vehicle
- **Expected Date**: When should it be completed

![Create Form](../../public/help/screenshots/operations/create-form.png)

### Step 3: Add Cargo Items
Click "Add Item" to add multiple items to the shipment
- Item name
- Quantity
- Unit
- Weight/Volume
- Special handling notes

### Step 4: Set Dates & Times
- Pickup Date & Time
- Delivery Date & Time
- Deadline

### Step 5: Review & Submit
Review all details and click "Create Operation"

![Confirmation](../../public/help/screenshots/operations/confirm.png)

## 4. Managing Dispatches

### Dispatch Lifecycle
```
Pending → In Progress → In Transit → At Destination → Completed
                    ↘ Delayed ↗
```

### Changing Status
[Content with screenshots for each status change...]

## FAQs

**Q: Can I assign multiple drivers to one operation?**
A: Currently, one operation requires one primary driver. However, you can add helpers in the operation details.

**Q: What happens if a driver is unavailable?**
A: The system will alert you. You can reassign to another available driver.

---

## Best Practices
- Always verify driver availability before dispatch
- Include detailed pickup instructions
- Confirm delivery addresses
- Track in real-time for urgent deliveries
```

---

## 🎨 React Component Examples

### HelpIndex.tsx Structure

```tsx
// Main help page showing all categories
export default function HelpIndex() {
  return (
    <div className="help-page">
      <HelpHeader 
        title="Help & Support"
        description="Find answers and guides for every feature"
      />
      
      <SearchBar onSearch={handleSearch} />
      
      <FeaturedArticles articles={featured} />
      
      <CategoriesGrid>
        {categories.map(cat => (
          <CategoryCard 
            title={cat.title}
            icon={cat.icon}
            articleCount={cat.count}
            onClick={() => navigate(cat.link)}
          />
        ))}
      </CategoriesGrid>
      
      <RecentlyViewed articles={recent} />
    </div>
  );
}
```

### HelpDetail.tsx Structure

```tsx
// Individual help article page
export default function HelpDetail({ article }) {
  return (
    <div className="help-detail">
      <HelpBreadcrumbs path={article.breadcrumbs} />
      
      <article className="help-content">
        <header>
          <h1>{article.title}</h1>
          <MetaInfo 
            updated={article.updated}
            readTime={article.readTime}
            difficulty={article.difficulty}
          />
        </header>
        
        <ContentRenderer content={article.content} />
        
        <FAQSection faqs={article.faqs} />
        
        <RelatedArticles articles={article.related} />
      </article>
      
      <aside className="help-sidebar">
        <HelpFeedback articleId={article.id} />
        <ContactSupport />
        <PrintExport article={article} />
      </aside>
    </div>
  );
}
```

---

## 🔍 Search Implementation

### Search Features
1. **Full-text Search** - Search across all content
2. **Filters** - By category, difficulty, module
3. **Suggestions** - Auto-complete based on articles
4. **Recent Searches** - Quick access to previous searches
5. **Popular Searches** - Common queries

### Search Database Structure

```json
{
  "articles": [
    {
      "id": "ops-create-1",
      "title": "Creating an Operation",
      "category": "operations",
      "content": "Complete text...",
      "tags": ["operations", "dispatch", "create"],
      "keywords": ["operation", "dispatch", "create", "shipment"],
      "difficulty": "easy",
      "readTime": 5
    }
  ]
}
```

---

## 📊 Content Statistics

### Modules to Document (23 core):
```
Dashboard                  → 5 articles
Operations                 → 8 articles
Trucks                     → 6 articles
Drivers                    → 6 articles
Driver-Trucks Assignment   → 4 articles
Cargo Types               → 3 articles
Customers                 → 4 articles
Regions/Woredas/Zones     → 5 articles
Places & Distances        → 4 articles
Maintenance               → 7 articles
Maintenance Types         → 3 articles
Fuel Records              → 4 articles
Fuel Management           → 3 articles
Driver Performance        → 5 articles
Driver Safety             → 4 articles
Vehicle Performance       → 4 articles
Outsource Performance     → 3 articles
Financial                 → 5 articles
Reports                   → 12 articles
Users Management          → 4 articles
Roles & Permissions       → 5 articles
Notifications             → 4 articles
Activity Logs             → 3 articles

Total: ~130 Help Articles
```

---

## 🎯 User Journey Flows

### Flow 1: New User Onboarding
```
Help Index
    ↓
"Getting Started" Category
    ↓
Select Role (Admin/Driver/Manager)
    ↓
Role-specific Getting Started Guide
    ↓
Interactive Tutorial
    ↓
Help Articles for Role
    ↓
Contact Support if needed
```

### Flow 2: Troubleshooting
```
User encounters issue
    ↓
Search Help for issue
    ↓
View troubleshooting article
    ↓
Follow diagnostic steps
    ↓
View FAQ
    ↓
Contact Support (if needed)
```

### Flow 3: Learning New Feature
```
Click Feature "?" icon
    ↓
Modal Help Content
    ↓
"Learn More" → Full Help Article
    ↓
Related Articles
    ↓
Video Tutorial
    ↓
Try Feature
```

---

## 🛠️ Backend Implementation

### HelpController.php

```php
namespace App\Http\Controllers;

class HelpController extends Controller
{
    // Get all help articles
    public function index()
    {
        return inertia('Help/HelpIndex', [
            'articles' => Help::published()->get(),
            'categories' => HelpCategory::all(),
            'featured' => Help::featured()->get(),
        ]);
    }

    // Show specific help article
    public function show($category, $slug)
    {
        $article = Help::where('slug', $slug)->firstOrFail();
        
        return inertia('Help/HelpDetail', [
            'article' => $article,
            'related' => $article->relatedArticles(),
            'faqs' => $article->faqs(),
        ]);
    }

    // Search help articles
    public function search(Request $request)
    {
        $query = $request->input('q');
        
        $results = Help::where('title', 'like', "%{$query}%")
            ->orWhere('content', 'like', "%{$query}%")
            ->orWhere('tags', 'like', "%{$query}%")
            ->paginate(20);

        return inertia('Help/HelpSearch', [
            'results' => $results,
            'query' => $query,
        ]);
    }

    // Submit feedback
    public function submitFeedback(Request $request)
    {
        HelpFeedback::create([
            'article_id' => $request->article_id,
            'user_id' => auth()->id(),
            'helpful' => $request->helpful,
            'feedback' => $request->feedback,
        ]);

        return response()->json(['success' => true]);
    }
}
```

---

## 📱 Responsive Design

### Breakpoints
- **Mobile** (< 640px): Single column, collapse sidebar
- **Tablet** (640px - 1024px): Sidebar collapses to icons
- **Desktop** (> 1024px): Full three-column layout

### Mobile Experience
- Hamburger menu for navigation
- Full-width content area
- Floating action button for search
- Simplified video players
- Touch-friendly buttons (min 44px)

---

## 🔐 Access Control

```php
// Policy-based access
Route::middleware(['auth', 'can:view-help'])->group(function () {
    Route::get('/help', [HelpController::class, 'index']);
    Route::get('/help/{category}/{slug}', [HelpController::class, 'show']);
});

// Some articles may have role-based restrictions
- Admin-only guides
- Driver-specific tutorials
- Manager analytics guides
```

---

## 📈 Analytics & Tracking

### Track User Behavior
- Article views
- Search queries
- Click-through rates
- Time spent on article
- Feedback submissions
- Support ticket creation rate

### Benefits
- Identify confusing features
- Improve documentation
- Find gaps in coverage
- Measure documentation effectiveness

---

## 🚀 Deployment Checklist

- [ ] All markdown content files created
- [ ] Screenshots organized in folders
- [ ] Components developed and tested
- [ ] Search functionality working
- [ ] Routes configured
- [ ] Database migrations (if needed)
- [ ] Styling complete
- [ ] Responsive design tested
- [ ] SEO optimization
- [ ] Analytics integrated
- [ ] User feedback form working
- [ ] Performance optimized
- [ ] Accessibility audit completed
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Production deployment

---

## 📞 Support Integration

### Contact Support from Help
- Chat with support agent
- Email support form
- Create support ticket
- View support status
- Knowledge base link

### Help Footer
- Last updated timestamp
- Version information
- Print/PDF option
- Share article
- Report problem
- Rate helpfulness

This comprehensive architecture provides a scalable, user-friendly help system that guides users through every feature of the application.

