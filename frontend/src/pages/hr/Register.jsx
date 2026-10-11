import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../../services/api";

function HRRegister() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    company: "",
    department: "",
    designation: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: "hr",
        company: formData.company,
        department: formData.department,
        designation: formData.designation,
      };

      const res = await API.post("/auth/register", payload);
      localStorage.setItem("smarthire_token", res.data.access_token);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("smarthire_user", JSON.stringify(res.data.user));
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/hr/dashboard");
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
        setError(detail || "Registration failed. Please check your information.");
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
            Create recruiter account
          </h1>

          <p className="mt-3 text-sm text-neutral-500">
            Sign up to manage job openings, AI screening, and interview pipelines.
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
                placeholder="e.g. Sarah Jenkins"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Work Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium mb-1.5"
              >
                Work email
              </label>

              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="sarah@company.com"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Company & Department */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="company"
                  className="block text-sm font-medium mb-1.5"
                >
                  Company name
                </label>

                <input
                  id="company"
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. Acme Corp"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="block text-sm font-medium mb-1.5"
                >
                  Department
                </label>

                <input
                  id="department"
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Talent Acquisition"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Designation */}
            <div>
              <label
                htmlFor="designation"
                className="block text-sm font-medium mb-1.5"
              >
                Job designation / title
              </label>

              <input
                id="designation"
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Senior Technical Recruiter"
                className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  placeholder="••••••••"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>

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
                  placeholder="••••••••"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-2.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="cursor-pointer w-full bg-black text-white rounded-lg py-3 text-sm font-medium transition-all duration-200 hover:bg-neutral-800 hover:-translate-y-0.5 disabled:opacity-50 mt-2"
            >
              {loading ? "Creating Recruiter Account..." : "Create Recruiter Account"}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-neutral-500 mt-6">
            Already have a recruiter account?{" "}
            <Link
              to="/hr/login"
              className="text-black font-medium hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
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

export default HRRegister;
