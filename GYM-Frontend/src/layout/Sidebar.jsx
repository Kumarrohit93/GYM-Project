import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  IndianRupee,
  Calendar,
  Dumbbell,
  TrendingUp,
  Bell,
  X
} from "lucide-react";
import { ADMIN_ROUTES, MEMBER_ROUTES } from "../utils/routes";

const adminSidebarItems = [
  { name: "Dashboard", path: ADMIN_ROUTES.dashboard, icon: LayoutDashboard },
  { name: "Members", path: ADMIN_ROUTES.members, icon: Users },
  { name: "Memberships", path: ADMIN_ROUTES.memberships, icon: CreditCard },
  { name: "Payments", path: ADMIN_ROUTES.payments, icon: IndianRupee },
  { name: "Attendance", path: ADMIN_ROUTES.attendance, icon: Calendar },
  { name: "Workouts", path: ADMIN_ROUTES.workouts, icon: Dumbbell },
  { name: "Progress", path: ADMIN_ROUTES.progress, icon: TrendingUp },
  { name: "Notifications", path: ADMIN_ROUTES.notifications, icon: Bell },
];

const memberSidebarItems = [
  { name: "Dashboard", path: MEMBER_ROUTES.dashboard, icon: LayoutDashboard },
  { name: "Attendance", path: MEMBER_ROUTES.attendance, icon: Calendar },
  { name: "Workouts", path: MEMBER_ROUTES.workouts, icon: Dumbbell },
  { name: "Progress", path: MEMBER_ROUTES.progress, icon: TrendingUp },
  { name: "Notifications", path: MEMBER_ROUTES.notifications, icon: Bell },
];

const Sidebar = ({ isOpen, toggleSidebar, portal }) => {
  const sidebarItems = portal === "member" ? memberSidebarItems : adminSidebarItems;

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-64 flex-col border-r border-borders bg-white transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-borders px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF6B00] text-white font-bold">
              AI
            </div>
            <span className="text-xl font-bold tracking-tight text-[#111827]">
              GymAI <span className="text-[#FF6B00]">Pro</span>
            </span>
          </div>
          <button
            onClick={toggleSidebar}
            className="rounded-lg p-1 text-gray-500 hover:bg-gray-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-4 py-6">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#FF6B00]/10 text-[#FF6B00]"
                      : "text-gray-600 hover:bg-gray-50 hover:text-[#111827]"
                  }`
                }
              >
                <Icon size={18} />
                {item.name}
              </NavLink>
            );
          })}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
