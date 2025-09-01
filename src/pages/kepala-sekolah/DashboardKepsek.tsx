import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default function DashboardKepsek() {
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['summary_data'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data: totalTeachers, error: teachersError } = await supabase
        .from('teachers')
        .select('*', { count: 'exact' });
      if (teachersError) throw teachersError;
      
      const { data: attendanceSummary, error: attendanceError } = await supabase
        .from('attendance')
        .select('status', { count: 'exact' })
        .eq('date', today);
      if (attendanceError) throw attendanceError;
      
      const hadirCount = attendanceSummary.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length;
      const alphaCount = attendanceSummary.filter(a => a.status === 'Alfa').length;
      
      return {
        totalTeachers: totalTeachers.length,
        hadir: hadirCount,
        alpha: alphaCount,
        belumAbsen: (totalTeachers.length || 0) - (attendanceSummary.length || 0)
      };
    },
    staleTime: 1000 * 60,
  });

  const formattedDate = format(new Date(), "EEEE, dd MMMM yyyy", { locale: id });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }
  
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Dashboard Kepala Sekolah</h1>
      <p className="text-gray-500">Ringkasan absensi harian: {formattedDate}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Guru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summaryData?.totalTeachers || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Hadir Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{summaryData?.hadir || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Alfa Hari Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{summaryData?.alpha || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-medium">Belum Absen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{summaryData?.belumAbsen || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Ringkasan Keterlambatan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              [Grafik atau tabel ringkasan guru paling sering terlambat akan ditampilkan di sini]
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tren Absensi Bulanan</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              [Grafik batang atau garis untuk tren absensi bulanan akan ditampilkan di sini]
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}