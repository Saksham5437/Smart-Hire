import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../../services/api";

function InterviewRules() {
  const { applicationId } = useParams();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchApp = async () => {
      try {
        if (applicationId) {
          const res = await API.get(`/applications/${applicationId}`);
          if (isMounted) setApp(res.data);
        }
      } catch (err) {
        console.error("Failed to load application details", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchApp();
    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  const rules = [
    {
      title: "Laptop or Desktop Only",
      description:
        "The interview must be completed using a laptop or desktop computer. Mobile phones and tablets are not supported.",
    },
    {
      title: "Camera Must Remain On",
      description:
        "Your camera must remain enabled throughout the entire interview session.",
    },
    {
      title: "Microphone Must Remain On",
      description:
        "Your microphone must remain enabled so your spoken responses can be recorded and evaluated.",
    },
    {
      title: "Screen Sharing Required",
      description:
        "You must share your complete screen throughout the interview session.",
    },
    {
      title: "Single Candidate Required",
      description:
        "Only the registered candidate should be visible during the interview. Additional faces may trigger a security violation.",
    },
    {
      title: "Stay on the Interview Screen",
      description:
        "Do not switch tabs, windows, or leave the interview environment during the session.",
    },
    {
      title: "Stable Environment",
      description:
        "Make sure you have a stable internet connection, sufficient lighting, and a quiet environment before starting.",
    },
    {
      title: "Interview Recording & AI Scoring",
      description:
        "The interview session is analyzed for relevance, correctness, completeness, and skill alignment.",
    },
  ];

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

          <Link
            to="/candidate/dashboard"
            className="text-sm text-gray-600 transition hover:text-black"
          >
            Candidate Portal
          </Link>
        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Check if Application is Ineligible or Under Review */}
        {app && app.eligibility === "Not Eligible" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-8 text-center max-w-xl mx-auto my-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-2xl font-bold mb-4">
              ✕
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Not Eligible for AI Interview
            </h1>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              Your resume screening score for <span className="font-semibold">{app.job?.title}</span> is{" "}
              <strong className="text-rose-700">{app.screening_score != null ? `${app.screening_score}%` : "below 60%"}</strong>, which is below the minimum 60% eligibility threshold required for this position.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/candidate/applications"
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
              >
                ← Back to Applications
              </Link>
              <Link
                to="/candidate/jobs"
                className="rounded-lg border border-neutral-300 px-5 py-2.5 text-sm font-medium text-black hover:bg-neutral-100 transition"
              >
                Browse Other Jobs
              </Link>
            </div>
          </div>
        ) : app && app.eligibility === "Under Review" && app.stage !== "Interview Scheduled" ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-8 text-center max-w-xl mx-auto my-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-2xl font-bold mb-4">
              ⏳
            </div>
            <h1 className="text-2xl font-bold text-neutral-900">
              Application Under Review
            </h1>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              Your resume match score is <strong className="text-amber-800">{app.screening_score}%</strong> (qualifying for the 60%–84% intermediate tier). Your application is currently awaiting manual review by the HR recruitment team. The AI interview will be unlocked once approved.
            </p>
            <div className="mt-6 flex justify-center">
              <Link
                to="/candidate/applications"
                className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 transition"
              >
                ← Back to Applications Pipeline
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500">
                Secure AI Interview Protocol
              </p>

              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                Before You Begin
              </h1>

              <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-gray-500">
                Please read the interview requirements carefully. These
                conditions maintain a standardized and secure
                evaluation environment.
              </p>
            </div>

        {/* Interview Info */}
        <section className="mt-10 rounded-xl border border-gray-200 p-6">
          <div className="grid gap-6 sm:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">
                Position
              </p>

              <p className="mt-1 text-sm font-medium">
                {app?.job?.title || "AI / ML Engineer"}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Structure
              </p>

              <p className="mt-1 text-sm font-medium">
                10 Dynamic Questions
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Timings
              </p>

              <p className="mt-1 text-sm font-medium">
                4 Theo (2m) + 6 Code (5m)
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Workflow Reference
              </p>

              <p className="mt-1 text-sm font-medium font-mono">
                Application #{applicationId || "—"}
              </p>
            </div>
          </div>
        </section>

        {/* Rules */}
        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Interview Rules
          </h2>

          <div className="mt-5 space-y-3">
            {rules.map((rule, index) => (
              <div
                key={rule.title}
                className="flex gap-4 rounded-xl border border-gray-200 p-5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-medium">
                  {index + 1}
                </div>

                <div>
                  <h3 className="text-sm font-semibold">
                    {rule.title}
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {rule.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Important Notice */}
        <section className="mt-8 rounded-xl border border-gray-300 bg-gray-50 p-6">
          <h2 className="text-sm font-semibold">
            Important Proctoring Notice
          </h2>

          <p className="mt-3 text-sm leading-7 text-gray-600">
            Security telemetry events (e.g. window blurring, tab switching, multiple faces, camera toggles)
            are recorded with exact timestamps against your application record.
          </p>
        </section>

        {/* Acknowledgement */}
        <section className="mt-8 rounded-xl border border-gray-200 p-6">
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 accent-black"
            />

            <div>
              <p className="text-sm font-medium">
                I have read and understood the interview rules.
              </p>

              <p className="mt-1 text-sm leading-6 text-gray-500">
                I understand that the interview environment will
                be monitored according to the stated requirements.
              </p>
            </div>
          </label>
        </section>

        {/* Actions */}
        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center">
          <Link
            to="/candidate/applications"
            className="text-sm text-gray-500 transition hover:text-black"
          >
            ← Back to Applications
          </Link>

          <button
            onClick={() => {
              if (agreed) {
                navigate(`/candidate/interview/system-check/${applicationId}`);
              }
            }}
            disabled={!agreed}
            className="rounded-lg bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
          >
            Continue to System Check →
          </button>
        </div>
        </>
        )}
      </main>
    </div>
  );
}

export default InterviewRules;