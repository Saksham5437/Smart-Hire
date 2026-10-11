import { useParams, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function CandidateProfile() {
  const { applicationId, candidateId } = useParams();
  const effectiveId = applicationId || candidateId || 1;

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchApp = async () => {
      try {
        const res = await API.get(`/applications/${effectiveId}`);
        if (isMounted) setApp(res.data);
      } catch (err) {
        console.error("Failed to load application profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchApp();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center text-sm text-gray-500">
        Loading candidate workflow profile #{effectiveId}...
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen bg-white text-black flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-semibold">Application Not Found</h2>
        <p className="text-sm text-gray-500 mt-2">Could not locate application record #{effectiveId}.</p>
        <Link to="/hr/applications" className="mt-4 bg-black text-white px-5 py-2.5 rounded-lg text-sm">
          Return to Applications Pipeline
        </Link>
      </div>
    );
  }

  const candidate = app.candidate || {};
  const job = app.job || {};

  /*
    5-Stage Recruitment Progress Timeline:
    1 = Application Submitted
    2 = AI Screening
    3 = AI Interview
    4 = Human Interview
    5 = Final Decision
  */
  const getStageNumber = (stage) => {
    if (stage === "Selected" || stage === "Rejected" || stage === "On Hold") return 5;
    if (stage === "Interview Scheduled" || stage === "HR Review") return 4;
    if (stage === "Interview Completed") return 3;
    if (stage === "Screening") return 2;
    return 1;
  };

  const currentStageNumber = getStageNumber(app.stage);
  const skillsList = candidate.skills ? candidate.skills.split(",").map((s) => s.trim()) : ["Python", "FastAPI", "Machine Learning"];
  const jobRequiredSkills = job.skills ? job.skills.split(",").map((s) => s.trim()) : ["Python", "Machine Learning", "SQL"];

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
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Back */}
        <Link
          to="/hr/applications"
          className="text-sm text-gray-500 transition hover:text-black"
        >
          ← Back to Applications Pipeline
        </Link>

        {/* Header */}
        <div className="mt-6 flex flex-col justify-between gap-5 border-b border-gray-200 pb-8 md:flex-row md:items-end">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Application #{app.id}
              </span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-gray-500">
                Applied for {job.title}
              </span>
            </div>

            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              {candidate.name || "Candidate"}
            </h1>

            <p className="mt-2 text-gray-500 text-sm">
              {candidate.email} • {candidate.location || "Bengaluru, India"}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/hr/applications/${app.id}/screening-results`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
            >
              Screening Results
            </Link>

            <Link
              to={`/hr/applications/${app.id}/interview-results`}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
            >
              Interview Results
            </Link>

            <Link
              to={`/hr/applications/${app.id}/final-decision`}
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
            >
              Final Decision →
            </Link>
          </div>
        </div>

        {/* Profile Grid */}
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {/* Personal Information */}
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">
              Candidate Profile
            </h2>

            <div className="mt-6 space-y-4 text-sm">
              <div>
                <p className="text-xs text-gray-500">Full Name</p>
                <p className="mt-1 font-medium">{candidate.name}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="mt-1 font-medium">{candidate.email}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Phone</p>
                <p className="mt-1 font-medium">{candidate.phone || "+91 9876543210"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="mt-1 font-medium">{candidate.location || "Bengaluru, India"}</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Applied On</p>
                <p className="mt-1 font-medium">{new Date(app.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </section>

          {/* Resume Summary & Skills */}
          <section className="rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">
              Qualifications & Extracted Skills
            </h2>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-xs text-gray-500">Education</p>
                <p className="mt-1 font-medium text-sm">
                  {candidate.education || "B.Tech in Artificial Intelligence & Machine Learning"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Experience</p>
                <p className="mt-1 font-medium text-sm">
                  {candidate.experience || "1-2 Years relevant experience"}
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs text-gray-500 mb-3">
                Extracted Skills from Profile / Resume
              </p>

              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {candidate.profile_summary && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Summary</p>
                <p className="text-sm text-gray-600 leading-relaxed">{candidate.profile_summary}</p>
              </div>
            )}
          </section>

          {/* AI Screening & Evaluation Overview */}
          <section className="rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold">
              AI Assessment Scores
            </h2>

            <div className="mt-6">
              <p className="text-xs text-gray-500">
                Resume Screening Match
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {app.screening_score != null ? `${app.screening_score}%` : "Pending"}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold border ${
                  app.eligibility === "Eligible"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : app.eligibility === "Under Review"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {app.eligibility === "Eligible"
                  ? "✓ Eligible (≥85%)"
                  : app.eligibility === "Under Review"
                  ? "⏳ Under Review (60-84%)"
                  : "✕ Not Eligible (<60%)"}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Identity & Resume Consistency
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {app.identity_match_score != null ? `${app.identity_match_score}%` : "100%"}
              </p>

              <span
                className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                  app.identity_match_status === "Discrepancy Justified"
                    ? "bg-amber-100 text-amber-800"
                    : app.identity_match_status === "Discrepancy Detected"
                    ? "bg-red-100 text-red-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {app.identity_match_status || "Verified Authenticity"}
              </span>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                AI Interview Score
              </p>

              <p className="mt-1 text-3xl font-semibold">
                {app.ai_interview_score != null ? `${app.ai_interview_score} / 100` : "Not Taken"}
              </p>

              <p className="text-xs text-gray-500 mt-2">
                Evaluated over Relevance, Correctness, Completeness, and Skill Alignment.
              </p>
            </div>

            <div className="mt-6 space-y-2 pt-2">
              <Link
                to={`/hr/applications/${app.id}/screening-results`}
                className="block text-center rounded-lg bg-black px-4 py-2.5 text-xs font-medium text-white transition hover:bg-gray-800"
              >
                View Screening Scorecard →
              </Link>

              <Link
                to={`/hr/applications/${app.id}/interview-results`}
                className="block text-center rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium transition hover:bg-gray-50"
              >
                View Interview Transcript →
              </Link>

              <Link
                to={`/hr/applications/${app.id}/security-report`}
                className="block text-center rounded-lg border border-gray-300 px-4 py-2 text-xs font-medium transition hover:bg-gray-50"
              >
                View Security / Proctoring Report →
              </Link>
            </div>
          </section>

          {/* Job Requirements Alignment */}
          <section className="rounded-xl border border-gray-200 p-6 lg:col-span-2">
            <h2 className="text-lg font-semibold">
              Skill Alignment with Job Requirements
            </h2>

            <div className="mt-6 space-y-3">
              {jobRequiredSkills.map((reqSkill) => {
                const isMatched = skillsList.some(
                  (s) => s.toLowerCase().includes(reqSkill.toLowerCase()) || reqSkill.toLowerCase().includes(s.toLowerCase())
                );

                return (
                  <div
                    key={reqSkill}
                    className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 text-sm"
                  >
                    <span className="font-medium">{reqSkill}</span>
                    <span
                      className={`text-xs font-semibold ${
                        isMatched ? "text-emerald-700" : "text-gray-400"
                      }`}
                    >
                      {isMatched ? "✓ Matched in Profile" : "— Not Specified"}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 5-Stage Recruitment Progress */}
          <section className="rounded-xl border border-gray-200 p-6 lg:col-span-3">
            <h2 className="text-lg font-semibold">
              Recruitment Workflow Progress
            </h2>

            <div className="mt-8 grid gap-4 md:grid-cols-5">
              {[
                { name: "Application", step: 1 },
                { name: "AI Screening", step: 2 },
                { name: "AI Interview", step: 3 },
                { name: "Human Interview", step: 4 },
                { name: "Final Decision", step: 5 },
              ].map((stage, index) => {
                const isCompleted = currentStageNumber >= stage.step;
                const isCurrent = currentStageNumber === stage.step;

                return (
                  <div key={stage.name} className="relative">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                          isCompleted
                            ? "bg-black text-white"
                            : isCurrent
                            ? "bg-gray-300 text-gray-800"
                            : "border border-gray-300 text-gray-400"
                        }`}
                      >
                        {isCompleted ? "✓" : stage.step}
                      </div>

                      <span className="text-sm font-medium">
                        {stage.name}
                      </span>
                    </div>

                    {index < 4 && (
                      <div className="ml-4 mt-2 hidden h-4 border-l border-gray-200 md:block" />
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Quick Decision Banner */}
          <section className="rounded-xl border border-gray-200 p-6 lg:col-span-3 flex flex-col md:flex-row items-center justify-between gap-4 bg-gray-50">
            <div>
              <span className="text-xs uppercase font-semibold text-gray-500">Current Stage:</span>
              <h3 className="text-xl font-semibold text-black mt-1">
                {app.final_decision ? `Finalized: ${app.final_decision}` : app.stage}
              </h3>
            </div>

            <div className="flex gap-3">
              <Link
                to={`/hr/applications/${app.id}/schedule-interview`}
                className="rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-50 transition"
              >
                Schedule Human Interview
              </Link>

              <Link
                to={`/hr/applications/${app.id}/final-decision`}
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition"
              >
                Proceed to Final Decision →
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default CandidateProfile;