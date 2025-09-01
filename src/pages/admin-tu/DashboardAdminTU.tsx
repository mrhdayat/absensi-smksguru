import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { RecentAbsences } from "./RecentAbsences";
import { ManualInputForm } from "./ManualInputForm";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function DashboardAdminTU() {
  const [date] = useState(new Date());

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', date.toISOString().split('T')[0]],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          teachers (
            profiles (full_name)
          )
        `)
        .eq('date', date.toISOString().split('T')[0]);

      if (error) throw error;
      return data;
    },
  });
  
  const formattedDate = format(date, "EEEE, dd MMMM yyyy", { locale: id });

  const handleExport = async () => {
    try {
        const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/export/xlsx`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    from_date: new Date().toISOString().split('T')[0],
                    to_date: new Date().toISOString().split('T')[0]
                }),
            }
        );

        if (!response.ok) {
            throw new Error("Gagal mengunduh file.");
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Absensi_Guru_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        console.error("Export error:", error);
        alert(error.message);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8 lg:p-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Admin TU</h1>
          <p className="text-gray-500">Ringkasan absensi guru hari ini: {formattedDate}</p>
        </div>
        <Button onClick={handleExport}>Export XLSX</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Guru Hadir</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : attendanceData?.filter(a => a.status === 'Hadir' || a.status === 'Terlambat').length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Belum Absen</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : '...'}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sakit/Izin/Alfa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : attendanceData?.filter(a => ['Sakit', 'Izin', 'Alfa'].includes(a.status)).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentAbsences attendanceData={attendanceData ?? null} isLoading={isLoading} />
        <ManualInputForm />
      </div>
    </div>
  );
}