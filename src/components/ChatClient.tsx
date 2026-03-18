"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { ArrowLeftIcon, PaperAirplaneIcon, PaperClipIcon, LockClosedIcon } from "@heroicons/react/24/solid";
import toast from "react-hot-toast";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Timestamp;
  read: boolean;
  type: "text" | "otp" | "location";
  otp?: string;
}

const QUICK_REPLIES = [
  "Where are you?",
  "Handle with care",
  "Thank you!",
  "Almost there?",
  "Confirmed ✓",
];

export default function ChatClient({ parcelId }: { parcelId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Demo messages if Firestore not ready
  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setMessages([
        {
          id: "m1",
          senderId: "other",
          senderName: "Deepak (Carrier)",
          text: "Hi, I have picked up your parcel.",
          timestamp: Timestamp.now(),
          read: true,
          type: "text",
        },
        {
          id: "m2",
          senderId: "other",
          senderName: "Deepak (Carrier)",
          text: "I am at Kadapa bypass right now.",
          timestamp: Timestamp.now(),
          read: true,
          type: "text",
        },
      ]);
      return;
    }

    const q = query(
      collection(db, "chats", parcelId, "messages"),
      orderBy("timestamp", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];
      setMessages(msgs);
      setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return unsubscribe;
  }, [parcelId]);

  async function sendMessage(text: string, type: "text" | "otp" = "text", extra: Record<string, unknown> = {}) {
    if (!text.trim() && type === "text") return;
    
    const uid = auth.currentUser?.uid || "demo-user";
    const name = auth.currentUser?.displayName || "User";

    const newMessage = {
      senderId: uid,
      senderName: name,
      text,
      type,
      timestamp: serverTimestamp(),
      read: false,
      ...extra,
    };

    // Optimistic UI
    const tempId = Date.now().toString();
    setMessages((prev) => [...prev, { ...newMessage, id: tempId, timestamp: Timestamp.now() } as Message]);
    setInputText("");

    try {
      if (auth.currentUser) {
        await addDoc(collection(db, "chats", parcelId, "messages"), newMessage);
      }
    } catch {
      toast.error("Failed to send message");
    }
  }

  function handleSendOTP() {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    sendMessage("Delivery OTP", "otp", { otp });
    toast.success("OTP Card Sent!");
  }

  return (
    <div className="flex flex-col h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-slate-900 px-4 pt-12 pb-4 flex items-center gap-3 border-b border-slate-800">
        <button onClick={() => router.back()} className="p-2 hover:bg-slate-800 rounded-full transition-colors">
          <ArrowLeftIcon className="w-5 h-5 text-white" />
        </button>
        <div className="flex-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
            D
          </div>
          <div>
            <div className="flex items-center gap-1">
              <h1 className="text-white font-bold text-sm">Deepak (Carrier)</h1>
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            </div>
            <p className="text-slate-400 text-xs">Parcel #{parcelId}</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === (auth.currentUser?.uid || "demo-user");
          
          if (msg.type === "otp") {
            return (
              <div key={msg.id} className="flex justify-center my-4 animate-fade-in">
                <div className="bg-blue-900/40 border border-blue-500/50 rounded-2xl p-4 max-w-[85%] text-center">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <LockClosedIcon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-blue-300 font-bold mb-1">Delivery OTP</h3>
                  <p className="text-white text-3xl font-mono tracking-widest mb-2">{msg.otp}</p>
                  <p className="text-slate-400 text-[10px]">
                    Share this OTP with carrier to confirm delivery
                  </p>
                </div>
              </div>
            );
          }

          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"} animate-fade-in`}>
              <div className={isMe ? "bubble-right" : "bubble-left"}>
                <p className="text-sm">{msg.text}</p>
              </div>
              <div className="flex items-center gap-1 mt-1 px-1">
                <span className="text-[10px] text-slate-500">
                  {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {isMe && <span className="text-blue-400 text-[10px]">✓✓</span>}
              </div>
            </div>
          );
        })}
        <div ref={scrollRef} />
      </div>

      {/* Quick Replies */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-slate-800 bg-slate-900/50">
        {QUICK_REPLIES.map((reply) => (
          <button
            key={reply}
            onClick={() => sendMessage(reply)}
            className="flex-shrink-0 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-full text-xs text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
          >
            {reply}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 bg-slate-900 pb-8 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSendOTP}
            className="p-2 text-slate-400 hover:text-blue-400 transition-colors"
            title="Send Delivery OTP"
          >
            <LockClosedIcon className="w-6 h-6" />
          </button>
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage(inputText)}
              placeholder="Type a message..."
              className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 pr-10"
            />
            <PaperClipIcon className="w-5 h-5 text-slate-500 absolute right-3 top-3 cursor-pointer" />
          </div>
          <button
            onClick={() => sendMessage(inputText)}
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white disabled:opacity-50 disabled:bg-slate-700 transition-colors shadow-lg shadow-blue-600/30"
          >
            <PaperAirplaneIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
