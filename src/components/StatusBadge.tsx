"use client";
import { ParcelStatus, STATUS_COLORS } from "@/lib/constants";

export default function StatusBadge({ status }: { status: ParcelStatus }) {
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium flex items-center gap-1.5 ${STATUS_COLORS[status]}`}>
      {status === "In Transit" && (
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse-dot" />
      )}
      {status}
    </span>
  );
}
