import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function HRDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("smarthire_user") || localStorage.getItem("user");
    if (!storedUser) {
      navigate("/hr/login");
      return;
    }
    const parsed = JSON.parse(storedUser);
    if (parsed.role !== "hr") {
      navigate("/hr/login");
      return;
    }
    if (isMounted) setUser(parsed);

    const loadData = async () => {
      try {
        const [jobsRes, appsRes] = await Promise.all([
          API.get("/jobs"),
          API.get("/applications"),
        ]);
        if (isMounted) {
          setJobs(jobsRes.data);
          setApplications(appsRes.data);
        }
      } catch (err) {
        console.error("Dashboard load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const totalApplications = applications.length;
  const screenedCount = applications.filter((a) => a.screening_score != null).length;
  const interviewsCount = applications.filter(
    (a) => a.ai_interview_score != null || a.stage.includes("Interview")
  ).length;

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/");
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
              to="/hr/applications"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Applications Pipeline
            </Link>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
              {user?.name || "HR Manager"} ({user?.company || "SmartHire"})
            </span>

            <button
              onClick={handleSignOut}
              className="text-sm text-neutral-500 hover:text-black transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <p className="text-sm text-neutral-500 mb-2">
              Recruiter Portal
            </p>

            <h1 className="text-4xl font-semibold tracking-tight">
              Recruitment Dashboard
            </h1>

            <p className="mt-3 text-neutral-500">
              Live pipeline metrics, automated AI screening, and evaluation telemetry.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              to="/hr/applications"
              className="inline-flex items-center justify-center border border-neutral-300 px-5 py-3 rounded-lg text-sm font-medium hover:bg-neutral-50 transition cursor-pointer"
            >
              View Pipeline
            </Link>

            <Link
              to="/hr/jobs/create"
              className="inline-flex items-center justify-center bg-black text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:-translate-y-0.5 transition cursor-pointer"
            >
              + Create Job
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
          <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition">
            <p className="text-sm text-neutral-500">
              Active Job Postings
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {jobs.length}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition">
            <p className="text-sm text-neutral-500">
              Total Applications
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {totalApplications}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition">
            <p className="text-sm text-neutral-500">
              AI Screened
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {screenedCount}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition">
            <p className="text-sm text-neutral-500">
              Interviews Conducted
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {interviewsCount}
            </p>
          </div>
        </div>

        {/* Active Jobs */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">
                Active Job Postings
              </h2>

              <p className="text-sm text-neutral-500 mt-1">
                Monitor live candidate applications by role.
              </p>
            </div>

            <Link
              to="/hr/jobs/create"
              className="text-sm font-medium hover:underline"
            >
              + Create new
            </Link>
          </div>

          {jobs.length === 0 ? (
            <div className="border border-neutral-200 rounded-2xl p-8 text-center text-sm text-neutral-500">
              No jobs posted yet. Click "+ Create Job" to add one.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200">
              {jobs.map((job) => {
                const jobApps = applications.filter((a) => a.job_id === job.id);
                const jobScreened = jobApps.filter((a) => a.screening_score != null).length;
                const jobInterviews = jobApps.filter(
                  (a) => a.ai_interview_score != null || a.stage.includes("Interview")
                ).length;

                return (
                  <div key={job.id} className="p-6 hover:bg-neutral-50/50 transition">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">
                            {job.title}
                          </h3>

                          <span className="px-2.5 py-0.5 text-xs rounded-full bg-black text-white">
                            {job.status}
                          </span>
                        </div>

                        <p className="text-sm text-neutral-500 mt-1">
                          {job.company} • {job.location} • {jobApps.length} applications
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-8">
                        <div>
                          <p className="text-xs text-neutral-500">AI Screened</p>
                          <p className="mt-1 font-semibold">{jobScreened}</p>
                        </div>

                        <div>
                          <p className="text-xs text-neutral-500">Interviews</p>
                          <p className="mt-1 font-semibold">{jobInterviews}</p>
                        </div>

                        <Link
                          to={`/hr/applications?job=${encodeURIComponent(job.title)}`}
                          className="text-sm font-medium hover:underline text-black"
                        >
                          View applications →
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Candidates */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">
                Candidate Pipeline
              </h2>

              <p className="text-sm text-neutral-500 mt-1">
                Candidate records linked directly by Application ID.
              </p>
            </div>

            <Link
              to="/hr/applications"
              className="text-sm font-medium hover:underline"
            >
              View Full Pipeline ({applications.length}) →
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="border border-neutral-200 rounded-2xl p-8 text-center text-sm text-neutral-500">
              No candidate applications submitted yet.
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200">
              {applications.slice(0, 5).map((app) => (
                <div key={app.id} className="p-6 hover:bg-neutral-50/50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400">#{app.id}</span>
                        <Link
                          to={`/hr/applications/${app.id}`}
                          className="font-semibold text-base hover:underline"
                        >
                          {app.candidate?.name || "Candidate"}
                        </Link>
                      </div>

                      <p className="text-sm text-neutral-500 mt-0.5">
                        {app.job?.title || "Role"} • {app.candidate?.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-neutral-500">AI Match</p>
                        <p className="font-semibold mt-0.5">
                          {app.screening_score != null ? `${app.screening_score}%` : "Pending"}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                          app.eligibility === "Eligible"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : app.eligibility === "Under Review"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {app.eligibility}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${
                          ["AI Interview Completed", "Selected", "On Hold"].includes(app.stage)
                            ? "bg-black text-white"
                            : app.stage === "Rejected"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {app.stage}
                      </span>

                      <Link
                        to={`/hr/applications/${app.id}`}
                        className="text-sm font-medium underline hover:text-neutral-600"
                      >
                        Review Profile →
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default HRDashboard;