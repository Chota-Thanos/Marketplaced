"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-9 h-9"></div>;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-2 rounded-pill hover:bg-inverse transition-colors"
      aria-label="Toggle Theme"
    >
      {theme === "dark" ? <Sun size={20} className="text-ink-subtle" /> : <Moon size={20} className="text-ink-muted" />}
    </button>
  );
}
