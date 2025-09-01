import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

// Navigasi untuk setiap peran
const navigation = {
  super_admin: [
    { name: "Manajemen Guru", href: "/super_admin/teachers" },
    { name: "Pengaturan CMS", href: "/super_admin/cms" },
    { name: "Pengaturan Merek", href: "/super_admin/branding" },
    { name: "Log Aktivitas", href: "/super_admin/logs" },
  ],
  admin_tu: [
    { name: "Dashboard", href: "/admin_tu/dashboard" },
    { name: "Input Manual", href: "/admin_tu/manual" },
    { name: "Manajemen Jadwal", href: "/admin_tu/schedules" },
    { name: "Manajemen Guru", href: "/admin_tu/guru" },
  ],
  waka_kurikulum: [
    { name: "Dashboard", href: "/waka_kurikulum/dashboard" }, // Diperbarui
    { name: "Laporan & Analitik", href: "/waka_kurikulum/laporan" },
    { name: "Tren Absensi", href: "/waka_kurikulum/tren" },
  ],
  kepala_sekolah: [
    { name: "Dashboard", href: "/kepala_sekolah/dashboard" }, // Diperbarui
    { name: "Ringkasan KPI", href: "/kepala_sekolah/ringkasan" },
    { name: "Grafik & Laporan", href: "/kepala_sekolah/grafik" },
  ],
  guru: [
    { name: "Dashboard", href: "/guru/dashboard" }, // Diperbarui
    { name: "Riwayat Absensi", href: "/guru/histori" },
    { name: "Profil Saya", href: "/guru/profil" },
  ],
};

export default function Sidebar({ userRole }: { userRole: string }) {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  // Jika tidak ada peran, tidak tampilkan menu
  if (!navigation[userRole as keyof typeof navigation]) {
    return null;
  }
  
  const navItems = navigation[userRole as keyof typeof navigation];

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden md:block w-64 bg-slate-900 text-white min-h-screen p-4 sticky top-0">
        <div className="flex flex-col h-full">
          <div className="flex-1 space-y-2">
            <h2 className="text-xl font-bold mb-6">Absensi</h2>
            {navItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                  location.pathname === item.href
                    ? "bg-slate-800 font-semibold"
                    : "hover:bg-slate-700"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
          <div className="mt-auto pt-4 border-t border-slate-700">
            <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-700" onClick={() => supabase.auth.signOut()}>
              Keluar
            </Button>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      <header className="md:hidden sticky top-0 bg-white shadow-sm z-50 p-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 bg-slate-900 text-white">
            <div className="flex flex-col h-full p-4">
              <div className="flex-1 space-y-2">
                <h2 className="text-xl font-bold mb-6">Absensi</h2>
                {navItems.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center gap-2 p-2 rounded-md transition-colors ${
                      location.pathname === item.href
                        ? "bg-slate-800 font-semibold"
                        : "hover:bg-slate-700"
                    }`}
                    onClick={() => setOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
              <div className="mt-auto pt-4 border-t border-slate-700">
                <Button variant="ghost" className="w-full justify-start text-white hover:bg-slate-700" onClick={() => supabase.auth.signOut()}>
                  Keluar
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </header>
    </>
  );
}