"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { usePathname } from "next/navigation";

function getTitleFromPath(pathname: string): string {
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.includes("/evidence")) return "Evidence Requests";
  if (pathname.includes("/findings")) return "Findings";
  if (pathname.includes("/report")) return "Report";
  if (pathname.includes("/controls")) return "Controls";
  if (pathname.startsWith("/engagements/new")) return "New Engagement";
  if (pathname.startsWith("/engagements/")) return "Engagement Details";
  if (pathname.startsWith("/engagements")) return "Engagements";
  if (pathname.startsWith("/findings")) return "Findings";
  if (pathname.startsWith("/evidence")) return "Evidence Requests";
  if (pathname.startsWith("/reports")) return "Reports";
  if (pathname.startsWith("/settings")) return "Settings";
  return "AuditFlow";
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!localStorage.getItem("token")) router.replace("/login");
  }, [router]);

  const title = getTitleFromPath(pathname);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header title={title} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
