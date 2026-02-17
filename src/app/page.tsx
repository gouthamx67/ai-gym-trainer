import WebcamFeed from "@/components/WebCamFeed";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white p-4">
      <div className="w-full max-w-5xl flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl gradient-text">
            AI Gym Trainer
          </h1>
          <p className="text-zinc-400">
            Real-time form correction using computer vision.
          </p>
        </div>

        <div className="w-full border border-zinc-800 rounded-2xl p-4 bg-zinc-900/50 backdrop-blur-sm">
          <WebcamFeed />
        </div>
      </div>
    </main>
  );
}
