"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { CITIES } from "@/lib/constants";
import toast from "react-hot-toast";
import { UserCircleIcon, CameraIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function CreateAccountPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    dob: "",
    email: "",
    address: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [citySearch, setCitySearch] = useState("");
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filteredCities = CITIES.filter((c) =>
    c.toLowerCase().includes(citySearch.toLowerCase())
  );

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!form.name || !form.dob || !form.email || !form.address) {
      toast.error("Please fill all fields");
      return;
    }
    setLoading(true);
    try {
      const user = auth.currentUser;
      const uid = user?.uid || "demo-user-" + Date.now();

      let photoURL = "";
      if (photo && user) {
        try {
          const imgRef = storageRef(storage, `profiles/${uid}/photo.jpg`);
          await uploadBytes(imgRef, photo);
          photoURL = await getDownloadURL(imgRef);
        } catch {
          // Storage not configured - use data URL as fallback
          photoURL = photoPreview;
        }
      }

      const userDoc = {
        uid,
        name: form.name,
        phone: user?.phoneNumber || "demo",
        email: form.email,
        dob: form.dob,
        address: form.address,
        photoURL,
        isVerified: false,
        rating: 5.0,
        totalDeliveries: 0,
        totalEarnings: 0,
        role: "sender",
        createdAt: serverTimestamp(),
      };

      try {
        await setDoc(doc(db, "users", uid), userDoc);
      } catch {
        // Firestore not configured - store in localStorage as demo
        localStorage.setItem("carrymitra_user", JSON.stringify({ ...userDoc, uid }));
      }

      toast.success("Account created! Welcome to CarryMitra 🎉");
      router.push("/dashboard");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-8 pb-nav">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Create Account</h1>
        <p className="text-slate-400 text-sm mt-1">Tell us about yourself</p>
      </div>

      {/* Profile Photo */}
      <div className="flex flex-col items-center mb-6">
        <button
          onClick={() => fileRef.current?.click()}
          className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-slate-600 hover:border-blue-500 transition-colors bg-slate-800"
        >
          {photoPreview ? (
            <Image src={photoPreview} alt="Profile" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-1">
              <UserCircleIcon className="w-8 h-8 text-slate-500" />
              <CameraIcon className="w-4 h-4 text-slate-500" />
            </div>
          )}
        </button>
        <p className="text-slate-500 text-xs mt-2">Tap to add photo</p>
        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
      </div>

      {/* Form */}
      <div className="space-y-4">
        <div>
          <label className="text-slate-400 text-xs font-medium mb-1.5 block">Full Name</label>
          <input
            type="text"
            placeholder="Enter your full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="input-field"
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs font-medium mb-1.5 block">Date of Birth</label>
          <input
            type="date"
            value={form.dob}
            onChange={(e) => setForm({ ...form, dob: e.target.value })}
            className="input-field"
            style={{ colorScheme: "dark" }}
          />
        </div>

        <div>
          <label className="text-slate-400 text-xs font-medium mb-1.5 block">Email Address</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="input-field"
          />
        </div>

        <div className="relative">
          <label className="text-slate-400 text-xs font-medium mb-1.5 block">City / Address</label>
          <input
            type="text"
            placeholder="Search your city..."
            value={form.address || citySearch}
            onChange={(e) => {
              setCitySearch(e.target.value);
              setForm({ ...form, address: "" });
              setShowCityDropdown(true);
            }}
            onFocus={() => setShowCityDropdown(true)}
            className="input-field"
          />
          {showCityDropdown && filteredCities.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden z-10 shadow-xl max-h-48 overflow-y-auto">
              {filteredCities.map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setForm({ ...form, address: city });
                    setCitySearch(city);
                    setShowCityDropdown(false);
                  }}
                  className="w-full text-left px-4 py-3 text-white hover:bg-slate-700 transition-colors text-sm border-b border-slate-700/50 last:border-0"
                >
                  📍 {city}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="btn-primary mt-6"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating Account...
            </>
          ) : (
            "Create Account 🚀"
          )}
        </button>
      </div>
    </div>
  );
}
