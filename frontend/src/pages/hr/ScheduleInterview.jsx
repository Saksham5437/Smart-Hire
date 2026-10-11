import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function ScheduleInterview() {
  const { applicationId, candidateId } = useParams();
  const effectiveId = applicationId || candidateId || 1;
  const navigate = useNavigate();

  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Primary states start unselected by default
  const [interviewer, setInterviewer] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [interviewTime, setInterviewTime] = useState("");
  const [duration, setDuration] = useState("");
  const [meetingPlatform, setMeetingPlatform] = useState("");
  const [interviewMode, setInterviewMode] = useState("Online — Video Call");
  const [sendEmail, setSendEmail] = useState(true);
  const [addToCalendar, setAddToCalendar] = useState(true);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadApp = async () => {
      try {
        const [appRes, schedRes] = await Promise.all([
          API.get(`/applications/${effectiveId}`),
          API.get(`/applications/${effectiveId}/schedule`).catch(() => ({ data: {} })),
        ]);
        if (isMounted) {
          setApp(appRes.data);
          // Only populate if existing saved schedule has explicit values
          if (schedRes.data?.interviewer) {
            setInterviewer(schedRes.data.interviewer);
            if (schedRes.data.interview_type) setInterviewType(schedRes.data.interview_type);
            if (schedRes.data.interview_time) setInterviewTime(schedRes.data.interview_time);
            if (schedRes.data.duration) setDuration(schedRes.data.duration);
            if (schedRes.data.meeting_platform) setMeetingPlatform(schedRes.data.meeting_platform);
            if (schedRes.data.scheduled_at) {
              const dt = schedRes.data.scheduled_at.split("T")[0];
              setInterviewDate(dt);
            }
          }
        }
      } catch (err) {
        console.error("Schedule load error", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadApp();

    return () => {
      isMounted = false;
    };
  }, [effectiveId]);

  const isFormComplete =
    Boolean(interviewer) &&
    Boolean(interviewType) &&
    Boolean(interviewDate) &&
    Boolean(interviewTime) &&
    Boolean(duration) &&
    Boolean(meetingPlatform);

  const handleScheduleInterview = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!isFormComplete) {
      setErrorMsg("Please complete all interview specifications before scheduling.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        interviewer,
        interview_type: interviewType,
        interview_date: interviewDate,
        interview_time: interviewTime,
        duration,
        interview_mode: interviewMode,
        meeting_platform: meetingPlatform,
        meeting_link: `https://meet.smarthire.com/${effectiveId}-interview`,
        send_email: sendEmail,
        add_to_calendar: addToCalendar,
        notes,
      };

      await API.post(`/applications/${effectiveId}/schedule`, payload);
      setSuccessMsg(`Interview successfully scheduled with ${interviewer} on ${interviewDate} at ${interviewTime}.`);
      setApp((prev) => ({ ...prev, stage: "Interview Scheduled" }));
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to schedule interview.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white text-black flex items-center justify-center text-sm text-gray-500">
        Loading interview scheduling...
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
            Human Interview Scheduling • Application #{app?.id}
          </p>

          <div className="mt-3 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">
                Schedule Interview with {candidate.name || "Candidate"}
              </h1>

              <p className="mt-2 text-gray-500">
                Setup technical and managerial interview sessions with the hiring committee.
              </p>
            </div>

            <span className="w-fit rounded-full bg-black px-4 py-2 text-sm font-medium text-white">
              Stage: {app?.stage}
            </span>
          </div>
        </div>

        {/* Candidate Summary */}
        <section className="mt-8 rounded-xl border border-gray-200 p-6 bg-gray-50/50">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                Candidate Profile
              </p>

              <h2 className="mt-1 text-xl font-semibold text-black">
                {candidate.name}
              </h2>

              <p className="text-sm text-gray-500">
                {candidate.email} • {job.title}
              </p>
            </div>

            <div className="flex gap-4">
              <div className="rounded-lg bg-white border border-gray-200 px-5 py-3 text-center">
                <p className="text-xs text-gray-500">Screening Score</p>
                <p className="text-xl font-semibold text-black">{app?.screening_score || 85}%</p>
              </div>

              <div className="rounded-lg bg-white border border-gray-200 px-5 py-3 text-center">
                <p className="text-xs text-gray-500">AI Interview</p>
                <p className="text-xl font-semibold text-black">{app?.ai_interview_score || 88} / 100</p>
              </div>
            </div>
          </div>
        </section>

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

        {/* Scheduling Form */}
        <form onSubmit={handleScheduleInterview} className="mt-8 space-y-8">
          <section className="rounded-xl border border-gray-200 p-6">
            <div className="border-b border-gray-100 pb-4">
              <h2 className="text-lg font-semibold">
                Interview Specifications
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Select the required details below to configure the interview round.
              </p>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              {/* Interviewer */}
              <div>
                <label className="text-sm font-medium">
                  Assigned Interviewer <span className="text-red-500">*</span>
                </label>

                <select
                  value={interviewer}
                  onChange={(e) => setInterviewer(e.target.value)}
                  required
                  className={`mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black ${
                    interviewer ? "text-black" : "text-gray-400"
                  }`}
                >
                  <option value="" disabled>-- Select Assigned Interviewer --</option>
                  <option value="Dr. Anil Kumar — AI/ML Lead">Dr. Anil Kumar — AI/ML Lead</option>
                  <option value="Priya Menon — Engineering Manager">Priya Menon — Engineering Manager</option>
                  <option value="Rahul Shah — Senior Staff ML Engineer">Rahul Shah — Senior Staff ML Engineer</option>
                  <option value="Dr. Sneha Roy — VP of Engineering">Dr. Sneha Roy — VP of Engineering</option>
                  <option value="Vikram Malhotra — Principal Architect">Vikram Malhotra — Principal Architect</option>
                </select>
              </div>

              {/* Interview Type */}
              <div>
                <label className="text-sm font-medium">
                  Interview Format <span className="text-red-500">*</span>
                </label>

                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value)}
                  required
                  className={`mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black ${
                    interviewType ? "text-black" : "text-gray-400"
                  }`}
                >
                  <option value="" disabled>-- Select Interview Format --</option>
                  <option value="Technical + System Architecture">Technical + System Architecture</option>
                  <option value="Coding & Problem Solving">Coding & Problem Solving</option>
                  <option value="Engineering Manager Round">Engineering Manager Round</option>
                  <option value="Executive Leadership Round">Executive Leadership Round</option>
                  <option value="Culture Fit & HR Discussion">Culture Fit & HR Discussion</option>
                </select>
              </div>

              {/* Date */}
              <div>
                <label className="text-sm font-medium">
                  Interview Date <span className="text-red-500">*</span>
                </label>

                <input
                  type="date"
                  required
                  value={interviewDate}
                  onChange={(e) => setInterviewDate(e.target.value)}
                  className={`mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black ${
                    interviewDate ? "text-black" : "text-gray-400"
                  }`}
                />
              </div>

              {/* Time */}
              <div>
                <label className="text-sm font-medium">
                  Scheduled Time <span className="text-red-500">*</span>
                </label>

                <select
                  value={interviewTime}
                  onChange={(e) => setInterviewTime(e.target.value)}
                  required
                  className={`mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black ${
                    interviewTime ? "text-black" : "text-gray-400"
                  }`}
                >
                  <option value="" disabled>-- Select Scheduled Time --</option>
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="11:30 AM">11:30 AM</option>
                  <option value="01:00 PM">01:00 PM</option>
                  <option value="02:00 PM">02:00 PM</option>
                  <option value="03:30 PM">03:30 PM</option>
                  <option value="05:00 PM">05:00 PM</option>
                  <option value="06:30 PM">06:30 PM</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="text-sm font-medium">
                  Session Duration <span className="text-red-500">*</span>
                </label>

                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  required
                  className={`mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black ${
                    duration ? "text-black" : "text-gray-400"
                  }`}
                >
                  <option value="" disabled>-- Select Duration --</option>
                  <option value="30 minutes">30 minutes</option>
                  <option value="45 minutes">45 minutes</option>
                  <option value="60 minutes">60 minutes</option>
                  <option value="90 minutes">90 minutes</option>
                </select>
              </div>

              {/* Platform */}
              <div>
                <label className="text-sm font-medium">
                  Meeting Platform <span className="text-red-500">*</span>
                </label>

                <select
                  value={meetingPlatform}
                  onChange={(e) => setMeetingPlatform(e.target.value)}
                  required
                  className={`mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-black ${
                    meetingPlatform ? "text-black" : "text-gray-400"
                  }`}
                >
                  <option value="" disabled>-- Select Meeting Platform --</option>
                  <option value="Google Meet">Google Meet</option>
                  <option value="Microsoft Teams">Microsoft Teams</option>
                  <option value="Zoom">Zoom</option>
                </select>
              </div>
            </div>

            {/* Meeting Link Preview */}
            <div className="mt-6">
              <label className="text-sm font-medium">
                Auto-generated Meeting Link
              </label>

              <input
                type="text"
                readOnly
                value={
                  meetingPlatform
                    ? `https://meet.smarthire.com/${effectiveId}-interview`
                    : "(Select a meeting platform above to generate link)"
                }
                className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 font-mono"
              />
            </div>

            {/* Additional Options */}
            <div className="mt-6 grid gap-4 pt-4 border-t border-gray-100 sm:grid-cols-2">
              <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-black"
                />
                <span>Send email calendar invitation to candidate</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={addToCalendar}
                  onChange={(e) => setAddToCalendar(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-black focus:ring-black accent-black"
                />
                <span>Add event to interviewer's calendar</span>
              </label>
            </div>
          </section>

          {/* Real-time Summary of Selected Details Card */}
          <section className="rounded-xl border border-gray-200 bg-gray-50/50 p-6">
            <div className="border-b border-gray-200 pb-4">
              <h3 className="text-base font-semibold text-black">
                Interview Schedule Summary
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review selected interview specifications before confirming the schedule.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Candidate & Role */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Candidate & Role</p>
                <p className="mt-1 font-semibold text-sm text-black truncate">{candidate.name || "N/A"}</p>
                <p className="text-xs text-gray-500 truncate">{job.title || "Target Position"}</p>
              </div>

              {/* Interviewer */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Assigned Interviewer</p>
                {interviewer ? (
                  <p className="mt-1 font-semibold text-sm text-black truncate">{interviewer}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">Not selected</p>
                )}
                <p className="text-xs text-gray-500">Primary Evaluator</p>
              </div>

              {/* Format */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Interview Format</p>
                {interviewType ? (
                  <p className="mt-1 font-semibold text-sm text-black truncate">{interviewType}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">Not selected</p>
                )}
                <p className="text-xs text-gray-500">{interviewMode}</p>
              </div>

              {/* Date & Time */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Date & Time</p>
                {interviewDate || interviewTime ? (
                  <p className="mt-1 font-semibold text-sm text-black">
                    {interviewDate || "Date TBD"} • {interviewTime || "Time TBD"}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">Not selected</p>
                )}
                <p className="text-xs text-gray-500">Duration: {duration || "Not selected"}</p>
              </div>

              {/* Meeting Platform */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Platform</p>
                {meetingPlatform ? (
                  <p className="mt-1 font-semibold text-sm text-black">{meetingPlatform}</p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">Not selected</p>
                )}
                <p className="text-xs text-gray-500">Live Video Session</p>
              </div>

              {/* Meeting Link Preview */}
              <div className="rounded-lg border border-gray-200 bg-white p-4">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Meeting Room</p>
                {meetingPlatform ? (
                  <p className="mt-1 text-xs font-mono text-gray-700 truncate">
                    {`https://meet.smarthire.com/${effectiveId}-interview`}
                  </p>
                ) : (
                  <p className="mt-1 text-sm text-gray-400">Pending platform</p>
                )}
                <p className="text-xs text-gray-500">
                  {sendEmail ? "Auto-invites enabled" : "Manual invite"}
                </p>
              </div>
            </div>
          </section>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6">
            <Link
              to={`/hr/applications/${effectiveId}/final-decision`}
              className="text-sm text-gray-500 hover:text-black transition"
            >
              Skip to Final Decision →
            </Link>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={submitting || !isFormComplete}
                className="rounded-lg bg-black px-6 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
              >
                {submitting ? "Saving Schedule..." : "Save & Schedule Interview"}
              </button>

              <Link
                to={`/hr/applications/${effectiveId}/final-decision`}
                className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-black hover:bg-gray-50 transition"
              >
                Proceed to Final Decision →
              </Link>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

export default ScheduleInterview;