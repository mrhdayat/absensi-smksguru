import { useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Impor CardDescription
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const manualInputSchema = z.object({
  teacher_id: z.string().min(1, { message: "Nama guru wajib diisi." }),
  date: z.string().refine(val => !isNaN(new Date(val).getTime()), "Tanggal tidak valid."),
  time: z.string().min(1, { message: "Waktu wajib diisi." }),
  status: z.enum(["Hadir", "Izin", "Sakit", "Alfa"]),
  comment: z.string().optional(),
});

type ManualInputFormValues = z.infer<typeof manualInputSchema>;

export function ManualInputForm() {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);

  const form = useForm<ManualInputFormValues>({
    resolver: zodResolver(manualInputSchema),
    defaultValues: {
      teacher_id: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      status: "Hadir",
      comment: "",
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

  async function onSubmit(values: ManualInputFormValues) {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('attendance')
        .upsert({
          teacher_id: values.teacher_id,
          date: values.date,
          time_in: `${values.date}T${values.time}:00+08:00`,
          status: values.status,
          source: 'manual',
          comment: values.comment || '',
          edited_by: user?.id,
          edited_at: new Date().toISOString(),
        });
        
      if (error) {
        throw error;
      }
      
      await supabase.from('user_activity_logs').insert({
          user_id: user?.id,
          action: 'manual_attendance_input',
          details: { teacher_id: values.teacher_id, date: values.date, status: values.status }
      });

      toast.success("Absensi manual berhasil disimpan!");
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['attendance'] }); // Perbarui data di dashboard
    } catch (error: any) {
      toast.error(error.message || "Gagal menyimpan absensi manual.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Input Absensi Manual</CardTitle>
        <CardDescription>Oleh Admin TU. Digunakan untuk kasus khusus.</CardDescription>
      </CardHeader>
      <CardContent>
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tanggal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Waktu</FormLabel>
                  <FormControl>
                    <Input type="time" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <select {...field} className="block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500">
                      <option value="Hadir">Hadir</option>
                      <option value="Izin">Izin</option>
                      <option value="Sakit">Sakit</option>
                      <option value="Alfa">Alfa</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Keterangan (Opsional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Sakit karena..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan Absensi"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}