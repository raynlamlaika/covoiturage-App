# Frontend Integration Guide

## Google OAuth Button Implementation

### 1. Update Your Button Click Handler

Replace your button's `onClick` handler with this:

```jsx
<button
    type="button"
    onClick={() => {
        console.log("Google login clicked");
        // Redirect to backend OAuth endpoint
        window.location.href = "http://localhost:8080/api/auth/google/login";
    }}
    className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition-all"
>
    <svg className="w-5 h-5" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
    Continue with Google
</button>
```

### 2. Create OAuth Callback Page

Create a new route/page at `/auth/callback` to handle the OAuth redirect:

```jsx
// src/pages/AuthCallback.jsx (or similar)
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function AuthCallback() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        const username = searchParams.get('username');
        const email = searchParams.get('email');
        const error = searchParams.get('error');

        if (error) {
            console.error('OAuth error:', error);
            // Show error message
            alert('Login failed: ' + error);
            navigate('/login');
            return;
        }

        if (token) {
            // Store token in localStorage or your state management
            localStorage.setItem('authToken', token);
            localStorage.setItem('username', username);
            localStorage.setItem('email', email);
            
            console.log('Login successful!', { username, email });
            
            // Redirect to dashboard or home
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                <p className="mt-4 text-gray-600">Completing login...</p>
            </div>
        </div>
    );
}
```

### 3. Add Route to Your Router

```jsx
// In your main App.jsx or router configuration
import AuthCallback from './pages/AuthCallback';

// Add this route
<Route path="/auth/callback" element={<AuthCallback />} />
```

### 4. Using the Token for API Requests

After login, use the stored token for authenticated requests:

```jsx
// Example API call with authentication
const fetchUserData = async () => {
    const token = localStorage.getItem('authToken');
    
    const response = await fetch('http://localhost:8080/api/auth/profile', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    
    const data = await response.json();
    return data;
};
```

### 5. Full Example with Context/State Management

```jsx
// AuthContext.jsx
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is already logged in
        const token = localStorage.getItem('authToken');
        const username = localStorage.getItem('username');
        const email = localStorage.getItem('email');

        if (token) {
            setUser({ token, username, email });
        }
        setLoading(false);
    }, []);

    const login = (token, username, email) => {
        localStorage.setItem('authToken', token);
        localStorage.setItem('username', username);
        localStorage.setItem('email', email);
        setUser({ token, username, email });
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
```

## OAuth Flow

1. User clicks "Continue with Google" button
2. Frontend redirects to: `http://localhost:8080/api/auth/google/login`
3. Backend redirects user to Google's login page
4. User logs in with Google
5. Google redirects back to: `http://localhost:8080/api/auth/google/callback`
6. Backend creates JWT token and redirects to: `http://localhost:5173/auth/callback?token=xxx&username=xxx&email=xxx`
7. Frontend callback page extracts token from URL and stores it
8. User is logged in and redirected to dashboard

## Environment Variables

Make sure your backend `.env` has:
```env
GOOGLE_CLIENT_ID=your-actual-google-client-id
GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:8080/api/auth/google/callback
FRONTEND_URL=http://localhost:5173
```

## Testing

1. Get Google OAuth credentials from https://console.cloud.google.com/
2. Add to `.env` file
3. Restart backend: `pkill -f "python main.py" && cd /home/lamlaika/covoi/back-end && nohup .venv/bin/python main.py > server.log 2>&1 &`
4. Click the Google button in your frontend
5. You should be redirected through Google and back to your app with a token

## Security Notes

- Never expose tokens in URLs in production (use HTTP-only cookies instead)
- Always use HTTPS in production
- Store tokens securely (consider using HTTP-only cookies)
- Implement token refresh mechanism for long sessions
