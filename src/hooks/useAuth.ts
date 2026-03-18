"use client";
import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

export interface UserProfile {
  uid: string;
  name: string;
  phone: string;
  email: string;
  dob: string;
  address: string;
  photoURL: string;
  isVerified: boolean;
  rating: number;
  totalDeliveries: number;
  totalEarnings: number;
  createdAt: unknown;
  role?: "sender" | "carrier";
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const docRef = doc(db, "users", firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserProfile(docSnap.data() as UserProfile);
            setLoading(false);
            return;
          }
        } catch { /* fallback to local below */ }
      }

      // Fallback for Demo Mode or missing Firestore record
      const localData = typeof window !== 'undefined' ? localStorage.getItem("carrymitra_user") : null;
      if (localData) {
        try {
          const parsed = JSON.parse(localData);
          setUserProfile(parsed);
          if (!firebaseUser) {
            setUser({ uid: parsed.uid, phoneNumber: parsed.phone, email: parsed.email } as User);
          }
        } catch {
          setUserProfile(null);
        }
      } else {
        setUser(firebaseUser);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { user, userProfile, loading };
}
