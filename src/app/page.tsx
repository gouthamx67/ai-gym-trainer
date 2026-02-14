import WebcamFeed from "@/components/WebCamFeed";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white p-4">
      <h1 className="text-3xl font-bold mb-6">
        AI Gym Trainer
      </h1>
      <WebcamFeed />
    </main>
  );
}
