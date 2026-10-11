import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import API from "../../services/api";

function CreateJob() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    company: "SmartHire Tech",
    department: "Engineering",
    location: "Bengaluru, India",
    employment_type: "Full-time",
    description: "",
    skills: "",
    preferred_skills: "",
    education: "Bachelor's degree in CS / AIML",
    experience: "1–3 years",
    deadline: "2026-12-31",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const combinedSkills = formData.preferred_skills
        ? `${formData.skills}, ${formData.preferred_skills}`
        : formData.skills;

      const payload = {
        title: formData.title,
        company: formData.company,
        location: formData.location,
        employment_type: formData.employment_type,
        description: formData.description,
        skills: combinedSkills,
        experience: formData.experience,
        education: formData.education,
        deadline: formData.deadline,
      };

      const user = JSON.parse(localStorage.getItem("smarthire_user") || "{}");
      await API.post("/jobs", payload, {
        params: { created_by: user.id || 1 },
      });

      navigate("/hr/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to create job posting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="border-b border-neutral-200 bg-white">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link
            to="/"
            className="text-xl font-semibold tracking-tight"
          >
            SmartHire
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/hr/dashboard"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Dashboard
            </Link>

            <Link
              to="/hr/applications"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Applications
            </Link>
          </div>
        </div>
      </nav>

      {/* Page */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link
            to="/hr/dashboard"
            className="text-sm text-neutral-500 hover:text-black transition"
          >
            ← Back to dashboard
          </Link>

          <p className="text-sm text-neutral-500 mt-8">
            Recruiter Portal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight mt-2">
            Create a New Job
          </h1>

          <p className="mt-3 text-neutral-500">
            Define the role requirements, required skills, and AI evaluation criteria.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section className="border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Basic Information
            </h2>

            <p className="text-sm text-neutral-500 mt-1 mb-7">
              Provide basic details about this position.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Job Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">
                  Job title
                </label>

                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. AI / ML Engineer"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Company name
                </label>

                <input
                  type="text"
                  required
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="e.g. SmartHire Tech"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Location
                </label>

                <input
                  type="text"
                  required
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Bengaluru, India"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>

              {/* Employment Type */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Employment type
                </label>

                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm bg-white outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Internship</option>
                  <option>Contract</option>
                </select>
              </div>

              {/* Deadline */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Application deadline
                </label>

                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>
            </div>
          </section>

          {/* Job Description */}
          <section className="border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Job Description
            </h2>

            <p className="text-sm text-neutral-500 mt-1 mb-7">
              Describe the role, responsibilities and expectations.
            </p>

            <textarea
              rows="6"
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the role, key responsibilities, and expected outcomes..."
              className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none resize-none focus:border-black focus:ring-1 focus:ring-black transition"
            />
          </section>

          {/* Requirements & Skills */}
          <section className="border border-neutral-200 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-semibold">
              Candidate Requirements & AI Screening Criteria
            </h2>

            <p className="text-sm text-neutral-500 mt-1 mb-7">
              Define mandatory and preferred skills used for automatic AI screening scoring.
            </p>

            <div className="space-y-6">
              {/* Mandatory Skills */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Mandatory Skills (comma separated)
                </label>

                <input
                  type="text"
                  required
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  placeholder="e.g. Python, PyTorch, FastAPI, MySQL"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                />

                <p className="text-xs text-neutral-400 mt-2">
                  Our AI screening engine parses resumes for these keywords with automatic triage: ≥85% is eligible for the AI interview, ≥60% is queued under review, and &lt;60% is not eligible.
                </p>
              </div>

              {/* Preferred Skills */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Preferred Skills (Optional)
                </label>

                <input
                  type="text"
                  value={formData.preferred_skills}
                  onChange={(e) => setFormData({ ...formData, preferred_skills: e.target.value })}
                  placeholder="e.g. Docker, Kubernetes, AWS, NLP"
                  className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Education */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Minimum Education
                  </label>

                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    placeholder="e.g. B.Tech / M.Tech in CS / AIML"
                    className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  />
                </div>

                {/* Experience */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Required Experience
                  </label>

                  <input
                    type="text"
                    value={formData.experience}
                    onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                    placeholder="e.g. 0–2 years"
                    className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black transition"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
            <Link
              to="/hr/dashboard"
              className="inline-flex items-center justify-center border border-neutral-300 px-6 py-3 rounded-lg text-sm font-medium hover:bg-neutral-50 transition cursor-pointer"
            >
              Cancel
            </Link>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center bg-black text-white px-7 py-3 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Publishing Job..." : "Publish Job Opening"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default CreateJob;