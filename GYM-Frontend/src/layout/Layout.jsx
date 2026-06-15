import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/routes";

const Layout = ({ portal }) => {
  const { token, role, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#F8F9FA]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-[#FF6B00]" />
      </div>
    );
  }

  if (!token || !role) {
    return <Navigate to="/login" replace />;
  }

  if (portal && role !== portal) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} portal={portal} />

      <div className="flex flex-col min-h-screen lg:pl-64">
        <Navbar toggleSidebar={toggleSidebar} portal={portal} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
