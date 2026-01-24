# How to Link Driver to User Account - Step by Step Guide

## Quick Steps Summary

1. **Navigate to Drivers** → `/drivers`
2. **Click on a Driver** → View details
3. **Click "Edit"** button
4. **Find "Link User Account"** dropdown
5. **Select a User** from the list
6. **Click "Save"**

---

## Detailed Instructions

### Step 1: Access Drivers Page
- URL: `http://localhost:8000/drivers`
- Or click "Drivers" in the sidebar navigation

### Step 2: Select a Driver
- Click on any driver name/row in the list
- This opens the driver detail page

### Step 3: Edit the Driver
- Click the **"Edit"** button (pencil icon) in the top right
- URL will change to: `/drivers/{id}/edit`

### Step 4: Locate User Link Field
- Scroll down to the **"General Information"** section
- After the **"Status"** field, you'll see:
  - **Label:** "Link User Account"
  - **Tooltip:** "Select a user account to link to this driver. This allows the user to access the mobile app as a driver."
  - **Dropdown:** Shows available users

### Step 5: Select a User
- Click the dropdown
- You'll see:
  - **"None (No user linked)"** - To unlink or leave unlinked
  - **List of users** - Format: `Name (email@example.com)`
- Select the user you want to link

### Step 6: Save Changes
- Scroll to bottom of form
- Click **"Save"** or **"Update Driver"** button
- You'll see a success message

### Step 7: Verify Link
- After saving, you'll be redirected to drivers list
- Click the driver again to view details
- In the **"Basic Information"** section, you should see:
  - ✅ **Blue box** with "Linked User Account" if linked
  - ❌ **Gray box** with "No user account linked" if not linked

---

## Alternative: Create New Driver with User Link

### Step 1: Go to Create Page
- URL: `http://localhost:8000/drivers/create`
- Or click "Create Driver" button

### Step 2: Fill Required Fields
- Driver ID (required)
- Name (required)
- Gender (required)
- Status (required)

### Step 3: Link User (Optional)
- Find "Link User Account" dropdown
- Select user from list
- Or leave as "None" to create without link

### Step 4: Save
- Fill other optional fields if needed
- Click "Save" or "Create Driver"

---

## Important Notes

⚠️ **User Can Only Link to One Driver**
- Each user can only be linked to ONE driver
- If you try to link a user already linked to another driver, you'll get an error

⚠️ **Available Users**
- Only users NOT already linked to a driver will appear in the dropdown
- Users already linked will not show in the list

✅ **You Can Change Links**
- Edit the driver anytime to change the linked user
- Set to "None" to unlink the user

✅ **Users Without Links Can Still Exist**
- Drivers can exist without linked users
- Users can exist without linked drivers

---

## Visual Guide

### Edit Form Layout:
```
┌─────────────────────────────────────┐
│ General Information                 │
├─────────────────────────────────────┤
│ Driver ID        [DRV001]           │
│ Name             [John Driver]      │
│ Gender           [Male ▼]           │
│ Status           [Active ▼]         │
│ Link User Account [Select User ▼]   │ ← HERE!
└─────────────────────────────────────┘
```

### Detail Page (After Linking):
```
┌─────────────────────────────────────┐
│ Basic Information                   │
├─────────────────────────────────────┤
│ ... other fields ...                │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ ✓ Linked User Account         │   │
│ │ John Driver                   │   │
│ │ driver1@test.com              │   │
│ │ This driver can access the    │   │
│ │ mobile app using this account.│   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

---

## Troubleshooting

### Problem: "Link User Account" field not showing
**Solution:**
- Make sure you're on the Edit page (`/drivers/{id}/edit`)
- Check if there are any users available (if all users are linked, field might not show)
- Refresh the page

### Problem: User I want is not in the dropdown
**Solution:**
- That user is probably already linked to another driver
- Check other drivers or unlink the user first
- Create a new user if needed

### Problem: Getting "user_id.unique" error
**Solution:**
- The user you selected is already linked to another driver
- Select a different user or unlink from the other driver first

### Problem: Changes not saving
**Solution:**
- Check if you have permission to edit drivers
- Make sure you clicked "Save" button
- Check browser console for errors

---

## Test After Linking

### 1. Check in Web App
- View driver detail page
- Should show linked user info

### 2. Test Mobile App Login
- Open mobile app
- Login with the linked user's email
- Should see driver dashboard (if truck assigned)

### 3. Test API
```bash
# Login with linked user
POST /api/login
{
  "email": "driver1@test.com",
  "password": "password123"
}

# Get truck assignment
GET /api/driver/truck
Authorization: Bearer {token}
```

---

## Quick Reference URLs

- **Drivers List:** `/drivers`
- **Create Driver:** `/drivers/create`
- **View Driver:** `/drivers/{id}`
- **Edit Driver:** `/drivers/{id}/edit`

---

## Need Help?

If you encounter issues:
1. Check browser console for errors (F12)
2. Verify user exists: `/users`
3. Verify driver exists: `/drivers`
4. Check Laravel logs: `storage/logs/laravel.log`
5. Run: `php artisan tinker` to check database directly

