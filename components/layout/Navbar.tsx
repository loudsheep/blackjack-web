"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();

  const links = [
    { href: "/", label: "Home" },
    { href: "/create", label: "Create Table" },
    { href: "/join", label: "Join Table" },
    { href: "/about", label: "About" },
  ];

  return (
    <header className="fixed top-0 w-full z-50 flex items-center justify-between px-4 sm:px-8 py-3 glass-panel border-b border-white/5 backdrop-blur-md bg-background-dark/80">
      <div className="flex items-center gap-4">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="bg-primary p-1.5 rounded-lg shrink-0 group-hover:scale-105 transition-transform duration-300">
            <span className="material-symbols-outlined text-background-dark font-bold">playing_cards</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black tracking-tight text-white uppercase italic hidden sm:block group-hover:text-primary transition-colors duration-300">
            VIP Blackjack
          </h2>
        </Link>
      </div>

      <nav className="flex items-center gap-4 sm:gap-6">
        {links.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                isActive
                  ? "text-primary drop-shadow-[0_0_8px_rgba(13,242,128,0.5)]"
                  : "text-white/60 hover:text-white"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
