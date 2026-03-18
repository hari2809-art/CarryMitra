"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "@/lib/firebase";
import { CITIES, PARCEL_CATEGORIES } from "@/lib/constants";
import BottomNav from "@/components/BottomNav";
import toast from "react-hot-toast";
import { PhotoIcon, XMarkIcon, TruckIcon } from "@heroicons/react/24/outline";
import Image from "next/image";

export default function PostParcelPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    category: "Documents",
    weight: "",
    pickupCity: "Hyderabad",
    deliveryCity: "Bangalore",
    description: "",
    price: "",
  });

  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.weight || !form.price || !form.description) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      const uid = auth.currentUser?.uid || "demo-user";
      const name = auth.currentUser?.displayName || "Anonymous Sender";

      let photoURL = "";
      if (photo && auth.currentUser) {
        const parcelId = "CM" + Math.floor(Math.random() * 100000);
        const imgRef = storageRef(storage, `parcels/${parcelId}/photo.jpg`);
        await uploadBytes(imgRef, photo);
        photoURL = await getDownloadURL(imgRef);
      }

      const parcelData = {
        parcelId: "CM" + Math.floor(1000 + Math.random() * 9000),
        senderId: uid,
        senderName: name,
        carrierId: null,
        pickupCity: form.pickupCity,
        deliveryCity: form.deliveryCity,
        category: form.category,
        weight: parseFloat(form.weight),
        description: form.description,
        photoURL,
        price: parseFloat(form.price),
        status: "Posted",
        distance: 570, // Mock distance
        eta: "8 hrs", // Mock ETA
        createdAt: serverTimestamp(),
      };

      if (auth.currentUser) {
        await addDoc(collection(db, "parcels"), parcelData);
      } else {
        // Demo storage
        const existing = JSON.parse(localStorage.getItem("demo_parcels") || "[]");
        localStorage.setItem("demo_parcels", JSON.stringify([...existing, parcelData]));
      }

      toast.success("Parcel posted successfully! 📦");
      router.push("/dashboard");
    } catch {
      toast.error("Failed to post parcel");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-12 pb-nav">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <TruckIcon className="w-7 h-7 text-blue-500" />
          Post a Parcel
        </h1>
        <p className="text-slate-400 text-sm mt-1">Fill in the details to find a traveler</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Photo Upload */}
        <div className="glass-card p-4 border-dashed">
          <label className="text-slate-400 text-xs font-medium mb-3 block">Parcel Photo</label>
          <div className="flex flex-col items-center">
            {photoPreview ? (
              <div className="relative w-full aspect-video rounded-xl overflow-hidden group">
                <Image src={photoPreview} alt="Preview" fill className="object-cover" />
                <button
                  type="button"
                  onClick={() => { setPhoto(null); setPhotoPreview(""); }}
                  className="absolute top-2 right-2 bg-red-600/80 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full py-10 flex flex-col items-center gap-2 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed hover:bg-slate-800 transition-colors"
              >
                <PhotoIcon className="w-10 h-10 text-slate-600" />
                <span className="text-slate-500 text-sm font-medium">Capture or Upload Photo</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handlePhotoChange}
            />
          </div>
        </div>

        {/* Cities */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Pickup City</label>
            <select
              value={form.pickupCity}
              onChange={(e) => setForm({ ...form, pickupCity: e.target.value })}
              className="input-field py-2 text-sm"
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-end pb-3 text-blue-500">→</div>
          <div className="flex-1">
            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Delivery City</label>
            <select
              value={form.deliveryCity}
              onChange={(e) => setForm({ ...form, deliveryCity: e.target.value })}
              className="input-field py-2 text-sm"
            >
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Category & Weight */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field py-2 text-sm"
            >
              {PARCEL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="w-24">
            <label className="text-slate-400 text-xs font-medium mb-1.5 block">Weight (kg)</label>
            <input
              type="number"
              step="0.1"
              placeholder="0.5"
              value={form.weight}
              onChange={(e) => setForm({ ...form, weight: e.target.value })}
              className="input-field py-2 text-sm"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-slate-400 text-xs font-medium mb-1.5 block">Description</label>
          <textarea
            placeholder="e.g. Small box with birthday gift, fragile"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="input-field h-24 resize-none text-sm"
          />
        </div>

        {/* Pricing */}
        <div className="glass-card p-4 bg-blue-900/10 border-blue-900/30">
          <label className="text-blue-400 text-xs font-bold mb-2 block uppercase tracking-wider">Offer Your Price</label>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold font-mono text-white">₹</span>
            <input
              type="number"
              placeholder="350"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="bg-transparent border-none text-3xl font-bold text-white focus:outline-none w-full placeholder:text-slate-700"
            />
          </div>
          <p className="text-slate-500 text-[10px] mt-2 italic">Suggested: ₹150 - ₹500 based on weight & distance</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
        >
          {loading ? (
            <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            "Post Parcel Now"
          )}
        </button>
      </form>

      <BottomNav />
    </div>
  );
}
