import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Import components
import TopNavigation from './mainP/top';
import Matches from './mainP/matches';
import Makedrive from './mainP/makedrive';
import Profile from './userpage/profile';

// Home page component
function HomePage() {
  return (
    <>
      <TopNavigation />
      <Matches />
      <Makedrive />
    </>
  );
}

// Protected Route component
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // Redirect to home if not authenticated
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Router>
      <Routes>
        {/* Home page with navigation, matches, and makedrive */}
        <Route path="/" element={<HomePage />} />
        
        {/* Profile page - protected route */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
