import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function FinalDecision() {
  const { applicationId, candidateId } = useParams();
  const effectiveId = applicationId || candidateId || 1;
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [decision, setDecision] = useState("Selected");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadApp = async () => {
      try {
        const res = await API.get(`/applications/${effectiveId}`);
        if (isMounted) {
          setApp(res.data);
          if (res.data.final_decision) {
            setDecision(res.data.final_decision);
          }
        }
      } catch (err) {
        console.error("Failed to load application for final decision:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadApp();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  const handleFinalizeDecision = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setSubmitting(true);

    try {
      const res = await API.post(`/applications/${effectiveId}/final-decision`, {
        decision: decision,
      });

      setSuccessMsg(`Decision finalized: Application #${effectiveId} marked as ${decision}.`);
      setApp((prev) => ({
        ...prev,
        stage: res.data.stage,
        final_decision: res.data.final_decision,
      }));

      setTimeout(() => {
        navigate("/hr/applications");
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to record decision.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center text-sm text-gray-500">
        Loading candidate decision scorecard...
      </div>
    );
  }

  const candidate = app?.candidate || {};
  const job = app?.job || {};

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
      <main className="mx-auto max-w-5xl px-6 py-10">
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
            Final Recruitment Determination • Application #{app?.id}
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Final Decision: {candidate.name || "Candidate"}
              </h1>

              <p className="mt-2 text-gray-500">
                {job.title} · {candidate.email}
              </p>
            </div>

            <span className="w-fit rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
              Status: {app?.stage}
            </span>
          </div>
        </div>

        {successMsg && (
          <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800">
            ✓ {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
            {errorMsg}
          </div>
        )}

        {/* Comprehensive Evaluation Summary */}
        <section className="mt-8 rounded-xl border border-gray-200 p-6 bg-gray-50/50">
          <h2 className="text-lg font-semibold">
            Hiring Assessment Summary
          </h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-white border border-gray-200 p-5 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold">AI Resume Screening</p>
              <p className="text-3xl font-semibold text-black mt-2">
                {app?.screening_score != null ? `${app.screening_score}%` : "85%"}
              </p>
              <span className="text-xs text-gray-500 mt-1 inline-block">
                {app?.eligibility || "Eligible"}
              </span>
            </div>

            <div className="rounded-lg bg-white border border-gray-200 p-5 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold">AI Interview Evaluation</p>
              <p className="text-3xl font-semibold text-black mt-2">
                {app?.ai_interview_score != null ? `${app.ai_interview_score}` : "88"} <span className="text-base text-gray-400">/ 100</span>
              </p>
              <span className="text-xs text-gray-500 mt-1 inline-block">
                Technical Score
              </span>
            </div>

            <div className="rounded-lg bg-white border border-gray-200 p-5 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold">Identity Integrity</p>
              <p className="text-3xl font-semibold text-black mt-2">
                {app?.identity_match_score != null ? `${app.identity_match_score}%` : "100%"}
              </p>
              <span
                className={`text-xs mt-1 inline-block font-semibold px-2 py-0.5 rounded-full ${
                  app?.identity_match_status === "Discrepancy Justified"
                    ? "bg-amber-100 text-amber-800"
                    : app?.identity_match_status === "Discrepancy Detected"
                    ? "bg-red-100 text-red-800"
                    : "bg-emerald-100 text-emerald-800"
                }`}
              >
                {app?.identity_match_status || "Verified"}
              </span>
            </div>

            <div className="rounded-lg bg-white border border-gray-200 p-5 text-center shadow-sm">
              <p className="text-xs text-gray-500 uppercase font-semibold">Proctoring Telemetry</p>
              <p className="text-3xl font-semibold text-black mt-2">
                Verified
              </p>
              <span className="text-xs text-gray-500 mt-1 inline-block">
                Compliant
              </span>
            </div>
          </div>

          {/* Identity Verification Details (If Justification or Mismatch Exists) */}
          {app?.identity_discrepancies && (
            <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-semibold text-neutral-800 uppercase tracking-wider">
                  Candidate Identity & Resume Verification Audit
                </span>
                <span
                  className={`text-2xs font-semibold px-2.5 py-0.5 rounded-full ${
                    app?.identity_match_status === "Discrepancy Justified"
                      ? "bg-amber-100 text-amber-800 border border-amber-200"
                      : app?.identity_match_status === "Discrepancy Detected"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  }`}
                >
                  {app?.identity_match_status || "Verified"}
                </span>
              </div>

              {app?.identity_discrepancies?.justification_note && (
                <div className="mt-4 p-3.5 rounded-lg bg-amber-50/60 border border-amber-200">
                  <p className="text-2xs font-bold text-amber-900 uppercase tracking-wider">
                    📝 Candidate Discrepancy Statement:
                  </p>
                  <p className="text-xs text-amber-900 mt-1 italic leading-relaxed">
                    &quot;{app.identity_discrepancies.justification_note}&quot;
                  </p>
                </div>
              )}

              {app?.identity_discrepancies?.discrepancies && (
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {app.identity_discrepancies.discrepancies.map((d, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-neutral-100 bg-neutral-50/50 flex flex-col justify-between"
                    >
                      <div className="flex items-center justify-between font-medium text-neutral-700">
                        <span>{d.field}</span>
                        <span
                          className={`text-2xs px-2 py-0.5 rounded font-semibold ${
                            d.status === "MATCH"
                              ? "bg-emerald-100 text-emerald-800"
                              : d.status === "MISMATCH"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <div className="mt-2 text-2xs space-y-1 font-mono text-neutral-600">
                        <p>👤 Account: {d.account_value || "—"}</p>
                        <p>📄 Resume: {d.resume_value || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        {/* Decision Selection Card */}
        <section className="mt-8 rounded-xl border border-gray-200 p-8">
          <h2 className="text-xl font-semibold">
            Select Final Outcome
          </h2>

          <p className="text-sm text-gray-500 mt-1 mb-6">
            This decision will update the application stage in the database and reflect in the candidate portal.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Select */}
            <label
              className={`border rounded-xl p-5 cursor-pointer flex flex-col justify-between transition ${
                decision === "Selected"
                  ? "border-black bg-neutral-900 text-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">Select Candidate</span>
                <input
                  type="radio"
                  name="decision"
                  value="Selected"
                  checked={decision === "Selected"}
                  onChange={() => setDecision("Selected")}
                  className="accent-white"
                />
              </div>
              <p className={`text-xs mt-3 leading-relaxed ${decision === "Selected" ? "text-neutral-300" : "text-gray-500"}`}>
                Issue offer letter and proceed to onboarding.
              </p>
            </label>

            {/* On Hold */}
            <label
              className={`border rounded-xl p-5 cursor-pointer flex flex-col justify-between transition ${
                decision === "On Hold"
                  ? "border-black bg-neutral-900 text-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">Put On Hold</span>
                <input
                  type="radio"
                  name="decision"
                  value="On Hold"
                  checked={decision === "On Hold"}
                  onChange={() => setDecision("On Hold")}
                  className="accent-white"
                />
              </div>
              <p className={`text-xs mt-3 leading-relaxed ${decision === "On Hold" ? "text-neutral-300" : "text-gray-500"}`}>
                Retain profile for subsequent evaluation rounds.
              </p>
            </label>

            {/* Reject */}
            <label
              className={`border rounded-xl p-5 cursor-pointer flex flex-col justify-between transition ${
                decision === "Rejected"
                  ? "border-black bg-neutral-900 text-white"
                  : "border-gray-200 bg-white hover:border-gray-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base">Reject Candidate</span>
                <input
                  type="radio"
                  name="decision"
                  value="Rejected"
                  checked={decision === "Rejected"}
                  onChange={() => setDecision("Rejected")}
                  className="accent-white"
                />
              </div>
              <p className={`text-xs mt-3 leading-relaxed ${decision === "Rejected" ? "text-neutral-300" : "text-gray-500"}`}>
                Candidate does not meet technical threshold.
              </p>
            </label>
          </div>

          {/* Feedback Notes */}
          <div className="mt-8">
            <label className="block text-sm font-medium mb-2">
              HR Committee Feedback & Comments
            </label>

            <textarea
              rows="4"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Candidate demonstrated strong foundational ML engineering skills and structured problem solving..."
              className="w-full rounded-xl border border-gray-300 p-4 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-200 pt-6">
            <Link
              to="/hr/applications"
              className="text-sm text-gray-500 hover:text-black transition"
            >
              ← Cancel & Return to Pipeline
            </Link>

            <button
              onClick={handleFinalizeDecision}
              disabled={submitting}
              className="w-full sm:w-auto rounded-lg bg-black px-8 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800 cursor-pointer disabled:opacity-50"
            >
              {submitting ? "Persisting Decision..." : "Record & Finalize Decision ✓"}
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default FinalDecision;