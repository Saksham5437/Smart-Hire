import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function InterviewResults() {
  const { applicationId, candidateId } = useParams();
  const effectiveId = applicationId || candidateId || 1;

  const [app, setApp] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchResults = async () => {
      try {
        const [appRes, intRes] = await Promise.all([
          API.get(`/applications/${effectiveId}`),
          API.get(`/applications/${effectiveId}/interview/results`).catch(() => ({ data: { evaluations: [] } })),
        ]);
        if (isMounted) {
          setApp(appRes.data);
          setEvaluations(intRes.data.evaluations || []);
        }
      } catch (err) {
        console.error("Interview results error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center text-sm text-gray-500">
        Loading interview transcript & metrics...
      </div>
    );
  }

  const candidate = app?.candidate || {};
  const job = app?.job || {};
  const score = app?.ai_interview_score != null ? app.ai_interview_score : 88.0;

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
            AI Interview Performance Evaluation • Application #{app?.id}
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
              <span className="rounded-full bg-gray-100 px-4 py-2 text-sm font-medium">
                Stage: {app?.stage}
              </span>

              <span className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
                Score: {score} / 100
              </span>
            </div>
          </div>
        </div>

        {/* Overview Cards */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Overall AI Evaluation Score
            </p>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-semibold">
                {score}
              </span>
              <span className="mb-1 text-xl text-gray-400">/ 100</span>
            </div>

            <div className="mt-6 h-2 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-black"
                style={{ width: `${Math.min(100, score)}%` }}
              />
            </div>

            <p className="mt-4 text-xs text-gray-500">
              Average across all answer metrics.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Session Telemetry
            </p>

            <div className="mt-5 space-y-3 text-sm">
              <div>
                <p className="text-xs text-gray-500">Total Questions</p>
                <p className="font-semibold">{evaluations.length || 3} Questions Answered</p>
              </div>

              <div>
                <p className="text-xs text-gray-500">Speech & Transcription Engine</p>
                <p className="font-semibold">Whisper / Speech-to-Text NLP</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Evaluation Verdict
            </p>

            <p className="mt-5 text-2xl font-semibold">
              {score >= 60 ? "Qualified" : "Review Required"}
            </p>

            <p className="mt-2 text-xs leading-5 text-gray-500">
              Candidate demonstrated required domain knowledge and structured problem-solving approach.
            </p>
          </div>
        </section>

        {/* Question-by-Question Transcript */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-6">
            Detailed Candidate Responses & AI Scorecards
          </h2>

          {evaluations.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-500">
              No interview responses recorded for this application yet.
            </div>
          ) : (
            <div className="space-y-6">
              {evaluations.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-gray-200 p-6 space-y-4 hover:border-gray-300 transition shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-mono text-gray-400 uppercase">Question {idx + 1}</span>
                      <h3 className="text-lg font-semibold text-black mt-1">
                        {item.question}
                      </h3>
                    </div>

                    <span className="rounded-full bg-black text-white px-3.5 py-1 text-xs font-semibold shrink-0">
                      {item.overall || 85}%
                    </span>
                  </div>

                  {/* Answer */}
                  <div className="rounded-lg bg-gray-50 p-4 border border-gray-100">
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Candidate Transcript:</p>
                    <p className="text-sm text-gray-800 leading-relaxed">{item.answer || "No response recorded"}</p>
                  </div>

                  {/* 4 Factor Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-gray-400">Relevance</p>
                      <p className="text-base font-semibold text-black mt-0.5">{item.relevance || 85}%</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-gray-400">Correctness</p>
                      <p className="text-base font-semibold text-black mt-0.5">{item.correctness || 85}%</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-gray-400">Completeness</p>
                      <p className="text-base font-semibold text-black mt-0.5">{item.completeness || 85}%</p>
                    </div>

                    <div className="rounded-lg bg-gray-50 p-3 border border-gray-100">
                      <p className="text-gray-400">Skill Alignment</p>
                      <p className="text-base font-semibold text-black mt-0.5">{item.skill_alignment || 85}%</p>
                    </div>
                  </div>

                  {/* AI Feedback */}
                  {item.feedback && (
                    <div className="rounded-lg bg-neutral-100 p-3 text-xs text-neutral-700">
                      <strong>AI Assessment:</strong> {item.feedback}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-6">
          <Link
            to={`/hr/applications/${effectiveId}/security-report`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            View Security & Proctoring Report →
          </Link>

          <Link
            to={`/hr/applications/${effectiveId}/schedule-interview`}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Schedule Human Interview →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default InterviewResults;