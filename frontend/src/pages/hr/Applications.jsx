import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import API from "../../services/api";

function Applications() {
  const [searchParams] = useSearchParams();
  const jobFromUrl = searchParams.get("job");

  const [applications, setApplications] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState(jobFromUrl || "All jobs");
  const [stageFilter, setStageFilter] = useState("All stages");
  const [eligibilityFilter, setEligibilityFilter] = useState("All eligibility");

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        const [appsRes, jobsRes] = await Promise.all([
          API.get("/applications"),
          API.get("/jobs"),
        ]);
        if (isMounted) {
          setApplications(appsRes.data);
          setJobs(jobsRes.data);
        }
      } catch (err) {
        console.error("Applications load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredApplications = applications.filter((application) => {
    const searchText = search.toLowerCase().trim();
    const candidateName = application.candidate?.name || "";
    const candidateEmail = application.candidate?.email || "";
    const jobTitle = application.job?.title || "";

    const matchesSearch =
      searchText === "" ||
      candidateName.toLowerCase().includes(searchText) ||
      candidateEmail.toLowerCase().includes(searchText) ||
      jobTitle.toLowerCase().includes(searchText) ||
      String(application.id).includes(searchText);

    const matchesJob =
      jobFilter === "All jobs" ||
      jobTitle === jobFilter;

    const matchesStage =
      stageFilter === "All stages" ||
      application.stage === stageFilter;

    const matchesEligibility =
      eligibilityFilter === "All eligibility" ||
      application.eligibility === eligibilityFilter;

    return matchesSearch && matchesJob && matchesStage && matchesEligibility;
  });

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/hr/dashboard" className="text-xl font-semibold">
            SmartHire
          </Link>

          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/hr/dashboard"
              className="text-gray-600 transition hover:text-black"
            >
              Dashboard
            </Link>

            <Link
              to="/hr/applications"
              className="font-medium text-black"
            >
              Applications Pipeline
            </Link>

            <Link
              to="/hr/jobs/create"
              className="text-gray-600 transition hover:text-black"
            >
              + Create Job
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm text-gray-500">
              Recruitment Workflow
            </p>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Candidate Applications Pipeline
            </h1>

            <p className="mt-2 text-gray-500">
              All applications are strictly tracked and identified by their unique workflow Application ID.
            </p>
          </div>

          <Link
            to="/hr/jobs/create"
            className="w-fit rounded-lg bg-black px-5 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            + Create Job
          </Link>
        </div>

        {/* Filters */}
        <section className="mt-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Search */}
            <div>
              <label className="text-sm font-medium">
                Search Candidate or Role
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, ID..."
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-black"
              />
            </div>

            {/* Job Filter */}
            <div>
              <label className="text-sm font-medium">
                Filter by Role
              </label>

              <select
                value={jobFilter}
                onChange={(e) => setJobFilter(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                <option>All jobs</option>
                {jobs.map((j) => (
                  <option key={j.id} value={j.title}>
                    {j.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Stage Filter */}
            <div>
              <label className="text-sm font-medium">
                Filter by Stage
              </label>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                <option>All stages</option>
                <option>Applied</option>
                <option>Screening</option>
                <option>Interview Scheduled</option>
                <option>Interview Completed</option>
                <option>Selected</option>
                <option>Rejected</option>
                <option>On Hold</option>
              </select>
            </div>

            {/* Eligibility Triage Filter */}
            <div>
              <label className="text-sm font-medium">
                Filter by Eligibility
              </label>

              <select
                value={eligibilityFilter}
                onChange={(e) => setEligibilityFilter(e.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
              >
                <option>All eligibility</option>
                <option value="Eligible">Eligible (≥85%)</option>
                <option value="Under Review">Under Review (60-84%)</option>
                <option value="Not Eligible">Not Eligible (&lt;60%)</option>
              </select>
            </div>
          </div>
        </section>

        {/* Results Count */}
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing{" "}
            <span className="font-medium text-black">
              {filteredApplications.length}
            </span>{" "}
            {filteredApplications.length === 1
              ? "application"
              : "applications"}
          </p>

          {(search ||
            jobFilter !== "All jobs" ||
            stageFilter !== "All stages" ||
            eligibilityFilter !== "All eligibility") && (
            <button
              onClick={() => {
                setSearch("");
                setJobFilter("All jobs");
                setStageFilter("All stages");
                setEligibilityFilter("All eligibility");
              }}
              className="text-sm font-medium underline cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>

        {/* Applications */}
        <section className="mt-4 overflow-hidden rounded-xl border border-gray-200">
          {/* Table Header */}
          <div className="hidden grid-cols-12 gap-4 border-b border-gray-200 bg-gray-50 px-6 py-4 text-xs font-medium uppercase tracking-wide text-gray-500 lg:grid">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">Candidate</div>
            <div className="col-span-2">Position</div>
            <div className="col-span-2">Applied Date</div>
            <div className="col-span-1">AI Score</div>
            <div className="col-span-1">Eligibility</div>
            <div className="col-span-1">Stage</div>
            <div className="col-span-1 text-right">Action</div>
          </div>

          {/* Empty State */}
          {loading ? (
            <div className="flex min-h-64 items-center justify-center p-6 text-sm text-gray-500">
              Loading applications from database...
            </div>
          ) : filteredApplications.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center px-6">
              <div className="text-center">
                <h3 className="text-lg font-semibold">
                  No applications found
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {search
                    ? `No candidates match "${search}".`
                    : "No applications match the selected filters."}
                </p>
              </div>
            </div>
          ) : (
            /* Candidate Rows */
            filteredApplications.map((app) => (
              <div
                key={app.id}
                className="grid grid-cols-1 gap-4 border-b border-gray-200 px-6 py-5 transition last:border-b-0 hover:bg-gray-50 lg:grid-cols-12 lg:items-center"
              >
                {/* ID */}
                <div className="lg:col-span-1">
                  <span className="font-mono text-xs text-gray-400">#{app.id}</span>
                </div>

                {/* Candidate */}
                <div className="lg:col-span-3">
                  <p className="font-medium text-black">
                    {app.candidate?.name || "Candidate"}
                  </p>

                  <p className="text-xs text-gray-500">
                    {app.candidate?.email}
                  </p>
                </div>

                {/* Position */}
                <div className="lg:col-span-2">
                  <p className="text-sm font-medium">
                    {app.job?.title || "Role"}
                  </p>
                  <p className="text-xs text-gray-400">{app.job?.company}</p>
                </div>

                {/* Applied */}
                <div className="lg:col-span-2">
                  <p className="text-xs text-gray-500">
                    {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Score */}
                <div className="lg:col-span-1">
                  <p className="font-semibold text-sm">
                    {app.screening_score != null ? `${app.screening_score}%` : "—"}
                  </p>
                </div>

                {/* Eligibility */}
                <div className="lg:col-span-1">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                      app.eligibility === "Eligible"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : app.eligibility === "Under Review"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {app.eligibility}
                  </span>
                </div>

                {/* Stage */}
                <div className="lg:col-span-1">
                  <span
                    className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ${
                      ["AI Interview Completed", "Selected", "On Hold"].includes(app.stage)
                        ? "bg-black text-white"
                        : app.stage === "Rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {app.stage}
                  </span>
                </div>

                {/* Action - Critical applicationId Routing */}
                <div className="lg:col-span-1 lg:text-right">
                  <Link
                    to={`/hr/applications/${app.id}`}
                    className="inline-flex rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-black transition"
                  >
                    Review →
                  </Link>
                </div>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}

export default Applications;