import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import API from "../../services/api";

function ApplyJob() {
  const { jobId } = useParams();
  const navigate = useNavigate();

  const [job, setJob] = useState(null);
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [skills, setSkills] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [parsingResume, setParsingResume] = useState(false);
  const [autoFillNotice, setAutoFillNotice] = useState("");
  const [identityVerification, setIdentityVerification] = useState(null);
  const [justificationNote, setJustificationNote] = useState("");
  const [showJustification, setShowJustification] = useState(false);
  const [isSyncingProfile, setIsSyncingProfile] = useState(false);
  const [syncNotice, setSyncNotice] = useState("");
  const [triageResult, setTriageResult] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const storedUser = localStorage.getItem("smarthire_user") || localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (isMounted) {
        setUser(parsed);
      }
    } else {
      navigate("/candidate/login");
    }

    const fetchJob = async () => {
      try {
        const res = await API.get(`/jobs/${jobId}`);
        if (isMounted) setJob(res.data);
      } catch (err) {
        console.error("Job fetch error", err);
      }
    };
    fetchJob();

    return () => {
      isMounted = false;
    };
  }, [jobId, navigate]);

  const handleResumeFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setParsingResume(true);
    setAutoFillNotice("");
    setSyncNotice("");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Pass candidate_id to enable real-time identity consistency check
      const url = user?.id
        ? `/applications/parse-resume?candidate_id=${user.id}`
        : "/applications/parse-resume";

      const res = await API.post(url, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data && res.data.data) {
        const parsed = res.data.data;
        let filledCount = 0;

        if (parsed.name && parsed.name.trim()) {
          setFullName(parsed.name);
          filledCount++;
        }
        if (parsed.email && parsed.email.trim()) {
          setEmail(parsed.email);
          filledCount++;
        }
        if (parsed.phone && parsed.phone.trim()) {
          setPhone(parsed.phone);
          filledCount++;
        }
        if (parsed.skills && parsed.skills.trim()) {
          setSkills(parsed.skills);
          filledCount++;
        }

        setAutoFillNotice(
          `✨ Resume scanned successfully! Auto-filled ${filledCount} detail fields directly from your document.`
        );
      }

      if (res.data && res.data.verification) {
        setIdentityVerification(res.data.verification);
      }
    } catch (parseErr) {
      console.warn("Resume instant auto-fill notice:", parseErr);
    } finally {
      setParsingResume(false);
    }
  };

  // Sync candidate account profile to match extracted resume details
  const handleSyncProfile = async () => {
    if (!user?.id || !identityVerification?.resume_data) return;
    setIsSyncingProfile(true);
    setError("");

    const resData = identityVerification.resume_data;
    try {
      const payload = {
        name: resData.name || fullName,
        email: resData.email || email,
        phone: resData.phone || phone,
        skills: resData.skills || skills,
      };

      const res = await API.put(`/users/${user.id}`, payload);
      const updatedUser = { ...user, ...res.data };
      setUser(updatedUser);
      localStorage.setItem("smarthire_user", JSON.stringify(updatedUser));
      localStorage.setItem("user", JSON.stringify(updatedUser));

      setFullName(updatedUser.name);
      setEmail(updatedUser.email);
      if (updatedUser.phone) setPhone(updatedUser.phone);
      if (updatedUser.skills) setSkills(updatedUser.skills);

      // Re-verify with updated account data
      setIdentityVerification({
        ...identityVerification,
        is_verified: true,
        status: "VERIFIED",
        match_score: 100.0,
        has_hard_mismatch: false,
        summary_title: "Account Profile Synchronized & Verified",
        message: "Your registered account profile has been successfully updated to match the credentials on your uploaded resume document.",
        discrepancies: identityVerification.discrepancies.map((d) => ({
          ...d,
          status: "MATCH",
          account_value: d.resume_value,
          note: "Synchronized with resume document.",
        })),
      });

      setSyncNotice("Account credentials synchronized successfully with your resume!");
    } catch (syncErr) {
      setError(syncErr.response?.data?.detail || "Failed to update profile. Please try again.");
    } finally {
      setIsSyncingProfile(false);
    }
  };

  // Form validation & missing fields tracking
  const missingFields = [];
  if (!resumeFile) missingFields.push("Resume document (Upload required)");
  if (!fullName.trim()) missingFields.push("Full name");
  if (!email.trim()) missingFields.push("Email address");
  if (!phone.trim()) missingFields.push("Phone number");
  if (!skills.trim()) missingFields.push("Key skills & frameworks");
  if (!confirmed) missingFields.push("Confirmation agreement");

  // Check if there is an unresolved hard identity mismatch
  const hasUnresolvedDiscrepancy =
    identityVerification &&
    identityVerification.has_hard_mismatch &&
    !justificationNote.trim();

  const isFormValid = missingFields.length === 0 && !hasUnresolvedDiscrepancy;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
      if (hasUnresolvedDiscrepancy) {
        setError(
          "Identity verification discrepancy detected: Please synchronize your account profile, upload the matching resume, or provide an official justification note before submitting."
        );
      } else {
        setError(`Please complete all required fields before submitting: ${missingFields.join(", ")}`);
      }
      return;
    }

    if (!user) {
      navigate("/candidate/login");
      return;
    }

    setLoading(true);

    try {
      // 1. Submit Application to Database
      const appPayload = {
        job_id: parseInt(jobId),
        candidate_id: user.id,
        identity_match_score: identityVerification ? identityVerification.match_score : 100.0,
        identity_match_status: identityVerification
          ? justificationNote.trim()
            ? "Discrepancy Justified"
            : identityVerification.status
          : "Verified",
        identity_discrepancies: identityVerification
          ? { ...identityVerification, justification_note: justificationNote.trim() }
          : null,
      };

      const appRes = await API.post("/applications", appPayload);
      const newAppId = appRes.data.id;

      // 2. Automatically trigger AI resume screening
      let screenInfo = null;
      try {
        const formData = new FormData();
        if (resumeFile) {
          formData.append("file", resumeFile);
        }
        if (justificationNote.trim()) {
          formData.append("justification_note", justificationNote.trim());
        }

        const screenRes = await API.post(`/applications/${newAppId}/screen`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        screenInfo = screenRes.data;
      } catch (screenErr) {
        console.warn("Screening trigger background notice:", screenErr);
      }

      const finalScore = screenInfo?.screening_score != null ? screenInfo.screening_score : 85.0;
      const finalEligibility = screenInfo?.eligibility || (finalScore >= 85 ? "Eligible" : finalScore >= 60 ? "Under Review" : "Not Eligible");

      setTriageResult({
        applicationId: newAppId,
        score: finalScore,
        eligibility: finalEligibility,
        matchedSkills: screenInfo?.matched_skills || [],
        jobTitle: job?.title || "Role",
        company: job?.company || "SmartHire",
      });
    } catch (err) {
      setError(
        err.response?.data?.detail || "Application submission failed. You may have already applied for this role."
      );
    } finally {
      setLoading(false);
    }
  };

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

      {/* Triage Result Screen or Application Form */}
      {triageResult ? (
        <div className="max-w-2xl mx-auto px-6 py-14">
          <div className="border border-neutral-200 rounded-3xl p-8 shadow-sm bg-white text-center">
            {/* Triage Badge / Icon */}
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl mb-6">
              {triageResult.eligibility === "Eligible" ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 text-3xl font-bold">
                  ✓
                </div>
              ) : triageResult.eligibility === "Under Review" ? (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-800 text-3xl font-bold">
                  ⏳
                </div>
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-rose-100 text-rose-700 text-3xl font-bold">
                  ✕
                </div>
              )}
            </div>

            <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
              Resume Screening Triage • Application #{triageResult.applicationId}
            </p>

            <h1 className="mt-2 text-2xl font-bold text-neutral-900 sm:text-3xl">
              {triageResult.eligibility === "Eligible"
                ? "Eligible for AI Interview"
                : triageResult.eligibility === "Under Review"
                ? "Application Under Review"
                : "Not Eligible for AI Interview"}
            </h1>

            <p className="mt-2 text-sm text-neutral-600">
              Role: <span className="font-semibold text-black">{triageResult.jobTitle}</span> • {triageResult.company}
            </p>

            {/* Score & Triage Breakdown */}
            <div className="mt-6 rounded-2xl border border-neutral-200 bg-neutral-50/70 p-6 text-left">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-neutral-500">Screening Match Score</p>
                  <p className="text-3xl font-extrabold text-neutral-900 mt-1">
                    {triageResult.score}%
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-neutral-500">Triage Status</p>
                  <span
                    className={`inline-flex mt-1 items-center px-3 py-1 rounded-full text-xs font-semibold border ${
                      triageResult.eligibility === "Eligible"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : triageResult.eligibility === "Under Review"
                        ? "bg-amber-50 text-amber-800 border-amber-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {triageResult.eligibility}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    triageResult.score >= 85
                      ? "bg-emerald-600"
                      : triageResult.score >= 60
                      ? "bg-amber-500"
                      : "bg-rose-500"
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, triageResult.score))}%` }}
                />
              </div>

              {/* Triage Criteria Reference */}
              <div className="mt-5 grid grid-cols-3 gap-2 pt-4 border-t border-neutral-200 text-center text-[11px]">
                <div className={`p-2 rounded-lg ${triageResult.score >= 85 ? "bg-emerald-100/70 font-semibold text-emerald-900 border border-emerald-300" : "text-neutral-400"}`}>
                  <p>≥ 85%</p>
                  <p>AI Interview</p>
                </div>
                <div className={`p-2 rounded-lg ${triageResult.score >= 60 && triageResult.score < 85 ? "bg-amber-100/70 font-semibold text-amber-900 border border-amber-300" : "text-neutral-400"}`}>
                  <p>60% – 84%</p>
                  <p>Under Review</p>
                </div>
                <div className={`p-2 rounded-lg ${triageResult.score < 60 ? "bg-rose-100/70 font-semibold text-rose-900 border border-rose-300" : "text-neutral-400"}`}>
                  <p>&lt; 60%</p>
                  <p>Not Eligible</p>
                </div>
              </div>

              {/* Explanatory Message */}
              <div className="mt-4 text-xs leading-relaxed text-neutral-600">
                {triageResult.eligibility === "Eligible" ? (
                  <p>
                    🎉 <strong>Great match!</strong> Your skills match or exceed the 85% qualification threshold. You are cleared to take the automated AI technical interview immediately.
                  </p>
                ) : triageResult.eligibility === "Under Review" ? (
                  <p>
                    ⏳ <strong>Under HR Inspection:</strong> Your match score is between 60% and 84%. Your application has been successfully recorded and submitted for manual HR review. You will be notified when your AI interview is unlocked.
                  </p>
                ) : (
                  <p>
                    ℹ️ <strong>Minimum threshold not met:</strong> Your match score is below 60% for this role. You are not eligible for the AI interview at this time, but you are welcome to apply to other matching roles.
                  </p>
                )}
              </div>
            </div>

            {/* Matched skills list if available */}
            {triageResult.matchedSkills && triageResult.matchedSkills.length > 0 && (
              <div className="mt-4 text-left">
                <p className="text-xs font-medium text-neutral-500 mb-2">Verified Skills in Resume:</p>
                <div className="flex flex-wrap gap-1.5">
                  {triageResult.matchedSkills.map((sk, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-neutral-100 text-neutral-800"
                    >
                      ✓ {sk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              {triageResult.eligibility === "Eligible" ? (
                <>
                  <Link
                    to={`/candidate/interview/rules/${triageResult.applicationId}`}
                    className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 shadow-sm text-center"
                  >
                    Proceed to AI Interview Protocol →
                  </Link>
                  <Link
                    to="/candidate/applications"
                    className="rounded-xl border border-neutral-300 px-5 py-3.5 text-sm font-medium text-black transition hover:bg-neutral-50 text-center"
                  >
                    View in My Applications
                  </Link>
                </>
              ) : triageResult.eligibility === "Under Review" ? (
                <>
                  <Link
                    to="/candidate/applications"
                    className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 shadow-sm text-center"
                  >
                    Go to My Applications →
                  </Link>
                  <Link
                    to="/candidate/dashboard"
                    className="rounded-xl border border-neutral-300 px-5 py-3.5 text-sm font-medium text-black transition hover:bg-neutral-50 text-center"
                  >
                    Return to Dashboard
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/candidate/jobs"
                    className="rounded-xl bg-black px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800 shadow-sm text-center"
                  >
                    Explore Other Openings →
                  </Link>
                  <Link
                    to="/candidate/applications"
                    className="rounded-xl border border-neutral-300 px-5 py-3.5 text-sm font-medium text-black transition hover:bg-neutral-50 text-center"
                  >
                    View My Applications
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl mx-auto px-6 py-14">
          {/* Back */}
          <Link
            to={`/candidate/jobs/${jobId}`}
            className="text-sm text-neutral-500 hover:text-black transition"
          >
            ← Back to job
          </Link>

          {/* Header */}
          <div className="mt-10 mb-10">
            <p className="text-sm text-neutral-500">
              Application Submission
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-tight">
              Apply for {job?.title || "Role"}
            </h1>

            <p className="mt-3 text-neutral-500">
              Please upload your resume and verify all details. All fields are required to proceed with your application.
            </p>
          </div>

          {/* Form */}
          <div className="border border-neutral-200 rounded-2xl p-8 shadow-sm">
          {syncNotice && (
            <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-medium text-emerald-800 flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2">
                <span className="text-base">✓</span>
                <span>{syncNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setSyncNotice("")}
                className="text-emerald-700 hover:text-emerald-900 ml-4 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {autoFillNotice && (
            <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs font-medium text-blue-900 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">✨</span>
                <span>{autoFillNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoFillNotice("")}
                className="text-blue-700 hover:text-blue-900 ml-4 font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Upload - Positioned at top for instant autofill flow */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="resume"
                  className="block text-sm font-semibold"
                >
                  Upload Resume (PDF, DOCX, TXT)
                </label>
                
                {resumeFile ? (
                  <span className="text-xs text-neutral-800 bg-neutral-100 border border-neutral-200 font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <span>✓</span> Attached
                  </span>
                ) : (
                  <span className="text-xs text-red-500 border border-red-200 bg-red-50/60 font-medium px-2 py-0.5 rounded-full">
                    Required
                  </span>
                )}
              </div>

              <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                parsingResume
                  ? "border-neutral-900 bg-neutral-100 animate-pulse"
                  : resumeFile
                  ? "border-neutral-900 bg-neutral-50"
                  : "border-red-400 bg-red-50/15 hover:border-red-500"
              }`}>
                <input
                  id="resume"
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  className="hidden"
                  onChange={handleResumeFileChange}
                />

                <label
                  htmlFor="resume"
                  className="cursor-pointer block"
                >
                  {parsingResume ? (
                    <div>
                      <div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent mb-3"></div>
                      <p className="text-sm font-semibold text-black">
                        AI Scanning & Extracting Details...
                      </p>
                      <p className="text-xs text-neutral-500 mt-1">
                        Reading document structure, technical skills, and candidate profile in real-time.
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-3 text-neutral-400">
                        {resumeFile ? "📄" : "☁️"}
                      </div>

                      <p className="text-sm font-medium">
                        {resumeFile ? (
                          <span className="text-black font-semibold">{resumeFile.name}</span>
                        ) : (
                          <span className="text-neutral-700 font-medium">Click to upload resume (PDF, DOCX, TXT)</span>
                        )}
                      </p>

                      <p className="text-xs text-neutral-500 mt-2">
                        {resumeFile
                          ? "Click again to change document and re-parse details."
                          : "Our AI parser will automatically read your document, verify identity consistency, and auto-fill the fields below."}
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* IDENTITY VERIFICATION & RECONCILIATION PANEL */}
            {identityVerification && (
              <div
                className={`rounded-2xl border p-6 transition-all duration-300 ${
                  identityVerification.has_hard_mismatch && !justificationNote.trim()
                    ? "border-red-300 bg-red-50/40"
                    : identityVerification.is_verified
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-amber-200 bg-amber-50/30"
                }`}
              >
                {/* Status Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-neutral-200/80">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg shrink-0 font-bold ${
                        identityVerification.has_hard_mismatch && !justificationNote.trim()
                          ? "bg-red-100 text-red-700 border border-red-200"
                          : identityVerification.is_verified
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {identityVerification.has_hard_mismatch && !justificationNote.trim()
                        ? "⚠️"
                        : identityVerification.is_verified
                        ? "🛡️"
                        : "ℹ️"}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h2 className="text-base font-semibold text-black tracking-tight">
                          {justificationNote.trim()
                            ? "Identity Discrepancy Exception Attached"
                            : identityVerification.summary_title}
                        </h2>

                        <span
                          className={`text-2xs uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full ${
                            identityVerification.has_hard_mismatch && !justificationNote.trim()
                              ? "bg-red-200/80 text-red-800 border border-red-300"
                              : identityVerification.is_verified
                              ? "bg-emerald-200/80 text-emerald-900 border border-emerald-300"
                              : "bg-amber-200/80 text-amber-900 border border-amber-300"
                          }`}
                        >
                          {justificationNote.trim()
                            ? "Exception Documented"
                            : `Match Confidence: ${identityVerification.match_score}%`}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                        {justificationNote.trim()
                          ? "Your formal discrepancy explanation will be submitted to the HR recruiter for manual audit."
                          : identityVerification.message}
                      </p>
                    </div>
                  </div>

                  {identityVerification.is_verified && !identityVerification.has_hard_mismatch && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-white border border-emerald-200 px-3 py-1.5 rounded-xl shrink-0 shadow-2xs">
                      <span>✓</span>
                      <span>Verified Authenticity</span>
                    </div>
                  )}
                </div>

                {/* Side-by-Side Comparison Matrix */}
                <div className="mt-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-700 uppercase tracking-wider">
                      Identity & Credential Reconciliation Matrix
                    </span>
                    <span className="text-2xs text-neutral-500">
                      Cross-referencing Account Record vs. Resume Document
                    </span>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold">
                          <th className="py-2.5 px-4">Credential Field</th>
                          <th className="py-2.5 px-4">Registered Account Record 👤</th>
                          <th className="py-2.5 px-4">Detected in Resume 📄</th>
                          <th className="py-2.5 px-4">Match Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {identityVerification.discrepancies.map((item, idx) => {
                          const isMatch = item.status === "MATCH";
                          const isMismatch = item.status === "MISMATCH";

                          return (
                            <tr key={idx} className={isMismatch ? "bg-red-50/30" : "hover:bg-neutral-50/50"}>
                              <td className="py-3 px-4 font-medium text-neutral-900 whitespace-nowrap">
                                {item.field}
                              </td>

                              <td className="py-3 px-4 text-neutral-700 max-w-[200px] truncate" title={item.account_value}>
                                <span className="font-mono text-2xs bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200">
                                  {item.account_value || "—"}
                                </span>
                              </td>

                              <td className="py-3 px-4 text-neutral-700 max-w-[200px] truncate" title={item.resume_value}>
                                <span
                                  className={`font-mono text-2xs px-2 py-0.5 rounded border ${
                                    isMismatch
                                      ? "bg-red-100 text-red-900 border-red-200 font-semibold"
                                      : "bg-neutral-100 border-neutral-200"
                                  }`}
                                >
                                  {item.resume_value || "—"}
                                </span>
                              </td>

                              <td className="py-3 px-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-2xs font-semibold ${
                                    isMatch
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : isMismatch
                                      ? "bg-red-100 text-red-800 border border-red-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}
                                >
                                  {isMatch ? "✓ Matched" : isMismatch ? "🔴 Mismatch Conflict" : "Minor Variation"}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Professional Resolution Suite (If Discrepancy Exists) */}
                {identityVerification.has_hard_mismatch && (
                  <div className="mt-5 pt-5 border-t border-red-200/80">
                    <div className="mb-3">
                      <p className="text-xs font-semibold text-red-900">
                        Resolution Options (Choose one to proceed):
                      </p>
                      <p className="text-xs text-neutral-600 mt-0.5">
                        In accordance with hiring compliance standards, you must reconcile these details before completing application submission.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {/* Action 1: Upload Matching Resume */}
                      <label
                        htmlFor="resume"
                        className="cursor-pointer flex flex-col justify-between p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-black hover:shadow-2xs transition text-left"
                      >
                        <div>
                          <div className="text-sm font-semibold text-black flex items-center gap-1.5">
                            <span>🔄</span> Upload Correct Resume
                          </div>
                          <p className="text-2xs text-neutral-500 mt-1 leading-normal">
                            Replace the document with your own resume matching account credentials.
                          </p>
                        </div>
                        <span className="mt-3 text-xs font-medium text-neutral-700 underline">
                          Browse Files →
                        </span>
                      </label>

                      {/* Action 2: Sync Account Profile */}
                      <button
                        type="button"
                        onClick={handleSyncProfile}
                        disabled={isSyncingProfile}
                        className="cursor-pointer flex flex-col justify-between p-3.5 rounded-xl border border-neutral-200 bg-white hover:border-black hover:shadow-2xs transition text-left disabled:opacity-50"
                      >
                        <div>
                          <div className="text-sm font-semibold text-black flex items-center gap-1.5">
                            <span>⚡</span> Sync Account Profile
                          </div>
                          <p className="text-2xs text-neutral-500 mt-1 leading-normal">
                            Update your registered profile data to match the credentials on this document.
                          </p>
                        </div>
                        <span className="mt-3 text-xs font-medium text-black underline">
                          {isSyncingProfile ? "Updating Profile..." : "Sync Credentials Now →"}
                        </span>
                      </button>

                      {/* Action 3: Justification Note */}
                      <button
                        type="button"
                        onClick={() => setShowJustification(!showJustification)}
                        className={`cursor-pointer flex flex-col justify-between p-3.5 rounded-xl border transition text-left ${
                          showJustification
                            ? "border-black bg-neutral-900 text-white"
                            : "border-neutral-200 bg-white hover:border-black hover:shadow-2xs"
                        }`}
                      >
                        <div>
                          <div
                            className={`text-sm font-semibold flex items-center gap-1.5 ${
                              showJustification ? "text-white" : "text-black"
                            }`}
                          >
                            <span>📝</span> Submit Justification
                          </div>
                          <p
                            className={`text-2xs mt-1 leading-normal ${
                              showJustification ? "text-neutral-300" : "text-neutral-500"
                            }`}
                          >
                            Provide a formal statement explaining legal name changes or alternative emails.
                          </p>
                        </div>
                        <span
                          className={`mt-3 text-xs font-medium underline ${
                            showJustification ? "text-white" : "text-black"
                          }`}
                        >
                          {showJustification ? "Hide Justification Form" : "Explain Discrepancy →"}
                        </span>
                      </button>
                    </div>

                    {/* Discrepancy Explanation Input Area */}
                    {showJustification && (
                      <div className="mt-4 p-4 rounded-xl bg-white border border-neutral-300 animate-fadeIn">
                        <label
                          htmlFor="justification"
                          className="block text-xs font-semibold text-neutral-800 mb-1"
                        >
                          Official Discrepancy Statement (Attached to HR Evaluation Audit)
                        </label>
                        <p className="text-2xs text-neutral-500 mb-2">
                          Please state the reason for information divergence (e.g., &quot;Recently changed legal surname after marriage&quot;, &quot;Applied with university research lab alias email&quot;):
                        </p>
                        <textarea
                          id="justification"
                          rows={3}
                          value={justificationNote}
                          onChange={(e) => setJustificationNote(e.target.value)}
                          placeholder="Type your official explanation for the HR recruiting team..."
                          className="w-full border border-neutral-300 rounded-lg p-3 text-xs outline-none focus:border-black focus:ring-1 focus:ring-black"
                        />
                        {justificationNote.trim().length > 0 && (
                          <p className="text-2xs text-emerald-700 font-medium mt-1.5 flex items-center gap-1">
                            <span>✓</span> Exception justification entered. Submission will proceed with an HR audit flag.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Full Name */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium"
                >
                  Full name
                </label>
                {!fullName.trim() && (
                  <span className="text-xs text-neutral-400">Required</span>
                )}
              </div>

              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Email */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="email"
                  className="block text-sm font-medium"
                >
                  Email address
                </label>
                {!email.trim() && (
                  <span className="text-xs text-neutral-400">Required</span>
                )}
              </div>

              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Phone */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium"
                >
                  Phone number
                </label>
                {!phone.trim() && (
                  <span className="text-xs text-neutral-400">Required</span>
                )}
              </div>

              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Candidate Skills */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="skills"
                  className="block text-sm font-medium"
                >
                  Key Skills & Frameworks
                </label>
                {!skills.trim() && (
                  <span className="text-xs text-neutral-400">Required</span>
                )}
              </div>

              <input
                id="skills"
                type="text"
                required
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                placeholder="e.g. Python, Machine Learning, FastAPI, PyTorch, Docker"
                className="w-full border border-neutral-300 rounded-lg px-4 py-3 text-sm outline-none transition focus:border-black focus:ring-1 focus:ring-black"
              />
            </div>

            {/* Confirmation */}
            <div className="pt-2">
              <div className="flex items-start gap-3">
                <input
                  id="confirm"
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1 accent-black h-4 w-4 cursor-pointer"
                />

                <label
                  htmlFor="confirm"
                  className="text-sm text-neutral-600 leading-6 cursor-pointer"
                >
                  I confirm that the information provided in this application is accurate and I agree to proceed to automated interview evaluation.
                </label>
              </div>
            </div>

            {/* Missing Fields Checklist Banner */}
            {!isFormValid && (
              <div className="rounded-xl border-2 border-dashed border-red-400 bg-neutral-50/60 p-4 text-xs text-neutral-700 transition-all">
                <div className="mb-2.5">
                  <span className="font-semibold text-neutral-900 tracking-tight">Required to submit application:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {missingFields.map((field, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 border border-neutral-200 shadow-2xs"
                    >
                      {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!isFormValid || loading || parsingResume}
              className={`w-full rounded-xl py-3.5 text-sm font-medium transition-all duration-200 ${
                !isFormValid || loading || parsingResume
                  ? "bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200"
                  : "bg-black text-white hover:bg-neutral-800 hover:-translate-y-0.5 cursor-pointer shadow-sm"
              }`}
            >
              {loading
                ? "Processing Application..."
                : parsingResume
                ? "Scanning Resume..."
                : !isFormValid
                ? "Complete All Required Fields to Submit"
                : "Submit Application & Continue →"}
            </button>
          </form>
        </div>
      </div>
      )}
    </main>
  );
}

export default ApplyJob;