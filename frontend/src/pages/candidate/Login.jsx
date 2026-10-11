import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function UnifiedLogin({ initialRole }) {
  const location = useLocation();
  const navigate = useNavigate();

  // Determine starting role from prop or URL
  const determineRole = () => {
    if (initialRole) return initialRole;
    if (location.pathname.includes("/hr")) return "hr";
    return "candidate";
  };

  const [role, setRole] = useState(determineRole);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(determineRole());
    setError("");
  }, [location.pathname, initialRole]);

  const handleRoleSwitch = (newRole) => {
    if (newRole === role) return;
    setRole(newRole);
    setError("");
    setEmail("");
    setPassword("");
  };

  const handleDemoFill = () => {
    setError("");
    if (role === "candidate") {
      setEmail("rahul@example.com");
      setPassword("candidate123");
    } else {
      setEmail("hr@smarthire.com");
      setPassword("admin123");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await API.post("/auth/login", { email, password, role });
      
      if (role === "candidate" && res.data.user.role !== "candidate") {
        setError("Access denied: Recruiter account detected. Please switch to the Recruiter Login tab above.");
        setLoading(false);
        return;
      }
      if (role === "hr" && res.data.user.role !== "hr") {
        setError("Access denied: Candidate account detected. Please switch to the Candidate Login tab above.");
        setLoading(false);
        return;
      }

      localStorage.setItem("smarthire_token", res.data.access_token);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("smarthire_user", JSON.stringify(res.data.user));
      localStorage.setItem("user", JSON.stringify(res.data.user));

      if (role === "hr") {
        navigate("/hr/dashboard");
      } else {
        navigate("/candidate/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.detail || `Invalid ${role === "hr" ? "recruiter" : "candidate"} credentials.`);
    } finally {
      setLoading(false);
    }
  };

  const isHR = role === "hr";

  return (
    <main className="min-h-screen bg-neutral-50 text-black flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Branding */}
        <div className="text-center mb-8">
          <Link
            to="/"
            className="text-2xl font-semibold tracking-tight hover:opacity-80 transition"
          >
            SmartHire
          </Link>

          <p className="mt-2 text-xs font-medium uppercase tracking-wider text-neutral-400">
            {isHR ? "Recruiter Workspace Access" : "Candidate Portal Access"}
          </p>
        </div>

        {/* Card Container */}
        <div className="bg-white border border-neutral-200 rounded-3xl p-7 sm:p-8 shadow-sm">
          
          {/* Switcher Toggle Header */}
          <div className="mb-8">
            <div className="text-center mb-3">
              <span className="text-xs font-medium text-neutral-500">Select Login Portal</span>
            </div>
            
            <div className="grid grid-cols-2 p-1 bg-neutral-100 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => handleRoleSwitch("candidate")}
                className={`cursor-pointer flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  !isHR
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                <span>👤</span>
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch("hr")}
                className={`cursor-pointer flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isHR
                    ? "bg-white text-black shadow-sm"
                    : "text-neutral-500 hover:text-black"
                }`}
              >
                <span>🏢</span>
                <span>HR / Recruiter</span>
              </button>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-6">
            <h1 className="text-2xl font-semibold tracking-tight">
              {isHR ? "Recruiter sign in" : "Candidate sign in"}
            </h1>
            <p className="mt-1.5 text-xs text-neutral-500">
              {isHR
                ? "Sign in to manage job requisitions, candidate evaluation & AI pipelines."
                : "Sign in to track job applications, complete AI interviews & check status."}
            </p>
          </div>

          {/* Error Notice */}
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-medium text-red-700 leading-relaxed">
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-medium text-neutral-700 mb-1.5"
              >
                {isHR ? "Work Email" : "Email Address"}
              </label>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isHR ? "hr@smarthire.com" : "rahul@example.com"}
                className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black bg-white"
              />
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-neutral-700"
                >
                  Password
                </label>
              </div>

              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-neutral-300 rounded-xl px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black bg-white"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-black text-white rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:bg-neutral-800 hover:-translate-y-0.5 disabled:opacity-50 mt-2"
            >
              {loading
                ? "Signing in..."
                : isHR
                ? "Access Recruiter Workspace →"
                : "Sign In as Candidate →"}
            </button>
          </form>

          {/* Demo Quick-Fill Button */}
          <div className="mt-5 pt-4 border-t border-neutral-100 text-center">
            <button
              type="button"
              onClick={handleDemoFill}
              className="cursor-pointer text-xs text-neutral-500 hover:text-black inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 transition"
            >
              <span>⚡ Fill Demo Credentials:</span>
              <span className="font-semibold text-neutral-700">
                {isHR ? "hr@smarthire.com" : "rahul@example.com"}
              </span>
            </button>
          </div>

          {/* Register Link */}
          <p className="text-center text-xs text-neutral-500 mt-5">
            Don't have an account?{" "}
            <Link
              to={isHR ? "/hr/register" : "/candidate/register"}
              className="text-black font-semibold hover:underline"
            >
              {isHR ? "Create recruiter account" : "Create candidate account"}
            </Link>
          </p>
        </div>

        {/* Security and Return Links */}
        <div className="text-center mt-6">
          <Link
            to="/"
            className="text-xs text-neutral-500 hover:text-black transition"
          >
            ← Back to SmartHire Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default UnifiedLogin;