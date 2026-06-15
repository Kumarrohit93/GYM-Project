import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPath } from "../utils/routes";
import { Eye, EyeOff, Lock, User, AlertCircle, Phone } from "lucide-react";
import { motion } from "framer-motion";

const Login = () => {
  const { login, token, role } = useAuth();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState(() => localStorage.getItem("gym_last_role") || "member");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (token && role) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError("");
    setLoading(true);

    const result = await login(username, password, selectedRole, rememberMe);
    setLoading(false);

    if (result.success) {
      navigate(getDashboardPath(result.role));
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F8F9FA] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md rounded-xl border border-borders bg-white p-8 shadow-sm"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#FF6B00] text-white text-2xl font-bold shadow-sm">
            AI
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#111827]">
            Welcome to GymAI Pro
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Sign in to access your administrative dashboard or member app
          </p>
        </div>

        {/* Portal Selection Tabs */}
        <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => {
              setSelectedRole("admin");
              setError("");
              setUsername("");
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
              selectedRole === "admin"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Admin Portal
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedRole("member");
              setError("");
              setUsername("");
            }}
            className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
              selectedRole === "member"
                ? "bg-white text-[#111827] shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            Member App
          </button>
        </div>

        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-[#EF4444]">
            <AlertCircle size={18} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Login Failed</p>
              <p className="text-xs text-red-500">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              {selectedRole === "admin" ? "Username or Email" : "Phone Number"}
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                {selectedRole === "admin" ? <User size={18} /> : <Phone size={18} />}
              </span>
              <input
                type={selectedRole === "admin" ? "text" : "tel"}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={selectedRole === "admin" ? "admin" : "9876543210"}
                className="block w-full rounded-lg border border-borders bg-gray-50 py-2.5 pl-10 pr-4 text-sm text-[#111827] placeholder-gray-400 outline-none transition-all focus:border-[#FF6B00] focus:bg-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
              Password
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Lock size={18} />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="block w-full rounded-lg border border-borders bg-gray-50 py-2.5 pl-10 pr-10 text-sm text-[#111827] placeholder-gray-400 outline-none transition-all focus:border-[#FF6B00] focus:bg-white"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-borders text-[#FF6B00] focus:ring-[#FF6B00]"
              />
              <span className="text-xs text-gray-500 font-medium select-none">
                Remember my session
              </span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-lg bg-[#FF6B00] py-3 text-sm font-semibold text-white transition-colors hover:bg-[#E05E00] focus:outline-none disabled:bg-orange-300"
          >
            {loading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
