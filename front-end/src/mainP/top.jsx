import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function TopNavigation() {
    const [activeTab, setActiveTab] = useState("main");
    const [isScrolled, setIsScrolled] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignInModal, setShowSignInModal] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [signInData, setSignInData] = useState({ 
        username: "", 
        email: "", 
        password: "", 
        confirmPassword: "" 
    });
    
    const navigate = useNavigate();

    // Check if user is logged in on component mount
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUserData(JSON.parse(storedUser));
            setIsLoggedIn(true);
        }
    }, []);

    // Handle scroll effect
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle Login
    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:8080/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(loginData)
            });

            if (response.ok) {
                const data = await response.json();
                alert("Login successful!");
                console.log("Login response:", data);
                
                // Store user data and token properly
                const user = { username: data.username, email: data.email };
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('email', data.email);
                
                setUserData(user);
                setIsLoggedIn(true);
                setShowLoginModal(false);
                setLoginData({ email: "", password: "" });
            } else {
                const errorData = await response.json();
                alert(errorData.detail || "Login failed. Please check your credentials.");
            }
        } catch (error) {
            console.error("Login error:", error);
            alert("Error during login");
        }
    };

    // Handle Sign In (Registration)
    const handleSignIn = async (e) => {
        e.preventDefault();
        
        if (signInData.password !== signInData.confirmPassword) {
            alert("Passwords do not match!");
            return;
        }

        try {
            const response = await fetch("http://localhost:8080/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    username: signInData.username,
                    email: signInData.email,
                    password: signInData.password
                })
            });

            if (response.ok) {
                const data = await response.json();
                alert("Registration successful!");
                console.log("Registration response:", data);
                
                // Store user data and token properly
                const user = { username: data.username, email: data.email };
                localStorage.setItem('user', JSON.stringify(user));
                localStorage.setItem('token', data.access_token);
                localStorage.setItem('username', data.username);
                localStorage.setItem('email', data.email);
                
                setUserData(user);
                setIsLoggedIn(true);
                setShowSignInModal(false);
                setSignInData({ username: "", email: "", password: "", confirmPassword: "" });
            } else {
                const errorData = await response.json();
                alert(errorData.detail || "Registration failed. Please try again.");
            }
        } catch (error) {
            console.error("Registration error:", error);
            alert("Error during registration");
        }
    };

    // Handle Logout
    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        localStorage.removeItem('email');
        setUserData(null);
        setIsLoggedIn(false);
        setShowProfileMenu(false);
        navigate('/');
    };

    const navItems = [
        { id: "main", label: "Main", path: "/" },
        { id: "about", label: "About", path: "/about" },
        { id: "contact", label: "Contact", path: "/contact" },
    ];

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled 
                ? 'bg-slate-900/95 backdrop-blur-lg shadow-xl' 
                : 'bg-slate-900/80 backdrop-blur-sm'
        }`}>
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xl">M</span>
                        </div>
                        <span className="text-2xl font-bold text-white">
                            MatchRide
                        </span>
                    </div>

                    {/* Navigation Links */}
                    <div className="hidden md:flex items-center gap-8">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={`text-base font-medium transition-all duration-200 relative ${
                                    activeTab === item.id
                                        ? 'text-white'
                                        : 'text-gray-300 hover:text-white'
                                }`}
                            >
                                {item.label}
                                {activeTab === item.id && (
                                    <span className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"></span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Auth Buttons / Profile */}
                    <div className="flex items-center gap-2 md:gap-4">
                        {isLoggedIn ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                                    className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 transition-all duration-200"
                                >
                                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                        <span className="text-purple-600 font-bold text-sm">
                                            {userData?.username?.charAt(0).toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <span className="text-white font-medium text-sm md:text-base hidden sm:inline">
                                        {userData?.username || 'User'}
                                    </span>
                                </button>

                                {/* Profile Dropdown */}
                                {showProfileMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl py-2 z-[60]">
                                        <div className="px-4 py-2 border-b border-gray-200">
                                            <p className="text-sm font-semibold text-gray-700">{userData?.username}</p>
                                            <p className="text-xs text-gray-500">{userData?.email}</p>
                                        </div>
                                        <Link
                                            to="/profile"
                                            onClick={() => setShowProfileMenu(false)}
                                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            My Profile
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setShowProfileMenu(false);
                                                // Add bookings view logic
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            My Bookings
                                        </button>
                                        <button
                                            onClick={handleLogout}
                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-200"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <button 
                                    onClick={() => setShowSignInModal(true)}
                                    className="text-white font-medium px-3 md:px-5 py-2 rounded-lg hover:bg-white/10 transition-all duration-200 text-sm md:text-base"
                                >
                                    Sign In
                                </button>
                                <button 
                                    onClick={() => setShowLoginModal(true)}
                                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold px-4 md:px-6 py-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 text-sm md:text-base"
                                >
                                    Login
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] p-4 overflow-y-auto flex items-center justify-center min-h-screen" onClick={() => setShowLoginModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full my-8" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Login</h2>
                                <button
                                    onClick={() => setShowLoginModal(false)}
                                    className="text-white hover:text-gray-200 text-3xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleLogin} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your email"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Password
                                </label>
                                <input
                                    type="password"
                                    value={loginData.password}
                                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                                    required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="Enter your password"
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowLoginModal(false)}
                                    className="w-full sm:flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all"
                                >
                                    Login
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative flex items-center py-4">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            {/* Google Auth Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    console.log("Google login clicked");
                                    // Add your Google OAuth logic here
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
                        </form>
                    </div>
                </div>
            )}

            {/* Sign In (Registration) Modal */}
            {showSignInModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] p-4 overflow-y-auto flex items-center justify-center min-h-screen" onClick={() => setShowSignInModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full my-8" onClick={(e) => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 rounded-t-2xl">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-bold text-white">Sign In</h2>
                                <button
                                    onClick={() => setShowSignInModal(false)}
                                    className="text-white hover:text-gray-200 text-3xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSignIn} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        value={signInData.username}
                                        onChange={(e) => setSignInData({...signInData, username: e.target.value})}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Choose a username"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        value={signInData.email}
                                        onChange={(e) => setSignInData({...signInData, email: e.target.value})}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Enter your email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        value={signInData.password}
                                        onChange={(e) => setSignInData({...signInData, password: e.target.value})}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Create a password"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        value={signInData.confirmPassword}
                                        onChange={(e) => setSignInData({...signInData, confirmPassword: e.target.value})}
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Confirm your password"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowSignInModal(false)}
                                    className="w-full sm:flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="w-full sm:flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg font-semibold shadow-lg transition-all"
                                >
                                    Sign In
                                </button>
                            </div>

                            {/* Divider */}
                            <div className="relative flex items-center py-4">
                                <div className="flex-grow border-t border-gray-300"></div>
                                <span className="flex-shrink mx-4 text-gray-500 text-sm">or</span>
                                <div className="flex-grow border-t border-gray-300"></div>
                            </div>

                            {/* Google Auth Button */}
                            <button
                                type="button"
                                onClick={() => {
                                    console.log("Google sign in clicked");
                                    // Add your Google OAuth logic here
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
                        </form>
                    </div>
                </div>
            )}
        </nav>
    );
}
