# Screenshot Guidelines for Help Documentation

This document provides comprehensive guidelines for capturing screenshots to complete the Help & Documentation system.

## Overview

The help system currently has **placeholder components** that show where screenshots should be placed. This guide helps you capture high-quality, consistent screenshots to replace these placeholders.

## Quick Summary

- **Total Screenshots Needed:** ~50-60 screenshots
- **Recommended Resolution:** 1920×1080 or 2560×1440
- **Format:** PNG (preferred) or JPG
- **Location:** `public/images/help/`
- **Browser:** Chrome or Edge (latest version)

---

## Screenshot Requirements

### Resolution and Quality

- **Minimum:** 1920×1080 pixels
- **Recommended:** 2560×1440 pixels for retina displays
- **Format:** PNG for UI elements (better quality), JPG for photos
- **Color Mode:** RGB
- **File Size:** Keep under 500KB per image (compress if needed)

### Browser Setup

1. **Use Chrome or Microsoft Edge** (latest version)
2. **Maximize the browser window** to full screen
3. **Hide bookmarks bar** (Ctrl+Shift+B)
4. **Use Incognito/Private mode** for clean interface
5. **Zoom level:** 100% (Ctrl+0)
6. **Theme:** Capture both light and dark mode where applicable

### Screenshot Tools

**Recommended Tools:**
- **Windows:** Snipping Tool (Win+Shift+S), Greenshot, ShareX
- **Mac:** Command+Shift+4, Skitch, CleanShot X
- **Cross-platform:** Flameshot, Lightshot
- **For annotations:** Snagit (premium), Microsoft Whiteboard

### Annotation Guidelines

Add annotations to highlight important elements:

**Annotation Types:**
1. **Numbered Circles:** For step-by-step processes (1, 2, 3...)
2. **Arrows:** Point to specific buttons or fields
3. **Highlight Boxes:** Outline important sections in red or yellow
4. **Text Labels:** Add brief explanatory text when needed

**Annotation Style:**
- Use **bright colors** that contrast with the UI (red, yellow, orange)
- Keep annotations **minimal** - don't overcrowd
- Use **consistent sizing** for similar elements
- Place text **outside** the UI elements when possible

---

## Screenshot Locations

All screenshots should be placed in: `public/images/help/{category}/{subcategory}/`

### Directory Structure

```
public/images/help/
├── getting-started/
│   ├── dashboard-overview.png
│   ├── sidebar-navigation.png
│   ├── user-menu.png
│   └── help-center.png
│
├── fleet/trucks/
│   ├── sidebar-navigation.png
│   ├── index-add-button.png
│   ├── form-basic-info.png
│   ├── form-vehicle-type.png
│   ├── form-engine-chassis.png
│   ├── form-cargo-capacity.png
│   ├── form-photo-upload.png
│   ├── form-registration.png
│   ├── form-status.png
│   ├── form-submit-buttons.png
│   └── detail-page.png
│
├── operations/
│   ├── sidebar-operations.png
│   ├── index-create-button.png
│   ├── form-customer.png
│   ├── form-origin-destination.png
│   ├── form-driver-truck.png
│   ├── form-cargo-type.png
│   ├── form-cargo-details.png
│   ├── form-freight-rate.png
│   ├── form-expenses.png
│   ├── form-dates.png
│   ├── form-summary.png
│   ├── form-submit.png
│   └── detail-page.png
│
├── reports/
│   ├── sidebar-reports.png
│   ├── filter-button.png
│   ├── filter-modal.png
│   ├── date-range-filter.png
│   ├── multi-select-filter.png
│   ├── combined-filters.png
│   ├── active-filters.png
│   └── export-button.png
│
└── admin/users/
    ├── sidebar-users.png
    ├── index-create-button.png
    ├── form-basic-info.png
    ├── form-password.png
    ├── form-role.png
    ├── edit-form.png
    ├── password-reset.png
    ├── delete-warning.png
    └── activity-logs.png
```

---

## Screenshot Checklist by Article

### 1. Welcome Guide (Getting Started)
- [ ] `dashboard-overview.png` - Full dashboard view with KPI cards and charts
- [ ] `sidebar-navigation.png` - Sidebar with all menu items visible
- [ ] `user-menu.png` - User dropdown showing Profile, Settings, Logout
- [ ] `help-center.png` - Help center homepage
- [ ] `notification-bell.png` - Notification dropdown

### 2. Adding Trucks (Fleet Management)
- [ ] `fleet/trucks/sidebar-navigation.png` - Sidebar with Fleet Management expanded
- [ ] `fleet/trucks/index-add-button.png` - Trucks list with Add button highlighted
- [ ] `fleet/trucks/form-basic-info.png` - Plate number, make, model, year fields
- [ ] `fleet/trucks/form-vehicle-type.png` - Vehicle type dropdown opened
- [ ] `fleet/trucks/form-engine-chassis.png` - Engine and chassis number fields
- [ ] `fleet/trucks/form-cargo-capacity.png` - Capacity and dimension fields
- [ ] `fleet/trucks/form-photo-upload.png` - File upload area
- [ ] `fleet/trucks/form-registration.png` - Registration details with date pickers
- [ ] `fleet/trucks/form-status.png` - Status dropdown with options
- [ ] `fleet/trucks/form-submit-buttons.png` - Cancel and Create Truck buttons
- [ ] `fleet/trucks/detail-page.png` - Truck detail page after creation

### 3. Creating Operations
- [ ] `operations/sidebar-operations.png` - Sidebar with Operations highlighted
- [ ] `operations/index-create-button.png` - Operations list with Create button
- [ ] `operations/form-customer.png` - Customer dropdown
- [ ] `operations/form-origin-destination.png` - Origin and destination selects
- [ ] `operations/form-driver-truck.png` - Driver-truck assignment dropdown
- [ ] `operations/form-cargo-type.png` - Cargo type dropdown
- [ ] `operations/form-cargo-details.png` - Quantity and weight fields
- [ ] `operations/form-freight-rate.png` - Freight rate calculator
- [ ] `operations/form-expenses.png` - Expenses table
- [ ] `operations/form-dates.png` - Date pickers for start and completion
- [ ] `operations/form-summary.png` - Summary panel with calculations
- [ ] `operations/form-submit.png` - Submit button area
- [ ] `operations/detail-page.png` - Operation detail page

### 4. Using Report Filters
- [ ] `reports/sidebar-reports.png` - Reports menu
- [ ] `reports/filter-button.png` - Report page with Filter button highlighted
- [ ] `reports/filter-modal.png` - Complete filter dialog opened
- [ ] `reports/date-range-filter.png` - Date picker with presets
- [ ] `reports/multi-select-filter.png` - Checkbox list for trucks/drivers
- [ ] `reports/combined-filters.png` - Multiple filters applied
- [ ] `reports/active-filters.png` - Report page showing active filter badges
- [ ] `reports/export-button.png` - Export dropdown with format options

### 5. Managing Users (Administration)
- [ ] `admin/users/sidebar-users.png` - Administration menu expanded
- [ ] `admin/users/index-create-button.png` - Users list
- [ ] `admin/users/form-basic-info.png` - Name and email fields
- [ ] `admin/users/form-password.png` - Password fields with strength indicator
- [ ] `admin/users/form-role.png` - Role dropdown with descriptions
- [ ] `admin/users/edit-form.png` - Edit user form
- [ ] `admin/users/password-reset.png` - Reset password dialog
- [ ] `admin/users/delete-warning.png` - Delete confirmation dialog
- [ ] `admin/users/activity-logs.png` - Activity logs page

---

## Step-by-Step Screenshot Process

### For Each Screenshot:

1. **Navigate to the Page**
   - Log in with appropriate permissions
   - Navigate to the exact page/feature being documented
   - Ensure all data is loaded

2. **Prepare the View**
   - Close unnecessary popups or notifications
   - Use sample data (not real customer data)
   - Ensure proper zoom level (100%)
   - Check that all UI elements are visible

3. **Capture the Screenshot**
   - Use full window capture or selective area
   - Include enough context (e.g., show the sidebar for orientation)
   - Don't crop too tightly - leave some padding

4. **Add Annotations (if needed)**
   - Refer to the article's `ScreenshotPlaceholder` component for specific annotations
   - Follow the annotation guidelines above
   - Keep it simple and clear

5. **Optimize the Image**
   - Compress to reduce file size (use TinyPNG, ImageOptim, or similar)
   - Target: Under 500KB per image
   - Verify quality isn't degraded too much

6. **Save with Correct Filename**
   - Use exact filename from placeholder (e.g., `form-basic-info.png`)
   - Use lowercase and hyphens, not spaces
   - Save to correct directory path

7. **Test in Application**
   - Refresh the help article page
   - Verify the screenshot appears correctly
   - Check it's clear and readable
   - Ensure annotations are visible

---

## Sample Data Guidelines

When capturing screenshots, use **realistic but generic** sample data:

### Good Examples:
- **Trucks:** Plate: "AA-12345", Make: "Volvo", Model: "FH16"
- **Drivers:** Name: "John Smith", License: "DL123456"
- **Operations:** Route: "Addis Ababa → Dire Dawa", Freight: 15,000 Birr
- **Customers:** "ABC Transport Ltd.", "XYZ Logistics"

### Avoid:
- Real customer names or sensitive data
- Real phone numbers or email addresses
- Actual license plates or registration numbers
- Profanity or inappropriate content
- Lorem ipsum or obviously fake data

---

## Common Screenshot Scenarios

### Dropdown Menus
- Capture with dropdown **expanded** showing all options
- Ensure the selected item is visible
- Show enough items to illustrate the options available

### Forms
- Show **partially filled forms** demonstrating proper input
- Include any validation indicators (green checkmarks, red errors)
- Capture both empty state and filled state if both are useful

### Data Tables
- Show **at least 5-10 rows** of data for context
- Include column headers clearly
- Show any sorting/filtering indicators

### Modal Dialogs
- Capture the dialog AND the dimmed background behind it
- Ensure the entire dialog fits in the screenshot
- Show any action buttons at the bottom

### Error Messages
- Capture validation errors in red
- Show the error message clearly
- Include the field that has the error

### Success States
- Capture success toasts/notifications
- Show green checkmarks or success indicators
- Include any confirmation messages

---

## Quality Checklist

Before finalizing a screenshot, verify:

- [ ] **Resolution:** At least 1920×1080
- [ ] **Focus:** UI elements are sharp and readable
- [ ] **Context:** Enough surrounding UI visible for orientation
- [ ] **Annotations:** Clear, not obstructing important UI
- [ ] **File Size:** Under 500KB (compressed)
- [ ] **Filename:** Matches the placeholder exactly
- [ ] **Location:** Saved in correct directory
- [ ] **Content:** No sensitive/private data visible
- [ ] **Theme:** Consistent with documentation (light mode preferred)
- [ ] **Zoom:** UI appears normal size, not zoomed in/out

---

## Tools and Resources

### Screenshot Tools
- **Snipping Tool (Windows built-in):** Win+Shift+S
- **Greenshot (Free):** https://getgreenshot.org/
- **ShareX (Free):** https://getsharex.com/
- **Lightshot (Free):** https://app.prntscr.com/
- **Snagit (Paid):** https://www.techsmith.com/screen-capture.html

### Image Compression
- **TinyPNG:** https://tinypng.com/
- **ImageOptim (Mac):** https://imageoptim.com/
- **Squoosh (Web):** https://squoosh.app/

### Annotation Tools
- **Paint 3D (Windows):** Built-in
- **Preview (Mac):** Built-in
- **Skitch (Free):** https://evernote.com/products/skitch
- **GIMP (Free):** https://www.gimp.org/

---

## Frequently Asked Questions

### Q: Do I need to capture every single placeholder?
**A:** Not necessarily. Start with the most important articles (Getting Started, Adding Trucks, Creating Operations). You can add more screenshots over time.

### Q: What if the UI changes after I take screenshots?
**A:** Screenshots can be updated anytime. Just replace the file in `public/images/help/` with the same filename.

### Q: Can I use different dimensions for different screenshots?
**A:** Yes, but try to be consistent. Most screenshots should be similar dimensions for a cohesive look.

### Q: Should I include the browser chrome (tabs, URL bar)?
**A:** No, capture only the application UI within the browser window.

### Q: What about mobile screenshots?
**A:** The current help system focuses on desktop. Mobile can be added later if needed.

### Q: Can I hire someone to do the screenshots?
**A:** Yes! Provide them with this guide, sample account access, and the list of required screenshots.

---

## Progress Tracking

Create a checklist to track your progress:

```markdown
## Screenshot Progress

### Getting Started (5 screenshots)
- [ ] dashboard-overview.png
- [ ] sidebar-navigation.png
- [ ] user-menu.png
- [ ] help-center.png
- [ ] notification-bell.png

### Fleet Management - Trucks (11 screenshots)
- [ ] sidebar-navigation.png
- [ ] index-add-button.png
... (continue for all)

### Operations (13 screenshots)
- [ ] ...

### Reports (8 screenshots)
- [ ] ...

### Administration - Users (9 screenshots)
- [ ] ...

**Total Progress:** 0 / 50 screenshots completed
```

---

## Need Help?

If you have questions about which screenshots to capture or how to capture them:

1. Check the article's `ScreenshotPlaceholder` component - it describes what should be shown
2. Look at the `description` and `annotations` props for specific details
3. Refer to the `fileName` prop for the exact filename and path

The placeholder components are designed to be self-documenting!

---

## Conclusion

Taking screenshots systematically will complete your help documentation and provide users with visual guidance. Start with the most critical workflows and expand from there. Quality is more important than quantity - clear, annotated screenshots are far more valuable than blurry or confusing ones.

**Good luck with your screenshot project!** 📸

