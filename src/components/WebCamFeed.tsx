"use client";

import { useEffect, useRef } from "react";
import * as mpPose from "@mediapipe/pose";

import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

export default function WebcamFeed() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
   let pose: mpPose.Pose;

    async function setupCamera() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
      });

      if (!videoRef.current) return;

      videoRef.current.srcObject = stream;

      videoRef.current.onloadedmetadata = async () => {
        await videoRef.current?.play();
        setupPose();
      };
    }

    function setupPose() {
      if (!videoRef.current || !canvasRef.current) return;

      pose = new mpPose.Pose({

        locateFile: (file) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results) => {
        drawResults(results);
      });

      const video = videoRef.current;

      async function detect() {
        if (!video) return;

        await pose.send({ image: video });
        requestAnimationFrame(detect);
      }

      detect();
    }

    function drawResults(results: mpPose.Results)
 {
      if (!canvasRef.current || !videoRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (results.poseLandmarks) {
        drawConnectors(ctx, results.poseLandmarks, mpPose.POSE_CONNECTIONS
, {
          color: "#00FF00",
          lineWidth: 4,
        });

        drawLandmarks(ctx, results.poseLandmarks, {
          color: "#FF0000",
          lineWidth: 2,
        });
      }
    }

    setupCamera();
  }, []);

  return (
    <div className="relative w-full max-w-3xl">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full rounded-lg"
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
      />
    </div>
  );
}
