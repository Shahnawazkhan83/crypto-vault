import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface DarkModeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create context with default values
const DarkModeContext = createContext<DarkModeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

// Custom hook to use the dark mode context
export const useDarkMode = () => useContext(DarkModeContext);

// Provider component
export const DarkModeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Check for saved theme in localStorage or use system preference
  const getSavedTheme = (): Theme => {
    if (typeof window === "undefined") return "light";

    const savedTheme = localStorage.getItem("theme") as Theme | null;

    if (savedTheme && (savedTheme === "dark" || savedTheme === "light")) {
      return savedTheme;
    }

    // Check system preference
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return "dark";
    }

    return "light";
  };

  const [theme, setTheme] = useState<Theme>(getSavedTheme);

  // Apply theme class to <html> element
  useEffect(() => {
    const htmlElement = document.documentElement;

    if (theme === "dark") {
      htmlElement.classList.add("dark");
    } else {
      htmlElement.classList.remove("dark");
    }

    // Save to localStorage
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const handleChange = () => {
      const savedTheme = localStorage.getItem("theme") as Theme | null;
      // Only auto switch if no preference was explicitly saved
      if (!savedTheme) {
        setTheme(mediaQuery.matches ? "dark" : "light");
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  // Toggle theme function
  const toggleTheme = () => {
    setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
  };

  return (
    <DarkModeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </DarkModeContext.Provider>
  );
};
