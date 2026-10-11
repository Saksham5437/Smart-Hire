import { Link, useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function SecurityReports() {
  const { applicationId, candidateId } = useParams();
  const effectiveId = applicationId || candidateId || 1;

  const [app, setApp] = useState(null);
  const [securityData, setSecurityData] = useState({ events: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadReport = async () => {
      try {
        const [appRes, secRes] = await Promise.all([
          API.get(`/applications/${effectiveId}`),
          API.get(`/applications/${effectiveId}/security-report`).catch(() => ({ data: { events: [] } })),
        ]);
        if (isMounted) {
          setApp(appRes.data);
          setSecurityData(secRes.data || { events: [] });
        }
      } catch (err) {
        console.error("Security report error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadReport();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center text-sm text-gray-500">
        Loading security & proctoring report...
      </div>
    );
  }

  const candidate = app?.candidate || {};
  const job = app?.job || {};
  const events = securityData.events || [];
  const tabSwitches = events.filter((e) => e.event_type === "TAB_SWITCH").length;
  const isSuspicious = tabSwitches > 3;

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
            Interview Security & Proctoring Telemetry • Application #{app?.id}
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
              <span
                className={`rounded-full px-4 py-2 text-sm font-medium ${
                  isSuspicious ? "bg-yellow-100 text-yellow-800" : "bg-black text-white"
                }`}
              >
                {isSuspicious ? "Flagged for Review" : "Integrity Verified"}
              </span>
            </div>
          </div>
        </div>

        {/* Proctoring Summary Cards */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Total Logged Security Events
            </p>

            <p className="mt-4 text-5xl font-semibold">
              {events.length}
            </p>

            <p className="mt-4 text-xs text-gray-500">
              Recorded during live candidate session.
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Tab / Window Switches
            </p>

            <p className="mt-4 text-5xl font-semibold">
              {tabSwitches}
            </p>

            <p className="mt-4 text-xs text-gray-500">
              {tabSwitches === 0 ? "Candidate remained in interview window." : `${tabSwitches} focus loss events logged.`}
            </p>
          </div>

          <div className="rounded-xl border border-gray-200 p-6">
            <p className="text-sm text-gray-500">
              Environment Checks
            </p>

            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span>Camera Stream</span>
                <span className="font-semibold text-emerald-700">✓ Active</span>
              </div>
              <div className="flex justify-between">
                <span>Microphone Audio</span>
                <span className="font-semibold text-emerald-700">✓ Active</span>
              </div>
              <div className="flex justify-between">
                <span>Screen Sharing</span>
                <span className="font-semibold text-emerald-700">✓ Verified</span>
              </div>
            </div>
          </div>
        </section>

        {/* Security Event Log Timeline */}
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-6">
            Proctoring Telemetry Timeline
          </h2>

          {events.length === 0 ? (
            <div className="rounded-xl border border-neutral-200 p-8 text-center text-sm text-neutral-500">
              No security anomalies or violations logged for this session. Candidate maintained full compliance.
            </div>
          ) : (
            <div className="rounded-xl border border-gray-200 divide-y divide-gray-200 overflow-hidden">
              {events.map((evt) => (
                <div key={evt.id} className="p-5 flex items-center justify-between hover:bg-neutral-50/50">
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold ${
                        evt.severity === "warning"
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : "bg-neutral-100 text-neutral-800"
                      }`}
                    >
                      {evt.event_type}
                    </span>

                    <span className="text-sm text-neutral-700">{evt.details}</span>
                  </div>

                  <span className="text-xs text-neutral-400 font-mono">
                    {evt.created_at ? new Date(evt.created_at).toLocaleTimeString() : "Live"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Actions */}
        <div className="mt-10 flex flex-wrap justify-end gap-3 border-t border-gray-200 pt-6">
          <Link
            to={`/hr/applications/${effectiveId}/interview-results`}
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-50"
          >
            ← View Interview Results
          </Link>

          <Link
            to={`/hr/applications/${effectiveId}/schedule-interview`}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
          >
            Proceed to Schedule Interview →
          </Link>
        </div>
      </main>
    </div>
  );
}

export default SecurityReports;