import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface RecentAbsencesProps {
  attendanceData: any[] | null;
  isLoading: boolean;
}

export function RecentAbsences({ attendanceData, isLoading }: RecentAbsencesProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Absensi Terbaru</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-center">Memuat data...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Guru</TableHead>
                <TableHead>Jam Masuk</TableHead>
                <TableHead>Jam Pulang</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendanceData?.map((absent: any) => (
                <TableRow key={absent.id}>
                  <TableCell>{absent.teachers?.profiles?.full_name}</TableCell>
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
        )}
      </CardContent>
    </Card>
  );
}