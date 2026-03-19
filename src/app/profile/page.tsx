"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import toast from "react-hot-toast";
import { UserCircleIcon, PencilSquareIcon, ShieldCheckIcon, ArrowRightOnRectangleIcon, StarIcon, TruckIcon, MapPinIcon, CurrencyRupeeIcon } from "@heroicons/react/24/solid";
import Image from "next/image";

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  photoURL: string;
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
}

const DEFAULT_PROFILE: UserProfile = {
  name: "Deepak Kumar",
  email: "deepak@example.com",
  phone: "+91 98765 43210",
  address: "Hyderabad, Telangana",
  photoURL: "",
  isVerified: true,
  rating: 4.8,
  totalDeliveries: 24,
  totalEarnings: 4250,
};

export default function ProfilePage() {
  const router = useRouter();
  const { userProfile, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else if (userProfile) {
          setProfile(userProfile);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (userProfile) setProfile(userProfile);
      }
    }

    if (!authLoading) {
      fetchProfile();
    }
  }, [userProfile, authLoading]);

  async function handleLogout() {
    try {
      await signOut(auth);
      toast.success("Signed out successfully");
      router.push("/");
    } catch {
      toast.error("Failed to sign out");
    }
  }

  async function handleUpdateProfile() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setIsEditing(false);
      return;
    }

    // setLoading(true);
    try {
      await updateDoc(doc(db, "users", uid), {
        name: profile.name,
        email: profile.email,
        address: profile.address,
      } as Record<string, unknown>);
      toast.success("Profile updated!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to update profile");
    } finally {
    }
  }

  return (
    <div className={`min-h-screen bg-slate-950 px-5 pt-12 pb-nav ${authLoading ? "opacity-50 pointer-events-none" : ""}`}>
      {/* Profile Header */}
      <div className="flex flex-col items-center mb-8 relative">
        <div className="w-28 h-28 rounded-full border-4 border-blue-600/30 p-1 mb-4 relative">
          <div className="w-full h-full rounded-full bg-slate-800 overflow-hidden relative">
            {profile.photoURL ? (
              <Image src={profile.photoURL} alt="Profile" fill className="object-cover" />
            ) : (
              <UserCircleIcon className="w-full h-full text-slate-700" />
            )}
          </div>
          {profile.isVerified && (
            <div className="absolute bottom-1 right-1 bg-blue-600 text-white p-1.5 rounded-full border-4 border-slate-950">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
          )}
        </div>
        
        <div className="text-center">
          <h1 className="text-2xl font-black text-white flex items-center justify-center gap-2">
            {profile.name}
            {profile.isVerified && <span className="text-blue-500 text-sm font-bold bg-blue-500/10 px-2 py-0.5 rounded-full">VERIFIED ✓</span>}
          </h1>
          <p className="text-slate-500 text-sm mt-1">{profile.email}</p>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <div className="glass-card p-4 text-center">
          <StarIcon className="w-5 h-5 text-amber-400 mx-auto mb-1" />
          <p className="text-white font-bold">{profile.rating}</p>
          <p className="text-slate-500 text-[10px] uppercase">Rating</p>
        </div>
        <div className="glass-card p-4 text-center border-blue-500/20">
          <TruckIcon className="w-5 h-5 text-blue-400 mx-auto mb-1" />
          <p className="text-white font-bold">{profile.totalDeliveries}</p>
          <p className="text-slate-500 text-[10px] uppercase">Deliveries</p>
        </div>
        <div className="glass-card p-4 text-center border-green-500/20">
          <CurrencyRupeeIcon className="w-5 h-5 text-green-400 mx-auto mb-1" />
          <p className="text-white font-bold">₹{profile.totalEarnings}</p>
          <p className="text-slate-500 text-[10px] uppercase">Earned</p>
        </div>
      </div>

      {/* Profile Sections */}
      <div className="space-y-4">
        <div className="glass-card p-5 group transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-wider">Account Information</h3>
            <button 
              onClick={() => isEditing ? handleUpdateProfile() : setIsEditing(true)}
              className="text-blue-400 text-xs font-bold flex items-center gap-1 hover:text-blue-300 transition-colors"
            >
              <PencilSquareIcon className="w-3.5 h-3.5" />
              {isEditing ? "SAVE" : "EDIT"}
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <UserCircleIcon className="w-5 h-5 text-slate-600 mt-1" />
              <div className="flex-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Full Name</p>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.name} 
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-slate-800 border-b border-blue-500 text-white text-sm py-1 focus:outline-none"
                  />
                ) : (
                  <p className="text-white text-sm font-medium">{profile.name}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPinIcon className="w-5 h-5 text-slate-600 mt-1" />
              <div className="flex-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Location</p>
                {isEditing ? (
                  <input 
                    type="text" 
                    value={profile.address} 
                    onChange={e => setProfile({...profile, address: e.target.value})}
                    className="w-full bg-slate-800 border-b border-blue-500 text-white text-sm py-1 focus:outline-none"
                  />
                ) : (
                  <p className="text-white text-sm font-medium">{profile.address}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-4 opacity-70">
              <TruckIcon className="w-5 h-5 text-slate-600 mt-1" />
              <div className="flex-1">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Phone (Registered)</p>
                <p className="text-white text-sm font-medium">{profile.phone}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4">
          <button 
            onClick={() => router.push('/kyc')}
            className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all ${
              profile.isVerified 
              ? "bg-slate-900 text-green-500 border border-green-500/30" 
              : "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            }`}
          >
            <ShieldCheckIcon className="w-5 h-5" />
            {profile.isVerified ? "IDENTITY VERIFIED" : "VERIFY IDENTITY NOW"}
          </button>

          <button 
            onClick={handleLogout}
            className="w-full py-4 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-2xl flex items-center justify-center gap-3 font-bold text-sm transition-all border border-red-500/20"
          >
            <ArrowRightOnRectangleIcon className="w-5 h-5" />
            SIGN OUT
          </button>
        </div>

        <p className="text-center text-slate-700 text-[10px] pt-8 font-medium">
          CarryMitra v1.0.0 (Demo Mode) · Built for Startup Demo
        </p>
      </div>

      <BottomNav />
    </div>
  );
}
