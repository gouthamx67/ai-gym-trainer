"use client";

import { useEffect, useRef, useState } from "react";
import { extractKeyJoints, calculateAngle } from "@/lib/biomechanics";
import { EXERCISES, updateExercise, ExerciseState } from "@/lib/repCounter";

// The skeleton connection map (indices handled by the model)
const POSE_CONNECTIONS: [number, number][] = [
  [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24],
  [23, 24], [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30],
  [29, 31], [30, 32], [27, 31], [28, 32], [15, 17], [16, 18], [17, 19],
  [18, 20], [15, 21], [16, 22], [19, 21], [20, 22]
];

export default function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const poseResultsRef = useRef<any>(null); // Use any for dynamic typing
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModelLoaded, setIsModelLoaded] = useState(false);

  // Multi-Exercise State
  const [activeExerciseId, setActiveExerciseId] = useState<string>("curl");
  const [repCount, setRepCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const curStateRef = useRef<ExerciseState>("down");

  // Keep a ref to the active ID for the render loop (avoids stale closures)
  const activeIdRef = useRef<string>("curl");
  useEffect(() => {
    activeIdRef.current = activeExerciseId;
    setRepCount(0); // Reset count when switching exercises
    setProgress(0);
    curStateRef.current = "down";
  }, [activeExerciseId]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let poseModule: any;
    let drawingModule: any;

    async function init() {
      try {
        // 1. Dynamic Imports to bypass Turbopack build errors
        // @ts-ignore
        poseModule = await import("@mediapipe/pose");
        // @ts-ignore
        drawingModule = await import("@mediapipe/drawing_utils");

        // 2. Setup Camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await new Promise((resolve) => {
            if (videoRef.current) videoRef.current.onloadedmetadata = () => resolve(true);
          });
          await videoRef.current.play();
          setIsLoading(false);

          setupPose();
        }
      } catch (err) {
        console.error("Initialization error:", err);
        setError("System initialization failed. Please check camera permissions.");
      }
    }

    function setupPose() {
      // The Pose class might be nested depending on the environment
      const PoseClass = poseModule.Pose || (window as any).Pose;
      if (!PoseClass) {
        setError("Failed to load Pose Engine from MediaPipe.");
        return;
      }

      const pose = new PoseClass({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        poseResultsRef.current = results;
        if (!isModelLoaded) setIsModelLoaded(true);
      });

      startRenderingLoop(pose);
    }

    function startRenderingLoop(pose: any) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const render = async () => {
        if (video.readyState === 4) {
          await pose.send({ image: video });
        }

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(-1, 1);
        ctx.translate(-canvas.width, 0);

        const results = poseResultsRef.current;
        if (results && results.poseLandmarks) {
          const joints = extractKeyJoints(results.poseLandmarks);

          drawingModule.drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
            color: "#10b981",
            lineWidth: 2,
          });

          drawingModule.drawLandmarks(ctx, results.poseLandmarks, {
            color: "#ffffff",
            lineWidth: 1,
            radius: 3,
          });

          // Check Visibility (Production-level UX)
          if (joints) {
            const minVisibility = 0.5;
            const isVisible =
              joints.leftShoulder.visibility > minVisibility &&
              joints.rightShoulder.visibility > minVisibility;

            if (!isVisible) {
              ctx.restore();
              ctx.fillStyle = "rgba(239, 68, 68, 0.8)";
              ctx.fillRect(canvas.width / 2 - 100, 20, 200, 40);
              ctx.fillStyle = "white";
              ctx.font = "bold 14px Inter";
              ctx.textAlign = "center";
              ctx.fillText("STEP BACK: FULL BODY NOT VISIBLE", canvas.width / 2, 45);
              ctx.save();
              ctx.scale(-1, 1);
              ctx.translate(-canvas.width, 0);
            } else {
              // Multi-Exercise Logic
              const config = EXERCISES[activeIdRef.current];
              if (!config) return;

              const angle = config.getAngle(joints);

              // Update Rep Counter using the Generic Engine
              const result = updateExercise(angle, curStateRef.current, repCount, config);

              if (result.newCount !== repCount) {
                setRepCount(result.newCount);
              }
              setProgress(result.progress);
              curStateRef.current = result.newState;

              // Visual Feedback (Drawing Logic)
              ctx.fillStyle = "#ffffff";
              ctx.font = "bold 24px Inter";

              // Find coordinates for the relevant joint (for bicep curl it's the elbow, for squats it's the knee)
              const displayJoint = activeIdRef.current === "curl" ? joints.rightElbow : joints.rightKnee;
              const { x, y } = displayJoint;

              ctx.fillText(`${angle}°`, x * canvas.width, y * canvas.height - 20);

              // Draw Progress Gauge
              ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(x * canvas.width, y * canvas.height, 40, 0, 2 * Math.PI);
              ctx.stroke();

              ctx.strokeStyle = "#10b981";
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(x * canvas.width, y * canvas.height, 40, -Math.PI / 2, (-Math.PI / 2) + (result.progress * 2 * Math.PI));
              ctx.stroke();
            }
          }
        }

        ctx.restore();
        animationFrameId = requestAnimationFrame(render);
      };

      render();
    }

    init();

    return () => {
      if (stream) stream.getTracks().forEach((track) => track.stop());
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  if (error) {
    return (
      <div className="flex items-center justify-center w-full h-64 bg-zinc-900 rounded-2xl text-red-400 border border-red-900/50 p-6 text-center">
        <p className="font-medium">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-zinc-900 rounded-xl overflow-hidden shadow-2xl group border border-zinc-800">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            <p className="text-zinc-400 text-sm font-medium">Initializing Vision...</p>
          </div>
        </div>
      )}

      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover transform -scale-x-100" playsInline muted autoPlay />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Production-Level HUD */}
      <div className="absolute top-6 left-6 flex flex-col gap-4">
        {/* Exercise Selector */}
        <div className="flex gap-2 bg-black/40 backdrop-blur-md p-1.5 rounded-xl border border-white/10">
          {Object.values(EXERCISES).map((ex) => (
            <button
              key={ex.id}
              onClick={() => setActiveExerciseId(ex.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${activeExerciseId === ex.id
                  ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
            >
              {ex.name}
            </button>
          ))}
        </div>

        <div className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl min-w-[160px] shadow-2xl">
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-1">Active Session</p>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-xl font-bold text-white tracking-tight">
              {EXERCISES[activeExerciseId]?.name}
            </h2>
            <div className="flex flex-col items-end">
              <p className="text-3xl font-black text-white tabular-nums">{repCount}</p>
              <p className="text-[10px] text-zinc-500 font-bold uppercase">Reps</p>
            </div>
          </div>

          <div className="mt-4 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        <div className={`w-2 h-2 rounded-full ${isModelLoaded ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-bounce'}`}></div>
        <span className={`text-xs font-semibold uppercase tracking-wider ${isModelLoaded ? 'text-emerald-500' : 'text-amber-500'}`}>
          {isModelLoaded ? 'Pose Engine Active' : 'Loading Model...'}
        </span>
      </div>
    </div>
  );
}
