"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  ArchiveBoxIcon,
  PlusCircleIcon,
  CurrencyRupeeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import {
  HomeIcon as HomeIconSolid,
  ArchiveBoxIcon as ArchiveBoxIconSolid,
  CurrencyRupeeIcon as CurrencyRupeeIconSolid,
  UserCircleIcon as UserCircleIconSolid,
} from "@heroicons/react/24/solid";

interface BottomNavProps {
  unreadCount?: number;
}


import { useAuth } from "@/hooks/useAuth";

export default function BottomNav({ unreadCount = 0 }: BottomNavProps) {
  const pathname = usePathname();
  const { userProfile } = useAuth();
  const role = userProfile?.role || "carrier";

  const tabs = [
    { href: "/dashboard", label: "Home", Icon: HomeIcon, IconSolid: HomeIconSolid },
    { 
      href: "/deliveries", 
      label: role === "carrier" ? "My Jobs" : "My Parcels", 
      Icon: ArchiveBoxIcon, 
      IconSolid: ArchiveBoxIconSolid 
    },
    { 
      href: role === "carrier" ? "/deliveries" : "/post-parcel", 
      label: role === "carrier" ? "Find" : "Post", 
      Icon: role === "carrier" ? ArchiveBoxIcon : PlusCircleIcon, 
      IconSolid: role === "carrier" ? ArchiveBoxIconSolid : PlusCircleIcon, 
      special: true 
    },
    { href: "/earnings", label: "Earnings", Icon: CurrencyRupeeIcon, IconSolid: CurrencyRupeeIconSolid },
    { href: "/profile", label: "Profile", Icon: UserCircleIcon, IconSolid: UserCircleIconSolid },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-50">
      <div className="flex items-center justify-around px-2 py-2 pb-safe">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href;
          const IconComp = isActive ? tab.IconSolid : tab.Icon;

          if (tab.special) {
            return (
              <Link key={tab.href + tab.label} href={tab.href} className="flex flex-col items-center">
                <div className="w-14 h-14 -mt-5 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/40 border-4 border-slate-900">
                  <IconComp className="w-7 h-7 text-white" />
                </div>
                <span className="text-[10px] text-blue-400 mt-0.5 font-medium">{tab.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 min-w-[52px] py-1 relative"
            >
              <div className="relative">
                <IconComp className={`w-6 h-6 ${isActive ? "text-blue-500" : "text-slate-500"}`} />
                {tab.label.includes("Job") && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? "text-blue-500" : "text-slate-500"}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-500 rounded-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
