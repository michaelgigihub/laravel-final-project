import * as React from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = React.useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Toggle theme"
    className={`relative w-12 h-7 rounded-full transition-colors duration-200 focus:outline-none cursor-pointer ${theme === "dark" ? "bg-zinc-900" : "bg-zinc-100"}`}
    >
      <span
        className={`absolute top-1 left-1 flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-200 ${theme === "dark" ? "translate-x-5 bg-black" : "translate-x-0 bg-white"}`}
      >
        {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
      </span>
    </button>
  );
}
