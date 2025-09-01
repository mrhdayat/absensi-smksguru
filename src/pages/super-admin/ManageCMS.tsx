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
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Skema validasi untuk konten CMS
const cmsSchema = z.object({
  hero_title: z.string().min(1, "Judul hero wajib diisi."),
  hero_subtitle: z.string().min(1, "Slogan hero wajib diisi."),
  about_title: z.string().min(1, "Judul tentang aplikasi wajib diisi."),
  about_content: z.string().min(1, "Konten tentang aplikasi wajib diisi."),
});

type CmsFormValues = z.infer<typeof cmsSchema>;

export default function ManageCMS() {
  const queryClient = useQueryClient();

  const form = useForm<CmsFormValues>({
    resolver: zodResolver(cmsSchema),
  });

  // Query untuk mengambil data CMS
  const { isLoading, isError } = useQuery({
    queryKey: ['cms_content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_sections')
        .select('*');

      if (error) throw error;
      
      const content = data.reduce((acc, section) => {
        return { ...acc, [section.section_name]: section.content };
      }, {});

      // Set nilai default form dari data yang diambil
      if (content.hero) {
        form.setValue("hero_title", content.hero.title);
        form.setValue("hero_subtitle", content.hero.subtitle);
      }
      if (content.about) {
        form.setValue("about_title", content.about.title);
        form.setValue("about_content", content.about.content);
      }

      return content;
    },
    staleTime: 1000 * 60,
  });

  const updateCMSMutation = useMutation({
    mutationFn: async (updatedData: CmsFormValues) => {
      // Simpan perubahan untuk Hero Section
      await supabase
        .from('cms_sections')
        .upsert({
          section_name: 'hero',
          content: { title: updatedData.hero_title, subtitle: updatedData.hero_subtitle }
        });

      // Simpan perubahan untuk About Section
      await supabase
        .from('cms_sections')
        .upsert({
          section_name: 'about',
          content: { title: updatedData.about_title, content: updatedData.about_content }
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cms_content'] });
      toast.success("Konten CMS berhasil diperbarui!");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal memperbarui konten CMS.");
    },
  });

  const onSubmit = (values: CmsFormValues) => {
    updateCMSMutation.mutate(values);
  };
  
  if (isLoading) {
    return <p>Memuat konten CMS...</p>;
  }

  if (isError) {
    return <p>Terjadi kesalahan saat memuat konten.</p>;
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Manajemen Konten Landing Page</h1>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="hero_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul Hero</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="hero_subtitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slogan/Subjudul</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Tentang Aplikasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="about_title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Judul</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="about_content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Konten</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={6} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Button type="submit" disabled={updateCMSMutation.isPending}>
            {updateCMSMutation.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </Form>
    </div>
  );
}