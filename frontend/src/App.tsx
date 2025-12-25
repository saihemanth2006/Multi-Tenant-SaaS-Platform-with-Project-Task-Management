import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Register } from './pages/Register';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ProjectsList } from './pages/ProjectsList';
import { ProjectDetails } from './pages/ProjectDetails';
import UsersList from './pages/UsersList';
import './styles/globals.css';

// Layout wrapper for protected routes
const ProtectedLayout = () => (
  <Layout>
    <Outlet />
  </Layout>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected Routes with Layout */}
          <Route
            element={
              <ProtectedRoute>
                <ProtectedLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/:projectId" element={<ProjectDetails />} />
            <Route path="/users" element={<UsersList />} />
            <Route path="/tenants" element={<div className="p-8 text-center">Tenants (Super Admin Only)</div>} />
            <Route path="/profile" element={<div className="p-8 text-center">Profile (Coming in Step 4.4)</div>} />
            <Route path="/settings" element={<div className="p-8 text-center">Settings (Coming in Step 4.4)</div>} />
          </Route>

          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
