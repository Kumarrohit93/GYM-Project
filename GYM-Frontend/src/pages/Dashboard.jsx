import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserCheck,
  Calendar,
  DollarSign,
  AlertTriangle,
  Plus,
  ArrowRight,
  UserPlus,
  Dumbbell,
  CheckCircle,
  Clock,
  Sparkles,
  QrCode,
  Bell,
  X,
  TrendingUp,
  CreditCard,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";
import { ADMIN_ROUTES } from "../utils/routes";

const Dashboard = () => {
  const { role, user, userId } = useAuth();

  // Admin states
  const [adminStats, setAdminStats] = useState(null);
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminError, setAdminError] = useState("");
  const [activeQR, setActiveQR] = useState("");
  const [gymConfig, setGymConfig] = useState({ latitude: 0, longitude: 0, radius: 100 });
  const [configSaving, setConfigSaving] = useState(false);
  const [configSuccess, setConfigSuccess] = useState(false);

  // Member states
  const [memberProfile, setMemberProfile] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [memberLoading, setMemberLoading] = useState(true);
  const [memberError, setMemberError] = useState("");
  const [aiGenerating, setAiGenerating] = useState(false);
  const [memberAnalytics, setMemberAnalytics] = useState(null);

  // QR Scanner Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [qrTokenInput, setQrTokenInput] = useState("");

  useEffect(() => {
    if (role === "admin") {
      fetchAdminStats();
    } else if (role === "member" && userId) {
      fetchMemberDashboardData();
    }
  }, [role, userId]);

  // --- ADMIN METHODS ---
  const fetchAdminStats = async () => {
    try {
      setAdminLoading(true);
      const [statsRes, qrRes, configRes] = await Promise.all([
        API.get("/dashboard/stats"),
        API.get("/attendance/qr").catch(() => ({ data: { qrToken: "" } })),
        API.get("/attendance/config").catch(() => ({ data: { data: { latitude: 0, longitude: 0, radius: 100 } } }))
      ]);
      setAdminStats(statsRes.data.data);
      setActiveQR(qrRes.data.qrToken);
      setGymConfig(configRes.data.data);
      setAdminError("");
    } catch (err) {
      console.error(err);
      setAdminError("Failed to fetch dashboard statistics");
    } finally {
      setAdminLoading(false);
    }
  };

  const handleSaveGymConfig = async () => {
    setConfigSaving(true);
    setConfigSuccess(false);
    try {
      const res = await API.post("/attendance/config", gymConfig);
      setGymConfig(res.data.data);
      setConfigSuccess(true);
      setTimeout(() => setConfigSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to save location settings");
    } finally {
      setConfigSaving(false);
    }
  };

  // --- MEMBER METHODS ---
  const fetchMemberDashboardData = async () => {
    if (!userId) return;
    try {
      setMemberLoading(true);
      setMemberError("");

      const [profileRes, workoutRes, paymentRes, attendanceRes, analyticsRes] = await Promise.all([
        API.get(`/member/${userId}`).catch(() => ({ data: { data: null } })),
        API.get(`/workout/today/${userId}`).catch(() => ({ data: { data: null } })),
        API.get(`/payment/member/${userId}`).catch(() => ({ data: { data: { payments: [], pendingDues: 0 } } })),
        API.get(`/attendance/member/${userId}`).catch(() => ({ data: { data: [] } })),
        API.get(`/member/${userId}/analytics`).catch(() => ({ data: { data: null } }))
      ]);

      setMemberProfile(profileRes.data?.data);
      setTodayWorkout(workoutRes.data?.data);
      setPaymentStats(paymentRes.data?.data);
      setAttendanceLogs(attendanceRes.data?.data || []);
      setMemberAnalytics(analyticsRes.data?.data);
    } catch (err) {
      console.error(err);
      setMemberError("Error loading dashboard details. Please refresh.");
    } finally {
      setMemberLoading(false);
    }
  };

  const handleGenerateMemberWorkout = async () => {
    if (!userId) return;
    setAiGenerating(true);
    try {
      await API.post("/workout/generate", { memberId: userId });
      const workoutRes = await API.get(`/workout/today/${userId}`);
      setTodayWorkout(workoutRes.data?.data);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to generate AI workout routine");
    } finally {
      setAiGenerating(false);
    }
  };

  const handleSimulateQRScan = async () => {
    if (!userId) return;
    setScanning(true);
    setScanSuccess(false);
    setScanMessage("");

    try {
      const activeSession = attendanceLogs.find(log => !log.checkOutTime);

      if (activeSession) {
        const res = await API.post("/attendance/checkout", { memberId: userId });
        setScanSuccess(true);
        setScanMessage(`Check-Out Successful! Duration: ${res.data?.data?.duration || 0} mins.`);
        fetchMemberDashboardData();
        setScanning(false);
        return;
      }

      if (!qrTokenInput.trim()) {
        setScanSuccess(false);
        setScanMessage("Please scan the gym QR code and enter the token.");
        setScanning(false);
        return;
      }

      if (!("geolocation" in navigator)) {
        setScanSuccess(false);
        setScanMessage("GPS is required to mark attendance. Please enable location services.");
        setScanning(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            await API.post("/attendance/checkin", {
              qrToken: qrTokenInput.trim(),
              latitude,
              longitude,
            });
            setScanSuccess(true);
            setScanMessage("Check-In Successful! Have a great workout session!");
          } catch (err) {
            setScanSuccess(false);
            setScanMessage(err.response?.data?.message || "Error checking in");
          } finally {
            fetchMemberDashboardData();
            setScanning(false);
          }
        },
        () => {
          setScanSuccess(false);
          setScanMessage("You must be inside the gym to mark attendance. Please enable GPS and try again.");
          setScanning(false);
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    } catch (err) {
      console.error(err);
      setScanSuccess(false);
      setScanMessage(err.response?.data?.message || "Failed to initiate QR scan verification");
      setScanning(false);
    }
  };

  // Check current check-in state
  const isCheckedIn = attendanceLogs.length > 0 && !attendanceLogs[0].checkOutTime;
  const currentSession = isCheckedIn ? attendanceLogs[0] : null;

  // --- RENDER ADMIN DASHBOARD ---
  if (role === "admin") {
    const stats = adminStats;
    const statCards = stats
      ? [
          { title: "Total Members", value: stats.totalMembers, icon: Users, color: "text-[#111827]", bg: "bg-blue-50/50" },
          { title: "Active Members", value: stats.activeMembers, icon: UserCheck, color: "text-[#22C55E]", bg: "bg-green-50/50" },
          { title: "Present Today", value: stats.presentToday, icon: Calendar, color: "text-purple-600", bg: "bg-purple-50/50" },
          { title: "Monthly Revenue", value: `$${stats.monthlyRevenue}`, icon: DollarSign, color: "text-[#FF6B00]", bg: "bg-orange-50/50" },
          { title: "Pending Fees", value: `$${stats.pendingFees}`, icon: AlertTriangle, color: "text-[#EF4444]", bg: "bg-red-50/50" },
        ]
      : [];

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Admin Dashboard</h2>
          <p className="text-sm text-gray-500">Real-time metrics and operations at a glance</p>
        </div>

        {stats?.inactiveCount > 0 && (
          <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
            <AlertTriangle className="text-amber-600 shrink-0" size={20} />
            <div>
              <span className="font-bold">{stats.inactiveCount} active members</span> have not checked in for 10 or more days.
            </div>
          </div>
        )}

        {adminLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-xl border border-borders bg-white" />
            ))}
          </div>
        ) : adminError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[#EF4444] text-sm flex items-center justify-between">
            <span>{adminError}</span>
            <button onClick={fetchAdminStats} className="font-semibold underline">Retry</button>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {statCards.map((card, i) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={i}
                  whileHover={{ y: -4 }}
                  className="rounded-xl border border-borders bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                      {card.title}
                    </span>
                    <div className={`rounded-lg p-2 ${card.bg}`}>
                      <Icon size={18} className={card.color} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-2xl font-bold text-[#111827]">{card.value}</h3>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-borders bg-white p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#111827]">Quick Actions</h3>
            <p className="text-xs text-gray-400 mt-1 mb-6">Common operations for faster access</p>
            <div className="space-y-3">
              <Link
                to={`${ADMIN_ROUTES.members}?action=add`}
                className="flex w-full items-center justify-between rounded-lg border border-borders px-4 py-3 text-sm font-medium text-gray-700 hover:bg-[#FF6B00]/5 hover:text-[#FF6B00] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <UserPlus size={16} />
                  <span>Add Member</span>
                </div>
                <Plus size={16} />
              </Link>
              <Link
                to={ADMIN_ROUTES.attendance}
                className="flex w-full items-center justify-between rounded-lg border border-borders px-4 py-3 text-sm font-medium text-gray-700 hover:bg-[#FF6B00]/5 hover:text-[#FF6B00] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Calendar size={16} />
                  <span>Member Check-In</span>
                </div>
                <ArrowRight size={16} />
              </Link>
              <Link
                to={ADMIN_ROUTES.payments}
                className="flex w-full items-center justify-between rounded-lg border border-borders px-4 py-3 text-sm font-medium text-gray-700 hover:bg-[#FF6B00]/5 hover:text-[#FF6B00] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign size={16} />
                  <span>Record Payment</span>
                </div>
                <Plus size={16} />
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-borders bg-white p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111827]">System Activity Logs</h3>
              <p className="text-xs text-gray-400 mt-1 mb-6">Latest backend background executions</p>
              <div className="space-y-4">
                <div className="flex items-start gap-4 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">Membership Expiry Monitor</p>
                    <p className="text-xs text-gray-400">Node-cron automated script verified active statuses at midnight.</p>
                  </div>
                  <span className="text-xs text-gray-400">Midnight</span>
                </div>
                <div className="flex items-start gap-4 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-purple-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">AI Workout Dispatcher</p>
                    <p className="text-xs text-gray-400">Generated tailored daily exercise routines for active members.</p>
                  </div>
                  <span className="text-xs text-gray-400">3:00 AM</span>
                </div>
                <div className="flex items-start gap-4 text-sm">
                  <div className="mt-1 h-2 w-2 rounded-full bg-orange-500 shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-700">Dues Alert Job</p>
                    <p className="text-xs text-gray-400">Scanned ledger and dispatched reminders to profiles with pending fees.</p>
                  </div>
                  <span className="text-xs text-gray-400">1:00 AM</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gym Controls & QR */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Card 1: Dynamic Daily QR Code */}
          <div className="rounded-xl border border-borders bg-white p-6 shadow-sm flex flex-col items-center justify-center text-center">
            <h3 className="text-base font-bold text-[#111827] mb-1">Gym Entry QR Code</h3>
            <p className="text-xs text-gray-400 mb-4 font-medium">Dynamic QR rotates daily at midnight</p>
            <div className="rounded-lg border-2 border-[#111827] bg-white p-4 flex items-center justify-center shadow-inner min-h-[192px]">
              {activeQR ? (
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(activeQR)}`}
                  alt="Daily Gym Entry QR Code"
                  className="w-40 h-40"
                />
              ) : (
                <QrCode size={160} className="text-gray-300 animate-pulse" />
              )}
            </div>
            <span className="text-[9px] text-gray-400 font-mono mt-3 select-all max-w-full overflow-hidden text-ellipsis whitespace-nowrap">
              Token: {activeQR || "Loading..."}
            </span>
          </div>

          {/* Card 2: Gym Location Config */}
          <div className="rounded-xl border border-borders bg-white p-6 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-base font-bold text-[#111827] mb-1">Gym Location Settings</h3>
              <p className="text-xs text-gray-400 mb-4 font-medium">Configure geofencing for QR check-ins</p>
              
              <div className="space-y-2">
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={gymConfig.latitude}
                    onChange={(e) => setGymConfig({ ...gymConfig, latitude: Number(e.target.value) })}
                    className="mt-0.5 block w-full rounded-lg border border-borders bg-gray-50 py-1.5 px-3 text-xs text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    placeholder="e.g. 28.6139"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={gymConfig.longitude}
                    onChange={(e) => setGymConfig({ ...gymConfig, longitude: Number(e.target.value) })}
                    className="mt-0.5 block w-full rounded-lg border border-borders bg-gray-50 py-1.5 px-3 text-xs text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    placeholder="e.g. 77.2090"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider">Allowed Radius (meters)</label>
                  <input
                    type="number"
                    value={gymConfig.radius}
                    onChange={(e) => setGymConfig({ ...gymConfig, radius: Number(e.target.value) })}
                    className="mt-0.5 block w-full rounded-lg border border-borders bg-gray-50 py-1.5 px-3 text-xs text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    placeholder="e.g. 100"
                  />
                </div>
              </div>
            </div>

            <div className="mt-3">
              <button
                type="button"
                onClick={handleSaveGymConfig}
                disabled={configSaving}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] py-2 text-xs font-semibold text-white hover:bg-[#E05E00] disabled:bg-gray-400 transition-colors"
              >
                {configSaving ? "Saving..." : configSuccess ? "Saved!" : "Save Configuration"}
              </button>
            </div>
          </div>

          {/* Card 3: Geofence Info */}
          <div className="rounded-xl border border-borders bg-white p-6 shadow-sm flex flex-col justify-between">
            <h3 className="text-base font-bold text-[#111827] mb-1">Geofence Status</h3>
            <p className="text-xs text-gray-400 mb-4 font-medium">Security settings validation</p>
            <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-gray-50/50 rounded-lg border border-dashed border-borders">
              <UserCheck className="text-[#22C55E] mb-2" size={24} />
              <p className="text-xs font-bold text-gray-700">GPS Rules Enforced</p>
              <p className="text-[10px] text-gray-500 mt-1 max-w-[200px]">
                Members will be verified dynamically. Device GPS must match gym coordinates before check-in.
              </p>
            </div>
          </div>
        </div>

        {/* Separator / Inactive title if active */}
        {stats?.inactiveCount > 0 && <div className="mt-4" />}

          {stats?.inactiveCount > 0 && (
            <div className="rounded-xl border border-borders bg-white p-6 shadow-sm md:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-[#111827]">Inactive Members (10+ Days Absent)</h3>
                  <p className="text-xs text-gray-400 mt-1">Active members who have not checked in for 10 or more days</p>
                </div>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {stats.inactiveCount} Members
                </span>
              </div>

              <div className="overflow-hidden rounded-lg border border-borders bg-gray-50/30">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-borders text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <tr>
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Last Visit</th>
                        <th className="px-4 py-3">Days Absent</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borders text-[#111827]">
                      {stats.inactiveMembers.map((member) => {
                        const lastVisitDate = member.lastVisit ? new Date(member.lastVisit) : new Date(member.joiningDate);
                        const now = new Date();
                        const diffTime = Math.abs(now - lastVisitDate);
                        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                        
                        return (
                          <tr key={member._id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-semibold">{member.fullName}</td>
                            <td className="px-4 py-3 font-mono text-xs text-gray-500">{member.phone}</td>
                            <td className="px-4 py-3 text-gray-500 text-xs font-medium">
                              {member.lastVisit 
                                ? new Date(member.lastVisit).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
                                : `Never (Joined ${new Date(member.joiningDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })})`}
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-bold text-[#EF4444]">
                                {diffDays} days
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Link
                                to={`${ADMIN_ROUTES.members}?search=${encodeURIComponent(member.fullName)}`}
                                className="text-xs font-bold text-[#FF6B00] hover:underline"
                              >
                                View Profile
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
      </div>
    );
  }

  // --- RENDER MEMBER APP DASHBOARD ---
  const isFeePending = paymentStats?.pendingDues > 0;
  const isExpiringSoon = memberProfile?.membershipExpiry
    ? Math.ceil((new Date(memberProfile.membershipExpiry) - new Date()) / (1000 * 60 * 60 * 24)) <= 5
    : false;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-[#111827]">Welcome back, {user?.fullName || "Athlete"}!</h2>
        <p className="text-sm text-gray-500">Your personal training and fitness control room</p>
      </div>

      {/* Warning/Alert Banner */}
      {isExpiringSoon && memberProfile?.membershipExpiry && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800 text-sm">
          <AlertTriangle className="text-amber-600 shrink-0" size={20} />
          <div>
            Your membership is expiring soon on{" "}
            <span className="font-bold">
              {new Date(memberProfile.membershipExpiry).toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
              })}
            </span>
            . Please contact management to renew.
          </div>
        </div>
      )}

      {isFeePending && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-[#EF4444] text-sm">
          <AlertTriangle className="text-[#EF4444] shrink-0" size={20} />
          <div>
            You have pending gym fees of <span className="font-bold">${paymentStats.pendingDues}</span>. Please clear your balance as soon as possible.
          </div>
        </div>
      )}

      {memberLoading ? (
        <div className="grid gap-6 sm:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-borders bg-white" />
          ))}
        </div>
      ) : memberError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[#EF4444] text-sm flex items-center justify-between">
          <span>{memberError}</span>
          <button onClick={fetchMemberDashboardData} className="font-semibold underline">Retry</button>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          {/* Card 1: Membership Status */}
          <div className="rounded-xl border border-borders bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Membership Type</span>
              <div className="rounded-lg p-2 bg-blue-50 text-blue-600">
                <CreditCard size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#111827] capitalize">
                {memberProfile?.membershipType || "Monthly"} Plan
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {memberProfile?.membershipExpiry
                  ? `Expires: ${new Date(memberProfile.membershipExpiry).toLocaleDateString()}`
                  : "No active membership"}
              </p>
            </div>
          </div>

          {/* Card 2: Fee Status */}
          <div className="rounded-xl border border-borders bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Dues / Fee Status</span>
              <div
                className={`rounded-lg p-2 ${
                  isFeePending ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
                }`}
              >
                <DollarSign size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#111827]">
                {isFeePending ? `$${paymentStats.pendingDues} Due` : "Fees Fully Paid"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                Status:{" "}
                <span className={isFeePending ? "text-red-500 font-bold" : "text-green-500 font-bold"}>
                  {isFeePending ? "Pending" : "Cleared"}
                </span>
              </p>
            </div>
          </div>

          {/* Card 3: Attendance Check-In */}
          <div className="rounded-xl border border-borders bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Attendance Status</span>
              <div
                className={`rounded-lg p-2 ${
                  isCheckedIn ? "bg-green-50 text-green-500 animate-pulse" : "bg-gray-100 text-gray-500"
                }`}
              >
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#111827]">
                {isCheckedIn ? "Checked In" : "Checked Out"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {isCheckedIn
                  ? `Active session since ${new Date(currentSession.checkInTime).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    })}`
                  : "No check-in session today"}
              </p>
            </div>
          </div>

          {/* Card 4: Avg Gym Time */}
          <div className="rounded-xl border border-borders bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Avg Gym Time</span>
              <div className="rounded-lg p-2 bg-orange-50 text-[#FF6B00]">
                <Clock size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#111827]">
                {memberAnalytics?.attendance?.averageGymTime !== undefined ? `${memberAnalytics.attendance.averageGymTime} mins` : "--"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">Per visit average</p>
            </div>
          </div>

          {/* Card 5: Monthly Gym Time */}
          <div className="rounded-xl border border-borders bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Monthly Time</span>
              <div className="rounded-lg p-2 bg-purple-50 text-purple-600">
                <TrendingUp size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#111827]">
                {memberAnalytics?.attendance?.monthlyTimeSpent !== undefined ? `${Math.round(memberAnalytics.attendance.monthlyTimeSpent / 60)} hrs` : "--"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {memberAnalytics?.attendance?.monthlyTimeSpent !== undefined ? `${memberAnalytics.attendance.monthlyTimeSpent} mins` : "This month"}
              </p>
            </div>
          </div>

          {/* Card 6: Total Gym Time */}
          <div className="rounded-xl border border-borders bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Gym Time</span>
              <div className="rounded-lg p-2 bg-green-50 text-green-600">
                <CheckCircle size={18} />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-lg font-bold text-[#111827]">
                {memberAnalytics?.attendance?.totalTimeSpent !== undefined ? `${Math.round(memberAnalytics.attendance.totalTimeSpent / 60)} hrs` : "--"}
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-medium">
                {memberAnalytics?.attendance?.totalTimeSpent !== undefined ? `${memberAnalytics.attendance.totalTimeSpent} mins` : "All-time total"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* QR Attendance and Today's Workout Layout */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* QR Scanner Module */}
        <div className="rounded-xl border border-borders bg-white p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-[#FF6B00] border-b border-borders pb-4 mb-4">
              <QrCode size={18} />
              <h3 className="text-base font-bold text-[#111827]">QR Attendance</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              Scan the official QR Code displayed at the gym desk to log your check-in or check-out times automatically.
            </p>
          </div>
          <button
            onClick={() => {
              setQrModalOpen(true);
              setScanSuccess(false);
              setScanMessage("");
            }}
            className={`w-full flex items-center justify-center gap-2 rounded-lg py-3 text-sm font-semibold text-white transition-colors outline-none ${
              isCheckedIn
                ? "bg-[#EF4444] hover:bg-red-600 shadow-sm"
                : "bg-[#FF6B00] hover:bg-[#E05E00] shadow-sm"
            }`}
          >
            <QrCode size={16} />
            <span>{isCheckedIn ? "Check-Out via QR" : "Check-In via QR"}</span>
          </button>
        </div>

        {/* AI Workouts Module */}
        <div className="rounded-xl border border-borders bg-white p-6 shadow-sm md:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <div className="flex items-center gap-2 text-purple-600">
                <Dumbbell size={18} />
                <h3 className="text-base font-bold text-[#111827]">Today's AI Workout</h3>
              </div>
              {todayWorkout && (
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-semibold text-[#22C55E]">
                  Active
                </span>
              )}
            </div>

            {todayWorkout ? (
              <div className="space-y-4">
                {todayWorkout.exercises && todayWorkout.exercises.map((ex) => (
                  <div key={ex._id} className="flex items-center justify-between border-b border-borders pb-2 text-sm">
                    <div>
                      <p className="font-semibold text-gray-800">{ex.excerciseName}</p>
                      <p className="text-xs text-gray-400">
                        {ex.sets?.length || 0} sets | Rest: {ex.restTime}s
                        {ex.sets?.length > 0 && (
                          <> | Target: {ex.sets[0].targetReps} reps @ {ex.sets[0].targetWeight} kg</>
                        )}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-semibold ${ex.completed ? "text-green-500" : "text-amber-500"}`}>
                        {ex.completed ? "Completed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Dumbbell size={36} className="text-gray-300 mb-2 animate-bounce" />
                <p className="text-sm font-semibold text-[#111827]">No AI Routine Scheduled</p>
                <p className="text-xs text-gray-400 mt-1 max-w-[300px]">
                  Let the AI generate a customized daily workout program according to your age, goal, and metrics.
                </p>
              </div>
            )}
          </div>

          {!todayWorkout && (
            <button
              onClick={handleGenerateMemberWorkout}
              disabled={aiGenerating}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#FF6B00] py-3 text-sm font-semibold text-white hover:bg-[#E05E00] disabled:bg-orange-300 transition-colors"
            >
              <Sparkles size={16} />
              {aiGenerating ? "Generating Plan..." : "Generate AI Routine"}
            </button>
          )}
        </div>
      </div>

      {/* QR Code Scanner Simulation Modal */}
      <AnimatePresence>
        {qrModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-borders overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
                <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                  <QrCode size={20} className="text-[#FF6B00]" />
                  <span>Gym QR Code Reader</span>
                </h3>
                <button
                  onClick={() => setQrModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="relative rounded-xl border border-borders bg-[#F8F9FA] overflow-hidden p-6 flex flex-col items-center justify-center min-h-[250px]">
                {scanning ? (
                  // Scanner Animation
                  <div className="w-full flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48 border-2 border-dashed border-[#FF6B00] rounded-xl flex items-center justify-center bg-white shadow-inner">
                      <Camera size={48} className="text-gray-300 animate-pulse" />
                      {/* Laser Line */}
                      <motion.div
                        initial={{ y: -70 }}
                        animate={{ y: 70 }}
                        transition={{ repeat: Infinity, repeatType: "reverse", duration: 1.5, ease: "easeInOut" }}
                        className="absolute w-44 h-0.5 bg-[#FF6B00] shadow-md shadow-orange-500"
                      />
                    </div>
                    <span className="text-xs text-gray-500 font-semibold mt-4">Searching for QR code...</span>
                  </div>
                ) : scanSuccess ? (
                  // Success State
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="h-16 w-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mb-4 border border-green-200">
                      <Check size={32} />
                    </div>
                    <h4 className="text-base font-bold text-green-600">Scan Successful</h4>
                    <p className="text-sm text-gray-600 mt-2">{scanMessage}</p>
                    <button
                      onClick={() => setQrModalOpen(false)}
                      className="mt-6 rounded-lg bg-[#111827] px-6 py-2 text-xs font-semibold text-white hover:bg-black"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <div className="w-full text-center flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48 border border-borders rounded-xl flex items-center justify-center bg-white shadow-inner">
                      <QrCode size={100} className="text-gray-300" />
                    </div>
                    <p className="text-xs text-gray-400 mt-4 max-w-[280px]">
                      {isCheckedIn
                        ? "Scan to check out from your active gym session."
                        : "Scan the gym entrance QR code and enter the token below."}
                    </p>
                    {!isCheckedIn && (
                      <input
                        type="text"
                        value={qrTokenInput}
                        onChange={(e) => setQrTokenInput(e.target.value)}
                        placeholder="Paste scanned QR token here"
                        className="mt-4 w-full rounded-lg border border-borders bg-white py-2 px-3 text-xs text-[#111827] focus:border-[#FF6B00] outline-none font-mono"
                      />
                    )}
                  </div>
                )}
              </div>

              {!scanning && !scanSuccess && (
                <div className="flex gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setQrModalOpen(false)}
                    className="flex-1 rounded-lg border border-borders bg-white py-2.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateQRScan}
                    className="flex-1 rounded-lg bg-[#FF6B00] py-2.5 text-xs font-semibold text-white hover:bg-[#E05E00]"
                  >
                    {isCheckedIn ? "Confirm Check-Out" : "Confirm Check-In"}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
