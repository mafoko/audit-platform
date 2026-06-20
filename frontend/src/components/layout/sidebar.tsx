"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  FileCheck,
  AlertTriangle,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/engagements", label: "Engagements", icon: Briefcase },
  { href: "/evidence", label: "Evidence Requests", icon: FileCheck },
  { href: "/findings", label: "Findings", icon: AlertTriangle },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "AU";

  return (
    <div
      className={cn(
        "relative flex flex-col border-r bg-slate-900 text-slate-100 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-slate-700 px-4">
        <Shield className="h-7 w-7 shrink-0 text-blue-400" />
        {!collapsed && (
          <span className="ml-3 text-lg font-bold text-white">AuditFlow</span>
        )}
      </div>

      {/* Toggle button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-20 z-10 flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
      >
        {collapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      {/* Nav items */}
      <nav className="flex-1 space-y-1 p-3 pt-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn("h-5 w-5 shrink-0", !collapsed && "mr-3")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      <div className={cn("border-t border-slate-700 p-3", collapsed && "flex justify-center")}>
        <div className={cn("flex items-center", !collapsed && "space-x-3")}>
          <Avatar className="h-8 w-8 shrink-0 bg-blue-500">
            <AvatarFallback className="bg-blue-600 text-xs text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {user?.full_name || "Auditor"}
              </p>
              <p className="truncate text-xs text-slate-400">{user?.role || "User"}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
