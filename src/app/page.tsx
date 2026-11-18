"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getDefaultLandingRoute } from "@/lib/api";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(getDefaultLandingRoute(user));
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FFFDEE]">
      <div className="h-9 w-9 animate-spin rounded-full border-4 border-[#D4E4DC] border-t-[#076653]" />
    </div>
  );
}
