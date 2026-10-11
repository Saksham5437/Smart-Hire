import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchJobs = async () => {
      try {
        const res = await API.get("/jobs");
        if (isMounted) setJobs(res.data);
      } catch (err) {
        console.error("Failed to load jobs", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchJobs();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = jobs.filter((job) => {
    const search = searchTerm.toLowerCase();
    const skillsMatch = job.skills ? job.skills.toLowerCase().includes(search) : false;
    return (
      (job.title && job.title.toLowerCase().includes(search)) ||
      (job.company && job.company.toLowerCase().includes(search)) ||
      (job.location && job.location.toLowerCase().includes(search)) ||
      (job.employment_type && job.employment_type.toLowerCase().includes(search)) ||
      (job.experience && job.experience.toLowerCase().includes(search)) ||
      skillsMatch
    );
  });

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
              to="/candidate/applications"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Applications
            </Link>

            <Link
              to="/"
              className="text-sm text-neutral-500 hover:text-black transition"
            >
              Sign out
            </Link>
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
            Available Jobs
          </h1>

          <p className="mt-3 text-neutral-500">
            Explore opportunities and find a role that matches your skills.
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search jobs by title, skill, location or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border border-neutral-200 rounded-xl px-5 py-3.5 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
          />
        </div>

        {/* Jobs */}
        <div className="space-y-4">
          {loading ? (
            <div className="border border-neutral-200 rounded-2xl p-12 text-center text-sm text-neutral-500">
              Loading open positions...
            </div>
          ) : filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div
                key={job.id}
                className="border border-neutral-200 rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                  {/* Job information */}
                  <div>
                    <p className="text-sm text-neutral-500">
                      {job.company}
                    </p>

                    <h2 className="text-2xl font-semibold mt-2">
                      {job.title}
                    </h2>

                    <div className="flex flex-wrap gap-4 mt-3 text-sm text-neutral-500">
                      <span>📍 {job.location}</span>
                      <span>•</span>
                      <span>{job.employment_type}</span>
                      <span>•</span>
                      <span>{job.experience}</span>
                    </div>

                    {/* Skills */}
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

                  {/* Action */}
                  <Link
                    to={`/candidate/jobs/${job.id}`}
                    className="inline-flex items-center justify-center bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-neutral-800 hover:-translate-y-0.5 transition cursor-pointer whitespace-nowrap"
                  >
                    View Job
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="border border-neutral-200 rounded-2xl p-12 text-center">
              <h3 className="text-lg font-semibold">
                No jobs found
              </h3>

              <p className="mt-2 text-sm text-neutral-500">
                Try searching for a different role, skill, or company.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default Jobs;