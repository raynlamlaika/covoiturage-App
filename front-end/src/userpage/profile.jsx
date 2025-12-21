import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [editData, setEditData] = useState({
    username: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [deletePassword, setDeletePassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [updateLoading, setUpdateLoading] = useState(false);

  const fetchUserProfile = React.useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please login.');
        setLoading(false);
        setTimeout(() => navigate('/'), 2000);
        return;
      }

      const response = await fetch('http://localhost:8080/api/auth/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.clear();
          setError('Session expired. Please login again.');
          setTimeout(() => navigate('/'), 2000);
        } else {
          const errorData = await response.json();
          setError(errorData.detail || 'Failed to fetch profile');
        }
        setLoading(false);
        return;
      }

      const data = await response.json();
      setUser(data);
      setEditData({
        username: data.username,
        email: data.email
      });
      setError(null);
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('email');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (user) {
      setEditData({
        username: user.username,
        email: user.email
      });
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateProfile = async () => {
    try {
      setUpdateLoading(true);
      setError(null);
      setSuccessMessage('');

      const token = localStorage.getItem('token');
      const updatePayload = {};

      if (editData.username !== user.username) {
        updatePayload.username = editData.username;
      }
      if (editData.email !== user.email) {
        updatePayload.email = editData.email;
      }

      const response = await fetch('http://localhost:8080/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatePayload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update profile');
      }

      const data = await response.json();
      setUser(data);
      setSuccessMessage('Profile updated successfully!');
      setIsEditing(false);
      
      // Update local storage
      localStorage.setItem('username', data.username);
      localStorage.setItem('email', data.email);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      setUpdateLoading(true);
      setError(null);
      setSuccessMessage('');

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match');
        setUpdateLoading(false);
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setError('Password must be at least 6 characters long');
        setUpdateLoading(false);
        return;
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: passwordData.currentPassword,
          new_password: passwordData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update password');
      }

      setSuccessMessage('Password updated successfully!');
      setShowPasswordChange(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setUpdateLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/auth/account?password=${encodeURIComponent(deletePassword)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete account');
      }

      // Clear all user data and redirect to home
      localStorage.clear();
      navigate('/');
    } catch (err) {
      setError(err.message);
      setUpdateLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-8 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-700 text-lg font-semibold">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-8 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h2 className="text-red-600 text-2xl font-bold mb-4">⚠️ Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/')} 
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-8 flex justify-center items-center">
        <div className="bg-white rounded-2xl shadow-2xl p-12 text-center">
          <h2 className="text-gray-800 text-2xl font-bold mb-4">No User Data</h2>
          <p className="text-gray-700 mb-6">Unable to load profile information.</p>
          <button 
            onClick={fetchUserProfile} 
            className="bg-gradient-to-r from-purple-600 to-purple-800 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-900 p-4 md:p-8 flex justify-center items-center">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 md:p-12 animate-[slideUp_0.5s_ease-out] relative">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-4 left-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
        >
          <svg 
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          <span className="font-medium">Back</span>
        </button>
        
        {/* Profile Header */}
        <div className="text-center mb-8 pb-8 border-b-2 border-gray-200">
          <div className="w-28 h-28 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 mx-auto mb-6 flex items-center justify-center shadow-lg">
            <span className="text-5xl md:text-6xl font-bold text-white">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">User Profile</h1>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-100 border-2 border-green-500 text-green-800 px-4 py-3 rounded-lg mb-6 font-semibold text-center animate-[slideDown_0.3s_ease-out]">
            ✓ {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-6 font-semibold text-center animate-[slideDown_0.3s_ease-out]">
            ⚠ {error}
          </div>
        )}

        {/* Profile Content */}
        <div className="mb-8">
          {!isEditing && !showPasswordChange ? (
            <>
              {/* View Mode */}
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Username</label>
                  <div className="flex items-center text-lg text-gray-800 bg-gray-50 px-4 py-3 rounded-lg border-2 border-gray-200">
                    <span className="mr-3 text-xl">👤</span>
                    {user.username}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Email</label>
                  <div className="flex items-center text-lg text-gray-800 bg-gray-50 px-4 py-3 rounded-lg border-2 border-gray-200">
                    <span className="mr-3 text-xl">📧</span>
                    {user.email}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Member Since</label>
                  <div className="flex items-center text-lg text-gray-800 bg-gray-50 px-4 py-3 rounded-lg border-2 border-gray-200">
                    <span className="mr-3 text-xl">📅</span>
                    {formatDate(user.created_at)}
                  </div>
                </div>
              </div>
            </>
          ) : isEditing ? (
            /* Edit Profile Mode */
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Username</label>
                <input
                  type="text"
                  name="username"
                  value={editData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all"
                  placeholder="Enter username"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all"
                  placeholder="Enter email"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button 
                  onClick={handleUpdateProfile} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-3 rounded-lg font-semibold uppercase tracking-wide hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button 
                  onClick={handleEditToggle} 
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold uppercase tracking-wide border-2 border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-50"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            /* Change Password Mode */
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-gray-800 text-center mb-6">Change Password</h3>
              
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Current Password</label>
                <input
                  type="password"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all"
                  placeholder="Enter current password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">New Password</label>
                <input
                  type="password"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all"
                  placeholder="Enter new password"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-purple-600 focus:ring-4 focus:ring-purple-100 transition-all"
                  placeholder="Confirm new password"
                />
              </div>

              <div className="flex gap-4 mt-6">
                <button 
                  onClick={handlePasswordUpdate} 
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-800 text-white px-4 py-3 rounded-lg font-semibold uppercase tracking-wide hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50"
                  disabled={updateLoading}
                >
                  {updateLoading ? 'Updating...' : 'Update Password'}
                </button>
                <button 
                  onClick={() => {
                    setShowPasswordChange(false);
                    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    setError(null);
                  }} 
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold uppercase tracking-wide border-2 border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-50"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {!isEditing && !showPasswordChange && (
          <>
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              <button 
                onClick={handleEditToggle} 
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold uppercase tracking-wide border-2 border-gray-200 hover:bg-gray-200 transition-all"
              >
                Edit Profile
              </button>
              <button 
                onClick={() => setShowPasswordChange(true)} 
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold uppercase tracking-wide border-2 border-gray-200 hover:bg-gray-200 transition-all"
              >
                Change Password
              </button>
              <button 
                onClick={handleLogout} 
                className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold uppercase tracking-wide hover:bg-red-600 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Logout
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 pt-8 border-t-2 border-gray-200">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account Status</span>
                <span className="block text-lg font-bold text-green-600">Active</span>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Account Type</span>
                <span className="block text-lg font-bold text-gray-800">Standard User</span>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-8 border-t-2 border-red-100">
              <h3 className="text-lg font-bold text-red-600 mb-2">Danger Zone</h3>
              <p className="text-gray-500 text-sm mb-4 leading-relaxed">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <button 
                onClick={() => setShowDeleteConfirm(true)} 
                className="w-full bg-white text-red-600 px-4 py-3 rounded-lg font-semibold uppercase tracking-wide border-2 border-red-600 hover:bg-red-600 hover:text-white hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                Delete Account
              </button>
            </div>
          </>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 animate-[fadeIn_0.3s_ease-out] p-4">
            <div className="bg-white rounded-2xl p-8 md:p-10 max-w-md w-full shadow-2xl animate-[scaleUp_0.3s_ease-out]">
              <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">⚠️ Delete Account</h2>
              <p className="text-gray-700 text-center mb-6 leading-relaxed">
                This action cannot be undone. All your data will be permanently deleted.
              </p>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-800 mb-2">Enter your password to confirm</label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-lg focus:outline-none focus:border-red-600 focus:ring-4 focus:ring-red-100 transition-all"
                  placeholder="Password"
                />
              </div>
              {error && (
                <div className="bg-red-100 border-2 border-red-500 text-red-800 px-4 py-3 rounded-lg mb-4 text-sm text-center">
                  {error}
                </div>
              )}
              <div className="flex gap-4">
                <button 
                  onClick={handleDeleteAccount} 
                  className="flex-1 bg-red-500 text-white px-4 py-3 rounded-lg font-semibold uppercase tracking-wide hover:bg-red-600 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={updateLoading || !deletePassword}
                >
                  {updateLoading ? 'Deleting...' : 'Yes, Delete My Account'}
                </button>
                <button 
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeletePassword('');
                    setError(null);
                  }} 
                  className="flex-1 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-semibold uppercase tracking-wide border-2 border-gray-200 hover:bg-gray-200 transition-all disabled:opacity-50"
                  disabled={updateLoading}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}