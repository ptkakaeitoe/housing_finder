"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const linksByRole = {
  student: [
    { label: "Dashboard", href: "/student" },
    { label: "Explore", href: "/explore" },
    { label: "Appointments", href: "/appointments" },
    { label: "Profile", href: "/profile" },
  ],
  landlord: [
    { label: "Dashboard", href: "/landlord" },
    { label: "My Listings", href: "/listings" },
    { label: "Appointments", href: "/landlord-appointments" },
    { label: "Verification", href: "/landlord-verification" },
    { label: "Profile", href: "/landlord-profile" },
  ],
  admin: [
    { label: "Dashboard", href: "/admin" },
    { label: "Verifications", href: "/admin-verifications" },
    { label: "Users", href: "/users" },
    { label: "Listings", href: "/manage-listings" },
    { label: "Reports", href: "/reports" },
  ],
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  return <aside className="w-full shrink-0 border-b border-line bg-surface px-4 py-3 lg:min-h-[calc(100vh-72px)] lg:w-60 lg:border-r lg:border-b-0 lg:p-5">
    <div className="mb-6 hidden items-center gap-3 border-b border-line pb-5 lg:flex">
      <span className="flex size-9 items-center justify-center rounded-lg bg-ink font-bold text-canvas">H</span>
      <span className="text-sm font-bold text-ink">Workspace</span>
    </div>
    <nav aria-label={`${role} navigation`} className="flex gap-1 overflow-x-auto lg:flex-col">
      {(linksByRole[role] ?? []).map((link) => {
        const active = pathname === link.href;
        return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined}
          className={`shrink-0 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${active ? "bg-surface-muted text-accent" : "text-ink hover:bg-surface-muted"}`}>
          {link.label}
        </Link>;
      })}
    </nav>
  </aside>;
}
