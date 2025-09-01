import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function AuditLogs() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['audit_logs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_activity_logs')
        .select(`
          id,
          action,
          details,
          created_at,
          profiles ( full_name, email )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Log Aktivitas</h1>
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Semua Aktivitas Pengguna</CardTitle>
        </CardHeader>
        <CardContent>
          {logs && logs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pengguna</TableHead>
                    <TableHead>Aktivitas</TableHead>
                    <TableHead>Detail</TableHead>
                    <TableHead>Waktu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log: any) => (
                    <TableRow key={log.id}>
                      <TableCell>{log.profiles.full_name}</TableCell>
                      <TableCell>{log.action.replace(/_/g, ' ').toUpperCase()}</TableCell>
                      <TableCell>{JSON.stringify(log.details)}</TableCell>
                      <TableCell>{format(new Date(log.created_at), "dd MMM yyyy HH:mm", { locale: id })}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Tidak ada log aktivitas.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}