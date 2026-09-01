"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

const options = [
  { value: "light", icon: Sun, label: "فاتح" },
  { value: "dark", icon: Moon, label: "داكن" },
  { value: "system", icon: Monitor, label: "النظام" },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="h-9 w-28" />;

  return (
    <div className="flex items-center gap-1 rounded-lg border border-black/10 p-1 dark:border-white/10">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          aria-label={label}
          aria-pressed={theme === value}
          className={`rounded-md p-1.5 transition-colors ${
            theme === value ? "bg-brand-500 text-white" : "text-ink-800/60 hover:bg-black/5 dark:text-white/60 dark:hover:bg-white/10"
          }`}
        >
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}
