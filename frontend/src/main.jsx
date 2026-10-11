import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

import "./index.css";
import App from "./App.jsx";

// Candidate Portal Pages
import CandidateLogin from "./pages/candidate/Login.jsx";
import CandidateRegister from "./pages/candidate/Register.jsx";
import CandidateDashboard from "./pages/candidate/Dashboard.jsx";
import Jobs from "./pages/candidate/Jobs.jsx";
import JobDetails from "./pages/candidate/JobDetails.jsx";
import ApplyJob from "./pages/candidate/ApplyJob.jsx";
import Applications from "./pages/candidate/Applications.jsx";
import InterviewRules from "./pages/candidate/Interview/InterviewRules.jsx";
import SystemCheck from "./pages/candidate/Interview/SystemCheck.jsx";
import SecureInterview from "./pages/candidate/Interview/SecureInterview.jsx";
import InterviewResult from "./pages/candidate/Interview/InterviewResult.jsx";

// HR / Recruiter Portal Pages
import HRLogin from "./pages/hr/Login.jsx";
import HRRegister from "./pages/hr/Register.jsx";
import HRDashboard from "./pages/hr/Dashboard.jsx";
import CreateJob from "./pages/hr/CreateJob.jsx";
import HRApplications from "./pages/hr/Applications.jsx";
import CandidateProfile from "./pages/hr/CandidateProfile.jsx";
import ScreeningResults from "./pages/hr/ScreeningResults.jsx";
import InterviewResults from "./pages/hr/InterviewResults.jsx";
import SecurityReports from "./pages/hr/SecurityReports.jsx";
import ScheduleInterview from "./pages/hr/ScheduleInterview.jsx";
import FinalDecision from "./pages/hr/FinalDecision.jsx";

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<App />} />

        {/* General Login */}
        <Route path="/login" element={<CandidateLogin />} />

        {/* Candidate Portal */}
        <Route path="/candidate/login" element={<CandidateLogin />} />
        <Route path="/candidate/register" element={<CandidateRegister />} />
        <Route path="/candidate/dashboard" element={<CandidateDashboard />} />
        <Route path="/candidate/jobs" element={<Jobs />} />
        <Route path="/candidate/jobs/:jobId" element={<JobDetails />} />
        <Route path="/candidate/apply/:jobId" element={<ApplyJob />} />
        <Route path="/candidate/applications" element={<Applications />} />
        <Route path="/candidate/interview/rules" element={<InterviewRules />} />
        <Route path="/candidate/interview/rules/:applicationId" element={<InterviewRules />} />
        <Route path="/candidate/interview/system-check" element={<SystemCheck />} />
        <Route path="/candidate/interview/system-check/:applicationId" element={<SystemCheck />} />
        <Route path="/candidate/interview/secure" element={<SecureInterview />} />
        <Route path="/candidate/interview/secure/:applicationId" element={<SecureInterview />} />
        <Route path="/candidate/interview/result" element={<InterviewResult />} />
        <Route path="/candidate/interview/result/:applicationId" element={<InterviewResult />} />

        {/* HR / Recruiter Portal (applicationId-based workflow routing) */}
        <Route path="/hr/login" element={<HRLogin />} />
        <Route path="/hr/register" element={<HRRegister />} />
        <Route path="/hr/dashboard" element={<HRDashboard />} />
        <Route path="/hr/jobs/create" element={<CreateJob />} />
        <Route path="/hr/applications" element={<HRApplications />} />
        <Route path="/hr/applications/:applicationId" element={<CandidateProfile />} />
        <Route path="/hr/applications/:applicationId/screening-results" element={<ScreeningResults />} />
        <Route path="/hr/applications/:applicationId/interview-results" element={<InterviewResults />} />
        <Route path="/hr/applications/:applicationId/security-report" element={<SecurityReports />} />
        <Route path="/hr/applications/:applicationId/security-reports" element={<SecurityReports />} />
        <Route path="/hr/applications/:applicationId/schedule-interview" element={<ScheduleInterview />} />
        <Route path="/hr/applications/:applicationId/final-decision" element={<FinalDecision />} />

        {/* Legacy routes mapping for backward compatibility */}
        <Route path="/hr/candidates/:candidateId" element={<CandidateProfile />} />
        <Route path="/hr/candidates/:candidateId/screening-results" element={<ScreeningResults />} />
        <Route path="/hr/candidates/:candidateId/interview-results" element={<InterviewResults />} />
        <Route path="/hr/candidates/:candidateId/security-reports" element={<SecurityReports />} />
        <Route path="/hr/candidates/:candidateId/schedule-interview" element={<ScheduleInterview />} />
        <Route path="/hr/candidates/:candidateId/final-decision" element={<FinalDecision />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>
);