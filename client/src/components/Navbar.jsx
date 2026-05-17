import { Link, useLocation, Outlet } from "react-router-dom";
import { 
  LayoutDashboard, 
  FileText, 
  History, 
  LogOut, 
  Building2, 
  Copy, 
  Check,
  User as UserIcon,
  Mail,
  RefreshCw,
  Power,
  PowerOff,
  Menu,
  X,
  PlusCircle
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import DarkModeToggle from "./DarkModeToggle";
import api from "../api/client";

export function AppLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { org } = useAuth();
  const location = useLocation();

  const toggleDrawer = () => setIsDrawerOpen(!isDrawerOpen);
  const closeDrawer = () => setIsDrawerOpen(false);

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
        <button onClick={toggleDrawer} className="p-2 -ml-2 text-slate-600 dark:text-slate-400">
          <Menu size={24} />
        </button>
        <span className="font-bold text-lg text-slate-900 dark:text-white truncate max-w-[150px]">
          {org?.name || "Verma"}
        </span>
        <div className="flex items-center gap-1">
          <DarkModeToggle />
        </div>
      </div>

      {/* Drawer Overlay */}
      {isDrawerOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 animate-in fade-in duration-300"
          onClick={closeDrawer}
        />
      )}

      <Navbar isOpen={isDrawerOpen} onClose={closeDrawer} />
      
      <main className="main-content flex-1 p-8 md:ml-64 overflow-y-auto">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-[70px] bg-slate-900 border-t border-slate-800 flex items-center justify-around px-2 z-40 pb-safe">
        <BottomTab to="/dashboard" icon={LayoutDashboard} label="Dashboard" active={location.pathname === '/dashboard'} />
        <BottomTab to="/invoices" icon={FileText} label="Invoices" active={location.pathname === '/invoices'} />
        <Link 
          to="/invoices/new"
          className="flex flex-col items-center justify-center -translate-y-4"
        >
          <div className="h-14 w-14 bg-amber-500 rounded-full flex items-center justify-center shadow-xl shadow-amber-500/20 text-slate-950">
            <PlusCircle size={32} />
          </div>
          <span className="text-[10px] font-bold text-amber-500 mt-1">New</span>
        </Link>
        <BottomTab to="/reminders" icon={History} label="Reminders" active={location.pathname === '/reminders'} />
      </div>
    </div>
  );
}

function BottomTab({ to, icon: Icon, label, active }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center gap-1 px-3">
      <Icon size={24} className={active ? "text-amber-500" : "text-slate-500"} />
      <span className={`text-[10px] font-bold ${active ? "text-amber-500" : "text-slate-500"}`}>{label}</span>
    </Link>
  );
}

export function Navbar({ isOpen, onClose }) {
  const { user, org, logout } = useAuth();
  const location = useLocation();
  const [copied, setCopied] = useState(false);
  const [gmailStatus, setGmailStatus] = useState({ connected: false, loading: true });

  useEffect(() => {
    checkGmailStatus();
  }, []);

  const checkGmailStatus = async () => {
    try {
      const res = await api.get("/auth/gmail/status");
      setGmailStatus({ ...res, loading: false });
    } catch (e) {
      setGmailStatus({ connected: false, loading: false });
    }
  };

  const connectGmail = async () => {
    try {
      const { url } = await api.get("/auth/gmail/connect");
      window.location.href = url;
    } catch (e) {
      toast.error("Failed to connect Gmail");
    }
  };

  const disconnectGmail = async () => {
    if (!confirm("Are you sure you want to disconnect your Gmail account?")) return;
    try {
      await api.post("/auth/gmail/disconnect");
      toast.success("Gmail disconnected");
      setGmailStatus({ connected: false, email: null });
    } catch (err) {
      toast.error('Failed to disconnect');
      console.error(err);
    }
  };

  const copyInviteCode = () => {
    if (!org?.invite_code) return;
    navigator.clipboard.writeText(org.invite_code);
    setCopied(true);
    toast.success("Invite code copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const navItems = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Invoices", path: "/invoices", icon: FileText },
    { name: "Reminders", path: "/reminders", icon: History },
  ];

  return (
    <nav className={`sidebar ${isOpen ? 'open' : ''} w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col md:fixed h-full z-50 transition-colors`}>
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Building2 className="text-slate-950" size={24} />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-lg leading-tight truncate text-slate-900 dark:text-white">{org?.name || "App Name"}</span>
            <span className="text-xs text-slate-400 dark:text-slate-500 font-medium tracking-wide uppercase">Business Hub</span>
          </div>
        </div>
        <button onClick={onClose} className="md:hidden p-2 -mr-2 text-slate-400">
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto" onClick={() => onClose && onClose()}>
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all group ${
              location.pathname === item.path
                ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/10"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/50"
            }`}
          >
            <item.icon size={20} className={location.pathname === item.path ? "" : "group-hover:scale-110 transition-transform"} />
            {item.name}
          </Link>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800 space-y-4">
        {/* User Info & Invite Code */}
        <div className="bg-slate-100 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-500 dark:text-slate-300">
              <UserIcon size={20} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-sm truncate text-slate-900 dark:text-white">{user?.name}</span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Gmail Status */}
        <div className="bg-slate-100 dark:bg-slate-800/30 rounded-2xl p-4 border border-slate-200 dark:border-slate-800/50">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">Gmail Service</span>
              <div className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${gmailStatus.connected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'}`} />
                <span className={`text-[10px] font-bold ${gmailStatus.connected ? 'text-emerald-500' : 'text-red-500'}`}>
                  {gmailStatus.connected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {gmailStatus.connected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Mail size={14} className="shrink-0" />
                  <span className="truncate">{gmailStatus.gmail}</span>
                </div>
                <button
                  onClick={disconnectGmail}
                  className="w-full flex items-center justify-center gap-2 bg-slate-200 dark:bg-slate-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 dark:hover:text-white text-slate-600 dark:text-slate-400 py-1.5 rounded-lg text-[10px] font-bold transition-all"
                >
                  <PowerOff size={12} />
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectGmail}
                className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-amber-500/10"
              >
                <Power size={12} />
                Connect Gmail
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between px-2">
          <DarkModeToggle />
          <button
            onClick={logout}
            className="flex items-center gap-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 font-medium text-sm transition-colors group"
          >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
