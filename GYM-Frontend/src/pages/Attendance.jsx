import React, { useState, useEffect } from "react";
import API from "../services/api";
import { LogIn, LogOut, Calendar, X, AlertCircle, QrCode, Camera, Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const Attendance = () => {
  const { role, userId } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [checkInModal, setCheckInModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState("");

  // QR Simulator state
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [scanMessage, setScanMessage] = useState("");
  const [qrTokenInput, setQrTokenInput] = useState("");

  useEffect(() => {
    fetchData();
  }, [role, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      if (role === "admin") {
        const [todayAttendanceRes, membersRes] = await Promise.all([
          API.get("/attendance/today"),
          API.get("/member"),
        ]);
        setAttendance(todayAttendanceRes.data.data || []);
        setMembers(membersRes.data.data || []);
      } else if (role === "member" && userId) {
        const response = await API.get(`/attendance/member/${userId}`);
        setAttendance(response.data.data || []);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to fetch attendance logs");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!selectedMember) return;
    setActionLoading(true);
    setActionError("");

    try {
      await API.post("/attendance/checkin", { memberId: selectedMember });
      fetchData();
      setCheckInModal(false);
    } catch (err) {
      console.error(err);
      setActionError(err.response?.data?.message || "Error checking in member");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async (memberId) => {
    if (!window.confirm("Are you sure you want to check out this member?")) return;
    try {
      await API.post("/attendance/checkout", { memberId });
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to check out member");
    }
  };

  const handleSimulateQRScan = async () => {
    if (!userId) return;
    setScanning(true);
    setScanSuccess(false);
    setScanMessage("");

    try {
      const activeSession = attendance.find(log => !log.checkOutTime);

      if (activeSession) {
        const res = await API.post("/attendance/checkout", { memberId: userId });
        setScanSuccess(true);
        setScanMessage(`Check-Out Successful! Duration: ${res.data?.data?.duration || 0} mins.`);
        fetchData();
        setScanning(false);
        return;
      }

      if (!qrTokenInput.trim()) {
        setScanSuccess(false);
        setScanMessage("Please scan the gym QR code and enter the token.");
        setScanning(false);
        return;
      }

      try {
        await API.post("/attendance/checkin", {
          qrToken: qrTokenInput.trim(),
        });
        setScanSuccess(true);
        setScanMessage("Check-In Successful! Active session started.");
      } catch (err) {
        setScanSuccess(false);
        setScanMessage(err.response?.data?.message || "Error checking in");
      } finally {
        fetchData();
        setScanning(false);
      }
    } catch (err) {
      console.error(err);
      setScanSuccess(false);
      setScanMessage(err.response?.data?.message || "Failed to initiate QR scan verification");
      setScanning(false);
    }
  };

  const isCheckedIn = attendance.length > 0 && !attendance[0].checkOutTime;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">
            {role === "admin" ? "Today's Attendance" : "My Attendance History"}
          </h2>
          <p className="text-sm text-gray-500">
            {role === "admin"
              ? "Track current entries, exits, and gym workout durations"
              : "Track your check-in dates and workout session lengths"}
          </p>
        </div>

        {role === "admin" ? (
          <button
            onClick={() => {
              setSelectedMember("");
              setActionError("");
              setCheckInModal(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E05E00] transition-colors"
          >
            <LogIn size={16} />
            <span>Check-In Member</span>
          </button>
        ) : (
          <button
            onClick={() => {
              setQrModalOpen(true);
              setScanSuccess(false);
              setScanMessage("");
            }}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-colors ${
              isCheckedIn ? "bg-[#EF4444] hover:bg-red-600" : "bg-[#FF6B00] hover:bg-[#E05E00]"
            }`}
          >
            <QrCode size={16} />
            <span>{isCheckedIn ? "Scan Check-Out QR" : "Scan Check-In QR"}</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded-lg bg-white" />
          <div className="h-48 w-full animate-pulse rounded-lg bg-white" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[#EF4444] text-sm">
          {error}
        </div>
      ) : attendance.length === 0 ? (
        <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <Calendar size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">
            {role === "admin" ? "No Attendance Recorded Today" : "No Attendance Recorded"}
          </h3>
          <p className="text-xs text-gray-400 mt-1">
            {role === "admin" 
              ? "Record a check-in to initiate today's list." 
              : "Scan the entrance QR code to log your first session check-in."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-borders bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-borders text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  {role === "admin" ? (
                    <th className="px-6 py-4">Member Name</th>
                  ) : (
                    <th className="px-6 py-4">Date</th>
                  )}
                  <th className="px-6 py-4">Check-In Time</th>
                  <th className="px-6 py-4">Check-Out Time</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borders text-[#111827]">
                {attendance.map((att) => (
                  <tr key={att._id} className="hover:bg-gray-50/50">
                    {role === "admin" ? (
                      <td className="px-6 py-4 font-semibold">{att.memberId?.fullName || "Deleted Member"}</td>
                    ) : (
                      <td className="px-6 py-4 font-semibold">
                        {new Date(att.date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    )}
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString() : "--"}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-gray-500">
                      {att.checkOutTime 
                        ? new Date(att.checkOutTime).toLocaleTimeString() 
                        : <span className="text-green-500 font-semibold">Currently Active</span>}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {att.duration !== undefined ? `${att.duration} mins` : "--"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {role === "admin" && !att.checkOutTime && (
                        <button
                          onClick={() => handleCheckOut(att.memberId?._id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-borders bg-white px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-red-500 transition-colors"
                        >
                          <LogOut size={12} />
                          <span>Check-Out</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Manual Checkin Modal for Admins */}
      {role === "admin" && checkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-borders">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#111827]">Member Check-In</h3>
              <button onClick={() => setCheckInModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {actionError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-[#EF4444] font-medium flex gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleCheckIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Member</label>
                <select
                  value={selectedMember}
                  onChange={(e) => setSelectedMember(e.target.value)}
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  required
                >
                  <option value="">-- Choose Member --</option>
                  {members.map((member) => (
                    <option key={member._id} value={member._id}>
                      {member.fullName} ({member.phone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-borders pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setCheckInModal(false)}
                  className="rounded-lg border border-borders bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center justify-center rounded-lg bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#E05E00] disabled:bg-orange-300 transition-colors"
                >
                  {actionLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Confirm Check-In"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Scanner Simulation Modal for Members */}
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
                  <div className="w-full flex flex-col items-center justify-center">
                    <div className="relative w-48 h-48 border-2 border-dashed border-[#FF6B00] rounded-xl flex items-center justify-center bg-white shadow-inner">
                      <Camera size={48} className="text-gray-300 animate-pulse" />
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

export default Attendance;
