import ThemeTogglerTwo from "@/components/common/ThemeTogglerTwo";
import Link from "next/link";
import Image from "next/image";
import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex w-full h-screen bg-white dark:bg-gray-900">
      {/* Left side - Auth form only */}
      <div className="flex flex-col items-center justify-center w-full lg:w-1/2 px-6 py-12">
        {children}
      </div>

      {/* Right side - Background image with rounded corners and branding */}
      <div className="hidden lg:flex lg:w-1/2 p-6">
        <div 
          className="relative w-full h-full rounded-3xl bg-cover bg-center bg-no-repeat shadow-2xl overflow-hidden"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1642615835477-d303d7dc9ee9?w=2160&q=80')",
          }}
        >
          {/* Branding overlay - centered on image */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="flex flex-col items-center text-center px-6">
              <Link href="/" className="mb-6">
                <div className="flex items-center gap-4 backdrop-blur-md bg-white/10 px-8 py-5 rounded-2xl border border-white/20 shadow-2xl hover:bg-white/15 transition-all duration-300">
                  <div className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg">
                    <Image
                      src="/logo/logo.png"
                      alt="TeamSync Logo"
                      width={56}
                      height={56}
                      className="w-full h-full object-contain rounded-xl"
                      priority
                    />
                  </div>
                  <span className="text-5xl font-bold text-white drop-shadow-2xl tracking-tight font-serif">
                    TeamSync
                  </span>
                </div>
              </Link>
              <p className="text-xl text-white/95 drop-shadow-lg max-w-md font-medium mt-4">
                Multi-organization team management platform
              </p>
            </div>
          </div>

          {/* Subtle gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/10" />
        </div>
      </div>

      {/* Theme toggle button */}
      <div className="fixed bottom-6 right-6 z-50">
        <ThemeTogglerTwo />
      </div>
    </div>
  );
}

