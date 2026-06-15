import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, LogOut, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Navbar = ({ toggleSidebar, portal }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes("/dashboard")) return portal === "member" ? "Member Dashboard" : "Admin Dashboard";
    if (path.includes("/memberships")) return "Membership Management";
    if (path.includes("/members")) return "Member Directory";
    if (path.includes("/payments")) return "Billing & Dues";
    if (path.includes("/attendance")) return portal === "member" ? "My Attendance" : "Today's Attendance";
    if (path.includes("/workouts")) return "AI Workout Planner";
    if (path.includes("/progress")) return "Fitness Analytics";
    if (path.includes("/notifications")) return "Alerts & Notifications";
    return portal === "member" ? "GymAI Pro Member" : "GymAI Pro Admin";
  };

  const displayName = user?.fullName || user?.name || (portal === "member" ? "Member" : "Administrator");
  const displayHandle = user?.phone || user?.username || portal;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-borders bg-white px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-lg font-semibold text-[#111827]">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden items-center gap-2 md:flex">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-600">
              <User size={16} />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-[#111827]">{displayName}</p>
              <p className="text-[10px] text-gray-400 capitalize">{displayHandle}</p>
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-2 rounded-lg border border-borders bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Navbar;
