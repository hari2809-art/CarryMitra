"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, collection, query, where, onSnapshot, orderBy, limit } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { CITIES } from "@/lib/constants";
import BottomNav from "@/components/BottomNav";
import StatusBadge from "@/components/StatusBadge";
import { ParcelStatus } from "@/lib/constants";
import { BellIcon, MapPinIcon } from "@heroicons/react/24/outline";
import { TruckIcon } from "@heroicons/react/24/solid";
import { useAuth } from "@/hooks/useAuth";
import toast from "react-hot-toast";

interface Parcel {
  id: string;
  pickupCity: string;
  deliveryCity: string;
  category: string;
  status: ParcelStatus;
  price: number;
  carrierId?: string;
  senderId: string;
}

interface UserStats {
  totalEarnings: number;
  totalDeliveries: number;
  name: string;
  address: string;
  photoURL: string;
  role: "sender" | "carrier";
}

export default function DashboardPage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [role, setRole] = useState<"sender" | "carrier">("carrier");
  const [fromCity, setFromCity] = useState("Hyderabad");
  const [toCity, setToCity] = useState("Bangalore");
  const [activeParcel, setActiveParcel] = useState<Parcel | null>(null);
  const [weekEarnings] = useState(1850);
  const [todayEarnings] = useState(450);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setStats(userProfile as UserStats);
      setRole(userProfile.role || "carrier");
      
      // Real-time active parcel for real users
      if (!userProfile.uid.startsWith("demo-")) {
        const q = query(
          collection(db, "parcels"),
          where(userProfile.role === "carrier" ? "carrierId" : "senderId", "==", userProfile.uid),
          where("status", "in", ["Accepted", "Picked Up", "In Transit", "Near Destination"]),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const unsub = onSnapshot(q, (snap) => {
          if (!snap.empty) {
            const d = snap.docs[0];
            setActiveParcel({ id: d.id, ...d.data() } as Parcel);
          } else {
            setActiveParcel(null);
          }
        });
        return () => unsub();
      }
    }
  }, [userProfile]);

  async function handleUpdatePlan() {
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "users", uid), { fromCity, toCity });
      }
      toast.success("Route updated! 🗺️");
    } catch {
      toast.success("Route saved (demo mode)");
    } finally {
      setLoading(false);
    }
  }

  const avgJobValue = stats?.totalDeliveries && stats.totalDeliveries > 0
    ? Math.round(stats.totalEarnings / stats.totalDeliveries)
    : 0;

  if (authLoading || (!userProfile && !stats)) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 pb-nav">
      {/* Header */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 px-5 pt-12 pb-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
              <TruckIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Welcome back,</p>
              <p className="text-white font-semibold text-sm">{userProfile?.name || stats?.name || "User"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800 rounded-lg px-2 py-1">
              <MapPinIcon className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-300 text-xs">{userProfile?.address || stats?.address || "Location..."}</span>
            </div>
            <button className="relative w-9 h-9 bg-slate-800 rounded-full flex items-center justify-center">
              <BellIcon className="w-5 h-5 text-slate-400" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
            </button>
          </div>
        </div>

        {/* Role Toggle */}
        <div className="flex bg-slate-800 rounded-xl p-1 gap-1">
          {["sender", "carrier"].map((r) => (
            <button
              key={r}
              onClick={() => {
                setRole(r as "sender" | "carrier");
                // Persist role choice if logged in
                if (userProfile?.uid && !userProfile.uid.startsWith("demo-")) {
                  updateDoc(doc(db, "users", userProfile.uid), { role: r });
                }
              }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                role === r
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r === "carrier" ? "📦 Carrier" : "🏠 Sender"}
            </button>
          ))}
        </div>
      </div>

      <div className={`px-5 space-y-4 ${authLoading ? "opacity-50" : ""}`}>
        {/* Action Section based on role */}
        {role === "carrier" ? (
          <div className="glass-card p-4 border-l-4 border-blue-500">
            <h3 className="text-white font-semibold text-sm mb-3">Plan My Travel Route</h3>
            <p className="text-slate-400 text-[10px] mb-3 uppercase font-bold">Where are you traveling today?</p>
            <div className="flex items-center gap-2 mb-3">
              <select
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
              <div className="text-blue-400 text-lg">→</div>
              <select
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
                className="flex-1 bg-slate-700 border border-slate-600 rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:border-blue-500"
              >
                {CITIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
            <button
              onClick={handleUpdatePlan}
              disabled={loading}
              className="btn-primary py-3 text-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : "Activate My Route 🚀"}
            </button>
          </div>
        ) : (
          <div className="glass-card p-4 border-l-4 border-green-500">
            <h3 className="text-white font-semibold text-sm mb-1">Need to send a parcel?</h3>
            <p className="text-slate-400 text-xs mb-4">Post your parcel and find travelers visiting your destination city.</p>
            <button 
              onClick={() => router.push("/post-parcel")}
              className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-600/20"
            >
              Post New Parcel 📦
            </button>
          </div>
        )}

        {/* Earnings Grid */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "This Week's Earnings", value: `₹${weekEarnings}`, color: "text-green-400", bg: "from-green-600/10 to-emerald-600/5" },
            { label: "Completed Jobs", value: stats?.totalDeliveries || 0, color: "text-blue-400", bg: "from-blue-600/10 to-blue-600/5" },
            { label: "Today's Earnings", value: `₹${todayEarnings}`, color: "text-amber-400", bg: "from-amber-600/10 to-amber-600/5" },
            { label: "Avg Job Value", value: `₹${avgJobValue || 0}`, color: "text-purple-400", bg: "from-purple-600/10 to-purple-600/5" },
          ].map((item) => (
            <div key={item.label} className={`glass-card p-4 bg-gradient-to-br ${item.bg}`}>
              <p className="text-slate-400 text-xs mb-1">{item.label}</p>
              <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        {/* Active Delivery Card */}
        {activeParcel ? (
          <div className="glass-card p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-white font-semibold text-sm">Ongoing Delivery</h3>
              <StatusBadge status={activeParcel.status} />
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-300 mb-3">
              <span>📍 {activeParcel.pickupCity}</span>
              <span className="text-blue-400">→</span>
              <span>🏁 {activeParcel.deliveryCity}</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/tracking/${activeParcel.id}`)}
                className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
              >
                <span className="w-2 h-2 bg-white rounded-full animate-pulse-dot" />
                Track Live
              </button>
              <button
                onClick={() => router.push(`/chat/${activeParcel.id}`)}
                className="flex-1 bg-green-600 text-white py-2.5 rounded-xl text-sm font-medium"
              >
                💬 Chat
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 flex flex-col items-center text-center">
            <span className="text-4xl mb-3">📭</span>
            <p className="text-white font-medium text-sm mb-1">No Active Deliveries</p>
            <p className="text-slate-400 text-xs">
              {role === "carrier"
                ? "Browse available parcels to start earning!"
                : "Post a parcel to get it delivered"}
            </p>
            <button
              onClick={() => router.push(role === "carrier" ? "/deliveries" : "/post-parcel")}
              className="mt-4 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium"
            >
              {role === "carrier" ? "Browse Parcels" : "Post Parcel"}
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 pb-4">
          {[
            { icon: "🗺️", label: "Track", href: "/tracking/demo" },
            { icon: "💬", label: "Chat", href: "/chat/demo" },
            { icon: "✅", label: "KYC", href: "/kyc" },
          ].map((action) => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className="glass-card py-4 flex flex-col items-center gap-2 card-hover"
            >
              <span className="text-2xl">{action.icon}</span>
              <span className="text-slate-400 text-xs">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
