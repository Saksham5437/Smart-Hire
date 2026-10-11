import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const elements = document.querySelectorAll(".reveal");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
          }
        });
      },
      {
        threshold: 0.15,
      }
    );

    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <main className="min-h-screen bg-white text-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="text-xl font-semibold tracking-tight">
            SmartHire
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-neutral-600 transition hover:text-black"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-neutral-600 transition hover:text-black"
            >
              How It Works
            </a>
            <a
              href="#recruiters"
              className="text-sm text-neutral-600 transition hover:text-black"
            >
              For Recruiters
            </a>
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            <Link
              to="/candidate/login"
              className="cursor-pointer hidden rounded-full px-4 py-2 text-sm font-medium transition hover:bg-neutral-100 sm:block"
            >
              Sign In
            </Link>

            <Link
              to="/candidate/register"
              className="cursor-pointer rounded-full bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto flex min-h-[calc(100vh-73px)] max-w-6xl items-center justify-center px-6 py-24 text-center lg:px-8">
          <div className="max-w-4xl">
            {/* Eyebrow */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2">
              <span className="text-xs font-medium tracking-wide text-neutral-600">
                AI-POWERED RECRUITMENT
              </span>
            </div>

            {/* Main Heading */}
            <h1 className="text-6xl font-semibold leading-[0.95] tracking-[-0.04em] sm:text-7xl lg:text-8xl">
              Smarter hiring.
              <br />
              <span className="text-neutral-400">Better talent.</span>
            </h1>

            {/* Description */}
            <p className="mx-auto mt-8 max-w-2xl text-base leading-7 text-neutral-500 sm:text-lg">
              SmartHire brings intelligent candidate screening, AI-powered interviews, secure
              assessment, and streamlined recruitment into one platform.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/candidate/register")}
                className="cursor-pointer w-full rounded-full bg-black px-7 py-3.5 text-sm font-medium text-white transition duration-200 hover:bg-neutral-800 sm:w-auto"
              >
                Get Started
              </button>

              <a
                href="#how-it-works"
                className="cursor-pointer w-full rounded-full border border-neutral-300 px-7 py-3.5 text-sm font-medium text-black transition duration-200 hover:bg-neutral-100 sm:w-auto"
              >
                See How It Works
              </a>
            </div>

            {/* Workflow */}
            <div className="mx-auto mt-16 max-w-3xl border-t border-neutral-200 pt-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-widest text-neutral-400">
                One intelligent workflow
              </p>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-neutral-500">
                <span>Resume</span>
                <span className="text-neutral-300">→</span>

                <span>Screening</span>
                <span className="text-neutral-300">→</span>

                <span>AI Interview</span>
                <span className="text-neutral-300">→</span>

                <span>Evaluation</span>
                <span className="text-neutral-300">→</span>

                <span className="font-medium text-black">Human Interview</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
          {/* Section Heading */}
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-neutral-500">THE SMARTER WAY TO HIRE</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Everything hiring needs.
            </h2>
            <p className="mt-5 text-base leading-7 text-neutral-500 sm:text-lg">
              Intelligent tools designed to simplify every stage of the recruitment process.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="mx-auto mt-16 grid max-w-5xl gap-4 md:grid-cols-2">
            {/* Feature 1 */}
            <div className="reveal group rounded-2xl border border-neutral-200 bg-white p-8 transition duration-300 hover:border-neutral-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">01</span>
                <span className="text-sm text-neutral-400 transition group-hover:text-black">↗</span>
              </div>
              <h3 className="mt-12 text-2xl font-semibold tracking-tight">Resume AI</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Automatically analyze candidate resumes and compare qualifications against job requirements.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="reveal group rounded-2xl border border-neutral-200 bg-white p-8 transition duration-300 hover:border-neutral-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">02</span>
                <span className="text-sm text-neutral-400 transition group-hover:text-black">↗</span>
              </div>
              <h3 className="mt-12 text-2xl font-semibold tracking-tight">AI Interview</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Conduct adaptive AI-powered interviews that respond intelligently to each candidate's answers.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="reveal group rounded-2xl border border-neutral-200 bg-white p-8 transition duration-300 hover:border-neutral-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">03</span>
                <span className="text-sm text-neutral-400 transition group-hover:text-black">↗</span>
              </div>
              <h3 className="mt-12 text-2xl font-semibold tracking-tight">Secure Interview</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
                A controlled interview environment with camera, microphone, screen sharing and real-time security monitoring.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="reveal group rounded-2xl border border-neutral-200 bg-white p-8 transition duration-300 hover:border-neutral-300 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-neutral-400">04</span>
                <span className="text-sm text-neutral-400 transition group-hover:text-black">↗</span>
              </div>
              <h3 className="mt-12 text-2xl font-semibold tracking-tight">Smart Scheduling</h3>
              <p className="mt-3 max-w-md text-sm leading-6 text-neutral-500">
                Streamline the transition to human interviews with automated scheduling and meeting notifications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="bg-white">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-neutral-500">HOW IT WORKS</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              One workflow. From application to interview.
            </h2>
            <p className="mt-5 text-base leading-7 text-neutral-500 sm:text-lg">
              SmartHire brings each stage of recruitment into one connected experience.
            </p>
          </div>

          <div className="mx-auto mt-20 max-w-5xl">
            <div className="grid gap-6 border-t border-neutral-200 py-10 md:grid-cols-[100px_1fr_1fr] md:items-center">
              <span className="text-sm font-medium text-neutral-400">01</span>
              <h3 className="text-2xl font-semibold tracking-tight">Apply</h3>
              <p className="text-sm leading-6 text-neutral-500">
                Candidates create an account, explore available positions and submit their application with a resume.
              </p>
            </div>

            <div className="grid gap-6 border-t border-neutral-200 py-10 md:grid-cols-[100px_1fr_1fr] md:items-center">
              <span className="text-sm font-medium text-neutral-400">02</span>
              <h3 className="text-2xl font-semibold tracking-tight">AI Screening</h3>
              <p className="text-sm leading-6 text-neutral-500">
                Intelligent screening analyzes qualifications and skills against the job requirements automatically.
              </p>
            </div>

            <div className="grid gap-6 border-t border-neutral-200 py-10 md:grid-cols-[100px_1fr_1fr] md:items-center">
              <span className="text-sm font-medium text-neutral-400">03</span>
              <h3 className="text-2xl font-semibold tracking-tight">AI Interview</h3>
              <p className="text-sm leading-6 text-neutral-500">
                Shortlisted candidates complete an adaptive, proctored AI interview in a secure environment.
              </p>
            </div>

            <div className="grid gap-6 border-t border-neutral-200 py-10 md:grid-cols-[100px_1fr_1fr] md:items-center">
              <span className="text-sm font-medium text-neutral-400">04</span>
              <h3 className="text-2xl font-semibold tracking-tight">Human Interview</h3>
              <p className="text-sm leading-6 text-neutral-500">
                Recruiters review AI evaluations and schedule interviews with top-performing candidates.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recruiter Section */}
      <section id="recruiters" className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium text-neutral-500">PORTALS</p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Built for candidates & recruiters
            </h2>
            <p className="mt-5 text-base leading-7 text-neutral-500 sm:text-lg">
              Dedicated interfaces tailored for each stage of hiring.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
            {/* Candidate Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 transition duration-300 hover:border-neutral-300">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  For Candidates
                </span>
                <span className="text-sm text-neutral-400">01</span>
              </div>

              <h3 className="mt-12 text-3xl font-semibold tracking-tight">
                Find your next role.
              </h3>

              <p className="mt-4 text-sm leading-6 text-neutral-500">
                Browse open positions, submit your resume, and complete AI interviews at your convenience.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  Explore open jobs
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  Automated resume screening
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  Interactive AI interview
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  Real-time status tracking
                </div>
              </div>

              <button
                onClick={() => navigate("/candidate/login")}
                className="cursor-pointer mt-10 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Candidate Portal →
              </button>
            </div>

            {/* Recruiter Card */}
            <div className="rounded-2xl border border-neutral-200 bg-white p-8 transition duration-300 hover:border-neutral-300">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-600">
                  For Recruiters
                </span>
                <span className="text-sm text-neutral-400">02</span>
              </div>

              <h3 className="mt-12 text-3xl font-semibold tracking-tight">
                Hire the right talent.
              </h3>

              <p className="mt-4 text-sm leading-6 text-neutral-500">
                Create jobs, automate candidate screening, review AI interview results and move qualified candidates
                through the recruitment process.
              </p>

              <div className="mt-8 space-y-3">
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  Create and manage job openings
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  AI-powered resume screening
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  Review interview performance
                </div>
                <div className="flex items-center gap-3 text-sm text-neutral-700">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-xs text-black">✓</span>
                  Schedule human interviews
                </div>
              </div>

              <button
                onClick={() => navigate("/hr/login")}
                className="cursor-pointer mt-10 rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
              >
                Recruiter Portal →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black text-white">
        <div className="mx-auto max-w-5xl px-6 py-28 text-center">
          <p className="text-sm font-medium text-neutral-500">START WITH SMARTHIRE</p>
          <h2 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
            Ready to hire smarter?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-7 text-neutral-400 sm:text-lg">
            Bring intelligent screening, adaptive interviews and streamlined recruitment into one platform.
          </p>
          <button
            onClick={() => navigate("/candidate/register")}
            className="cursor-pointer mt-9 rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition hover:bg-neutral-200"
          >
            Get Started →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid gap-12 md:grid-cols-4">
            <div className="md:col-span-2">
              <h3 className="text-xl font-semibold tracking-tight">SmartHire</h3>
              <p className="mt-4 max-w-sm text-sm leading-6 text-neutral-500">
                AI-powered recruitment designed to make hiring smarter, faster and more structured.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-medium">Product</h4>
              <div className="mt-4 space-y-3">
                <a href="#features" className="block text-sm text-neutral-500 transition hover:text-white">
                  Features
                </a>
                <a href="#how-it-works" className="block text-sm text-neutral-500 transition hover:text-white">
                  How It Works
                </a>
                <a href="#recruiters" className="block text-sm text-neutral-500 transition hover:text-white">
                  Recruiters
                </a>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium">Platform</h4>
              <div className="mt-4 space-y-3">
                <button
                  onClick={() => navigate("/candidate/login")}
                  className="cursor-pointer block text-sm text-neutral-500 transition hover:text-white"
                >
                  Candidate Portal
                </button>
                <button
                  onClick={() => navigate("/hr/login")}
                  className="cursor-pointer block text-sm text-neutral-500 transition hover:text-white"
                >
                  Recruiter Portal
                </button>
                <button
                  onClick={() => navigate("/candidate/login")}
                  className="cursor-pointer block text-sm text-neutral-500 transition hover:text-white"
                >
                  Sign In
                </button>
              </div>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-4 border-t border-neutral-800 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-600">© 2026 SmartHire. All rights reserved.</p>
            <p className="text-xs text-neutral-600">AI-powered recruitment platform</p>
          </div>
        </div>
      </footer>
    </main>
  );
}