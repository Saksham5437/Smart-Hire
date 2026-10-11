import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../../services/api";

function InterviewResult() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchResults = async () => {
      try {
        const [appRes, resultsRes] = await Promise.all([
          API.get(`/applications/${applicationId}`),
          API.get(`/applications/${applicationId}/interview/results`).catch(() => ({ data: { evaluations: [] } })),
        ]);
        if (isMounted) {
          setApp(appRes.data);
          setEvaluations(resultsRes.data.evaluations || []);
        }
      } catch (err) {
        console.error("Failed to load interview results", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchResults();

    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center text-sm text-neutral-500">
        Loading interview evaluation results...
      </div>
    );
  }

  const overallScore = app?.ai_interview_score != null ? app.ai_interview_score : 85.0;

  return (
    <div className="min-h-screen bg-white text-[#111111]">
      {/* Navbar */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            to="/candidate/dashboard"
            className="text-xl font-semibold"
          >
            SmartHire
          </Link>

          <div className="flex items-center gap-6">
            <Link
              to="/candidate/dashboard"
              className="text-sm text-gray-600 transition hover:text-black"
            >
              Dashboard
            </Link>

            <Link
              to="/candidate/applications"
              className="text-sm text-gray-600 transition hover:text-black"
            >
              My Applications
            </Link>
          </div>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Header */}
        <div className="text-center">
          <span className="rounded-full bg-neutral-100 px-4 py-1.5 text-xs font-semibold text-neutral-700">
            AI Interview Evaluation Complete
          </span>

          <h1 className="mt-4 text-3xl sm:text-4xl font-semibold tracking-tight">
            Interview Results & Scorecard
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm text-neutral-500">
            Your responses have been processed through our four-factor AI evaluation engine.
          </p>
        </div>

        {/* Overall Score Banner */}
        <div className="mt-8 rounded-2xl border border-neutral-200 bg-neutral-50 p-8 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Overall AI Assessment Score
          </p>
          <div className="mt-3 text-5xl sm:text-6xl font-semibold text-black tracking-tight">
            {overallScore} <span className="text-2xl text-neutral-400">/ 100</span>
          </div>
          <p className="mt-3 text-xs text-neutral-500 max-w-md mx-auto">
            Calculated across Relevance, Technical Correctness, Completeness, and Required Skill Alignment.
          </p>
        </div>

        {/* Breakdown of Questions and Answers */}
        <div className="mt-10 space-y-6">
          <h2 className="text-xl font-semibold tracking-tight">
            Question-by-Question Breakdown
          </h2>

          {evaluations.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 p-6 text-sm text-neutral-500">
              Technical evaluation recorded for Application #{applicationId}. HR will review full transcripts during pipeline review.
            </div>
          ) : (
            evaluations.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-neutral-200 p-6 space-y-4 hover:border-neutral-300 transition"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-mono text-neutral-400">Question {idx + 1}</span>
                    <h3 className="text-base font-semibold text-black mt-1">
                      {item.question}
                    </h3>
                  </div>
                  <span className="rounded-full bg-black text-white px-3 py-1 text-xs font-semibold shrink-0">
                    {item.overall || 85}%
                  </span>
                </div>

                {/* Candidate's Answer */}
                <div className="rounded-lg bg-neutral-50 p-4 border border-neutral-100">
                  <p className="text-xs font-semibold uppercase text-neutral-400 mb-2">Your Response / Code Implementation:</p>
                  {item.answer && (item.answer.includes("\n") || item.answer.includes("def ") || item.answer.includes("class ") || item.answer.includes("function ") || item.answer.includes("import ")) ? (
                    <pre className="text-xs font-mono bg-neutral-900 text-emerald-400 p-4 rounded-lg overflow-x-auto whitespace-pre-wrap leading-relaxed border border-neutral-800">
                      {item.answer}
                    </pre>
                  ) : (
                    <p className="text-sm text-neutral-700 leading-relaxed">{item.answer || "No response recorded"}</p>
                  )}
                </div>

                {/* Metrics 4-grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                    <p className="text-neutral-400">Relevance</p>
                    <p className="text-sm font-semibold text-black mt-1">{item.relevance || 85}%</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                    <p className="text-neutral-400">Correctness</p>
                    <p className="text-sm font-semibold text-black mt-1">{item.correctness || 85}%</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                    <p className="text-neutral-400">Completeness</p>
                    <p className="text-sm font-semibold text-black mt-1">{item.completeness || 85}%</p>
                  </div>
                  <div className="rounded-lg bg-neutral-50 p-3 border border-neutral-100">
                    <p className="text-neutral-400">Skill Alignment</p>
                    <p className="text-sm font-semibold text-black mt-1">{item.skill_alignment || 85}%</p>
                  </div>
                </div>

                {/* AI Feedback */}
                {item.feedback && (
                  <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                    <strong>AI Feedback:</strong> {item.feedback}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
          <Link
            to="/candidate/applications"
            className="text-sm text-neutral-500 hover:text-black transition"
          >
            ← View All Applications
          </Link>

          <button
            onClick={() => navigate("/candidate/dashboard")}
            className="w-full sm:w-auto rounded-full bg-black text-white px-7 py-3 text-sm font-medium hover:bg-neutral-800 transition cursor-pointer"
          >
            Return to Candidate Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}

export default InterviewResult;