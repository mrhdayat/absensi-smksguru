import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { formatDistanceToNow } from "date-fns";
import { id } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Bell } from "lucide-react"; // Impor Loader2 dan Bell
import { Button } from "@/components/ui/button"; // Tombol untuk trigger
export function Notifications() {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 30, // Perbarui setiap 30 detik
  });

  if (isLoading) {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications && notifications.filter(n => !n.is_read).length > 0 && (
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
              {notifications.filter(n => !n.is_read).length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <ScrollArea className="h-72">
          <div className="p-4">
            <h4 className="font-bold mb-2">Notifikasi</h4>
            {notifications?.length === 0 ? (
              <p className="text-gray-500 text-sm">Tidak ada notifikasi baru.</p>
            ) : (
              notifications?.map((notif: any) => (
                <div key={notif.id} className="border-b last:border-b-0 py-2">
                  <p className="font-semibold text-sm">{notif.title}</p>
                  <p className="text-xs text-gray-600">{notif.body}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true, locale: id })}
                  </p>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}