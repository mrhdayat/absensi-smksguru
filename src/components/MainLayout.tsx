import { useEffect, useState, createContext, useContext } from "react";
import { useNavigate, Outlet, useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import Sidebar from "./Sidebar";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Notifications } from "./Notifications";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Buat context untuk data branding
const BrandingContext = createContext<any>(null);

export function useBranding() {
  return useContext(BrandingContext);
}

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [initialLoad, setInitialLoad] = useState(true);

  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['userSession'],
    queryFn: async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!session) return null;
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, full_name, avatar_url')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) throw profileError;
      return { user: session.user, role: profile.role, full_name: profile.full_name, avatar_url: profile.avatar_url };
    },
    staleTime: 1000 * 60 * 5,
  });

  const { data: brandingData, isLoading: isBrandingLoading } = useQuery({
    queryKey: ['branding_config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_sections')
        .select('content')
        .eq('section_name', 'branding')
        .single();
      
      if (error && error.code !== "PGRST116") throw error;
      
      return data?.content || { app_title: "Absensi Guru", logo_url: "", primary_color: "#0D47A1" };
    },
    staleTime: 1000 * 60 * 5,
  });
  
  useEffect(() => {
    if (!isUserLoading && !userData) {
      navigate('/login', { replace: true });
    }
  }, [userData, isUserLoading, navigate]);

  useEffect(() => {
    if (userData && !isUserLoading && initialLoad) {
      setInitialLoad(false);
      const userRole = userData.role;
      const validPaths: Record<string, string[]> = {
        super_admin: ["/super_admin", "/super_admin/teachers", "/super_admin/cms", "/super_admin/branding", "/super_admin/logs"],
        admin_tu: ["/admin_tu", "/admin_tu/dashboard", "/admin_tu/schedules", "/admin_tu/manual", "/admin_tu/guru"],
        waka_kurikulum: ["/waka_kurikulum", "/waka_kurikulum/dashboard"],
        kepala_sekolah: ["/kepala_sekolah", "/kepala_sekolah/dashboard"],
        guru: ["/guru", "/guru/dashboard", "/guru/histori", "/guru/profil"],
      };

      const basePath = `/${userRole}`;
      const currentPath = location.pathname;
      const isPathAllowed = validPaths[userRole as keyof typeof validPaths]?.some(path => currentPath.startsWith(path));

      if (currentPath === '/') {
        // Jangan redirect dari landing page
      } else if (!isPathAllowed && !currentPath.includes('login') && !currentPath.includes('scan')) {
        toast.warning("Anda tidak memiliki akses ke halaman ini.");
        navigate(`${basePath}/dashboard`, { replace: true });
      }
    }
  }, [userData, isUserLoading, location.pathname, navigate, initialLoad]);
  
  if (isUserLoading || !userData || isBrandingLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  const initials = userData.full_name?.split(' ').map((n: string) => n[0]).join('') || 'UG';

  return (
    <BrandingContext.Provider value={brandingData}>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar userRole={userData.role} />
        <div className="flex-1 flex flex-col">
          <header className="flex justify-between items-center p-4 border-b bg-white shadow-sm sticky top-0 z-10">
            <h1 className="text-lg font-semibold">{brandingData.app_title}</h1>
            <div className="flex items-center gap-4">
              <Notifications />
              <Avatar>
                <AvatarImage src={userData.avatar_url} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </div>
          </header>
          <main className="flex-1 overflow-x-hidden p-4 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </BrandingContext.Provider>
  );
}