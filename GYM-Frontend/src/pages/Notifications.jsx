import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Bell, Eye, AlertCircle, X, Plus } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Notifications = () => {
  const { role, userId } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    message: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (role === "admin") {
      fetchMembers();
    } else if (role === "member" && userId) {
      setSelectedMember(userId);
      fetchNotifications(userId);
    }
  }, [role, userId]);

  const fetchMembers = async () => {
    try {
      const response = await API.get("/member");
      setMembers(response.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchNotifications = async (memberId) => {
    if (!memberId) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await API.get(`/notification/${memberId}`);
      setNotifications(response.data.data || []);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch notification alert history");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberChange = (e) => {
    const id = e.target.value;
    setSelectedMember(id);
    fetchNotifications(id);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await API.put(`/notification/read/${id}`);
      setNotifications(
        notifications.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
      alert("Failed to update notification read status");
    }
  };

  const handleIssueAlert = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");
    try {
      await API.post("/notification", {
        memberId: selectedMember,
        title: formData.title,
        message: formData.message,
      });
      fetchNotifications(selectedMember);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Failed to create notification");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Notifications</h2>
          <p className="text-sm text-gray-500">
            {role === "admin" 
              ? "Dispatch member warning alerts and review notification logs"
              : "Review your personal messages, automated reminders, and announcements"}
          </p>
        </div>
        {role === "admin" && selectedMember && (
          <button
            onClick={() => {
              setFormData({ title: "", message: "" });
              setFormError("");
              setModalOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E05E00] transition-colors"
          >
            <Plus size={16} />
            <span>Create Alert</span>
          </button>
        )}
      </div>

      {role === "admin" && (
        <div className="rounded-xl border border-borders bg-white p-5 shadow-sm max-w-md">
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Member</label>
          <select
            value={selectedMember}
            onChange={handleMemberChange}
            className="mt-2 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
          >
            <option value="">-- Choose Member --</option>
            {members.map((member) => (
              <option key={member._id} value={member._id}>
                {member.fullName} ({member.phone})
              </option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-[#EF4444] font-medium flex gap-2 max-w-xl">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {selectedMember ? (
        loading ? (
          <div className="space-y-4">
            <div className="h-16 w-full animate-pulse rounded-lg bg-white" />
            <div className="h-16 w-full animate-pulse rounded-lg bg-white" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm max-w-4xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
              <Bell size={24} />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">No Notifications Found</h3>
            <p className="text-xs text-gray-400 mt-1">
              {role === "admin"
                ? "Use the button above to issue a manual warning alert to this member."
                : "You have no active alerts or messages."}
            </p>
          </div>
        ) : (
          <div className="space-y-3 max-w-4xl">
            {notifications.map((n) => (
              <div
                key={n._id}
                className={`flex items-start justify-between rounded-xl border p-5 transition-all shadow-sm ${
                  n.read
                    ? "border-borders bg-white opacity-75"
                    : "border-[#FF6B00]/30 bg-orange-50/10"
                }`}
              >
                <div className="flex gap-4">
                  <div
                    className={`mt-0.5 rounded-lg p-2 ${
                      n.read ? "bg-gray-100 text-gray-400" : "bg-[#FF6B00]/10 text-[#FF6B00]"
                    }`}
                  >
                    <Bell size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#111827]">{n.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{n.message}</p>
                  </div>
                </div>

                {!n.read && (
                  <button
                    onClick={() => handleMarkAsRead(n._id)}
                    className="flex items-center gap-1 rounded-lg border border-borders bg-white px-2.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#FF6B00] transition-colors"
                  >
                    <Eye size={12} />
                    <span>Dismiss</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm max-w-4xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <Bell size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">No Member Selected</h3>
          <p className="text-xs text-gray-400 mt-1">
            Choose a member above to manage and issue custom alert notifications.
          </p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-borders">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#111827]">Issue Alert Notification</h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-[#EF4444] font-medium flex gap-2">
                <AlertCircle size={16} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleIssueAlert} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Alert Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Schedule Change Alert"
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Message Content</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Provide brief details about this notice..."
                  rows={4}
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-borders pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-lg border border-borders bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center justify-center rounded-lg bg-[#FF6B00] px-5 py-2 text-sm font-semibold text-white hover:bg-[#E05E00] disabled:bg-orange-300 transition-colors"
                >
                  {formLoading ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    "Dispatch Alert"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
