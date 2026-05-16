import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, Mail, Lock, User, Key, Building2, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function JoinPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    invite_code: "",
  });
  const [orgPreview, setOrgPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (formData.invite_code.length === 6) {
      checkInviteCode(formData.invite_code);
    } else {
      setOrgPreview(null);
    }
  }, [formData.invite_code]);

  const checkInviteCode = async (code) => {
    try {
      const data = await api.get(`/auth/check-code?code=${code.toUpperCase()}`);
      if (data.valid) {
        setOrgPreview(data.org_name);
      } else {
        setOrgPreview(null);
      }
    } catch (err) {
      setOrgPreview(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/auth/join-org", {
        ...formData,
        invite_code: formData.invite_code.toUpperCase()
      });
      login(data);
      toast.success(`Welcome to ${data.org.name}!`);
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 text-blue-600 dark:text-blue-500">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold">Join Organization</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
            Enter your invite code to join your team
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Invite Code</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                required
                type="text"
                placeholder="XXXXXX"
                maxLength={6}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-4 pl-10 pr-4 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors font-mono text-xl tracking-widest uppercase placeholder:font-sans placeholder:tracking-normal placeholder:text-base"
                value={formData.invite_code}
                onChange={(e) => setFormData({ ...formData, invite_code: e.target.value.toUpperCase() })}
              />
            </div>
            {orgPreview && (
              <div className="flex items-center gap-2 mt-2 ml-1 text-blue-600 dark:text-blue-400 animate-in fade-in slide-in-from-top-1 duration-300">
                <Building2 size={14} />
                <span className="text-sm font-medium italic">Joining: {orgPreview}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Your Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                required
                type="text"
                placeholder="John Doe"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                required
                type="email"
                placeholder="email@example.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-blue-500 text-slate-900 dark:text-white transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || (formData.invite_code.length < 6)}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20"
          >
            {loading ? "Joining..." : "Join Organization"} <ArrowRight size={20} />
          </button>

          <p className="text-center text-sm text-slate-500 mt-4">
            Need to create an organization?{" "}
            <Link to="/register" className="text-blue-600 dark:text-blue-500 hover:underline">Register here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
