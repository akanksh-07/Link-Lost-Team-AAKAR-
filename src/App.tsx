import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { AppLayout } from './layouts/AppLayout.tsx';
import { AdminLayout } from './layouts/AdminLayout.tsx';
import { ProtectedRoute } from './components/ProtectedRoute.tsx';
import { AdminRoute } from './components/AdminRoute.tsx';

// Pages
import { BrowseItems } from './pages/BrowseItems.tsx';
import { ItemDetails } from './pages/ItemDetails.tsx';
import { FoundItemForm } from './pages/FoundItemForm.tsx';
import { LostReportForm } from './pages/LostReportForm.tsx';
import { Dashboard } from './pages/Dashboard.tsx';
import { Claims } from './pages/Claims.tsx';
import { AdminDashboard } from './pages/AdminDashboard.tsx';
import { Login } from './pages/Login.tsx';
import { Register } from './pages/Register.tsx';
import { NotFound } from './pages/NotFound.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Main Student & Public Portal */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/items" replace />} />
            <Route path="/items" element={<BrowseItems />} />
            <Route path="/items/:id" element={<ItemDetails />} />

            {/* Protected Student Routes */}
            <Route
              path="/report-found"
              element={
                <ProtectedRoute>
                  <FoundItemForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-lost"
              element={
                <ProtectedRoute>
                  <LostReportForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/claims"
              element={
                <ProtectedRoute>
                  <Claims />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Auth Pages */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* 404 inside layout */}
            <Route path="*" element={<NotFound />} />
          </Route>

          {/* Admin Dedicated Console */}
          <Route
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
