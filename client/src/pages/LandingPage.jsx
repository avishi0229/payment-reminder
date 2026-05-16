import { Link } from "react-router-dom";
import { Building2, UserPlus, ArrowRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-slate-50 to-slate-100 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950">
      <div className="max-w-4xl w-full text-center mb-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 dark:from-amber-200 dark:via-amber-400 dark:to-amber-200 bg-clip-text text-transparent">
          Payment Reminders Simplified
        </h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Automate your business collections. Track invoices, send smart reminders, and get paid faster with our multi-tenant platform.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl blur opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl flex flex-col items-center text-center hover:border-amber-500/50 transition-colors shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="h-16 w-16 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 text-amber-600 dark:text-amber-500">
              <Building2 size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Create Organization</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Start a new account for your business. You'll be the administrator and can invite team members.
            </p>
            <Link
              to="/register"
              className="w-full py-4 px-6 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-amber-500/20"
            >
              Get Started <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        <div className="group relative">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-slate-500 to-slate-700 rounded-2xl blur opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition duration-500"></div>
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl flex flex-col items-center text-center hover:border-slate-500/50 transition-colors shadow-xl shadow-slate-200/50 dark:shadow-none">
            <div className="h-16 w-16 bg-slate-500/10 rounded-xl flex items-center justify-center mb-6 text-slate-600 dark:text-slate-500">
              <UserPlus size={32} />
            </div>
            <h2 className="text-2xl font-bold mb-4">Login to Account</h2>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Access your existing organization and manage your invoices, reminders and team settings.
            </p>
            <Link
              to="/login"
              className="w-full py-4 px-6 bg-slate-800 dark:bg-slate-800 hover:bg-slate-700 dark:hover:bg-slate-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-slate-800/20"
            >
              Log In <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
