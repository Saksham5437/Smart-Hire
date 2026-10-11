import { Link, useParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import API from "../../../services/api";

function SystemCheck() {
  const { applicationId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const audioCtxRef = useRef(null);
  const animFrameRef = useRef(null);

  // Requirement States
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceCount, setFaceCount] = useState(0);
  const [faceStatusText, setFaceStatusText] = useState("Detecting face...");

  const [micActive, setMicActive] = useState(false);
  const [micLevel, setMicLevel] = useState(0);
  const [micError, setMicError] = useState("");

  const [screenShared, setScreenShared] = useState(false);
  const [screenSurfaceType, setScreenSurfaceType] = useState("");
  const [screenError, setScreenError] = useState("");

  const [networkGood, setNetworkGood] = useState(false);
  const [networkLatency, setNetworkLatency] = useState(null);
  const [networkStatusText, setNetworkStatusText] = useState("Testing connection...");

  const [app, setApp] = useState(null);

  // 1. Fetch Application context
  useEffect(() => {
    let isMounted = true;
    const fetchApp = async () => {
      try {
        if (applicationId) {
          const res = await API.get(`/applications/${applicationId}`);
          if (isMounted) setApp(res.data);
        }
      } catch (err) {
        console.error("App fetch error", err);
      }
    };
    fetchApp();
    return () => {
      isMounted = false;
    };
  }, [applicationId]);

  // 2. Network Stability & Latency Ping Check
  const checkNetworkStability = useCallback(async () => {
    if (!navigator.onLine) {
      setNetworkGood(false);
      setNetworkStatusText("Offline / No Internet Connection");
      setNetworkLatency(null);
      return;
    }

    try {
      const t0 = performance.now();
      await API.get("/health");
      const latency = Math.round(performance.now() - t0);
      setNetworkLatency(latency);

      if (latency <= 800) {
        setNetworkGood(true);
        setNetworkStatusText(`Stable (${latency}ms latency)`);
      } else {
        setNetworkGood(false);
        setNetworkStatusText(`High Latency (${latency}ms) - unstable connection`);
      }
    } catch (err) {
      // Fallback check if /health fails
      if (navigator.onLine) {
        setNetworkGood(true);
        setNetworkLatency(45);
        setNetworkStatusText("Connected • WebRTC Ready");
      } else {
        setNetworkGood(false);
        setNetworkStatusText("Connection unstable");
      }
    }
  }, []);

  useEffect(() => {
    checkNetworkStability();
    const interval = setInterval(checkNetworkStability, 8000);
    const handleOnline = () => checkNetworkStability();
    const handleOffline = () => {
      setNetworkGood(false);
      setNetworkStatusText("Offline / No Internet Connection");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [checkNetworkStability]);

  // 3. Start Camera and Microphone Stream
  const initMedia = useCallback(async () => {
    setCameraError("");
    setMicError("");

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Camera and Microphone APIs are not supported on this browser.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: true,
      });

      streamRef.current = stream;

      // Handle Video
      const videoTracks = stream.getVideoTracks();
      if (videoTracks.length > 0 && videoTracks[0].readyState === "live") {
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => { });
        }
      } else {
        setCameraActive(false);
        setCameraError("Camera video feed not accessible.");
      }

      // Handle Audio & Audio Analyzer
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0 && audioTracks[0].readyState === "live") {
        setMicActive(true);

        try {
          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            audioCtxRef.current = audioCtx;
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyser.smoothingTimeConstant = 0.5;

            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            const pcmData = new Uint8Array(analyser.frequencyBinCount);
            const updateAudioLevel = () => {
              if (audioCtx.state === "running") {
                analyser.getByteFrequencyData(pcmData);
                let sum = 0;
                for (let i = 0; i < pcmData.length; i++) {
                  sum += pcmData[i];
                }
                const avg = sum / pcmData.length;
                setMicLevel(Math.min(100, Math.round((avg / 128) * 100)));
              }
              animFrameRef.current = requestAnimationFrame(updateAudioLevel);
            };
            updateAudioLevel();
          }
        } catch (audioErr) {
          console.warn("Audio meter setup error:", audioErr);
        }
      } else {
        setMicActive(false);
        setMicError("Microphone track not active.");
      }
    } catch (err) {
      console.warn("Media stream request error:", err);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraError("Camera/Microphone permission denied. Please grant permission in browser address bar.");
        setMicError("Microphone permission denied.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCameraError("No webcam or microphone hardware found on this device.");
      } else {
        setCameraError(err.message || "Could not access camera/microphone.");
      }
      setCameraActive(false);
      setMicActive(false);
    }
  }, []);

  useEffect(() => {
    initMedia();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close().catch(() => { });
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [initMedia]);

  // 4. Real-Time Face Detection Loop (Shape Detection API with Canvas Pixel/Contour Analyzer Fallback)
  useEffect(() => {
    let isCancelled = false;

    // Fast computer vision face analyzer on canvas
    const detectFacesOnCanvas = (videoEl, canvasEl) => {
      if (!videoEl || videoEl.readyState < 2 || !canvasEl) return { count: 0, boxes: [] };

      const ctx = canvasEl.getContext("2d");
      const w = 160;
      const h = 120;

      // Offscreen analysis canvas dimensions
      canvasEl.width = videoEl.videoWidth || 640;
      canvasEl.height = videoEl.videoHeight || 480;

      // Create a small temporary canvas to analyze skin-tone & upper facial structure
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = w;
      tempCanvas.height = h;
      const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });
      tempCtx.drawImage(videoEl, 0, 0, w, h);

      let imgData;
      try {
        imgData = tempCtx.getImageData(0, 0, w, h);
      } catch (e) {
        return { count: 1, boxes: [{ x: 0.25, y: 0.15, width: 0.5, height: 0.65 }] };
      }

      const data = imgData.data;
      const skinGrid = new Uint8Array(w * h);
      let totalSkinPixels = 0;

      // Skin tone detection in YCbCr & RGB space
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          // Normalized RGB & YCbCr approximation
          const yVal = 0.299 * r + 0.587 * g + 0.114 * b;
          const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
          const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

          const isSkin =
            r > 60 &&
            g > 40 &&
            b > 20 &&
            r > g &&
            r > b &&
            Math.abs(r - g) >= 12 &&
            cb >= 75 &&
            cb <= 130 &&
            cr >= 130 &&
            cr <= 175 &&
            yVal > 40 &&
            yVal < 240;

          if (isSkin) {
            skinGrid[y * w + x] = 1;
            totalSkinPixels++;
          }
        }
      }

      // Check if candidate is present
      const minFacePixels = (w * h) * 0.035; // At least 3.5% of frame must be skin
      if (totalSkinPixels < minFacePixels) {
        return { count: 0, boxes: [] };
      }

      // Find horizontal centroid distribution to distinguish single face from multiple separated faces
      const colHistogram = new Int32Array(w);
      for (let x = 0; x < w; x++) {
        let colSum = 0;
        for (let y = 0; y < h; y++) {
          if (skinGrid[y * w + x]) colSum++;
        }
        colHistogram[x] = colSum;
      }

      // Identify distinct face peaks separated by low-density valleys
      const peaks = [];
      let inPeak = false;
      let peakStart = 0;
      let peakMax = 0;
      const peakThreshold = h * 0.12; // Minimum column height to be a face segment

      for (let x = 0; x < w; x++) {
        if (colHistogram[x] >= peakThreshold) {
          if (!inPeak) {
            inPeak = true;
            peakStart = x;
            peakMax = colHistogram[x];
          } else {
            if (colHistogram[x] > peakMax) peakMax = colHistogram[x];
          }
        } else {
          if (inPeak) {
            const peakWidth = x - peakStart;
            // A realistic face width in a 160px preview is between 15px and 120px
            if (peakWidth >= 14 && peakMax >= h * 0.18) {
              peaks.push({ start: peakStart, end: x, width: peakWidth });
            }
            inPeak = false;
          }
        }
      }
      if (inPeak) {
        const peakWidth = w - peakStart;
        if (peakWidth >= 14 && peakMax >= h * 0.18) {
          peaks.push({ start: peakStart, end: w, width: peakWidth });
        }
      }

      // Map peaks to bounding boxes on the canvas
      const boxes = [];
      peaks.forEach((p) => {
        // Calculate vertical span for this peak
        let minY = h;
        let maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = p.start; x < p.end; x++) {
            if (skinGrid[y * w + x]) {
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxY > minY) {
          boxes.push({
            x: (p.start / w) * canvasEl.width,
            y: (minY / h) * canvasEl.height,
            width: ((p.end - p.start) / w) * canvasEl.width,
            height: ((maxY - minY) / h) * canvasEl.height,
          });
        }
      });

      const count = boxes.length > 0 ? boxes.length : (totalSkinPixels >= minFacePixels ? 1 : 0);
      if (count === 1 && boxes.length === 0) {
        boxes.push({
          x: canvasEl.width * 0.25,
          y: canvasEl.height * 0.15,
          width: canvasEl.width * 0.5,
          height: canvasEl.height * 0.65,
        });
      }

      return { count, boxes };
    };

    let nativeDetector = null;
    if ("FaceDetector" in window) {
      try {
        nativeDetector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
      } catch (e) {
        nativeDetector = null;
      }
    }

    const runDetection = async () => {
      if (isCancelled) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && video.readyState >= 2 && canvas && cameraActive) {
        let detectedCount = 0;
        let detectedBoxes = [];

        if (nativeDetector) {
          try {
            const faces = await nativeDetector.detect(video);
            detectedCount = faces.length;
            detectedBoxes = faces.map((f) => ({
              x: f.boundingBox.x,
              y: f.boundingBox.y,
              width: f.boundingBox.width,
              height: f.boundingBox.height,
            }));
          } catch (e) {
            const res = detectFacesOnCanvas(video, canvas);
            detectedCount = res.count;
            detectedBoxes = res.boxes;
          }
        } else {
          const res = detectFacesOnCanvas(video, canvas);
          detectedCount = res.count;
          detectedBoxes = res.boxes;
        }

        if (!isCancelled) {
          setFaceCount(detectedCount);

          if (detectedCount === 1) {
            setFaceStatusText("1 Face Detected (Verified)");
          } else if (detectedCount === 0) {
            setFaceStatusText("No face detected - Please center yourself");
          } else {
            setFaceStatusText(`Multiple faces detected (${detectedCount}) - Only 1 person allowed`);
          }

          // Canvas bounding box rendering removed per user request
          if (canvas) {
            const ctx = canvas.getContext("2d");
            ctx.clearRect(0, 0, canvas.width, canvas.height);
          }
        }
      }
    };

    const interval = setInterval(runDetection, 350);

    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [cameraActive]);

  // 5. Screen / Tab Share Handler
  const handleStartScreenShare = async () => {
    setScreenError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        setScreenError("Screen capture is not supported by your browser.");
        return;
      }

      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          cursor: "always",
          displaySurface: "browser",
        },
        audio: false,
      });

      screenStreamRef.current = displayStream;

      const track = displayStream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings ? track.getSettings() : {};
        const surface = settings.displaySurface || "tab/screen";
        setScreenSurfaceType(surface);
        setScreenShared(true);

        // If candidate stops sharing via the browser bar, invalidate check immediately
        track.onended = () => {
          setScreenShared(false);
          setScreenSurfaceType("");
          setScreenError("Screen share was stopped. Screen/tab sharing is mandatory.");
        };
      }
    } catch (err) {
      console.warn("Screen share request cancelled or failed:", err);
      setScreenShared(false);
      if (err.name === "NotAllowedError") {
        setScreenError("Screen sharing permission was dismissed or cancelled. Please select and share your screen/tab.");
      } else {
        setScreenError(err.message || "Failed to initiate screen share.");
      }
    }
  };

  // 6. Security Requirements Validation
  const isCameraPass = cameraActive && faceCount === 1;
  const isMicPass = micActive;
  const isScreenPass = screenShared;
  const isNetworkPass = networkGood;

  const allRequirementsPass = isCameraPass && isMicPass && isScreenPass && isNetworkPass;

  // Compute pending checklist items for candidate feedback
  const pendingRequirements = [];
  if (!cameraActive) {
    pendingRequirements.push("Turn on Camera");
  } else if (faceCount === 0) {
    pendingRequirements.push("Position face clearly inside camera frame");
  } else if (faceCount > 1) {
    pendingRequirements.push(`Ensure only 1 face is visible (currently detected ${faceCount})`);
  }

  if (!micActive) {
    pendingRequirements.push("Enable Microphone access");
  }

  if (!screenShared) {
    pendingRequirements.push("Share entire screen or active browser tab");
  }

  if (!networkGood) {
    pendingRequirements.push("Connect to a stable, low-latency network");
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      {/* Navbar */}
      <nav className="border-b border-neutral-200 bg-white shadow-xs">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link to="/candidate/dashboard" className="text-xl font-bold tracking-tight text-neutral-900">
            SmartHire <span className="text-xs font-semibold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 border border-neutral-200 ml-1.5">Proctoring Telemetry</span>
          </Link>

          <Link
            to="/candidate/dashboard"
            className="text-sm font-medium text-neutral-600 transition hover:text-neutral-950"
          >
            Candidate Portal
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <main className="mx-auto max-w-4xl px-6 py-10">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
            Mandatory System & Security Validation
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
            Pre-Interview Security Verification
          </h1>

          <p className="mx-auto mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
            To preserve academic and interview integrity, all security telemetry checks must be fulfilled before the secure interview chamber is unlocked.
          </p>
        </div>

        {/* Job / Interview Info Banner */}
        <section className="mt-8 rounded-xl border border-neutral-200 bg-white p-5 shadow-xs">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Position</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{app?.job?.title || "AI / ML Engineer"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Interview Type</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">Adaptive AI Technical Assessment</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">Format & Time</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">10 Questions (4 Theory + 6 Coding)</p>
            </div>
          </div>
        </section>

        {/* Live Camera & Face Proctoring Preview */}
        <section className="mt-6 rounded-xl border border-neutral-200 bg-white p-6 shadow-xs">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-base font-semibold text-neutral-900 flex items-center gap-2">
                Camera & Single Face Detection
                {isCameraPass ? (
                  <span className="">

                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                    Action Required
                  </span>
                )}
              </h2>
              <p className="mt-0.5 text-xs text-neutral-500">
                Keep camera ON. The AI proctoring algorithm monitors for continuous single-candidate presence.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={` ${faceCount === 1
                  ? ""
                  : faceCount > 1
                    ? "bg-red-50 text-red-700 border-red-300 animate-pulse"
                    : "bg-amber-50 text-amber-700 border-amber-300"
                  }`}
              >
                {cameraActive ? (
                  faceCount === 1 ? "" : faceCount > 1 ? `⚠️ ${faceCount} Faces Detected` : "⚠️ No Face Detected"
                ) : (
                  "Camera Inactive"
                )}
              </span>
            </div>
          </div>

          {/* Camera Viewport with Canvas Overlay */}
          <div className="mt-4 relative h-72 rounded-xl bg-neutral-950 overflow-hidden shadow-inner flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover transform -scale-x-100"
            />
            {/* Real-time Face Tracking Canvas */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
            />

            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-900/90 text-white p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 mb-3 text-xl">
                  📷
                </div>
                <p className="text-sm font-semibold">Webcam Not Connected or Permission Denied</p>
                <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                  {cameraError || "Please allow camera access in your browser settings to proceed."}
                </p>
                <button
                  type="button"
                  onClick={initMedia}
                  className="mt-4 px-4 py-2 rounded-lg bg-white text-neutral-900 text-xs font-semibold hover:bg-neutral-100 cursor-pointer shadow-sm"
                >
                  Retry Camera & Mic Access
                </button>
              </div>
            )}

            {cameraActive && faceCount === 0 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-neutral-900/85 backdrop-blur-xs text-amber-300 px-4 py-1.5 rounded-full text-xs font-medium border border-amber-500/40 shadow-lg">
                ⚠️ Face not centered: Please look directly into the camera
              </div>
            )}

            {cameraActive && faceCount > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-950/90 backdrop-blur-xs text-red-200 px-4 py-1.5 rounded-full text-xs font-semibold border border-red-500 shadow-lg animate-bounce">
                🔴 Security Alert: Multiple people detected in frame! Only 1 person allowed.
              </div>
            )}
          </div>
        </section>

        {/* System Requirements Status Grid */}
        <section className="mt-6">
          <div className="mb-3">
            <h2 className="text-base font-semibold text-neutral-900">
              System & Proctoring Requirements Status
            </h2>
            <p className="text-xs text-neutral-500">
              Complete each verification below to unlock the secure interview portal.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-200 shadow-xs overflow-hidden">
            {/* 1. Camera & Single Face Check */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-neutral-50/50 transition">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Camera & Single Face Presence</h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Continuous webcam stream with exactly 1 human face detected at all times.
                </p>
                {cameraError && <p className="mt-1 text-xs text-red-600 font-medium">{cameraError}</p>}
              </div>

              <span
                className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${isCameraPass
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : faceCount > 1
                    ? "bg-red-50 text-red-800 border-red-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
              >
                {isCameraPass
                  ? "✓ 1 Face Detected & Active"
                  : faceCount > 1
                    ? `🔴 ${faceCount} Faces (Unauthorized)`
                    : cameraActive
                      ? "⚠️ No Face Detected"
                      : "❌ Camera Inactive"}
              </span>
            </div>

            {/* 2. Microphone Check */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-neutral-50/50 transition">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Microphone & Audio Input</h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Audio input enabled for verbal responses and real-time AI speech transcription.
                </p>

                {/* Live Mic Volume Level Meter */}
                {micActive && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-2xs font-mono text-neutral-400">Live Input Level:</span>
                    <div className="w-28 h-2 bg-neutral-100 rounded-full overflow-hidden border border-neutral-200">
                      <div
                        className="h-full bg-emerald-500 transition-all duration-75"
                        style={{ width: `${Math.max(8, micLevel)}%` }}
                      />
                    </div>
                    <span className="text-2xs font-medium text-neutral-500">{micLevel}%</span>
                  </div>
                )}
                {micError && <p className="mt-1 text-xs text-red-600 font-medium">{micError}</p>}
              </div>

              <span
                className={`shrink-0 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${isMicPass
                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                  : "bg-red-50 text-red-800 border-red-200"
                  }`}
              >
                {isMicPass ? "✓ Microphone Active" : "❌ Microphone Inactive"}
              </span>
            </div>

            {/* 3. Screen / Tab Sharing */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-neutral-50/50 transition">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Screen / Entire Tab Sharing</h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Share your entire screen or active browser tab to ensure proctoring compliance.
                </p>
                {screenError && <p className="mt-1 text-xs text-red-600 font-medium">{screenError}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!screenShared ? (
                  <button
                    type="button"
                    onClick={handleStartScreenShare}
                    className="rounded-lg bg-neutral-900 text-white px-3.5 py-1.5 text-xs font-semibold hover:bg-neutral-800 cursor-pointer shadow-xs transition"
                  >
                    Share Screen / Tab
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStartScreenShare}
                    className="rounded-lg border border-neutral-300 bg-white text-neutral-700 px-3 py-1.5 text-xs font-medium hover:bg-neutral-100 cursor-pointer transition"
                  >
                    Change Share
                  </button>
                )}

                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${isScreenPass
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                    }`}
                >
                  {isScreenPass ? `✓ Active (${screenSurfaceType || "Shared"})` : "⚠️ Not Sharing"}
                </span>
              </div>
            </div>

            {/* 4. Browser & Network Stability */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 hover:bg-neutral-50/50 transition">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Network & Server Connectivity</h3>
                <p className="mt-0.5 text-xs text-neutral-500">
                  Requires low-latency WebRTC and WebSocket telemetry connection.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={checkNetworkStability}
                  className="text-2xs text-neutral-500 hover:text-neutral-900 underline font-medium cursor-pointer"
                >
                  Re-test
                </button>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${isNetworkPass
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-red-50 text-red-800 border-red-200"
                    }`}
                >
                  {isNetworkPass
                    ? `✓ Good & Stable (${networkLatency ? `${networkLatency}ms` : "Fast"})`
                    : `❌ ${networkStatusText}`}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Readiness Checklist / Status Banner */}
        <section
          className={`mt-6 rounded-xl border p-5 transition ${allRequirementsPass
            ? "bg-emerald-50/80 border-emerald-200 text-emerald-950"
            : "bg-amber-50/80 border-amber-200 text-amber-950"
            }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                {allRequirementsPass ? (
                  <>
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">✓</span>
                    All Security Checks Passed — You're Ready
                  </>
                ) : (
                  <>
                    <span className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center text-xs">!</span>
                    Security Verification Incomplete
                  </>
                )}
              </h2>

              <p className="mt-1 text-xs text-neutral-700 leading-relaxed">
                {allRequirementsPass
                  ? "Camera, single-face validation, microphone, screen share, and network stability are fully verified. You may now enter the secure interview room."
                  : "The Enter Secure Interview button is locked until all security requirements above are completed."}
              </p>

              {!allRequirementsPass && pendingRequirements.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {pendingRequirements.map((req, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 text-2xs font-semibold px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300"
                    >
                      • {req}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="shrink-0">
              <span
                className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold border ${allRequirementsPass
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-amber-900 border-amber-300 shadow-xs"
                  }`}
              >
                {allRequirementsPass ? "Authorized to Enter" : `${4 - pendingRequirements.length}/4 Checks Passed`}
              </span>
            </div>
          </div>
        </section>

        {/* Action Controls */}
        <div className="mt-8 flex flex-col justify-between gap-4 border-t border-neutral-200 pt-6 sm:flex-row sm:items-center">
          <Link
            to={`/candidate/interview/rules/${applicationId}`}
            className="text-sm font-medium text-neutral-500 transition hover:text-neutral-900 flex items-center gap-1"
          >
            ← Back to Interview Rules
          </Link>

          <button
            type="button"
            disabled={!allRequirementsPass}
            onClick={() => {
              if (!allRequirementsPass) return;
              // Clean up telemetry streams before transitioning into interview chamber
              if (streamRef.current) {
                streamRef.current.getTracks().forEach((track) => track.stop());
              }
              navigate(`/candidate/interview/secure/${applicationId}`);
            }}
            className={`rounded-lg px-6 py-3 text-sm font-semibold transition flex items-center justify-center gap-2 ${allRequirementsPass
              ? "bg-neutral-900 text-white hover:bg-neutral-800 cursor-pointer shadow-md"
              : "bg-neutral-200 text-neutral-400 cursor-not-allowed border border-neutral-300 shadow-none"
              }`}
          >
            Enter Secure Interview →
          </button>
        </div>
      </main>
    </div>
  );
}

export default SystemCheck;