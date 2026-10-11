import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../../services/api";

function CandidateRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "candidate",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Password criteria checks
  const pwd = formData.password;
  const hasMinLength = pwd.length >= 7;
  const hasCapital = /[A-Z]/.test(pwd);
  const hasSmall = /[a-z]/.test(pwd);
  const hasDigit = /[0-9]/.test(pwd);
  const hasSymbol = /[^A-Za-z0-9]/.test(pwd);

  const containsNameOrUsername = () => {
    if (!pwd) return false;
    const pwdLower = pwd.toLowerCase();
    if (formData.name) {
      const tokens = formData.name
        .toLowerCase()
        .split(/[^a-zA-Z0-9]+/)
        .filter((t) => t.length >= 2);
      for (const token of tokens) {
        if (pwdLower.includes(token)) return true;
      }
    }
    if (formData.email && formData.email.includes("@")) {
      const prefix = formData.email.split("@")[0].toLowerCase();
      if (prefix.length >= 3 && pwdLower.includes(prefix)) return true;
    }
    return false;
  };

  const hasNoName = pwd.length > 0 && !containsNameOrUsername();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (!hasMinLength) {
      setError("Password must be at least 7 characters long.");
      return;
    }
    if (!hasCapital) {
      setError("Password must contain at least one capital letter (A-Z).");
      return;
    }
    if (!hasSmall) {
      setError("Password must contain at least one small letter (a-z).");
      return;
    }
    if (!hasDigit) {
      setError("Password must contain at least one digit (0-9).");
      return;
    }
    if (!hasSymbol) {
      setError("Password must contain at least one symbol (e.g. !@#$%^&*).");
      return;
    }
    if (containsNameOrUsername()) {
      setError("Password must not include names used in your full name or username.");
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      setError("Phone number must be exactly 10 digits.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: cleanPhone,
        password: formData.password,
        role: "candidate",
      };

      const res = await API.post("/auth/register", payload);
      localStorage.setItem("smarthire_token", res.data.access_token);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("smarthire_user", JSON.stringify(res.data.user));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/candidate/dashboard");
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (
        typeof detail === "string" &&
        (detail.toLowerCase().includes("email already") ||
          detail.toLowerCase().includes("already registered") ||
          detail.toLowerCase().includes("taken"))
      ) {
        setError("Email already taken.");
      } else {
        setError(detail || "Registration failed. Please check your details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-10">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight"
          >
            SmartHire
          </Link>

          <h1 className="mt-8 text-3xl font-semibold tracking-tight">
            Create your account
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Create an account to apply for opportunities and take AI interviews.
          </p>
        </div>

        {/* Registration Card */}
        <div className="border border-neutral-200 rounded-2xl p-8 shadow-sm">
          {error && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            {/* Full Name */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium mb-1.5"
              >
                Full name
              </label>

              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Phone Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium"
                >
                  Phone number
                </label>
                <span className="text-xs text-neutral-400">
                  {formData.phone.length}/10 digits
                </span>
              </div>

              <input
                id="phone"
                type="tel"
                required
                maxLength={10}
                value={formData.phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                  setFormData({ ...formData, phone: val });
                }}
                placeholder="10-digit mobile number (e.g. 9876543210)"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black font-mono"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium mb-1.5"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a strong password"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />

              {/* Real-time Password Requirements Checklist */}
              <div className="mt-2.5 rounded-xl border border-neutral-200 bg-neutral-50/70 p-3 text-[11px] space-y-1.5">
                <p className="font-semibold text-neutral-600 mb-1 text-[10px] uppercase tracking-wider">
                  Password Requirements:
                </p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  <div className={`flex items-center gap-1.5 ${hasMinLength ? "text-emerald-700 font-medium" : "text-neutral-500"}`}>
                    <span>{hasMinLength ? "✓" : "○"}</span>
                    <span>At least 7 characters</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasCapital ? "text-emerald-700 font-medium" : "text-neutral-500"}`}>
                    <span>{hasCapital ? "✓" : "○"}</span>
                    <span>1 capital letter (A-Z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSmall ? "text-emerald-700 font-medium" : "text-neutral-500"}`}>
                    <span>{hasSmall ? "✓" : "○"}</span>
                    <span>1 small letter (a-z)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasDigit ? "text-emerald-700 font-medium" : "text-neutral-500"}`}>
                    <span>{hasDigit ? "✓" : "○"}</span>
                    <span>1 number (0-9)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${hasSymbol ? "text-emerald-700 font-medium" : "text-neutral-500"}`}>
                    <span>{hasSymbol ? "✓" : "○"}</span>
                    <span>1 symbol (!@#$...)</span>
                  </div>
                  <div className={`flex items-center gap-1.5 ${pwd.length > 0 && hasNoName ? "text-emerald-700 font-medium" : pwd.length > 0 && !hasNoName ? "text-rose-600 font-medium" : "text-neutral-500"}`}>
                    <span>{pwd.length > 0 && hasNoName ? "✓" : pwd.length > 0 && !hasNoName ? "✕" : "○"}</span>
                    <span>No name/username</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium mb-1.5"
              >
                Confirm password
              </label>

              <input
                id="confirmPassword"
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Create Account */}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full bg-black text-white rounded-lg py-3 text-sm font-medium transition-all duration-200 hover:bg-neutral-800 hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login */}
          <p className="text-center text-sm text-neutral-500 mt-7">
            Already have an account?{" "}
            <Link
              to="/candidate/login"
              className="text-black font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back */}
        <div className="text-center mt-8">
          <Link
            to="/"
            className="text-sm text-neutral-500 hover:text-black transition"
          >
            ← Back to SmartHire
          </Link>
        </div>
      </div>
    </main>
  );
}

export default CandidateRegister;