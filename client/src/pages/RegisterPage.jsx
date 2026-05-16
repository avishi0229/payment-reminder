import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Mail, Lock, User, Key, Copy, Check, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    org_name: "",
  });
  const [showModal, setShowModal] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/auth/register-org", formData);
      login(data);
      toast.success("Organization created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_bottom_left,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-500">
            <Building2 size={24} />
          </div>
          <h1 className="text-2xl font-bold">Create Organization</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
            Set up your organization and admin account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Admin Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Your Name"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white transition-colors"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Org Name</label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                <input
                  required
                  type="text"
                  placeholder="Company Name"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white transition-colors"
                  value={formData.org_name}
                  onChange={(e) => setFormData({ ...formData, org_name: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                required
                type="email"
                placeholder="email@company.com"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white transition-colors"
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
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-10 pr-4 focus:outline-none focus:border-amber-500 text-slate-900 dark:text-white transition-colors"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            {loading ? "Creating..." : "Create Organization"} <ArrowRight size={20} />
          </button>

          <p className="text-center text-sm text-slate-500 mt-4">
            Already have an organization?{" "}
            <Link to="/login" className="text-amber-600 dark:text-amber-500 hover:underline">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
