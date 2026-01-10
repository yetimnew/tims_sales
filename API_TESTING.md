# API Testing Guide

## Login Endpoint Testing

### Endpoint
```
POST http://10.0.2.2:8000/api/login
```

### Request Headers
```
Content-Type: application/json
Accept: application/json
```

### Request Body
```json
{
  "email": "user@example.com",
  "password": "password"
}
```

### Success Response (200)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "name": "User Name",
      "email": "user@example.com"
    },
    "token": "1|abc123token..."
  }
}
```

### Error Response (401)
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Validation Error (422)
```json
{
  "success": false,
  "message": "Validation error",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password field is required."]
  }
}
```

## Testing Methods

### 1. Using Flutter App (Recommended)
The Flutter app will automatically handle the POST request with proper headers.

### 2. Using Postman/Insomnia
- Method: POST
- URL: `http://10.0.2.2:8000/api/login`
- Headers:
  - `Content-Type: application/json`
  - `Accept: application/json`
- Body (raw JSON):
```json
{
  "email": "admin@test.com",
  "password": "password123"
}
```

### 3. Using cURL (Command Line)
```bash
curl -X POST http://10.0.2.2:8000/api/login \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"email":"admin@test.com","password":"password123"}'
```

### 4. Using PowerShell (Windows)
```powershell
$body = @{
    email = "admin@test.com"
    password = "password123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://10.0.2.2:8000/api/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

## Notes

1. **Browser Access**: If you access `http://10.0.2.2:8000/api/login` directly in a browser, you'll see "Referrer Policy: strict-origin-when-cross-origin" because:
   - Browsers make GET requests by default
   - The endpoint requires POST
   - This is normal browser behavior, not an error

2. **CORS**: CORS is configured to allow all origins (`*`) for API routes. The mobile app should work without CORS issues.

3. **Rate Limiting**: Login endpoint has rate limiting (5 requests per minute per IP).

4. **Android Emulator**: Use `http://10.0.2.2:8000/api` (special IP for Android emulator)
5. **iOS Simulator**: Use `http://localhost:8000/api`
6. **Physical Device**: Use `http://YOUR_COMPUTER_IP:8000/api`

## Test Users

Check your database seeders for test user credentials:
- Usually: `admin@test.com` / `password123`
- Or check `database/seeders/` files

