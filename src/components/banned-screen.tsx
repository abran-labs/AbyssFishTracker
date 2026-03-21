import { Hammer } from "lucide-react";

export function BannedScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white px-6">
      <div className="max-w-sm w-full text-center space-y-5">
        <div className="flex justify-center">
          <Hammer className="w-16 h-16 text-red-400" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-semibold text-red-400">Permanently Banned</h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            You have been permanently banned from Abyss Fish Tracker.
          </p>
        </div>
        <p className="text-xs text-zinc-600">If you believe this is a mistake, contact me.</p>
      </div>
    </div>
  );
}
