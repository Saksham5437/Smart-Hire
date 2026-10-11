import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function CandidateDashboard() {
  const [user, setUser] = useState(null);
  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      const storedUser = localStorage.getItem("smarthire_user") || localStorage.getItem("user");
      if (!storedUser) {
        navigate("/candidate/login");
        return;
      }
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== "candidate") {
        navigate("/candidate/login");
        return;
      }
      if (isMounted) setUser(parsedUser);

      try {
        const [appsRes, jobsRes] = await Promise.allSettled([
          API.get(`/applications?candidate_id=${parsedUser.id}`),
          API.get("/jobs"),
        ]);
        if (isMounted) {
          if (appsRes.status === "fulfilled") {
            setApplications(appsRes.value.data);
          } else {
            console.warn("Applications fetch warning:", appsRes.reason);
          }
          if (jobsRes.status === "fulfilled") {
            setJobs(jobsRes.value.data);
          } else {
            console.warn("Jobs fetch warning:", jobsRes.reason);
          }
        }
      } catch (err) {
        console.error("Failed to load candidate dashboard data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleSignOut = () => {
    localStorage.clear();
    navigate("/");
  };

  const aiInterviewsCount = applications.filter(
    (a) => a.stage === "Interview Scheduled" || a.stage === "Interview Completed" || a.ai_interview_score
  ).length;

  const humanInterviewsCount = applications.filter(
    (a) => a.stage === "Interview Scheduled" || a.stage === "HR Review"
  ).length;

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
              to="/candidate/jobs"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Browse Jobs
            </Link>
            <Link
              to="/candidate/applications"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              My Applications
            </Link>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
              {user?.name || "Candidate"}
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
        {/* Welcome */}
        <div className="mb-10">
          <p className="text-sm text-neutral-500 mb-2">
            Candidate Portal
          </p>

          <h1 className="text-4xl font-semibold tracking-tight">
            Welcome back, {user?.name || "Candidate"} 👋
          </h1>

          <p className="mt-3 text-neutral-500">
            Track your applications and discover new opportunities matched with your skills.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition">
            <p className="text-sm text-neutral-500">
              Total Applications
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {applications.length}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition">
            <p className="text-sm text-neutral-500">
              AI Interviews
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {aiInterviewsCount}
            </p>
          </div>

          <div className="border border-neutral-200 rounded-2xl p-6 hover:border-neutral-300 transition">
            <p className="text-sm text-neutral-500">
              Active Opportunities
            </p>

            <p className="mt-3 text-3xl font-semibold">
              {jobs.length}
            </p>
          </div>
        </div>

        {/* Available Jobs */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">
                Available Opportunities
              </h2>

              <p className="text-sm text-neutral-500 mt-1">
                Explore positions and launch your automated recruitment process.
              </p>
            </div>

            <Link
              to="/candidate/jobs"
              className="text-sm font-medium hover:underline cursor-pointer"
            >
              View all ({jobs.length}) →
            </Link>
          </div>

          {/* Job Cards */}
          <div className="grid gap-4">
            {jobs.slice(0, 2).map((job) => (
              <div
                key={job.id}
                className="border border-neutral-200 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  <div>
                    <p className="text-sm text-neutral-500">
                      {job.company} • {job.location}
                    </p>

                    <h3 className="text-2xl font-semibold mt-2">
                      {job.title}
                    </h3>

                    <p className="text-sm text-neutral-600 mt-2">
                      {job.description}
                    </p>

                    <div className="flex flex-wrap gap-2 mt-5">
                      {job.skills?.split(",").map((skill) => (
                        <span
                          key={skill.trim()}
                          className="px-3 py-1.5 text-xs border border-neutral-200 rounded-full"
                        >
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                  </div>

                  <Link
                    to={`/candidate/jobs/${job.id}`}
                    className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 transition cursor-pointer text-center whitespace-nowrap"
                  >
                    View Job & Apply
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Applications */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-semibold">
                My Applications
              </h2>

              <p className="text-sm text-neutral-500 mt-1">
                Real-time recruitment status linked to your exact workflow ID.
              </p>
            </div>

            <Link
              to="/candidate/applications"
              className="text-sm font-medium hover:underline cursor-pointer"
            >
              View all ({applications.length}) →
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="border border-neutral-200 rounded-2xl p-10 text-center">
              <p className="text-sm text-neutral-500">
                You haven't submitted any job applications yet.
              </p>
              <Link
                to="/candidate/jobs"
                className="mt-4 inline-flex bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800"
              >
                Browse Available Openings
              </Link>
            </div>
          ) : (
            <div className="border border-neutral-200 rounded-2xl overflow-hidden divide-y divide-neutral-200">
              {applications.map((app) => (
                <div key={app.id} className="px-6 py-5 flex items-center justify-between hover:bg-neutral-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-neutral-400">#{app.id}</span>
                      <p className="font-medium text-black">
                        {app.job?.title || "Role"}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-neutral-500">
                      <span>{app.job?.company || "SmartHire"} • Applied on {new Date(app.created_at).toLocaleDateString()}</span>
                      {app.screening_score != null && (
                        <>
                          <span>•</span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              app.eligibility === "Eligible"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : app.eligibility === "Under Review"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : "bg-rose-50 text-rose-700 border-rose-200"
                            }`}
                          >
                            {app.eligibility === "Eligible"
                              ? `Match ${app.screening_score}% (Eligible)`
                              : app.eligibility === "Under Review"
                              ? `Match ${app.screening_score}% (Under Review)`
                              : `Match ${app.screening_score}% (Not Eligible)`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-3 py-1.5 rounded-full font-medium bg-neutral-100 text-black">
                      {app.stage}
                    </span>

                    {/* Start interview allowed if Eligible or scheduled */}
                    {(app.eligibility === "Eligible" || app.stage === "Interview Scheduled") &&
                      app.stage !== "Interview Completed" &&
                      app.stage !== "Rejected" &&
                      app.stage !== "Selected" && (
                        <Link
                          to={`/candidate/interview/rules/${app.id}`}
                          className="bg-black text-white px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-neutral-800 transition"
                        >
                          Start Interview →
                        </Link>
                      )}

                    {app.stage === "Interview Completed" && (
                      <Link
                        to={`/candidate/interview/result/${app.id}`}
                        className="border border-neutral-300 px-3.5 py-1.5 rounded-lg text-xs font-medium hover:bg-neutral-100 transition"
                      >
                        View AI Result →
                      </Link>
                    )}
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

export default CandidateDashboard;