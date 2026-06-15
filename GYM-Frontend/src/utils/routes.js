export const ADMIN_ROUTES = {
  dashboard: "/admin/dashboard",
  members: "/admin/members",
  memberships: "/admin/memberships",
  payments: "/admin/payments",
  attendance: "/admin/attendance",
  workouts: "/admin/workouts",
  progress: "/admin/progress",
  notifications: "/admin/notifications",
};

export const MEMBER_ROUTES = {
  dashboard: "/member/dashboard",
  attendance: "/member/attendance",
  workouts: "/member/workouts",
  progress: "/member/progress",
  notifications: "/member/notifications",
};

export const getDashboardPath = (role) => {
  if (role === "admin") return ADMIN_ROUTES.dashboard;
  if (role === "member") return MEMBER_ROUTES.dashboard;
  return "/login";
};

export const getHomePathForRole = getDashboardPath;
