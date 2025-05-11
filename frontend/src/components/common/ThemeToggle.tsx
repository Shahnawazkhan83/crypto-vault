import React from "react";
import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useDarkMode } from "../../contexts/DarkModeProvider";

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useDarkMode();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-full p-1.5 text-slate-400 hover:text-slate-500 dark:text-slate-300 dark:hover:text-slate-200 
               hover:bg-slate-100 dark:hover:bg-dark-700 transition-colors relative
               focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-dark-800"
      aria-label={
        theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
      }
    >
      <span className="sr-only">
        {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      </span>

      {theme === "dark" ? (
        <SunIcon
          className="h-5 w-5 transition-transform duration-300 ease-in-out"
          aria-hidden="true"
        />
      ) : (
        <MoonIcon
          className="h-5 w-5 transition-transform duration-300 ease-in-out"
          aria-hidden="true"
        />
      )}
    </button>
  );
};

export default ThemeToggle;
