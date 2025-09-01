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
  FormDescription,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Pencil, Trash2 } from "lucide-react";

const teacherSchema = z.object({
  id: z.string().optional(),
  email: z.string().email(),
  full_name: z.string().min(1, "Nama lengkap wajib diisi."),
  nip: z.string().optional(),
  category: z.enum(["GTT", "Honorer"]),
  pin: z.string().min(4, "PIN minimal 4 karakter.").optional(),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export default function ManageTeachers() {
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any | null>(null);

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      email: "",
      full_name: "",
      nip: "",
      category: "GTT",
      pin: "",
    },
  });

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          nip,
          category,
          profiles (
            id,
            email,
            full_name
          )
        `);

      if (error) throw error;
      return data;
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (newTeacher: TeacherFormValues) => {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newTeacher.email,
        password: Math.random().toString(36).slice(-8),
      });
      if (authError || !authData.user) throw authError;

      const hashPinResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hash-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: newTeacher.pin, user_id: authData.user.id, action: 'hash' }),
      });
      const { hashed_pin } = await hashPinResponse.json();

      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: newTeacher.email,
          full_name: newTeacher.full_name,
          role: 'guru',
        });
      if (profileError) throw profileError;

      const { error: teacherError } = await supabase
        .from('teachers')
        .insert({
          id: authData.user.id,
          nip: newTeacher.nip,
          category: newTeacher.category,
          pin: hashed_pin,
        });
      if (teacherError) throw teacherError;
      
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('user_activity_logs').insert({
          user_id: user?.id,
          action: 'create_teacher',
          details: { teacher_name: newTeacher.full_name, new_email: newTeacher.email }
      });
      
      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success("Guru berhasil ditambahkan!");
      setOpenDialog(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menambahkan guru.");
    },
  });
  
  const updateTeacherMutation = useMutation({
    mutationFn: async (updatedTeacher: TeacherFormValues) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: updatedTeacher.full_name,
        })
        .eq('id', updatedTeacher.id);
      if (profileError) throw profileError;

      const updatedData: any = {
        nip: updatedTeacher.nip,
        category: updatedTeacher.category,
      };

      if (updatedTeacher.pin) {
        const hashPinResponse = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/hash-pin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin: updatedTeacher.pin, user_id: updatedTeacher.id, action: 'hash' }),
        });
        const { hashed_pin } = await hashPinResponse.json();
        updatedData.pin = hashed_pin;
      }
      
      const { error: teacherError } = await supabase
        .from('teachers')
        .update(updatedData)
        .eq('id', updatedTeacher.id);
      if (teacherError) throw teacherError;
      
      await supabase.from('user_activity_logs').insert({
          user_id: user?.id,
          action: 'update_teacher',
          details: { teacher_id: updatedTeacher.id, changes: updatedData }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success("Data guru berhasil diperbarui!");
      setOpenDialog(false);
      form.reset();
    },
    onError: (err) => {
      toast.error(err.message || "Gagal memperbarui data guru.");
    },
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (teacherId: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase.auth.admin.deleteUser(teacherId);
      if (error) throw error;
      
      await supabase.from('user_activity_logs').insert({
          user_id: user?.id,
          action: 'delete_teacher',
          details: { deleted_user_id: teacherId }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers'] });
      toast.success("Guru berhasil dihapus!");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal menghapus guru.");
    },
  });

  const onSubmit = (values: TeacherFormValues) => {
    if (editingTeacher) {
      updateTeacherMutation.mutate({ ...values, id: editingTeacher.profiles.id });
    } else {
      createTeacherMutation.mutate(values);
    }
  };

  const handleEditClick = (teacher: any) => {
    setEditingTeacher(teacher);
    form.reset({
      id: teacher.profiles.id,
      email: teacher.profiles.email,
      full_name: teacher.profiles.full_name,
      nip: teacher.nip,
      category: teacher.category,
      pin: "",
    });
    setOpenDialog(true);
  };
  
  const handleDeleteClick = (teacherId: string) => {
      if (window.confirm("Apakah Anda yakin ingin menghapus guru ini?")) {
        deleteTeacherMutation.mutate(teacherId);
      }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Manajemen Guru</h1>
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingTeacher(null); form.reset(); }}>Tambah Guru</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Guru" : "Tambah Guru Baru"}</DialogTitle>
              <DialogDescription>
                {editingTeacher ? "Perbarui data guru." : "Buat akun guru baru."}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Lengkap</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap guru" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="email@sekolah.sch.id" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIP (Opsional)</FormLabel>
                      <FormControl>
                        <Input placeholder="NIP" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>PIN</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Minimal 4 karakter" {...field} />
                      </FormControl>
                      <FormDescription>
                        {editingTeacher && "Kosongkan jika tidak ingin mengubah PIN."}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kategori</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="GTT">GTT (Guru Tetap)</SelectItem>
                          <SelectItem value="Honorer">Honorer</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}
                >
                  {createTeacherMutation.isPending || updateTeacherMutation.isPending ? "Memproses..." : editingTeacher ? "Simpan Perubahan" : "Tambah Guru"}
                </Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daftar Guru</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center">Memuat data guru...</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>NIP</TableHead>
                    <TableHead>Kategori</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teachers?.map((teacher: any) => (
                    <TableRow key={teacher.id}>
                      <TableCell>{teacher.profiles.full_name}</TableCell>
                      <TableCell>{teacher.profiles.email}</TableCell>
                      <TableCell>{teacher.nip || '-'}</TableCell>
                      <TableCell>{teacher.category}</TableCell>
                      <TableCell className="text-right flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(teacher)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(teacher.profiles.id)}>
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