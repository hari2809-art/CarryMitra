"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import StatusBadge from "@/components/StatusBadge";
import { ParcelStatus } from "@/lib/constants";
import toast from "react-hot-toast";
import Image from "next/image";

const DEMO_PARCELS = [
  {
    id: "CM1001", senderId: "user1", carrierId: null,
    pickupCity: "Hyderabad", deliveryCity: "Bangalore",
    category: "Electronics", weight: 2.5, status: "Posted" as ParcelStatus,
    price: 350, distance: 570, eta: "8 hrs", photoURL: "",
    senderName: "Ravi Kumar", createdAt: new Date(),
  },
  {
    id: "CM1002", senderId: "user2", carrierId: "demo-user",
    pickupCity: "Chennai", deliveryCity: "Madurai",
    category: "Documents", weight: 0.5, status: "In Transit" as ParcelStatus,
    price: 180, distance: 460, eta: "5 hrs", photoURL: "",
    senderName: "Priya Sharma", createdAt: new Date(),
  },
  {
    id: "CM1003", senderId: "user3", carrierId: "demo-user",
    pickupCity: "Tirupati", deliveryCity: "Chennai",
    category: "Clothing", weight: 1.2, status: "Delivered" as ParcelStatus,
    price: 220, distance: 140, eta: "Delivered", photoURL: "",
    senderName: "Anand Reddy", createdAt: new Date(),
  },
  {
    id: "CM1004", senderId: "user4", carrierId: null,
    pickupCity: "Kadapa", deliveryCity: "Nellore",
    category: "Medicines", weight: 0.8, status: "Posted" as ParcelStatus,
    price: 150, distance: 200, eta: "3 hrs", photoURL: "",
    senderName: "Sita Devi", createdAt: new Date(),
  },
  {
    id: "CM1005", senderId: "user5", carrierId: "demo-user",
    pickupCity: "Vijayawada", deliveryCity: "Guntur",
    category: "Food & Groceries", weight: 3.0, status: "Accepted" as ParcelStatus,
    price: 120, distance: 65, eta: "1.5 hrs", photoURL: "",
    senderName: "Mohammad Ali", createdAt: new Date(),
  },
];

const FILTER_TABS = ["All", "Pending", "In Progress", "Completed", "Cancelled"];
const STATUS_MAP: Record<string, ParcelStatus[]> = {
  All: ["Posted", "Accepted", "Picked Up", "In Transit", "Near Destination", "Delivered", "Cancelled"],
  Pending: ["Posted"],
  "In Progress": ["Accepted", "Picked Up", "In Transit", "Near Destination"],
  Completed: ["Delivered"],
  Cancelled: ["Cancelled"],
};

interface Parcel {
  id: string;
  senderId: string;
  carrierId: string | null;
  pickupCity: string;
  deliveryCity: string;
  category: string;
  weight: number;
  status: ParcelStatus;
  price: number;
  distance: number;
  eta: string;
  photoURL: string;
  senderName: string;
}

export default function DeliveriesPage() {
  const router = useRouter();
  const [parcels, setParcels] = useState<Parcel[]>(DEMO_PARCELS);
  const [filter, setFilter] = useState("All");
  const [viewMode, setViewMode] = useState<"carrier" | "sender">("carrier");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const field = viewMode === "carrier" ? "carrierId" : "senderId";
    const q = query(collection(db, "parcels"), where(field, "==", uid));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Parcel);
      setParcels(data);
    }, () => {/* Use demo data */});
    return () => unsub();
  }, [viewMode]);

  async function updateParcelStatus(id: string, status: ParcelStatus, extra?: Record<string, unknown>) {
    setUpdatingId(id);
    try {
      const uid = auth.currentUser?.uid;
      const updates: Record<string, unknown> = { status, updatedAt: serverTimestamp(), ...extra };
      if (uid) {
        await updateDoc(doc(db, "parcels", id), updates);
      }
      setParcels((prev) => prev.map((p) => p.id === id ? { ...p, status, ...extra } : p));
      if (status === "Delivered") toast.success("🎉 Delivery completed! Payment released.");
      else toast.success(`Status updated to: ${status}`);
    } catch {
      toast.error("Update failed");
    } finally {
      setUpdatingId(null);
    }
  }

  const filteredParcels = parcels.filter((p) =>
    STATUS_MAP[filter]?.includes(p.status) ?? true
  );

  return (
    <div className="min-h-screen bg-slate-950 pb-nav">
      {/* Header */}
      <div className="bg-slate-900 px-5 pt-12 pb-4">
        <h1 className="text-xl font-bold text-white mb-3">My Deliveries</h1>
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1 mb-3">
          {["carrier", "sender"].map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m as "carrier" | "sender")}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                viewMode === m ? "bg-blue-600 text-white" : "text-slate-400"
              }`}
            >
              {m === "carrier" ? "📦 As Carrier" : "🏠 As Sender"}
            </button>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                filter === tab
                  ? "bg-blue-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 py-3 space-y-3">
        {filteredParcels.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <span className="text-4xl mb-3 block">📭</span>
            <p className="text-white font-medium">No deliveries found</p>
            <p className="text-slate-400 text-sm mt-1">
              {filter === "Pending" ? "No pending jobs right now" : `No ${filter.toLowerCase()} deliveries`}
            </p>
          </div>
        ) : (
          filteredParcels.map((parcel) => (
            <div key={parcel.id} className="glass-card p-4 animate-fade-in card-hover">
              {/* Card Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 rounded-xl bg-slate-700 flex items-center justify-center text-lg overflow-hidden">
                    {parcel.photoURL ? (
                      <Image src={parcel.photoURL} alt="" width={40} height={40} className="object-cover rounded-xl" />
                    ) : (
                      getCategoryEmoji(parcel.category)
                    )}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">#{parcel.id}</p>
                    <p className="text-slate-400 text-xs">{parcel.category} · {parcel.weight}kg</p>
                  </div>
                </div>
                <StatusBadge status={parcel.status} />
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl px-3 py-2 mb-3">
                <div className="flex-1">
                  <p className="text-slate-400 text-[10px]">Pickup</p>
                  <p className="text-white text-sm font-medium">📍 {parcel.pickupCity}</p>
                </div>
                <div className="text-blue-400 text-base">→</div>
                <div className="flex-1">
                  <p className="text-slate-400 text-[10px]">Drop</p>
                  <p className="text-white text-sm font-medium">🏁 {parcel.deliveryCity}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mb-3 text-xs text-slate-400">
                <span className="flex items-center gap-1">💰 <span className="text-green-400 font-semibold">₹{parcel.price}</span></span>
                <span>📏 {parcel.distance} km</span>
                <span>⏱ {parcel.eta}</span>
              </div>

              {/* Action Buttons */}
              {parcel.status === "Posted" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => updateParcelStatus(parcel.id, "Cancelled")}
                    disabled={updatingId === parcel.id}
                    className="flex-1 border border-red-600/50 text-red-400 py-2.5 rounded-xl text-sm font-medium hover:bg-red-600/10 transition-colors"
                  >
                    Reject Job
                  </button>
                  <button
                    onClick={() => updateParcelStatus(parcel.id, "Accepted", {
                      carrierId: auth.currentUser?.uid || "demo-carrier"
                    })}
                    disabled={updatingId === parcel.id}
                    className="flex-2 flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                  >
                    {updatingId === parcel.id ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : "✓ Accept Job"}
                  </button>
                </div>
              )}

              {["Accepted", "Picked Up", "In Transit", "Near Destination"].includes(parcel.status) && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/tracking/${parcel.id}`)}
                      className="flex-1 bg-blue-600/20 border border-blue-600/50 text-blue-400 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-1"
                    >
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse-dot" />
                      Track Live
                    </button>
                    <button
                      onClick={() => router.push(`/chat/${parcel.id}`)}
                      className="flex-1 bg-green-600/20 border border-green-600/50 text-green-400 py-2.5 rounded-xl text-sm font-medium"
                    >
                      💬 Chat
                    </button>
                  </div>
                  <div className="flex gap-2">
                    {parcel.status === "Accepted" && (
                      <button
                        onClick={() => updateParcelStatus(parcel.id, "Picked Up")}
                        disabled={updatingId === parcel.id}
                        className="flex-1 bg-orange-600/20 border border-orange-600/50 text-orange-400 py-2 rounded-xl text-xs font-medium"
                      >
                        Mark Picked Up
                      </button>
                    )}
                    {(parcel.status === "Picked Up" || parcel.status === "In Transit") && (
                      <button
                        onClick={() => updateParcelStatus(parcel.id, "In Transit")}
                        disabled={updatingId === parcel.id}
                        className="flex-1 bg-blue-600/20 border border-blue-600/50 text-blue-400 py-2 rounded-xl text-xs font-medium"
                      >
                        In Transit
                      </button>
                    )}
                    <button
                      onClick={() => updateParcelStatus(parcel.id, "Delivered")}
                      disabled={updatingId === parcel.id}
                      className="flex-1 bg-green-600/20 border border-green-600/50 text-green-400 py-2 rounded-xl text-xs font-medium"
                    >
                      ✓ Mark Delivered
                    </button>
                  </div>
                </div>
              )}

              {parcel.status === "Delivered" && (
                <div className="flex items-center justify-center gap-2 bg-green-600/10 border border-green-600/30 rounded-xl py-2.5">
                  <span className="text-green-400 font-medium text-sm">✓ Delivery Complete</span>
                  <span className="text-slate-400 text-xs">· ₹{parcel.price} earned</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}

function getCategoryEmoji(category: string): string {
  const map: Record<string, string> = {
    "Electronics": "📱", "Documents": "📄", "Clothing": "👗",
    "Food & Groceries": "🍎", "Books": "📚", "Medicines": "💊",
    "Gifts": "🎁", "Fragile Items": "🔮", "Other": "📦",
  };
  return map[category] || "📦";
}
