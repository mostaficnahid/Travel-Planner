import { Suspense } from "react";
import { TripWizard } from "@/components/trip-wizard/wizard";

export default function NewTripPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 py-6">
      <Suspense fallback={<div className="text-center py-20 text-slate-500 font-medium">Loading Trip Planner Wizard...</div>}>
        <TripWizard />
      </Suspense>
    </div>
  );
}
