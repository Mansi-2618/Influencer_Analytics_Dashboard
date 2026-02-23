import { useEffect, useState } from "react";
import { useRouter} from "next/router";
import { useSession} from 'next-auth/react';
import Head from "next/head";

const STEPS = [
  { label: "Fetching Instagram Data", stage: "ingest" },
  { label: "Running Data Processing Pipeline", stage: "process" },
  { label: "Performing Sentiment Analysis", stage: "sentiment" },
  { label: "Finalizing Dashboard", stage: "completed" },
];

export default function GeneratingDashboard() {
  const router = useRouter();
  const { data: session } = useSession();
  const user_email = session?.user?.email;

  const [progress, setProgress] = useState(0);
  const [targetProgress, setTargetProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [pipelineStarted, setPipelineStarted] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false); 

  // Smooth progress animation
  useEffect(() => {
    if (progress < targetProgress) {
      const timer = setTimeout(() => {
        setProgress(prev => Math.min(prev + 1, targetProgress));
      }, 20); // Increment by 1% every 20ms
      return () => clearTimeout(timer);
    }
  }, [progress, targetProgress]);

  // 1️⃣ Start pipeline ONCE when page loads
  useEffect(() => {
    if (!user_email || pipelineStarted) return;

    const startPipeline = async () => {
      try {
        await fetch("/api/start-dashboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_email }),
        });

        setPipelineStarted(true);
      } catch (err) {
        console.error("Failed to start pipeline", err);
      }
    };

    startPipeline();
  }, [user_email, pipelineStarted]);

  // 2️⃣ Poll pipeline status from backend
  useEffect(() => {
    if (!pipelineStarted) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/pipeline-status?user_email=${user_email}`
        );
        const data = await res.json();

        // Update progress from Firestore's progress_percentage
        const newProgress = data.progress_percentage ?? data.progress ?? 0;
        setTargetProgress(newProgress);

        // Map stage to step index
        const stepIndex = STEPS.findIndex(
          (s) => s.stage === data.stage
        );
        if (stepIndex !== -1) {
          setCurrentStep(stepIndex);
        }

        // Redirect when completed
        if (data.stage === "completed" && data.progress_percentage === 100) {
          clearInterval(interval);
          setIsCompleting(true); // Show completion state
          
          // Wait 2 seconds before redirect
          setTimeout(() => {
            router.push("/dashboard-new");
          }, 1500); // little pause at 100%
        }
      } catch (err) {
        console.error("Pipeline polling failed", err);
      }
    }, 500); // Fast polling

    return () => clearInterval(interval);
  }, [pipelineStarted, user_email, router]);

  return (
    <>
      <Head>
        <title>Generating Dashboard...</title>
      </Head>

      <div className="min-h-screen flex items-center justify-center px-4
            bg-[#015581] bg-[linear-gradient(rgba(255,255,255,0.15)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.15)_2px,transparent_2px)] bg-[size:80px_80px]">
        <div className="max-w-xl w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-white shadow-xl">
          
          {/* Loader */}
          <div className="flex justify-center mb-6">
            {isCompleting ? (
              // Success checkmark animation
              <div className="w-14 h-14 rounded-full bg-green-500 flex items-center justify-center animate-bounce">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            ) : (
              // Loading spinner
              <div className="w-14 h-14 border-4 border-white/30 border-t-white rounded-full animate-spin" />
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-center mb-2">
            Generating Your Dashboard
          </h1>
          <p className="text-center text-white/80 mb-6">
            Please wait while we prepare everything for you
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-3 mb-4 overflow-hidden">
            <div
              className="bg-blue-400 h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Percentage */}
          <div className="text-center text-md font-semibold mb-6">
            {progress}%
          </div>

          {/* Steps */}
          <div className="space-y-3 text-m">
            {STEPS.map((step, index) => (
              <div
                key={step.label}
                className={`flex items-center gap-2 ${
                  index === currentStep
                    ? "text-blue-200 font-semibold"
                    : index < currentStep
                    ? "text-green-400"
                    : "text-white/50"
                }`}
              >
                {index < currentStep ? "✔ " : index === currentStep ? "⏳" : "• "}
                {step.label}
              </div>
            ))}
          </div>

        </div>
      </div>
    </>
  );
}