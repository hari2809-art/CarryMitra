"use client";
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import BottomNav from "@/components/BottomNav";
import { CurrencyRupeeIcon, ArrowUpRightIcon, ArrowDownLeftIcon } from "@heroicons/react/24/solid";

interface Transaction {
  id: string;
  parcelId: string;
  amount: number;
  type: "credit" | "debit";
  date: unknown;
  status: string;
}

const DEMO_TRANSACTIONS: Transaction[] = [
  { id: "t1", parcelId: "CM5421", amount: 450, type: "credit", date: new Date(), status: "Paid to Bank" },
  { id: "t2", parcelId: "CM8832", amount: 320, type: "credit", date: new Date(Date.now() - 86400000), status: "Paid to Bank" },
  { id: "t3", parcelId: "CM1109", amount: 180, type: "credit", date: new Date(Date.now() - 172800000), status: "Paid to Bank" },
  { id: "t4", parcelId: "CM9920", amount: 550, type: "credit", date: new Date(Date.now() - 259200000), status: "Paid to Bank" },
  { id: "t5", parcelId: "CM4401", amount: 250, type: "credit", date: new Date(Date.now() - 345600000), status: "Paid to Bank" },
];

export default function EarningsPage() {
  const [stats, setStats] = useState({
    total: 4250,
    week: 1850,
    today: 450,
    avg: 185,
  });
  const [transactions, setTransactions] = useState<Transaction[]>(DEMO_TRANSACTIONS);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "transactions"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const txs = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Transaction[];
        setTransactions(txs);
        
        // Calculate stats
        const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
        setStats({
          total,
          week: total * 0.4, // Mock calculation
          today: txs[0]?.amount || 0,
          avg: Math.round(total / txs.length)
        });
      }
    });

    return unsubscribe;
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 px-5 py-12 pb-nav">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <CurrencyRupeeIcon className="w-8 h-8 text-green-500" />
          My Earnings
        </h1>
        <p className="text-slate-400 text-sm mt-1">Real-time revenue tracking</p>
      </div>

      {/* Main Stats */}
      <div className="glass-card bg-gradient-to-br from-blue-600/20 to-indigo-600/10 p-6 mb-6 border-blue-500/30">
        <p className="text-blue-300 text-xs font-bold uppercase tracking-widest mb-1">Total Balance</p>
        <h2 className="text-4xl font-black text-white">₹{stats.total.toLocaleString()}</h2>
        <div className="flex gap-4 mt-6">
          <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors">
            Withdraw to Bank
          </button>
          <button className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl text-xs font-bold transition-colors border border-slate-700">
            View Policy
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="glass-card p-4">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">This Week</p>
          <p className="text-xl font-bold text-white">₹{stats.week.toLocaleString()}</p>
          <span className="text-green-500 text-[10px] flex items-center gap-0.5 mt-1">
            <ArrowUpRightIcon className="w-2.5 h-2.5" /> +12% vs last
          </span>
        </div>
        <div className="glass-card p-4">
          <p className="text-slate-500 text-[10px] font-bold uppercase mb-1">Avg per Job</p>
          <p className="text-xl font-bold text-white">₹{stats.avg.toLocaleString()}</p>
          <span className="text-slate-400 text-[10px] flex items-center gap-0.5 mt-1">
            Across {transactions.length} deliveries
          </span>
        </div>
      </div>

      {/* Transactions List */}
      <div>
        <h3 className="text-white font-bold text-sm mb-4">Recent Transactions</h3>
        <div className="space-y-3">
          {transactions.map((tx) => (
            <div key={tx.id} className="glass-card p-4 flex items-center gap-4 animate-fade-in card-hover">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                tx.type === "credit" ? "bg-green-600/20 text-green-500" : "bg-red-600/20 text-red-500"
              }`}>
                {tx.type === "credit" ? <ArrowDownLeftIcon className="w-5 h-5" /> : <ArrowUpRightIcon className="w-5 h-5" />}
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-bold">Parcel #{tx.parcelId}</p>
                <p className="text-slate-500 text-[10px]">
                  {tx.date instanceof Date ? tx.date.toLocaleDateString() : "Today"} · {tx.status}
                </p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-black ${tx.type === "credit" ? "text-green-400" : "text-red-400"}`}>
                  {tx.type === "credit" ? "+" : "-"} ₹{tx.amount}
                </p>
                <span className="text-slate-600 text-[10px]">Success</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
