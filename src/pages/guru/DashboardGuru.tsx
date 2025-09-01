import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardGuru() {
  const { data: userData, isLoading: isUserLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("User not authenticated");

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          full_name,
          email,
          avatar_url,
          teachers ( nip )
        `)
        .eq('id', user.id)
        .single();
      
      if (profileError) throw profileError;
      return { ...profile, id: user.id };
    },
  });

  const { data: attendanceData, isLoading: isAttendanceLoading } = useQuery({
    queryKey: ['guruAttendance'],
    queryFn: async () => {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('teacher_id', user.id)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  if (isUserLoading || isAttendanceLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  if (!userData) {
    return <p>Data pengguna tidak ditemukan.</p>;
  }

  // Perbaikan: Akses nip dari array teachers
  const nip = userData.teachers && userData.teachers.length > 0 ? userData.teachers[0].nip : '-';

  return (
    <div className="p-6 md:p-8 flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Avatar className="h-20 w-20">
          <AvatarImage src={userData.avatar_url || `https://ui-avatars.com/api/?name=${userData.full_name}`} />
          <AvatarFallback>{userData.full_name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold">{userData.full_name}</h1>
          <p className="text-gray-500">{userData.email}</p>
          <p className="text-gray-500">NIP: {nip}</p>
        </div>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Riwayat Absensi Saya</CardTitle>
          <CardDescription>Daftar absensi Anda yang tercatat di sistem.</CardDescription>
        </CardHeader>
        <CardContent>
          {attendanceData && attendanceData.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Jam Masuk</TableHead>
                  <TableHead>Jam Pulang</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendanceData.map((absent: any) => (
                  <TableRow key={absent.id}>
                    <TableCell>{format(new Date(absent.date), "dd MMMM yyyy", { locale: id })}</TableCell>
                    <TableCell>{absent.time_in ? format(new Date(absent.time_in), "HH:mm") : '-'}</TableCell>
                    <TableCell>{absent.time_out ? format(new Date(absent.time_out), "HH:mm") : '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold
                        ${absent.status === 'Hadir' && 'bg-green-100 text-green-800'}
                        ${absent.status === 'Terlambat' && 'bg-yellow-100 text-yellow-800'}
                        ${absent.status === 'Izin' && 'bg-blue-100 text-blue-800'}
                        ${absent.status === 'Sakit' && 'bg-red-100 text-red-800'}
                        ${absent.status === 'Alfa' && 'bg-gray-100 text-gray-800'}
                      `}>
                        {absent.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-gray-500">Belum ada riwayat absensi.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}