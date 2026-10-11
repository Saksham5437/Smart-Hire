import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function JobDetails() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchJob = async () => {
      try {
        const res = await API.get(`/jobs/${jobId}`);
        if (isMounted) setJob(res.data);
      } catch (err) {
        console.error("Failed to load job details", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchJob();
    return () => {
      isMounted = false;
    };
  }, [jobId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-sm text-neutral-500">
        Loading role details...
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-semibold">Job Not Found</h2>
        <p className="text-sm text-neutral-500 mt-2">The requested position could not be found.</p>
        <Link to="/candidate/jobs" className="mt-4 bg-black text-white px-5 py-2.5 rounded-lg text-sm">
          Browse All Jobs
        </Link>
      </div>
    );
  }

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
          </div>
        </div>
      </nav>

      {/* Job Details */}
      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* Back */}
        <Link
          to="/candidate/jobs"
          className="text-sm text-neutral-500 hover:text-black transition"
        >
          ← Back to jobs
        </Link>

        {/* Header */}
        <div className="mt-10 border-b border-neutral-200 pb-10">
          <p className="text-sm text-neutral-500">
            {job.company}
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {job.title}
          </h1>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-neutral-500">
            <span>📍 {job.location}</span>
            <span>•</span>
            <span>{job.employment_type}</span>
            <span>•</span>
            <span>{job.experience}</span>
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 py-10">
          {/* Main */}
          <div className="lg:col-span-2 space-y-10">
            {/* Description */}
            <section>
              <h2 className="text-xl font-semibold">
                About the role
              </h2>

              <p className="mt-4 text-sm leading-7 text-neutral-600 whitespace-pre-line">
                {job.description}
              </p>
            </section>

            {/* Requirements */}
            <section>
              <h2 className="text-xl font-semibold">
                Qualifications & Requirements
              </h2>

              <ul className="mt-4 space-y-3 text-sm text-neutral-600">
                <li>• Education: {job.education}</li>
                <li>• Relevant Experience: {job.experience}</li>
                <li>• Demonstrated knowledge in core stack technologies.</li>
                <li>• Ability to complete automated AI technical evaluation.</li>
              </ul>
            </section>

            {/* Skills */}
            <section>
              <h2 className="text-xl font-semibold">
                Required Skills
              </h2>

              <div className="flex flex-wrap gap-2 mt-5">
                {job.skills?.split(",").map((skill) => (
                  <span
                    key={skill.trim()}
                    className="px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-neutral-50 font-medium"
                  >
                    {skill.trim()}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <aside>
            <div className="border border-neutral-200 rounded-2xl p-6 sticky top-24">
              <p className="text-sm text-neutral-500">
                Application deadline
              </p>

              <p className="mt-2 font-medium">
                {job.deadline || "Open until filled"}
              </p>

              <div className="border-t border-neutral-200 my-6" />

              <p className="text-sm text-neutral-500">
                Experience
              </p>

              <p className="mt-2 font-medium">
                {job.experience}
              </p>

              <div className="border-t border-neutral-200 my-6" />

              <p className="text-sm text-neutral-500">
                Work arrangement
              </p>

              <p className="mt-2 font-medium">
                {job.employment_type} · {job.location}
              </p>

              <Link
                to={`/candidate/apply/${job.id}`}
                className="mt-7 w-full inline-flex items-center justify-center bg-black text-white rounded-lg py-3 text-sm font-medium hover:bg-neutral-800 hover:-translate-y-0.5 transition cursor-pointer"
              >
                Apply Now
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

export default JobDetails;