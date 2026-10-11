import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function Applications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("smarthire_user") || localStorage.getItem("user");
    if (!storedUser) {
      navigate("/candidate/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);

    const fetchApplications = async () => {
      try {
        const res = await API.get(`/applications?candidate_id=${parsedUser.id}`);
        if (isMounted) setApplications(res.data);
      } catch (err) {
        console.error("Failed to load applications", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchApplications();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const getStageBadgeClass = (stage) => {
    switch (stage) {
      case "Selected":
        return "bg-black text-white font-medium";
      case "Rejected":
        return "bg-red-50 text-red-700 border border-red-200 font-medium";
      case "On Hold":
        return "bg-yellow-50 text-yellow-800 border border-yellow-200 font-medium";
      case "Interview Completed":
        return "bg-neutral-100 text-neutral-800 font-medium";
      case "Interview Scheduled":
        return "bg-black text-white font-medium";
      default:
        return "bg-neutral-100 text-neutral-700";
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
              to="/candidate/dashboard"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Dashboard
            </Link>

            <Link
              to="/candidate/jobs"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Jobs
            </Link>

            <button
              onClick={() => {
                localStorage.clear();
                navigate("/");
              }}
              className="text-sm text-neutral-500 hover:text-black transition cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </nav>

      {/* Page */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <p className="text-sm text-neutral-500 mb-2">
            Candidate Portal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            My Applications
          </h1>

          <p className="mt-3 text-neutral-500">
            Track real-time progress for each position you've applied to.
          </p>
        </div>

        {/* Applications List */}
        {loading ? (
          <div className="border border-neutral-200 rounded-2xl p-12 text-center text-sm text-neutral-500">
            Loading your applications...
          </div>
        ) : applications.length === 0 ? (
          <div className="border border-neutral-200 rounded-2xl p-12 text-center">
            <h3 className="text-lg font-semibold">No Applications Found</h3>
            <p className="mt-2 text-sm text-neutral-500">
              You have not submitted any applications yet.
            </p>
            <Link
              to="/candidate/jobs"
              className="mt-6 inline-flex bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800"
            >
              Explore Available Roles
            </Link>
          </div>
        ) : (
          <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200">
            {applications.map((app) => (
              <div
                key={app.id}
                className="p-7 transition-colors hover:bg-neutral-50/50"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Job information */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-400">Application #{app.id}</span>
                      <span className="text-xs text-neutral-400">•</span>
                      <p className="text-sm text-neutral-500">
                        {app.job?.company || "SmartHire"}
                      </p>
                    </div>

                    <h2 className="text-xl font-semibold mt-1">
                      {app.job?.title || "Position"}
                    </h2>

                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-neutral-500">
                      <span>Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                      <span>•</span>
                      {app.screening_score != null ? (
                        <span className="flex items-center gap-1.5 font-medium">
                          <span>Match Score: {app.screening_score}%</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                              app.eligibility === "Eligible"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : app.eligibility === "Under Review"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {app.eligibility === "Eligible"
                              ? "✓ Eligible for AI Interview (≥85%)"
                              : app.eligibility === "Under Review"
                              ? "⏳ Under Review (60-84%)"
                              : "✕ Not Eligible (<60%)"}
                          </span>
                        </span>
                      ) : (
                        <span>Screening: Under Review</span>
                      )}
                      {app.ai_interview_score != null && (
                        <>
                          <span>•</span>
                          <span className="font-semibold text-black">
                            AI Score: {app.ai_interview_score} / 100
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-3 flex-wrap">
                    <span
                      className={`px-4 py-2 rounded-full text-xs ${getStageBadgeClass(app.stage)}`}
                    >
                      {app.stage}
                    </span>

                    {/* AI Interview Access - Only for Eligible candidates or HR Scheduled */}
                    {app.stage !== "Interview Completed" && app.stage !== "Rejected" && app.stage !== "Selected" && (
                      <>
                        {app.eligibility === "Eligible" || app.stage === "Interview Scheduled" ? (
                          <Link
                            to={`/candidate/interview/rules/${app.id}`}
                            className="inline-flex rounded-lg bg-black px-4 py-2 text-xs font-medium text-white transition hover:bg-neutral-800 whitespace-nowrap"
                          >
                            Start AI Interview →
                          </Link>
                        ) : app.eligibility === "Under Review" ? (
                          <span className="inline-flex rounded-lg bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-medium text-amber-800 whitespace-nowrap">
                            ⏳ Pending HR Review
                          </span>
                        ) : (
                          <span className="inline-flex rounded-lg bg-rose-50 border border-rose-200 px-3.5 py-1.5 text-xs font-medium text-rose-700 whitespace-nowrap">
                            ✕ Interview Locked (Score &lt; 60%)
                          </span>
                        )}
                      </>
                    )}

                    {app.stage === "Interview Completed" && (
                      <Link
                        to={`/candidate/interview/result/${app.id}`}
                        className="inline-flex rounded-lg border border-neutral-300 px-4 py-2 text-xs font-medium text-black transition hover:bg-neutral-100 whitespace-nowrap"
                      >
                        View AI Evaluation →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Browse Jobs */}
        <div className="mt-8 border border-neutral-200 rounded-2xl p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
          <div>
            <h2 className="font-semibold">
              Looking for another opportunity?
            </h2>

            <p className="text-sm text-neutral-500 mt-1">
              Explore the latest jobs available on SmartHire.
            </p>
          </div>

          <Link
            to="/candidate/jobs"
            className="inline-flex items-center justify-center bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:-translate-y-0.5 transition cursor-pointer"
          >
            Browse Jobs
          </Link>
        </div>
      </div>
    </main>
  );
}

export default Applications;