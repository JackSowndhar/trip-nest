import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import MyTrips from './pages/MyTrips';
import TripOverView from './pages/TripOverView';
import Itinerary from './pages/Itinerary';
import Budget from './pages/Budget';
import Members from './pages/Members';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/Appshell';
import './index.css';

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route
              path="/"
              element={
                <AppLayout>
                  <LandingPage />
                </AppLayout>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Dashboard />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <MyTrips />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <TripOverView />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId/itinerary"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Itinerary />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId/budget"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Budget />
                  </AppShell>
                </ProtectedRoute>
              }
            />
            <Route
              path="/trips/:tripId/members"
              element={
                <ProtectedRoute>
                  <AppShell>
                    <Members />
                  </AppShell>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
