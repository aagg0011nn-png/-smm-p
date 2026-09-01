"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="flex items-center gap-1.5 text-sm text-ink-800/60 hover:text-red-600 dark:text-white/50 dark:hover:text-red-400"
    >
      <LogOut size={15} />
      تسجيل الخروج
    </button>
  );
}
