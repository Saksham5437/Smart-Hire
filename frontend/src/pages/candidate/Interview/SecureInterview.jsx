import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import API from "../../../services/api";

const DEFAULT_QUESTIONS = [
  // 4 Theoretical Questions (2 Mins / 120s each)
  {
    id: 1,
    type: "theoretical",
    time_limit: 120,
    question: "Explain the internal execution lifecycle, memory management, and garbage collection in your primary programming language. How do you diagnose and prevent memory leaks in production?",
    category: "Language Internals & Memory",
    difficulty: "Medium",
    expected_skills: ["Python", "Memory Management"],
    code_template: "",
  },
  {
    id: 2,
    type: "theoretical",
    time_limit: 120,
    question: "How do you architect distributed microservices to maintain low latency, horizontal scalability, and fault tolerance under high traffic spikes?",
    category: "Architecture & Scalability",
    difficulty: "Hard",
    expected_skills: ["System Design", "Scalability"],
    code_template: "",
  },
  {
    id: 3,
    type: "theoretical",
    time_limit: 120,
    question: "Compare synchronous vs asynchronous execution models. What are the trade-offs between thread-based concurrency and event-driven async event loops?",
    category: "Concurrency & Asynchrony",
    difficulty: "Medium",
    expected_skills: ["Concurrency", "Async IO"],
    code_template: "",
  },
  {
    id: 4,
    type: "theoretical",
    time_limit: 120,
    question: "Explain indexing strategies (B-Tree vs Hash), query execution plans, and transaction isolation levels in relational databases vs caching layers.",
    category: "Database & Storage",
    difficulty: "Medium",
    expected_skills: ["Database Optimization", "SQL"],
    code_template: "",
  },
  // 6 Programming Challenges (5 Mins / 300s each)
  {
    id: 5,
    type: "programming",
    time_limit: 300,
    question: "Write an LRU (Least Recently Used) Cache class supporting get(key) and put(key, value) with O(1) average time complexity and a fixed capacity limit.",
    category: "Data Structures & Algorithms",
    difficulty: "Medium",
    expected_skills: ["Data Structures", "Algorithms"],
    code_template: "# Implement an LRU Cache with O(1) get and put\nclass LRUCache:\n    def __init__(self, capacity: int):\n        self.capacity = capacity\n        # Initialize hash map and doubly linked list or ordered structure\n\n    def get(self, key: int) -> int:\n        # Return value and update recency; return -1 if key not found\n        pass\n\n    def put(self, key: int, value: int) -> None:\n        # Insert or update key-value pair, evicting oldest item if over capacity\n        pass\n",
  },
  {
    id: 6,
    type: "programming",
    time_limit: 300,
    question: "Write a decorator function named `@retry_with_backoff` that catches runtime exceptions and retries the decorated function up to `max_retries` with exponential backoff delay.",
    category: "Advanced Language Features",
    difficulty: "Medium",
    expected_skills: ["Functional Programming", "Python"],
    code_template: "import time\nimport functools\n\ndef retry_with_backoff(max_retries: int = 3, initial_delay: float = 1.0, backoff_factor: float = 2.0):\n    def decorator(func):\n        @functools.wraps(func)\n        def wrapper(*args, **kwargs):\n            # Catch exceptions and retry with exponential delay\n            pass\n        return wrapper\n    return decorator\n",
  },
  {
    id: 7,
    type: "programming",
    time_limit: 300,
    question: "Implement a Token Bucket Rate Limiter algorithm that permits requests if tokens are available and refills tokens at a sustained `refill_rate` per second.",
    category: "System Algorithms & Concurrency",
    difficulty: "Hard",
    expected_skills: ["Rate Limiting", "Algorithms"],
    code_template: "import time\n\nclass TokenBucketRateLimiter:\n    def __init__(self, capacity: int, refill_rate_per_sec: float):\n        self.capacity = capacity\n        self.refill_rate = refill_rate_per_sec\n        self.tokens = float(capacity)\n        self.last_refill = time.time()\n\n    def allow_request(self, tokens_needed: int = 1) -> bool:\n        # Calculate elapsed time, replenish tokens, and return boolean\n        pass\n",
  },
  {
    id: 8,
    type: "programming",
    time_limit: 300,
    question: "Write an algorithm to detect circular dependencies (cycles in a directed dependency graph) between software modules.",
    category: "Graph Algorithms",
    difficulty: "Medium",
    expected_skills: ["Graph Algorithms", "Data Structures"],
    code_template: "from typing import Dict, List\n\ndef has_circular_dependency(dependency_graph: Dict[str, List[str]]) -> bool:\n    # Return True if a cycle exists in the graph, False otherwise\n    # Example graph: {'AuthService': ['DBService'], 'DBService': ['AuthService']}\n    pass\n",
  },
  {
    id: 9,
    type: "programming",
    time_limit: 300,
    question: "Write an asynchronous worker pool that processes a list of asynchronous tasks with a maximum concurrent task execution limit of `concurrency_limit`.",
    category: "Asynchronous Programming",
    difficulty: "Hard",
    expected_skills: ["Async IO", "Concurrency"],
    code_template: "import asyncio\nfrom typing import List, Callable, Any\n\nasync def run_batched_async_tasks(tasks: List[Callable[[], Any]], concurrency_limit: int = 5) -> List[Any]:\n    # Use asyncio.Semaphore to process tasks concurrently within the limit\n    pass\n",
  },
  {
    id: 10,
    type: "programming",
    time_limit: 300,
    question: "Implement a function to compute Cosine Similarity and Euclidean Distance between two dense embedding vectors without external numerical libraries, handling zero-division safely.",
    category: "Linear Algebra & ML Fundamentals",
    difficulty: "Easy",
    expected_skills: ["Vector Math", "Algorithms"],
    code_template: "import math\nfrom typing import List\n\ndef vector_metrics(vec_a: List[float], vec_b: List[float]) -> dict:\n    # Return {'cosine_similarity': float, 'euclidean_distance': float}\n    pass\n",
  },
];

function SecureInterview() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [answersList, setAnswersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognitionSupported, setRecognitionSupported] = useState(false);
  const [proctoringAlert, setProctoringAlert] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");

  // Countdown timer per question
  const [timeLeft, setTimeLeft] = useState(120);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const recognitionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const currentAnswerRef = useRef("");
  const answersListRef = useRef([]);
  const questionsRef = useRef(DEFAULT_QUESTIONS);
  const currentIndexRef = useRef(0);

  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  useEffect(() => {
    currentAnswerRef.current = currentAnswer;
  }, [currentAnswer]);

  useEffect(() => {
    answersListRef.current = answersList;
  }, [answersList]);

  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  // Request & Start Camera Stream
  const requestCameraAccess = useCallback(async () => {
    setCameraError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera API is not supported on this browser.");
        return;
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
      } catch (e1) {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.muted = true;
        videoRef.current.defaultMuted = true;
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play promise error:", playErr);
        }
      }

      setCameraActive(true);
      setCameraError("");

      API.post(`/applications/${applicationId}/security-event`, {
        event_type: "CAMERA_STARTED",
        details: "Camera proctoring stream active.",
        severity: "info",
      }).catch(() => {});
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraActive(false);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera permission was denied. Please allow camera access in browser address bar.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No webcam found on this device.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setCameraError("Camera is currently in use by another application.");
      } else {
        setCameraError("Could not connect to camera: " + (err.message || "Unknown error"));
      }
    }
  }, [applicationId]);

  // Callback ref ensures stream is attached immediately upon DOM node insertion
  const setVideoRef = useCallback((node) => {
    videoRef.current = node;
    if (node) {
      node.muted = true;
      node.defaultMuted = true;
      if (streamRef.current) {
        node.srcObject = streamRef.current;
        node.play().then(() => setCameraActive(true)).catch(() => {});
      }
    }
  }, []);

  // Initialize Interview & Camera & Proctoring Listeners
  useEffect(() => {
    let isMounted = true;

    const initInterview = async () => {
      try {
        const res = await API.post(`/applications/${applicationId}/interview/start`);
        if (isMounted) {
          if (res.data && res.data.questions && res.data.questions.length >= 10) {
            setQuestions(res.data.questions);
            questionsRef.current = res.data.questions;
          } else {
            setQuestions(DEFAULT_QUESTIONS);
            questionsRef.current = DEFAULT_QUESTIONS;
          }

          API.post(`/applications/${applicationId}/security-event`, {
            event_type: "INTERVIEW_STARTED",
            details: "Candidate initiated secure 10-question AI interview session.",
            severity: "info",
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("Failed to fetch interview questions, using default 10-question suite:", err);
        if (isMounted) {
          setQuestions(DEFAULT_QUESTIONS);
          questionsRef.current = DEFAULT_QUESTIONS;
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    initInterview();

    requestCameraAccess();

    // Speech recognition setup
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let finalChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0] && res[0].transcript) {
            finalChunk += " " + res[0].transcript.trim();
          }
        }

        if (finalChunk.trim()) {
          setCurrentAnswer((prev) => {
            const cleanPrev = (prev || "").trim();
            const cleanChunk = finalChunk.trim();
            return cleanPrev ? `${cleanPrev} ${cleanChunk}` : cleanChunk;
          });
        }
      };

      recognition.onerror = (e) => {
        console.warn("Speech recognition error:", e.error);
        if (e.error === "not-allowed" || e.error === "service-not-allowed") {
          setIsRecording(false);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {
            // Ignore
          }
        } else {
          setIsRecording(false);
        }
      };

      recognitionRef.current = recognition;
      setRecognitionSupported(true);
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setProctoringAlert("Warning: Tab switch detected! Proctoring event logged.");
        API.post(`/applications/${applicationId}/security-event`, {
          event_type: "TAB_SWITCH",
          details: "Candidate switched browser tabs or minimized window.",
          severity: "warning",
        }).catch(() => {});
      }
    };

    const handleWindowBlur = () => {
      API.post(`/applications/${applicationId}/security-event`, {
        event_type: "WINDOW_BLUR",
        details: "Interview window lost active focus.",
        severity: "warning",
      }).catch(() => {});
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [applicationId, requestCameraAccess]);

  // Set initial answer / code template and timer on question change
  useEffect(() => {
    const activeQuestions = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
    const currentQ = activeQuestions[currentIndex] || activeQuestions[0];

    const initialTime = currentQ.time_limit || (currentQ.type === "programming" ? 300 : 120);
    setTimeLeft(initialTime);

    if (currentQ.type === "programming") {
      setCurrentAnswer(currentQ.code_template || "# Write your solution below\n");
    } else {
      setCurrentAnswer("");
    }
  }, [currentIndex, questions]);

  // Execute Next / Submit Transition
  const submitOrAdvance = useCallback(async (forcedAnswer = null) => {
    if (isRecordingRef.current && recognitionRef.current) {
      isRecordingRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    }

    const activeQuestions = questionsRef.current.length > 0 ? questionsRef.current : DEFAULT_QUESTIONS;
    const idx = currentIndexRef.current;
    const currentQ = activeQuestions[idx] || activeQuestions[0];

    const finalAnswerText = (forcedAnswer !== null ? forcedAnswer : currentAnswerRef.current).trim();

    const updatedAnswers = [
      ...answersListRef.current,
      {
        question_id: currentQ.id || (idx + 1),
        question_text: currentQ.question || "Interview Question",
        answer_text: finalAnswerText || (currentQ.type === "programming" ? "# No code submitted" : "No answer provided"),
      },
    ];

    setAnswersList(updatedAnswers);
    answersListRef.current = updatedAnswers;

    if (idx + 1 < activeQuestions.length) {
      setCurrentIndex(idx + 1);
    } else {
      setSubmitting(true);
      try {
        await API.post(`/applications/${applicationId}/interview/complete`, {
          answers: updatedAnswers,
        });

        await API.post(`/applications/${applicationId}/security-event`, {
          event_type: "INTERVIEW_COMPLETED",
          details: "Candidate submitted all 10 technical responses.",
          severity: "info",
        }).catch(() => {});

        navigate(`/candidate/interview/result/${applicationId}`);
      } catch (err) {
        console.error("Error completing interview:", err);
        navigate(`/candidate/interview/result/${applicationId}`);
      } finally {
        setSubmitting(false);
      }
    }
  }, [applicationId, navigate]);

  // Question countdown interval timer
  useEffect(() => {
    if (loading || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitOrAdvance();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentIndex, loading, submitting, submitOrAdvance]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      isRecordingRef.current = false;
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      try {
        isRecordingRef.current = true;
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (e) {
        console.error("Speech recognition start error:", e);
      }
    }
  };

  const handleNext = () => {
    submitOrAdvance();
  };

  // Support Tab key indentation in programming code area
  const handleKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const value = e.target.value;
      const newValue = value.substring(0, start) + "    " + value.substring(end);
      setCurrentAnswer(newValue);
      setTimeout(() => {
        if (e.target) {
          e.target.selectionStart = e.target.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const resetStarterCode = () => {
    const activeQuestions = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
    const currentQ = activeQuestions[currentIndex] || activeQuestions[0];
    if (currentQ.code_template) {
      setCurrentAnswer(currentQ.code_template);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
          <p>Generating personalized 10-question technical interview...</p>
        </div>
      </div>
    );
  }

  const activeQuestions = questions.length > 0 ? questions : DEFAULT_QUESTIONS;
  const currentQ = activeQuestions[currentIndex] || DEFAULT_QUESTIONS[0];
  const isProgramming = currentQ.type === "programming";

  // Format time display MM:SS
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col justify-between">
      {/* Top Header & Telemetry Status */}
      <header className="border-b border-neutral-800 bg-[#121212] px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm font-semibold tracking-tight">SmartHire AI Proctor</span>
            <span className="text-xs text-neutral-500 font-mono">| App #{applicationId}</span>
          </div>

          {/* Question Step Pills & Timer */}
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-1.5">
              {activeQuestions.map((q, idx) => (
                <div
                  key={idx}
                  title={`Q${idx + 1}: ${q.type === "programming" ? "Programming (5 min)" : "Theoretical (2 min)"}`}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    idx === currentIndex
                      ? "w-7 bg-white"
                      : idx < currentIndex
                      ? "w-3 bg-emerald-500"
                      : "w-2 bg-neutral-800"
                  }`}
                />
              ))}
            </div>

            {/* Countdown Timer Badge */}
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono font-bold transition-all ${
              timeLeft <= 30
                ? "border-red-500/80 bg-red-950/60 text-red-400 animate-pulse"
                : timeLeft <= 60
                ? "border-amber-500/60 bg-amber-950/40 text-amber-300"
                : "border-neutral-700 bg-neutral-800 text-neutral-200"
            }`}>
              <span>⏱ Time Left:</span>
              <span className="text-sm tracking-wider">{formattedTime}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="mx-auto max-w-5xl w-full px-6 py-6 flex-1 flex flex-col justify-center">
        {proctoringAlert && (
          <div className="mb-4 rounded-xl border border-yellow-800/60 bg-yellow-950/40 p-4 text-xs font-medium text-yellow-300 flex items-center justify-between">
            <span>⚠️ {proctoringAlert}</span>
            <button
              onClick={() => setProctoringAlert("")}
              className="text-xs text-yellow-400 underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Question & Answer Card */}
          <div className="lg:col-span-2 rounded-2xl border border-neutral-800 bg-[#141414] p-8 shadow-xl">
            {/* Category, Difficulty & Type Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isProgramming
                    ? "bg-indigo-950 text-indigo-300 border border-indigo-800"
                    : "bg-blue-950 text-blue-300 border border-blue-800"
                }`}>
                  {isProgramming ? "💻 Programming Challenge (5 Min)" : "📚 Theoretical Question (2 Min)"}
                </span>

                <span className="rounded-full bg-neutral-800 px-3 py-1 text-xs text-neutral-300">
                  {currentQ.category || "Technical Competency"}
                </span>

                <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 text-xs text-neutral-400">
                  {currentQ.difficulty || "Medium"}
                </span>
              </div>

              <span className="text-xs text-neutral-400 font-mono">
                Question <strong className="text-white">{currentIndex + 1}</strong> of {activeQuestions.length}
              </span>
            </div>

            {/* Question Text */}
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white leading-snug">
              {currentQ.question}
            </h2>

            {/* Response Area */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium uppercase text-neutral-400 tracking-wider flex items-center gap-2">
                  <span>{isProgramming ? "Your Code Implementation" : "Your Answer"}</span>
                  {isProgramming && (
                    <span className="text-[10px] text-neutral-500 normal-case">(Supports Tab indentation)</span>
                  )}
                </label>

                <div className="flex items-center gap-2">
                  {isProgramming && currentQ.code_template && (
                    <button
                      type="button"
                      onClick={resetStarterCode}
                      className="text-xs text-neutral-400 hover:text-white transition px-2.5 py-1 rounded bg-neutral-800 hover:bg-neutral-700"
                    >
                      ↺ Reset Template
                    </button>
                  )}

                  {!isProgramming && recognitionSupported && (
                    <button
                      type="button"
                      onClick={toggleRecording}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition cursor-pointer ${
                        isRecording
                          ? "bg-red-500 text-white animate-pulse"
                          : "bg-neutral-800 text-neutral-300 hover:bg-neutral-700"
                      }`}
                    >
                      <span>{isRecording ? "⏹ Stop Dictation" : "🎤 Speech-to-Text"}</span>
                    </button>
                  )}
                </div>
              </div>

              <textarea
                rows={isProgramming ? 12 : 7}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                onKeyDown={isProgramming ? handleKeyDown : undefined}
                placeholder={
                  isProgramming
                    ? "# Type your code solution here. Focus on logic, edge cases, and performance..."
                    : "Type or dictate your technical response. Cover concepts, practical implementation, and trade-offs..."
                }
                className={`w-full rounded-xl border border-neutral-800 bg-[#1c1c1c] p-4 text-sm outline-none transition focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 ${
                  isProgramming
                    ? "font-mono text-emerald-400 leading-relaxed resize-y"
                    : "text-neutral-100 resize-none"
                }`}
              />
            </div>

            {/* Next / Submit Button */}
            <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <span className="text-xs text-neutral-500">
                {isProgramming
                  ? "⚡ Code is analyzed for algorithmic correctness, complexity, and syntax."
                  : "⚡ AI evaluates Relevance, Correctness, Completeness & Skill Alignment."}
              </span>

              <button
                type="button"
                onClick={handleNext}
                disabled={submitting}
                className="rounded-full bg-white text-black px-7 py-3 text-sm font-semibold hover:bg-neutral-200 transition disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
              >
                {submitting
                  ? "Submitting Interview..."
                  : currentIndex + 1 === activeQuestions.length
                  ? "Submit Final Answers ✓"
                  : "Next Question →"}
              </button>
            </div>
          </div>

          {/* Right Proctoring Thumbnail Box */}
          <div className="space-y-4">
            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-4 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-xs font-medium text-neutral-400">Live Video Stream</span>
                <span className="text-[10px] uppercase font-bold text-red-500 bg-red-950/80 px-2 py-0.5 rounded flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  REC
                </span>
              </div>

              <div className="h-44 bg-neutral-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-neutral-800">
                <video
                  ref={setVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-950/95 text-center p-4 text-xs text-neutral-300">
                    <span className="text-2xl mb-2">📷</span>
                    <p className="font-semibold text-white mb-1">
                      {cameraError ? "Camera Access Issue" : "Webcam Initializing"}
                    </p>
                    <p className="text-[11px] text-neutral-400 mb-3 max-w-xs">
                      {cameraError || "Please allow camera access in your browser to view your live stream."}
                    </p>
                    <button
                      type="button"
                      onClick={requestCameraAccess}
                      className="rounded-full bg-white text-black font-semibold px-4 py-1.5 text-xs hover:bg-neutral-200 transition cursor-pointer"
                    >
                      🔄 Connect Camera
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 bg-[#141414] p-5 text-xs text-neutral-400 space-y-2">
              <p className="font-semibold text-neutral-300">10-Question Interview Structure:</p>
              <p>• <strong>Questions 1–4:</strong> Theoretical (2 min each)</p>
              <p>• <strong>Questions 5–10:</strong> Hands-on Coding (5 min each)</p>
              <p>• Proctoring telemetry active throughout.</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-900 bg-[#101010] py-4 text-center text-xs text-neutral-600">
        SmartHire AI Automated Interview Session • Application Reference #{applicationId}
      </footer>
    </div>
  );
}

export default SecureInterview;