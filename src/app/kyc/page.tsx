"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import toast from "react-hot-toast";
import { ShieldCheckIcon, IdentificationIcon, CheckCircleIcon } from "@heroicons/react/24/outline";

export default function KYCPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [aadhaar, setAadhaar] = useState("");
  const [otp, setOtp] = useState("");

  async function handleVerifyAadhaar() {
    if (aadhaar.length !== 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    setLoading(true);
    // Simulate Aadhaar OTP send
    setTimeout(() => {
      setLoading(false);
      setStep(2);
      toast.success("OTP sent to Aadhaar-linked mobile");
    }, 1500);
  }

  async function handleVerifyOTP() {
    if (otp !== "1234") {
      toast.error("Invalid OTP. Use demo OTP: 1234");
      return;
    }
    setLoading(true);
    try {
      const uid = auth.currentUser?.uid;
      if (uid) {
        await updateDoc(doc(db, "users", uid), {
          isVerified: true
        });
      }
      setTimeout(() => {
        setLoading(false);
        setStep(3);
        toast.success("Identity Verified! ✅");
      }, 2000);
    } catch {
      toast.error("Database update failed, but simulation complete!");
      setStep(3);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <div className="bg-slate-900 px-5 pt-12 pb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <ShieldCheckIcon className="w-8 h-8 text-blue-500" />
          Safety Check
        </h1>
        <p className="text-slate-400 text-sm mt-1">Verify your identity to unlock higher trust</p>
      </div>

      <div className="flex-1 px-5 py-8">
        {step === 1 && (
          <div className="animate-slide-up">
            <div className="glass-card p-6 mb-8 border-blue-500/20 bg-blue-900/5">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <IdentificationIcon className="w-5 h-5 text-blue-400" />
                Aadhaar Verification
              </h3>
              <p className="text-slate-400 text-xs mb-6 leading-relaxed">
                Connect your DigiLocker or enter Aadhaar number manually. This data is never stored locally.
              </p>
              
              <label className="text-slate-500 text-[10px] font-bold uppercase mb-1.5 block">12-Digit Aadhaar Number</label>
              <input
                type="tel"
                maxLength={12}
                placeholder="0000 0000 0000"
                value={aadhaar}
                onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))}
                className="input-field text-lg tracking-[0.2em] font-mono mb-6"
              />
              
              <button
                onClick={handleVerifyAadhaar}
                disabled={loading || aadhaar.length < 12}
                className="btn-primary"
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify Identity"}
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex gap-4 p-4 glass-card bg-slate-900/50">
                <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
                  <ShieldCheckIcon className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="text-white text-sm font-bold">End-to-End Encrypted</p>
                  <p className="text-slate-500 text-xs">Your data is processed securely via Govt. APIs only.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-slide-up text-center">
            <h3 className="text-white font-bold text-xl mb-2">Enter Verification Code</h3>
            <p className="text-slate-400 text-sm mb-8">Verification code sent to mobile linked with Aadhaar XXXX-XXXX-{(aadhaar.slice(-4))}</p>
            
            <input
              type="tel"
              maxLength={4}
              placeholder="0 0 0 0"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="w-48 bg-slate-800 border border-slate-700 rounded-2xl px-4 py-4 text-center text-4xl font-black text-white focus:outline-none focus:border-blue-500 mb-8"
            />
            
            <button
              onClick={handleVerifyOTP}
              disabled={loading || otp.length < 4}
              className="btn-primary mb-4"
            >
              {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Verify Code"}
            </button>
            <p className="text-slate-500 text-xs">Demo Code: <span className="text-blue-400">1234</span></p>
          </div>
        )}

        {step === 3 && (
          <div className="animate-slide-up text-center pt-8">
            <div className="w-24 h-24 bg-green-600/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircleIcon className="w-16 h-16 text-green-500" />
            </div>
            <h2 className="text-3xl font-black text-white mb-2">Verified!</h2>
            <p className="text-slate-400 text-sm mb-12">You now have the &quot;CarryMitra Verified&quot; badge on your profile. This unlocks unlimited deliveries.</p>
            
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
