import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function ScreeningResults() {
  const { applicationId, candidateId } = useParams();
  const effectiveId = applicationId || candidateId || 1;

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [screeningLoading, setScreeningLoading] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchApp = async () => {
      try {
        const res = await API.get(`/applications/${effectiveId}`);
        if (isMounted) setApp(res.data);
      } catch (err) {
        console.error("Failed to load screening results", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchApp();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  const handleRunScreening = async () => {
    setScreeningLoading(true);
    setNotice("");
    try {
      const res = await API.post(`/applications/${effectiveId}/screen`);
      setApp((prev) => ({
        ...prev,
        screening_score: res.data.screening_score,
        eligibility: res.data.eligibility,
        stage: res.data.stage,
      }));
      setNotice(`AI Screening completed. Score: ${res.data.screening_score}% (${res.data.eligibility})`);
    } catch (err) {
      console.error(err);
      setNotice("Failed to re-run screening.");
    } finally {
      setScreeningLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center text-sm text-gray-500">
        Loading screening evaluation...
      </div>
    );
  }

  const candidate = app?.candidate || {};
  const job = app?.job || {};

  const candidateSkills = candidate.skills ? candidate.skills.split(",").map((s) => s.trim()) : ["Python", "FastAPI", "Machine Learning"];
  const jobSkills = job.skills ? job.skills.split(",").map((s) => s.trim()) : ["Python", "Machine Learning", "SQL"];

  const matchedSkills = jobSkills.filter((req) =>
    candidateSkills.some((s) => s.toLowerCase().includes(req.toLowerCase()) || req.toLowerCase().includes(s.toLowerCase()))
  );

  const score = app?.screening_score != null ? app.screening_score : 85;
  const eligibility = app?.eligibility || (score >= 85 ? "Eligible" : score >= 60 ? "Under Review" : "Not Eligible");

  const handleUpdateEligibility = async (newStatus) => {
    setNotice("");
    try {
      const res = await API.post(`/applications/${effectiveId}/eligibility`, {
        eligibility: newStatus,
      });
      setApp((prev) => ({
        ...prev,
        eligibility: res.data.eligibility,
      }));
      setNotice(`Application eligibility successfully updated to '${res.data.eligibility}'.`);
    } catch (err) {
      console.error(err);
      setNotice("Failed to update eligibility status.");
    }
  };

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
          to={`/hr/applications/${effectiveId}`}
          className="text-sm text-gray-500 transition hover:text-black"
        >
          ← Back to Candidate Profile
        </Link>

        {/* Header */}
        <div className="mt-6 border-b border-gray-200 pb-8">
          <p className="text-sm text-gray-500">
            AI Resume Screening Results • Application #{app?.id}
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                {candidate.name || "Candidate"}
              </h1>

              <p className="mt-2 text-gray-500">
                {job.title} · {candidate.email}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunScreening}
                disabled={screeningLoading}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium transition hover:bg-gray-50 cursor-pointer disabled:opacity-50"
              >
                {screeningLoading ? "Screening..." : "⚡ Re-run AI Screening"}
              </button>

              <span
                className={`rounded-full px-4 py-2 text-sm font-semibold border ${
                  eligibility === "Eligible"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : eligibility === "Under Review"
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {eligibility === "Eligible"
                  ? "✓ Eligible (≥85%)"
                  : eligibility === "Under Review"
                  ? "⏳ Under Review (60-84%)"
                  : "✕ Not Eligible (<60%)"}
              </span>
            </div>
          </div>
        </div>

        {notice && (
          <div className="mt-6 rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-xs font-medium text-black flex items-center justify-between">
            <span>{notice}</span>
            <button
              onClick={() => setNotice("")}
              className="text-neutral-500 hover:text-black text-xs font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Triage Matrix Banner */}
        <section className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                Resume Screening Triage Policy
              </h2>
              <p className="mt-1 text-xs text-neutral-500">
                Automatic AI classification rules based on keyword and semantic match with required job skills:
              </p>
            </div>

            {/* HR Manual Action Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-neutral-500 font-medium mr-1">HR Override:</span>
              <button
                onClick={() => handleUpdateEligibility("Eligible")}
                disabled={eligibility === "Eligible"}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                ✓ Approve for AI Interview
              </button>
              <button
                onClick={() => handleUpdateEligibility("Under Review")}
                disabled={eligibility === "Under Review"}
                className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                ⏳ Set Under Review
              </button>
              <button
                onClick={() => handleUpdateEligibility("Not Eligible")}
                disabled={eligibility === "Not Eligible"}
                className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-1.5 text-xs font-medium text-rose-700 transition hover:bg-rose-100 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
              >
                ✕ Mark Not Eligible
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div
              className={`p-3.5 rounded-xl border transition ${
                score >= 85
                  ? "border-emerald-300 bg-emerald-50/80 font-semibold text-emerald-900 ring-2 ring-emerald-500/20"
                  : "border-neutral-200 bg-white text-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">Match ≥ 85%</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  Eligible
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Directly qualified for automated AI technical interview.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border transition ${
                score >= 60 && score < 85
                  ? "border-amber-300 bg-amber-50/80 font-semibold text-amber-900 ring-2 ring-amber-500/20"
                  : "border-neutral-200 bg-white text-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">Match ≥ 60%</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  Under Review
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Intermediate threshold. Requires HR manual review before interview.
              </p>
            </div>

            <div
              className={`p-3.5 rounded-xl border transition ${
                score < 60
                  ? "border-rose-300 bg-rose-50/80 font-semibold text-rose-900 ring-2 ring-rose-500/20"
                  : "border-neutral-200 bg-white text-neutral-600"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-sm">Match &lt; 60%</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                  Not Eligible
                </span>
              </div>
              <p className="text-[11px] leading-relaxed opacity-90">
                Below cutoff. Candidate is disqualified from the AI interview.
              </p>
            </div>
          </div>
        </section>

        {/* Score Overview */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-6 md:col-span-1">
            <p className="text-sm text-gray-500">
              Overall Screening Match
            </p>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold">
                {score}
              </span>

              <span className="mb-1 text-xl text-gray-400">
                / 100
              </span>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  score >= 85
                    ? "bg-emerald-600"
                    : score >= 60
                    ? "bg-amber-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${Math.min(100, score)}%` }}
              />
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Computed by analyzing resume keywords against mandatory job criteria.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Target Position Details
            </p>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500">
                  Job Role
                </p>

                <p className="mt-1 text-sm font-medium">
                  {job.title}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Required Education & Experience
                </p>

                <p className="mt-1 text-sm font-medium">
                  {job.education} • {job.experience}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Screening Eligibility
            </p>

            <p className="mt-5 text-2xl font-semibold">
              {eligibility}
            </p>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              {eligibility === "Eligible"
                ? "Candidate achieves an exceptional match (≥85%) and automatically qualifies for the AI Interview."
                : eligibility === "Under Review"
                ? "Candidate match is between 60% and 84% and requires HR manual inspection before progressing."
                : "Candidate match is below 60% and does not meet the minimum eligibility threshold."}
            </p>
          </div>
        </section>

        {/* Skill Matching */}
        <section className="mt-8 rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Skills Matching Analysis
            </h2>

            <span className="text-sm text-gray-500">
              {matchedSkills.length} of {jobSkills.length} required skills verified
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {jobSkills.map((skill) => {
              const matched = matchedSkills.includes(skill);
              return (
                <div
                  key={skill}
                  className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3"
                >
                  <span className="text-sm font-medium">{skill}</span>
                  <span
                    className={`text-xs font-semibold ${
                      matched ? "text-emerald-700" : "text-neutral-400"
                    }`}
                  >
                    {matched ? "✓ Requirement Matched" : "— Missing in Profile"}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* AI Screening Summary */}
        <section className="mt-8 rounded-xl border border-gray-200 p-6 bg-gray-50/50">
          <h2 className="text-lg font-semibold">
            AI Automated Assessment Summary
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-600">
            Candidate <strong>{candidate.name}</strong> was evaluated against the job specifications for{" "}
            <strong>{job.title}</strong>. The resume analysis identified proficiency across core competencies (
            {matchedSkills.join(", ") || "Technical background"}). The candidate has been designated as{" "}
            <strong>{eligibility}</strong>.
          </p>
        </section>

        {/* Actions */}
        <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-6">
          <Link
            to={`/hr/applications/${effectiveId}/final-decision`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            Go to Final Decision
          </Link>

          <Link
            to={`/hr/applications/${effectiveId}/interview-results`}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Continue to AI Interview Results →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default ScreeningResults;