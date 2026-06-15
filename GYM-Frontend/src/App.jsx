import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AuthListener from "./components/AuthListener";
import ProtectedRoute from "./components/ProtectedRoute";
import RootRedirect from "./components/RootRedirect";
import Layout from "./layout/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Members from "./pages/Members";
import Memberships from "./pages/Memberships";
import Payments from "./pages/Payments";
import Attendance from "./pages/Attendance";
import Workouts from "./pages/Workouts";
import Progress from "./pages/Progress";
import Notifications from "./pages/Notifications";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthListener />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RootRedirect />} />

          <Route path="/dashboard" element={<RootRedirect />} />
          <Route path="/members" element={<RootRedirect />} />
          <Route path="/memberships" element={<RootRedirect />} />
          <Route path="/payments" element={<RootRedirect />} />
          <Route path="/attendance" element={<RootRedirect />} />
          <Route path="/workouts" element={<RootRedirect />} />
          <Route path="/progress" element={<RootRedirect />} />
          <Route path="/notifications" element={<RootRedirect />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <Layout portal="admin" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="members" element={<Members />} />
            <Route path="memberships" element={<Memberships />} />
            <Route path="payments" element={<Payments />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="workouts" element={<Workouts />} />
            <Route path="progress" element={<Progress />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          <Route
            path="/member"
            element={
              <ProtectedRoute allowedRoles={["member"]}>
                <Layout portal="member" />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="workouts" element={<Workouts />} />
            <Route path="progress" element={<Progress />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>

          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
