import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pencil, Trash2 } from "lucide-react";

const scheduleSchema = z.object({
  id: z.number().optional(),
  teacher_id: z.string().min(1, "Nama guru wajib diisi."),
  day_of_week: z.string().min(1, "Hari wajib diisi."),
  start_time: z.string().min(1, "Waktu mulai wajib diisi."),
  end_time: z.string().min(1, "Waktu selesai wajib diisi."),
});

type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const daysOfWeek = [
  { value: 1, label: "Senin" },
  { value: 2, label: "Selasa" },
  { value: 3, label: "Rabu" },
  { value: 4, label: "Kamis" },
  { value: 5, label: "Jumat" },
  { value: 6, label: "Sabtu" },
  { value: 7, label: "Minggu" },
];

export default function ManageSchedules() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      teacher_id: "",
      day_of_week: "1",
      start_time: "07:00",
      end_time: "08:00",
    },
  });

  const { data: schedules, isLoading } = useQuery({
    queryKey: ['teaching_schedules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teaching_schedules')
        .select(`
          *,
          teachers (
            profiles (full_name)
          )
        `);

      if (error) throw error;
      return data;
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers_list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, profiles (full_name)');
      if (error) throw error;
      return data;
    },
  });

  const createScheduleMutation = useMutation({
    mutationFn: async (newSchedule: ScheduleFormValues) => {
      const { error } = await supabase.from('teaching_schedules').insert({
        teacher_id: newSchedule.teacher_id,
        day_of_week: parseInt(newSchedule.day_of_week),
        start_time: newSchedule.start_time + ':00+08',
        end_time: newSchedule.end_time + ':00+08',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching_schedules'] });
      toast.success("Jadwal berhasil ditambahkan!");
      setOpenDialog(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menambahkan jadwal.");
    },
  });

  const updateScheduleMutation = useMutation({
    mutationFn: async (updatedSchedule: ScheduleFormValues) => {
      const { error } = await supabase
        .from('teaching_schedules')
        .update({
          teacher_id: updatedSchedule.teacher_id,
          day_of_week: parseInt(updatedSchedule.day_of_week),
          start_time: updatedSchedule.start_time + ':00+08',
          end_time: updatedSchedule.end_time + ':00+08',
        })
        .eq('id', updatedSchedule.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching_schedules'] });
      toast.success("Jadwal berhasil diperbarui!");
      setOpenDialog(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err.message || "Gagal memperbarui jadwal.");
    },
  });

  const deleteScheduleMutation = useMutation({
    mutationFn: async (scheduleId: number) => {
      const { error } = await supabase.from('teaching_schedules').delete().eq('id', scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teaching_schedules'] });
      toast.success("Jadwal berhasil dihapus!");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menghapus jadwal.");
    },
  });

  const onSubmit = (values: ScheduleFormValues) => {
    if (editingSchedule) {
      updateScheduleMutation.mutate({ ...values, id: editingSchedule.id });
    } else {
      createScheduleMutation.mutate(values);
    }
  };

  const handleEditClick = (schedule: any) => {
    setEditingSchedule(schedule);
    form.reset({
      teacher_id: schedule.teacher_id,
      day_of_week: String(schedule.day_of_week),
      start_time: schedule.start_time.slice(0, 5),
      end_time: schedule.end_time.slice(0, 5),
    });
    setOpenDialog(true);
  };
  
  const handleDeleteClick = (scheduleId: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
      deleteScheduleMutation.mutate(scheduleId);
    }
  };

  const getDayLabel = (value: number) => {
    return daysOfWeek.find(d => d.value === value)?.label || '';
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Jadwal Mengajar</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingSchedule(null); form.reset(); }}>Tambah Jadwal</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingSchedule ? "Edit Jadwal" : "Tambah Jadwal Baru"}</DialogTitle>
              <DialogDescription>
                {editingSchedule ? "Perbarui jadwal mengajar guru." : "Tambahkan jadwal mengajar untuk guru honorer."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="teacher_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Guru</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih guru" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachers?.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>{t.profiles.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="day_of_week"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hari</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih hari" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {daysOfWeek.map(day => (
                            <SelectItem key={day.value} value={String(day.value)}>{day.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="start_time"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Waktu Mulai</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="end_time"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Waktu Selesai</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createScheduleMutation.isPending || updateScheduleMutation.isPending}
                >
                  {createScheduleMutation.isPending || updateScheduleMutation.isPending ? "Memproses..." : editingSchedule ? "Simpan Perubahan" : "Tambah Jadwal"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Jadwal Mengajar</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center">Memuat data jadwal...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Guru</TableHead>
                    <TableHead>Hari</TableHead>
                    <TableHead>Waktu Mulai</TableHead>
                    <TableHead>Waktu Selesai</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules?.map((schedule: any) => (
                    <TableRow key={schedule.id}>
                      <TableCell>{schedule.teachers?.profiles?.full_name}</TableCell>
                      <TableCell>{getDayLabel(schedule.day_of_week)}</TableCell>
                      <TableCell>{schedule.start_time.slice(0, 5)}</TableCell>
                      <TableCell>{schedule.end_time.slice(0, 5)}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(schedule)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(schedule.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}