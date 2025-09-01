import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Form,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Skema validasi untuk branding
const brandingSchema = z.object({
  logo_url: z.string().optional(),
  favicon_url: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export default function BrandingSettings() {
  const queryClient = useQueryClient();
  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
  });
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);

  const { data: brandingData, isLoading } = useQuery({
    queryKey: ['branding_settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_sections')
        .select('content')
        .eq('section_name', 'branding')
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Abaikan jika data tidak ditemukan
      
      const content = data?.content || {};
      form.reset({
        logo_url: content.logo_url || '',
        favicon_url: content.favicon_url || '',
        primary_color: content.primary_color || '',
        secondary_color: content.secondary_color || '',
      });
      return content;
    },
    staleTime: 1000 * 60,
  });

  const updateBrandingMutation = useMutation({
    mutationFn: async (updatedData: BrandingFormValues) => {
      let logoUrl = updatedData.logo_url;
      let faviconUrl = updatedData.favicon_url;

      // Unggah logo jika ada file baru
      if (logoFile) {
        const { data, error } = await supabase.storage
          .from('assets')
          .upload(`branding/logo-${Date.now()}`, logoFile, { upsert: true });
        if (error) throw error;
        logoUrl = supabase.storage.from('assets').getPublicUrl(data.path).data.publicUrl;
      }
      
      // Unggah favicon jika ada file baru
      if (faviconFile) {
        const { data, error } = await supabase.storage
          .from('assets')
          .upload(`branding/favicon-${Date.now()}`, faviconFile, { upsert: true });
        if (error) throw error;
        faviconUrl = supabase.storage.from('assets').getPublicUrl(data.path).data.publicUrl;
      }

      // Simpan konfigurasi branding ke database
      await supabase
        .from('cms_sections')
        .upsert({
          section_name: 'branding',
          content: {
            logo_url: logoUrl,
            favicon_url: faviconUrl,
            primary_color: updatedData.primary_color,
            secondary_color: updatedData.secondary_color,
          }
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding_settings'] });
      toast.success("Pengaturan merek berhasil diperbarui!");
    },
    onError: (err) => {
      toast.error(err.message || "Gagal memperbarui pengaturan merek.");
    },
  });

  const onSubmit = (values: BrandingFormValues) => {
    updateBrandingMutation.mutate(values);
  };
  
  if (isLoading) {
    return <p>Memuat pengaturan...</p>;
  }

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Pengaturan Merek</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logo & Favicon</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="logo_url"
                render={() => (
                  <FormItem>
                    <FormLabel>Unggah Logo</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => {
                          if (e.target.files) {
                            setLogoFile(e.target.files[0]);
                          }
                        }} 
                      />
                    </FormControl>
                    {brandingData?.logo_url && <img src={brandingData.logo_url} alt="Logo Sekolah" className="mt-2 h-12" />}
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="favicon_url"
                render={() => (
                  <FormItem>
                    <FormLabel>Unggah Favicon</FormLabel>
                    <FormControl>
                      <Input 
                        type="file" 
                        onChange={(e) => {
                          if (e.target.files) {
                            setFaviconFile(e.target.files[0]);
                          }
                        }} 
                      />
                    </FormControl>
                    {brandingData?.favicon_url && <img src={brandingData.favicon_url} alt="Favicon" className="mt-2 h-8 w-8" />}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Warna Tema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="primary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warna Utama</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="secondary_color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Warna Sekunder</FormLabel>
                    <FormControl>
                      <Input type="color" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Button 
            type="submit" 
            disabled={updateBrandingMutation.isPending}
          >
            {updateBrandingMutation.isPending ? "Menyimpan..." : "Simpan Pengaturan"}
          </Button>
        </form>
      </Form>
    </div>
  );
}