# Google OAuth Setup Guide

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Go to "APIs & Services" > "Credentials"
4. Click "Create Credentials" > "OAuth client ID"
5. Choose "Web application"
6. Add authorized redirect URIs:
   - `http://localhost:8080/api/auth/google/callback`
   - `http://127.0.0.1:8080/api/auth/google/callback`
7. Copy the Client ID and Client Secret

## Step 2: Configure Environment Variables

Edit the `.env` file and add your credentials:

```
GOOGLE_CLIENT_ID=your-actual-client-id-here
GOOGLE_CLIENT_SECRET=your-actual-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
```

## Step 3: Test Google OAuth

### Start the server:
```bash
python main.py
```

### Test endpoints:

1. **Initiate Google Login:**
   - Visit: `http://localhost:8080/api/auth/google/login`
   - You'll be redirected to Google's login page
   - After login, you'll be redirected back with your access token

2. **Use the token:**
   - Copy the `access_token` from the response
   - Add it to Authorization header: `Bearer YOUR_ACCESS_TOKEN`
   - Test protected endpoint: `http://localhost:8080/api/auth/profile`

## Available Endpoints

### Regular Auth:
- POST `/api/auth/register` - Register with email/password
- POST `/api/auth/login` - Login with email/password

### Google OAuth:
- GET `/api/auth/google/login` - Start Google OAuth flow
- GET `/api/auth/google/callback` - OAuth callback (automatic)

### Protected Endpoints:
- GET `/api/auth/profile` - Get user profile (requires token)
- GET `/api/auth/verify` - Verify token validity
- PUT `/api/auth/profile` - Update profile
- DELETE `/api/auth/account` - Delete account

## Frontend Integration Example

```javascript
// Redirect to Google login
window.location.href = 'http://localhost:8080/api/auth/google/login';

// After callback, store the token
localStorage.setItem('token', response.access_token);

// Use token in API calls
fetch('http://localhost:8080/api/auth/profile', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  }
});
```

## Notes

- OAuth users don't have passwords (hashed_password is null)
- Both OAuth and local auth users share the same token system
- Tokens expire after 30 minutes by default
