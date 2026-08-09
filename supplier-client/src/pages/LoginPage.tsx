import { type FC, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Share2, LogIn } from "lucide-react";
import { login } from "../services/authService";

const LoginPage: FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSubmit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();

    if (!email.trim() || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      toast.success("Logged in successfully.");
      navigate("/");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="bg-[#2563EB] p-2 rounded-lg">
            <Share2 className="w-6 h-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-slate-900 tracking-tight">
            SyncMatch
          </span>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-6">
            Sign in to your account to continue.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#2563EB] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <LogIn className="w-4 h-4" />
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{" "}
            <Link to="/register" className="text-[#2563EB] font-medium hover:underline">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
