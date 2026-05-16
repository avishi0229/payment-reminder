import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, Mail, Lock, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await api.post("/auth/login", formData);
      login(data);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-md w-full bg-white dark:bg-slate-900/50 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-4 text-amber-600 dark:text-amber-500">
            <LogIn size={24} />
          </div>
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-2 text-center">
            Sign in to manage your organization's payments
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
              <input
                required
                type="email"
                placeholder="email@example.com"
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
            className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
          >
            {loading ? "Signing in..." : "Sign In"} <ArrowRight size={20} />
          </button>

          <p className="text-center text-sm text-slate-500 mt-6">
            Don't have an account yet?
          </p>
          <div className="flex flex-col gap-3">
            <Link
              to="/register"
              className="w-full text-center py-3 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              Create New Organization
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
