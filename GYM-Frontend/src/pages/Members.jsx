import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import API from "../services/api";
import { ADMIN_ROUTES } from "../utils/routes";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  User,
  X,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Clock,
  CreditCard,
  Dumbbell,
  Calendar,
  Activity
} from "lucide-react";

const Members = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 8;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    password: "",
    gender: "male",
    age: "",
    height: "",
    weight: "",
    goal: "general_fitness",
    experienceLevel: "beginner",
    injuries: "",
    membershipType: "monthly",
    status: "active",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Analytics modal state
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [selectedMemberAnalytics, setSelectedMemberAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const openAnalyticsModal = async (memberId) => {
    setAnalyticsOpen(true);
    setAnalyticsLoading(true);
    setSelectedMemberAnalytics(null);
    try {
      const response = await API.get(`/member/${memberId}/analytics`);
      setSelectedMemberAnalytics(response.data.data);
    } catch (err) {
      console.error(err);
      alert("Failed to load member analytics details");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get("search");
    if (searchQuery) {
      setSearch(searchQuery);
    }
    if (searchParams.get("action") === "add") {
      openAddModal();
      navigate(ADMIN_ROUTES.members, { replace: true });
    }
  }, [location]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await API.get("/member");
      setMembers(response.data.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch member directory");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      fullName: "",
      phone: "",
      password: "",
      gender: "male",
      age: "",
      height: "",
      weight: "",
      goal: "general_fitness",
      experienceLevel: "beginner",
      injuries: "",
      membershipType: "monthly",
      status: "active",
    });
    setFormError("");
    setModalOpen(true);
  };

  const openEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      fullName: member.fullName || "",
      phone: member.phone || "",
      password: "",
      gender: member.gender || "male",
      age: member.age || "",
      height: member.height || "",
      weight: member.weight || "",
      goal: member.goal || "general_fitness",
      experienceLevel: member.experienceLevel || "beginner",
      injuries: member.injuries ? member.injuries.join(", ") : "",
      membershipType: member.membershipType || "monthly",
      status: member.status || "active",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this member?")) return;
    try {
      await API.delete(`/member/${id}`);
      setMembers(members.filter((m) => m._id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete member");
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const payload = {
      ...formData,
      age: formData.age ? Number(formData.age) : undefined,
      height: formData.height ? Number(formData.height) : undefined,
      weight: formData.weight ? Number(formData.weight) : undefined,
      injuries: formData.injuries ? formData.injuries.split(",").map(i => i.trim()).filter(Boolean) : [],
    };

    if (editingMember && !payload.password) {
      delete payload.password;
    }

    try {
      if (editingMember) {
        const response = await API.put(`/member/${editingMember._id}`, payload);
        setMembers(members.map((m) => (m._id === editingMember._id ? response.data.data : m)));
      } else {
        const response = await API.post("/member", payload);
        setMembers([response.data.data, ...members]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "An error occurred saving data");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredMembers = members.filter((m) =>
    m.fullName.toLowerCase().includes(search.toLowerCase()) ||
    m.phone.includes(search)
  );

  const totalPages = Math.ceil(filteredMembers.length / limit) || 1;
  const paginatedMembers = filteredMembers.slice((page - 1) * limit, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Members</h2>
          <p className="text-sm text-gray-500">Register new athletes and edit profile configurations</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E05E00] transition-colors"
        >
          <Plus size={16} />
          <span>Add Member</span>
        </button>
      </div>

      <div className="relative max-w-md">
        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search by name or phone number..."
          className="block w-full rounded-lg border border-borders bg-white py-2.5 pl-10 pr-4 text-sm text-[#111827] outline-none focus:border-[#FF6B00]"
        />
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="h-12 w-full animate-pulse rounded-lg bg-white" />
          <div className="h-64 w-full animate-pulse rounded-lg bg-white" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-[#EF4444] text-sm">
          {error}
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <User size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">No Members Found</h3>
          <p className="text-xs text-gray-400 mt-1">Try modifying your search or adding a new member profile.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-borders bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-borders text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Gender</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borders text-[#111827]">
                {paginatedMembers.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold">{member.fullName}</td>
                    <td className="px-6 py-4 font-mono text-xs">{member.phone}</td>
                    <td className="px-6 py-4 capitalize text-gray-500">{member.gender}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold capitalize ${
                          member.status === "active"
                            ? "bg-green-50 text-[#22C55E]"
                            : member.status === "suspended"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-[#EF4444]"
                        }`}
                      >
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 capitalize text-gray-500">{member.membershipType}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openAnalyticsModal(member._id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-[#FF6B00] transition-colors"
                          title="Analytics & Details"
                        >
                          <BarChart2 size={15} />
                        </button>
                        <button
                          onClick={() => openEditModal(member)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-[#111827] transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(member._id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-borders px-6 py-4">
            <span className="text-xs text-gray-500 font-medium">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, filteredMembers.length)} of {filteredMembers.length} entries
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                className="rounded-lg border border-borders bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                className="rounded-lg border border-borders bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl border border-borders max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#111827]">
                {editingMember ? "Edit Member Profile" : "Register New Member"}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-xs text-[#EF4444] font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Password {!editingMember && <span className="text-[#EF4444]">*</span>}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                    required={!editingMember}
                    placeholder={editingMember ? "Leave blank to keep current" : "••••••••"}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Goal</label>
                  <select
                    value={formData.goal}
                    onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  >
                    <option value="muscle_gain">Muscle Gain</option>
                    <option value="fat_loss">Fat Loss</option>
                    <option value="strength">Strength Training</option>
                    <option value="endurance">Endurance</option>
                    <option value="general_fitness">General Fitness</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Experience Level</label>
                  <select
                    value={formData.experienceLevel}
                    onChange={(e) => setFormData({ ...formData, experienceLevel: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Membership Type</label>
                  <select
                    value={formData.membershipType}
                    onChange={(e) => setFormData({ ...formData, membershipType: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="halfYearly">Half Yearly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Injuries (comma separated)</label>
                  <input
                    type="text"
                    value={formData.injuries}
                    onChange={(e) => setFormData({ ...formData, injuries: e.target.value })}
                    placeholder="knee pain, shoulder tear"
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  />
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
                    "Save Member"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Member Analytics / Details Modal */}
      {analyticsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-4xl rounded-xl bg-white p-6 shadow-xl border border-borders max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-6">
              <h3 className="text-lg font-bold text-[#111827] flex items-center gap-2">
                <BarChart2 className="text-[#FF6B00]" size={22} />
                <span>Athlete Details & Analytics</span>
              </h3>
              <button onClick={() => setAnalyticsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {analyticsLoading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF6B00] border-t-transparent" />
                <p className="text-sm font-medium text-gray-500">Retrieving athlete data...</p>
              </div>
            ) : selectedMemberAnalytics ? (
              <div className="space-y-8">
                {/* 1. Member Information */}
                <div className="bg-gray-50 p-5 rounded-xl border border-borders">
                  <h4 className="text-sm font-bold text-[#111827] mb-4 uppercase tracking-wider flex items-center gap-2">
                    <User size={16} className="text-gray-400" />
                    <span>Member Information</span>
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Name</span>
                      <span className="font-bold text-[#111827]">{selectedMemberAnalytics.member.fullName}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Phone</span>
                      <span className="font-semibold text-gray-700 font-mono">{selectedMemberAnalytics.member.phone}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Membership Type</span>
                      <span className="font-semibold text-gray-700 capitalize">{selectedMemberAnalytics.member.membershipType}</span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Status</span>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${
                        selectedMemberAnalytics.member.status === "active" ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                      }`}>
                        {selectedMemberAnalytics.member.status}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Joining Date</span>
                      <span className="font-medium text-gray-600">
                        {new Date(selectedMemberAnalytics.member.joiningDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Membership Expiry</span>
                      <span className="font-medium text-gray-600">
                        {selectedMemberAnalytics.member.membershipExpiry
                          ? new Date(selectedMemberAnalytics.member.membershipExpiry).toLocaleDateString()
                          : "N/A"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Age / Gender</span>
                      <span className="font-medium text-gray-600">
                        {selectedMemberAnalytics.member.age || "N/A"} yrs / <span className="capitalize">{selectedMemberAnalytics.member.gender}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-xs text-gray-400 font-semibold uppercase">Height / Weight</span>
                      <span className="font-medium text-gray-600">
                        {selectedMemberAnalytics.member.height || "N/A"} cm / {selectedMemberAnalytics.member.weight || "N/A"} kg
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  {/* 2. Attendance Analytics */}
                  <div className="border border-borders p-5 rounded-xl bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#111827] mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-[#FF6B00]" />
                        <span>Attendance Analytics</span>
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm pb-2 border-b border-borders">
                          <span className="text-gray-500 font-medium">Total Attendance</span>
                          <span className="font-bold text-[#111827]">{selectedMemberAnalytics.attendance.totalAttendance} visits</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-2 border-b border-borders">
                          <span className="text-gray-500 font-medium">Current Month Attendance</span>
                          <span className="font-bold text-[#111827]">{selectedMemberAnalytics.attendance.currentMonthAttendance} visits</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-2 border-b border-borders">
                          <span className="text-gray-500 font-medium">Average Gym Time Per Visit</span>
                          <span className="font-bold text-[#111827]">{selectedMemberAnalytics.attendance.averageGymTime} minutes</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-2 border-b border-borders">
                          <span className="text-gray-500 font-medium">Monthly Time Spent in Gym</span>
                          <span className="font-bold text-[#111827]">
                            {Math.round(selectedMemberAnalytics.attendance.monthlyTimeSpent / 60)} hours ({selectedMemberAnalytics.attendance.monthlyTimeSpent} mins)
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-2 border-b border-borders">
                          <span className="text-gray-500 font-medium">Total Time Spent in Gym</span>
                          <span className="font-bold text-[#111827]">
                            {Math.round(selectedMemberAnalytics.attendance.totalTimeSpent / 60)} hours ({selectedMemberAnalytics.attendance.totalTimeSpent} mins)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-borders text-xs text-gray-400">
                      Last Visit: {selectedMemberAnalytics.attendance.lastVisit
                        ? new Date(selectedMemberAnalytics.attendance.lastVisit).toLocaleString()
                        : "Never"}
                    </div>
                  </div>

                  {/* 3. Workout Analytics */}
                  <div className="border border-borders p-5 rounded-xl bg-white shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[#111827] mb-4 uppercase tracking-wider flex items-center gap-2">
                        <Dumbbell size={16} className="text-purple-600" />
                        <span>Workout Analytics</span>
                      </h4>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center text-sm pb-2 border-b border-borders">
                          <span className="text-gray-500 font-medium">Total Workouts Completed</span>
                          <span className="font-bold text-[#111827]">{selectedMemberAnalytics.workout.totalWorkoutsCompleted} workouts</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 font-medium">Completion Percentage</span>
                            <span className="font-bold text-[#FF6B00]">{selectedMemberAnalytics.workout.completionPercentage}%</span>
                          </div>
                          <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#FF6B00] h-full rounded-full"
                              style={{ width: `${selectedMemberAnalytics.workout.completionPercentage}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex justify-between items-center text-sm pb-2 border-b border-borders">
                          <span className="text-gray-500 font-medium">Last Workout Date</span>
                          <span className="font-bold text-gray-700">
                            {selectedMemberAnalytics.workout.lastWorkoutDate
                              ? new Date(selectedMemberAnalytics.workout.lastWorkoutDate).toLocaleDateString()
                              : "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-borders text-xs text-gray-400 capitalize">
                      Fitness Goal: {selectedMemberAnalytics.member.goal.replace("_", " ")}
                    </div>
                  </div>
                </div>

                {/* 4. Payment Analytics */}
                <div className="border border-borders p-5 rounded-xl bg-white shadow-sm">
                  <h4 className="text-sm font-bold text-[#111827] mb-4 uppercase tracking-wider flex items-center gap-2">
                    <CreditCard size={16} className="text-green-600" />
                    <span>Payment Analytics</span>
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-3 mb-6">
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                      <span className="block text-xs font-bold text-green-700 uppercase tracking-wider">Paid Months</span>
                      <span className="text-2xl font-black text-green-800">{selectedMemberAnalytics.payment.paidMonths}</span>
                    </div>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 text-center">
                      <span className="block text-xs font-bold text-amber-700 uppercase tracking-wider">Pending Payments</span>
                      <span className="text-2xl font-black text-amber-800">{selectedMemberAnalytics.payment.pendingPayments}</span>
                    </div>
                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 text-center">
                      <span className="block text-xs font-bold text-red-700 uppercase tracking-wider">Overdue Payments</span>
                      <span className="text-2xl font-black text-red-800">{selectedMemberAnalytics.payment.overduePayments}</span>
                    </div>
                  </div>

                  <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Complete Payment History</h5>
                  {selectedMemberAnalytics.payment.history.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-400 font-medium">
                      No payment ledger records found.
                    </div>
                  ) : (
                    <div className="overflow-hidden rounded-lg border border-borders bg-gray-50/20">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-gray-50 border-b border-borders text-gray-400 font-bold uppercase">
                            <tr>
                              <th className="px-4 py-2.5">Due Date</th>
                              <th className="px-4 py-2.5">Amount</th>
                              <th className="px-4 py-2.5">Payment Date</th>
                              <th className="px-4 py-2.5">Status</th>
                              <th className="px-4 py-2.5">Method</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-borders text-[#111827]">
                            {selectedMemberAnalytics.payment.history.map((pay) => (
                              <tr key={pay._id} className="hover:bg-gray-50/50">
                                <td className="px-4 py-2.5 font-medium">{new Date(pay.dueDate).toLocaleDateString()}</td>
                                <td className="px-4 py-2.5 font-bold">₹{pay.amount}</td>
                                <td className="px-4 py-2.5 text-gray-500">
                                  {pay.paymentDate ? new Date(pay.paymentDate).toLocaleDateString() : "--"}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-semibold capitalize text-[10px] ${
                                    pay.status === "paid" ? "bg-green-50 text-green-600" :
                                    pay.status === "overdue" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"
                                  }`}>
                                    {pay.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 capitalize text-gray-500">{pay.paymentMethod || "cash"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 font-semibold">
                Unable to display analytics.
              </div>
            )}

            <div className="flex justify-end gap-3 border-t border-borders pt-4 mt-8">
              <button
                type="button"
                onClick={() => setAnalyticsOpen(false)}
                className="rounded-lg bg-[#111827] px-6 py-2 text-sm font-semibold text-white hover:bg-black transition-colors"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Members;
