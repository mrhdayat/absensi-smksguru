import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { Html5QrcodeScanner } from 'html5-qrcode';
import { motion } from "framer-motion";
import { QrCode } from "lucide-react";

const nipPinSchema = z.object({
  nip: z.string().min(1, { message: "NIP wajib diisi." }),
  pin: z.string().min(4, { message: "PIN minimal 4 karakter." }),
});

type NipPinFormValues = z.infer<typeof nipPinSchema>;

export default function ScanPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState("");

  const form = useForm<NipPinFormValues>({
    resolver: zodResolver(nipPinSchema),
    defaultValues: {
      nip: "",
      pin: "",
    },
  });

  useEffect(() => {
    let html5QrcodeScanner: Html5QrcodeScanner;

    const onScanSuccess = (decodedText: string) => {
      setScanResult(decodedText);
      setIsScanning(false);
      html5QrcodeScanner.clear().catch(err => console.error("Failed to clear scanner on success", err));
    };
    
    const onScanError = (errorMessage: string) => {
      // Menangani error pemindaian
    };

    if (isScanning) {
      // Hapus elemen scanner yang mungkin sudah ada sebelumnya
      const oldScanner = document.getElementById('qr-reader');
      if (oldScanner) {
        oldScanner.innerHTML = '';
      }
      
      html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          videoConstraints: {
            facingMode: { ideal: "environment" }
          }
        },
        false
      );

      html5QrcodeScanner.render(onScanSuccess, onScanError);
    }
    
    // Cleanup function
    return () => {
      if (html5QrcodeScanner && html5QrcodeScanner.getState() !== 0) {
        html5QrcodeScanner.clear().catch(err => console.error("Failed to clear scanner on cleanup", err));
      }
    };
  }, [isScanning]);
  
  useEffect(() => {
    if (scanResult) {
      toast.success("QR Code terdeteksi. Memproses absensi...");
      const parts = scanResult.split('-');
      if (parts.length === 2) {
        handleSubmitAbsen({ nip: parts[0], pin: parts[1] });
      } else {
        toast.error("Format QR code tidak valid.");
      }
    }
  }, [scanResult]);

  const handleManualSubmit = async (values: NipPinFormValues) => {
    await handleSubmitAbsen(values);
  };
  
  const handleSubmitAbsen = async (data: { nip: string, pin: string }) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/scan-absen`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Absen gagal. Silakan coba lagi.");
      }

      const result = await response.json();
      toast.success(result.message);
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Terjadi kesalahan. Coba lagi nanti.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="flex justify-center items-center gap-2">
              <QrCode className="h-6 w-6" /> Scan QR Absensi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div id="qr-reader" className="w-full rounded-lg overflow-hidden">
              <div className="text-gray-500 text-center p-4">Memuat QR Scanner...</div>
            </div>
            
            <div className="relative flex justify-center items-center">
              <span className="bg-white px-2 text-sm text-gray-500">
                ATAU
              </span>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleManualSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="nip"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIP</FormLabel>
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
                        <Input type="password" placeholder="PIN" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Memuat..." : "Absen Manual"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}