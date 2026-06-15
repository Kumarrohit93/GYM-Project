import React, { useState, useEffect } from "react";
import API from "../services/api";
import { TrendingUp, Plus, X, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from "recharts";

const Progress = () => {
  const { role, userId } = useAuth();
  const [members, setMembers] = useState([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(false);
  const [progressData, setProgressData] = useState([]);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "",
    bodyFatPercentage: "",
    chest: "",
    waist: "",
    arms: "",
    thighs: "",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (role === "admin") {
      fetchMembers();
    } else if (role === "member" && userId) {
      setSelectedMember(userId);
      fetchProgress(userId);
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

  const fetchProgress = async (memberId) => {
    if (!memberId) {
      setProgressData([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await API.get(`/progress/${memberId}`);
      const sortedData = (response.data.data || []).sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      setProgressData(sortedData);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch progress logs");
    } finally {
      setLoading(false);
    }
  };

  const handleMemberChange = (e) => {
    const id = e.target.value;
    setSelectedMember(id);
    fetchProgress(id);
  };

  const openLogModal = () => {
    setFormData({
      date: new Date().toISOString().split("T")[0],
      weight: "",
      bodyFatPercentage: "",
      chest: "",
      waist: "",
      arms: "",
      thighs: "",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      await API.post("/progress", {
        memberId: selectedMember,
        date: formData.date,
        weight: Number(formData.weight),
        bodyFatPercentage: Number(formData.bodyFatPercentage),
        chest: Number(formData.chest || 0),
        waist: Number(formData.waist || 0),
        arms: Number(formData.arms || 0),
        thighs: Number(formData.thighs || 0),
      });
      fetchProgress(selectedMember);
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Error logging body metrics");
    } finally {
      setFormLoading(false);
    }
  };

  const chartData = progressData.map((d) => ({
    dateStr: new Date(d.date).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    Weight: d.weight,
    FatPercent: d.bodyFatPercentage,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Fitness Progress</h2>
          <p className="text-sm text-gray-500">Track changes in body measurements, weights, and metrics</p>
        </div>
        {selectedMember && (
          <button
            onClick={openLogModal}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E05E00] transition-colors"
          >
            <Plus size={16} />
            <span>Log Metrics</span>
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
            <div className="h-64 w-full animate-pulse rounded-lg bg-white" />
            <div className="h-48 w-full animate-pulse rounded-lg bg-white" />
          </div>
        ) : progressData.length === 0 ? (
          <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm max-w-4xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
              <TrendingUp size={24} />
            </div>
            <h3 className="text-sm font-semibold text-[#111827]">No Metrics Logged</h3>
            <p className="text-xs text-gray-400 mt-1 mb-4">Click below to record the first physical measurements log.</p>
            <button
              onClick={openLogModal}
              className="rounded-lg bg-[#FF6B00] px-4 py-2 text-xs font-semibold text-white hover:bg-[#E05E00]"
            >
              Log Metrics
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-xl border border-borders bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#111827] mb-4">Weight Trend (kg)</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF6B00" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#FF6B00" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="dateStr" tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <YAxis tickLine={false} axisLine={false} tick={{ fill: "#9CA3AF", fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid #E5E7EB", fontSize: "12px" }} />
                    <Area type="monotone" dataKey="Weight" stroke="#FF6B00" strokeWidth={2} fillOpacity={1} fill="url(#weightGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-borders bg-white p-6 shadow-sm">
              <h3 className="text-base font-bold text-[#111827] mb-4">Body Measurements History</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-borders text-xs font-semibold uppercase tracking-wider text-gray-400">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Weight (kg)</th>
                      <th className="px-4 py-3">Body Fat %</th>
                      <th className="px-4 py-3">Chest (in)</th>
                      <th className="px-4 py-3">Waist (in)</th>
                      <th className="px-4 py-3">Arms (in)</th>
                      <th className="px-4 py-3">Thighs (in)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borders text-gray-700">
                    {[...progressData].reverse().map((data) => (
                      <tr key={data._id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 font-semibold text-[#111827]">
                          {new Date(data.date).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 font-bold">{data.weight}</td>
                        <td className="px-4 py-3">{data.bodyFatPercentage}%</td>
                        <td className="px-4 py-3">{data.chest}</td>
                        <td className="px-4 py-3">{data.waist}</td>
                        <td className="px-4 py-3">{data.arms}</td>
                        <td className="px-4 py-3">{data.thighs}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm max-w-4xl">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <TrendingUp size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">No Member Selected</h3>
          <p className="text-xs text-gray-400 mt-1">
            Choose a member above to inspect progression charts and log body dimensions.
          </p>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-borders">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#111827]">Log Progress Metrics</h3>
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

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Logging Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Body Fat (%)</label>
                  <input
                    type="number"
                    value={formData.bodyFatPercentage}
                    onChange={(e) => setFormData({ ...formData, bodyFatPercentage: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    required
                  />
                </div>
              </div>

              <div className="border-t border-borders pt-4 mt-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Dimensions (inches)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Chest</label>
                    <input
                      type="number"
                      value={formData.chest}
                      onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                      placeholder="0"
                      className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Waist</label>
                    <input
                      type="number"
                      value={formData.waist}
                      onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                      placeholder="0"
                      className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Arms</label>
                    <input
                      type="number"
                      value={formData.arms}
                      onChange={(e) => setFormData({ ...formData, arms: e.target.value })}
                      placeholder="0"
                      className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500">Thighs</label>
                    <input
                      type="number"
                      value={formData.thighs}
                      onChange={(e) => setFormData({ ...formData, thighs: e.target.value })}
                      placeholder="0"
                      className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    />
                  </div>
                </div>
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
                    "Save Log"
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

export default Progress;
