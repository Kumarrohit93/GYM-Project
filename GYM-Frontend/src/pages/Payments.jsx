import React, { useState, useEffect } from "react";
import API from "../services/api";
import { IndianRupee, Plus, Filter, X, AlertCircle } from "lucide-react";

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [statusFilter, setStatusFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    memberId: "",
    amount: "",
    dueDate: new Date().toISOString().split("T")[0],
    status: "pending",
    paymentMethod: "cash",
  });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, membersRes] = await Promise.all([
        API.get("/payment"),
        API.get("/member"),
      ]);
      setPayments(paymentsRes.data.data || []);
      setMembers(membersRes.data.data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch payment ledger");
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setFormData({
      memberId: "",
      amount: "",
      dueDate: new Date().toISOString().split("T")[0],
      status: "pending",
      paymentMethod: "cash",
    });
    setFormError("");
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    try {
      await API.post("/payment", {
        memberId: formData.memberId,
        amount: Number(formData.amount),
        dueDate: formData.dueDate,
        status: formData.status,
        paymentMethod: formData.paymentMethod,
      });
      fetchData();
      setModalOpen(false);
    } catch (err) {
      console.error(err);
      setFormError(err.response?.data?.message || "Error recording payment entry");
    } finally {
      setFormLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    if (statusFilter === "all") return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#111827]">Payments</h2>
          <p className="text-sm text-gray-500">Record billing transactions, manage ledgers and review pending balances</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#FF6B00] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#E05E00] transition-colors"
        >
          <Plus size={16} />
          <span>Record Payment</span>
        </button>
      </div>

      <div className="flex items-center gap-3">
        <Filter size={16} className="text-gray-400" />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-borders bg-white px-3 py-1.5 text-sm font-medium text-gray-600 outline-none focus:border-[#FF6B00]"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="overdue">Overdue</option>
        </select>
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
      ) : filteredPayments.length === 0 ? (
        <div className="rounded-xl border border-borders bg-white py-16 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-50 text-gray-400 mb-4">
            <IndianRupee size={24} />
          </div>
          <h3 className="text-sm font-semibold text-[#111827]">No Transactions Found</h3>
          <p className="text-xs text-gray-400 mt-1">Adjust filters or record a new transaction to start logs.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-borders bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50/70 border-b border-borders text-xs font-semibold uppercase tracking-wider text-gray-400">
                <tr>
                  <th className="px-6 py-4">Member</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Due Date</th>
                  <th className="px-6 py-4">Payment Date</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borders text-[#111827]">
                {filteredPayments.map((p) => (
                  <tr key={p._id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-semibold">{p.memberId?.fullName || "Deleted Member"}</td>
                    <td className="px-6 py-4 font-bold text-gray-700">₹{p.amount}</td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {new Date(p.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-gray-400">
                      {p.paymentDate ? new Date(p.paymentDate).toLocaleDateString() : "--"}
                    </td>
                    <td className="px-6 py-4 uppercase text-xs text-gray-500 font-medium">{p.paymentMethod}</td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                          p.status === "paid"
                            ? "bg-green-50 text-[#22C55E]"
                            : p.status === "pending"
                            ? "bg-amber-50 text-amber-600"
                            : "bg-red-50 text-[#EF4444]"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl border border-borders">
            <div className="flex items-center justify-between border-b border-borders pb-4 mb-4">
              <h3 className="text-lg font-bold text-[#111827]">Record Billing Transaction</h3>
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

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Amount (₹)</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Payment Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="paid">Paid</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Method</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mt-1 block w-full rounded-lg border border-borders bg-gray-50 py-2.5 px-3 text-sm text-[#111827] focus:border-[#FF6B00] focus:bg-white outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="card">Card</option>
                  </select>
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
                    "Record Entry"
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

export default Payments;
