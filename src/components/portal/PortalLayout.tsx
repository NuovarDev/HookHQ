"use client";

import { ReactNode, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Sun, Moon } from "lucide-react";

interface PortalLayoutProps {
  children: ReactNode;
  applicationName?: string;
  returnUrl?: string;
  token: string;
  theme?: "light" | "dark";
}

export default function PortalLayout({ 
  children, 
  applicationName, 
  returnUrl, 
  token,
  theme = "light"
}: PortalLayoutProps) {
  const [currentTheme, setCurrentTheme] = useState<"light" | "dark">(theme);

  useEffect(() => {
    setCurrentTheme(theme);
  }, [theme]);

  const handleBackClick = () => {
    if (returnUrl) {
      window.location.href = returnUrl;
    } else if (window.history.length > 1) {
      window.history.back();
    }
  };

  const toggleTheme = () => {
    const newTheme = currentTheme === "light" ? "dark" : "light";
    setCurrentTheme(newTheme);
    
    // Update URL with new theme parameter
    const url = new URL(window.location.href);
    url.searchParams.set("theme", newTheme);
    window.history.replaceState({}, "", url.toString());
  };

  const themeClasses = currentTheme === "dark" 
    ? "bg-gray-900 text-white border-gray-700" 
    : "bg-white text-gray-900 border-gray-200";

  const headerClasses = currentTheme === "dark"
    ? "border-b border-gray-700 bg-gray-900"
    : "border-b border-gray-200 bg-white";

  const buttonClasses = currentTheme === "dark"
    ? "text-gray-300 hover:text-white hover:bg-gray-800"
    : "text-gray-600 hover:text-gray-900";

  return (
    <div className={`min-h-screen ${themeClasses}`}>
      {/* Minimal header */}
      {applicationName && (
        <div className={headerClasses}>
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handleBackClick}
                className={buttonClasses}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {applicationName}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className={buttonClasses}
              >
                {currentTheme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content */}
      <main className="px-6">
        {children}
      </main>
    </div>
  );
}
