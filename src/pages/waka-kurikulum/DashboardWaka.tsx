import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardWaka() {
  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <h1 className="text-3xl font-bold">Dashboard Waka Kurikulum</h1>
      <p className="text-gray-500">Analitik dan laporan absensi mendalam.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Laporan Absensi per Guru</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              [Tabel atau grafik yang dapat difilter per guru, tanggal, dan status akan ditampilkan di sini]
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Statistik Per Mata Pelajaran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              [Analitik absensi yang dikelompokkan berdasarkan mata pelajaran akan ditampilkan di sini]
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Tingkat Ketidakhadiran</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              [Tabel dan grafik yang menunjukkan guru dengan tingkat ketidakhadiran tertinggi akan ditampilkan di sini]
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}