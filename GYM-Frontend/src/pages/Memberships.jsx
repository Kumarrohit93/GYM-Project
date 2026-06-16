import React, { useState, useEffect } from "react";
import API from "../services/api";
import {
  CreditCard,
  Plus,
  RefreshCw,
  X,
  AlertCircle,
  CheckCircle,
  AlertTriangle
} from "lucide-react";

const Memberships = () => {
  const [memberships, setMemberships] = useState([]);
  const [plans, setPlans] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [isRenewal, setIsRenewal] = useState(false);
  const [targetMembershipId, setTargetMembershipId] = useState(null);

  const [formData, setFormData] = useState({
    memberId: "",
    planId: "",
    startDate: new Date().toISOString().split("T")[0],
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [membershipsRes, plansRes, membersRes] = await Promise.all([
        API.get("/membership"),
        API.get("/membership/plans"),
        API.get("/member")
      ]);
      setMemberships(membershipsRes.data.data || []);
      setPlans(plansRes.data.data || []);
      setMembers(membersRes.data.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load membership records");
    } finally {
      setLoading(false);
    }
  };

  const openRegisterModal = () => {
    setIsRenewal(false);
    setTargetMembershipId(null);
    setFormData({
      memberId: "",
      planId: plans[0]?._id || "",
      startDate: new Date().toISOString().split("T")[0],
    });
    setFormError("");
    setModalOpen(true);
  };

  const openRenewalModal = (membership) => {
    setIsRenewal(true);
    setTargetMembershipId(membership._id);
    setFormData({
      memberId: membership.memberId?._id || "",
      planId: membership.planId?._id || plans[0]?._id || "",
      startDate: new Date().toISOString().split("T")[0],
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      if (isRenewal) {
        await API.put(`/membership/${targetMembershipId}`, {
          planId: formData.planId,
          startDate: formData.startDate,
        });
        fetchData();
      } else {
        await API.post("/membership", {
          memberId: formData.memberId,
          planId: formData.planId,
          startDate: formData.startDate,
        });
        fetchData();
      }
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Error saving membership");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Memberships</h2>
          <p className="text-sm text-gray-500">Monitor plans, active passes, and subscription periods</p>
        </div>
        <button
          onClick={openRegisterModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E05E00] transition-colors"
        >
          <Plus size={16} />
          <span>New Membership</span>
        </button>
      </div>

      <div>
        <h3 className="text-base font-bold text-[#111827] mb-4">Available Packages</h3>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan._id} className="rounded-xl border border-borders bg-white p-5 shadow-sm">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pass</span>
              <h4 className="text-lg font-bold text-[#111827] mt-1">{plan.name}</h4>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-[#111827]">₹{plan.price}</span>
                <span className="text-sm text-gray-500">/ {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}</span>
              </div>
            </div>
          ))}
        </div>
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
      ) : memberships.length === 0 ? (
        <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <CreditCard size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">No Memberships Found</h3>
          <p className="text-xs text-gray-400 mt-1">Initialize the directory by registering a member to a plan.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-borders bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-borders text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Current Plan</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borders text-[#111827]">
                {memberships.map((m) => {
                  const isExpired = new Date(m.endDate) < new Date();
                  return (
                    <tr key={m._id} className="hover:bg-gray-50/50">
                      <td className="px-6 py-4 font-semibold">{m.memberId?.fullName || "Deleted Member"}</td>
                      <td className="px-6 py-4 text-gray-500">{m.planId?.name || "N/A"}</td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {new Date(m.startDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-gray-400">
                        {new Date(m.endDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                            m.isActive && !isExpired
                              ? "bg-green-50 text-[#22C55E]"
                              : "bg-red-50 text-[#EF4444]"
                          }`}
                        >
                          {m.isActive && !isExpired ? (
                            <>
                              <CheckCircle size={12} />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle size={12} />
                              <span>Expired</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => openRenewalModal(m)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-borders bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:text-[#FF6B00] transition-colors"
                        >
                          <RefreshCw size={12} />
                          <span>Renew</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-borders">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#111827]">
                {isRenewal ? "Renew Membership" : "Create New Membership"}
              </h3>
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
              {!isRenewal && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Member</label>
                  <select
                    value={formData.memberId}
                    onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
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
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Select Plan</label>
                <select
                  value={formData.planId}
                  onChange={(e) => setFormData({ ...formData, planId: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  required
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} - ₹{p.price} ({p.durationMonths} mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
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
                    "Save Plan"
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

export default Memberships;
