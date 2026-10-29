import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Package,
  Tags,
  Truck,
  ClipboardList,
  FileCheck2,
  FileSignature,
  Users,
  ShieldCheck,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useMe, useMyPermissions } from "../../queries/account";
import { signOut } from "../../lib/auth";
import { BrandWordmark } from "../brand-wordmark";

// `permission` gates a nav item from view for roles that don't hold it — a
// sales or content_editor admin should never even see "Suppliers" in the
// sidebar, since they'd only get a 403 wall from every action on that page.
// Items without `permission` are visible to every admin.
const NAV: { label: string; href: string; icon: typeof LayoutDashboard; permission?: string }[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Orders", href: "/admin/orders", icon: ClipboardList, permission: "manage_orders" },
  { label: "Design Reviews", href: "/admin/design-reviews", icon: FileCheck2, permission: "manage_design_reviews" },
  { label: "RFQs", href: "/admin/rfqs", icon: FileSignature, permission: "manage_rfqs" },
  { label: "Products", href: "/admin/products", icon: Package },
  { label: "Categories", href: "/admin/categories", icon: Tags, permission: "manage_categories" },
  { label: "Suppliers", href: "/admin/suppliers", icon: Truck, permission: "manage_suppliers" },
  { label: "Customers", href: "/admin/customers", icon: Users, permission: "manage_customers" },
  { label: "Roles & Permissions", href: "/admin/roles", icon: ShieldCheck, permission: "manage_admins" },
];

export function AdminLayout({ title, children }: { title: string; children: ReactNode }) {
  const [location, navigate] = useLocation();
  const [open, setOpen] = useState(false);
  const { data: me } = useMe();
  const { data: permissions } = useMyPermissions();
  const visibleNav = NAV.filter((item) => !item.permission || (permissions ?? []).includes(item.permission));

  useEffect(() => setOpen(false), [location]);

  async function handleSignOut() {
    await signOut();
    navigate("/admin/login");
  }

  return (
    <div className="min-h-[100svh] bg-[#0b1f3a] text-white">
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0b1f3a]/95 px-4 py-3 backdrop-blur-xl md:hidden">
        <Link href="/admin" className="h-7 w-28">
          <BrandWordmark className="h-7 w-28" />
        </Link>
        <button type="button" onClick={() => setOpen(!open)} className="rounded-lg p-2 text-white/70 hover:bg-white/10">
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`${
            open ? "flex" : "hidden"
          } fixed inset-x-0 top-[49px] z-30 h-[calc(100svh-49px)] w-full flex-col overflow-y-auto border-r border-white/10 bg-[#0b1f3a] p-4 md:static md:top-0 md:flex md:h-[100svh] md:w-64 md:shrink-0`}
        >
          <Link href="/admin" className="mb-8 hidden h-8 w-32 md:block">
            <BrandWordmark className="h-8 w-32" />
          </Link>
          <nav className="flex flex-1 flex-col gap-1">
            {visibleNav.map((item) => {
              const active = item.href === "/admin" ? location === "/admin" : location.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    active ? "bg-[#FF6B00]/15 text-[#FF8A3D]" : "text-[#B9C2D0] hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon size={17} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="mt-6 border-t border-white/10 pt-4">
            <p className="truncate text-xs font-semibold text-white">{me?.name}</p>
            <p className="truncate text-xs text-white/40">{me?.email}</p>
            <button
              type="button"
              onClick={handleSignOut}
              className="mt-3 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#B9C2D0] hover:bg-white/5 hover:text-white"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>
        </aside>

        <main className="min-h-[100svh] flex-1 px-4 py-8 md:px-10 md:py-10">
          <h1 className="font-display mb-6 text-2xl font-extrabold text-white">{title}</h1>
          {children}
        </main>
      </div>
    </div>
  );
}
