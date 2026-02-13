# Postman Testing Guide for TIMS API

## Login Endpoint

### Request Configuration

**Method:** `POST`

**URL:** 
```
http://localhost:8000/api/login
```
Or if testing from a different machine/emulator:
```
http://10.0.2.2:8000/api/login  (Android Emulator)
http://YOUR_COMPUTER_IP:8000/api/login  (Physical Device)
```

### Headers
Add these headers in Postman:

| Key | Value |
|-----|-------|
| `Content-Type` | `application/json` |
| `Accept` | `application/json` |

### Body
Select **Body** tab → **raw** → **JSON**, then paste:

```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

### Expected Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "Admin User",
      "email": "admin@test.com"
    },
    "token": "1|abcdefghijklmnopqrstuvwxyz1234567890"
  }
}
```

### Expected Error Response (401 Unauthorized)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Expected Validation Error (422 Unprocessable Entity)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": [
      "The email field is required."
    ],
    "password": [
      "The password field is required."
    ]
  }
}
```

---

## Other Endpoints

### Logout
**Method:** `POST`  
**URL:** `http://localhost:8000/api/logout`  
**Headers:**
- `Authorization: Bearer {token_from_login}`
- `Accept: application/json`

### Get Profile
**Method:** `GET`  
**URL:** `http://localhost:8000/api/profile`  
**Headers:**
- `Authorization: Bearer {token_from_login}`
- `Accept: application/json`

### Get Driver Profile
**Method:** `GET`  
**URL:** `http://localhost:8000/api/driver/profile`  
**Headers:**
- `Authorization: Bearer {token_from_login}`
- `Accept: application/json`

---

## Quick Setup in Postman

### Step 1: Create New Request
1. Click **New** → **HTTP Request**
2. Name it: "TIMS Login"

### Step 2: Set Method and URL
1. Method: Select **POST** from dropdown
2. URL: Enter `http://localhost:8000/api/login`

### Step 3: Add Headers
1. Click **Headers** tab
2. Add:
   - Key: `Content-Type`, Value: `application/json`
   - Key: `Accept`, Value: `application/json`

### Step 4: Add Body
1. Click **Body** tab
2. Select **raw** radio button
3. Select **JSON** from dropdown (on the right)
4. Paste this JSON:
```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

### Step 5: Send Request
1. Click **Send** button
2. Check the response in the bottom panel

### Step 6: Save Token (for other requests)
1. After successful login, copy the `token` from response
2. For other endpoints, add header:
   - Key: `Authorization`
   - Value: `Bearer {paste_token_here}`

---

## Test Users

Check your database seeders for test user credentials. Common test users:

- `admin@test.com` / `password123`
- `manager@test.com` / `password123`
- `user@test.com` / `password123`

To check your test users, run:
```bash
php artisan tinker
User::all(['id', 'name', 'email']);
```

---

## Troubleshooting

### Error: "Connection refused"
- Make sure Laravel server is running: `php artisan serve`

### Error: "Method not allowed" or "404 Not Found"
- Verify the URL is correct: `http://localhost:8000/api/login`
- Check route exists: `php artisan route:list --path=api/login`

### Error: "CSRF token mismatch" 
- This shouldn't happen for API routes, but if it does, make sure you're using `/api/` prefix

### Error: "Too many requests" (429)
- Rate limiting is active (5 requests per minute)
- Wait 1 minute and try again

### Response shows "Referrer Policy" in browser
- You're accessing the URL directly in browser (GET request)
- Use Postman with POST method instead

---

## Environment Variables in Postman

Create a Postman Environment for easier testing:

**Variables:**
- `base_url`: `http://localhost:8000`
- `api_url`: `{{base_url}}/api`
- `token`: (set after login)

Then use: `{{api_url}}/login` instead of full URL.

