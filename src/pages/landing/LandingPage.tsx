import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Loader2, QrCode, Smartphone, Shield, BarChart2, Bell } from "lucide-react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import CountUp from 'react-countup';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRef } from "react";
import { Link } from "react-router-dom";

// Mapping ikon untuk fitur unggulan
const featureIcons: { [key: string]: any } = {
  qr_code: QrCode,
  mobile: Smartphone,
  security: Shield,
  analytics: BarChart2,
  automation: Bell,
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { scrollYProgress } = useScroll();
  const scale = useTransform(scrollYProgress, [0, 1], [1, 1.2]);
  
  const statsRef = useRef(null);
  const isStatsInView = useInView(statsRef, { once: true, margin: "-100px" });

  const { data: cmsData, isLoading, isError } = useQuery({
    queryKey: ['cms_content'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cms_sections')
        .select('*');

      if (error) throw error;
      
      const content = data.reduce((acc, section) => {
        return { ...acc, [section.section_name]: section.content };
      }, {});

      return content;
    },
    staleTime: 1000 * 60,
  });

  if (isLoading || isError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const heroContent = cmsData?.hero || { title: "Sistem Absensi Guru", subtitle: "Untuk SMKS Muhammadiyah Satui" };
  const aboutContent = cmsData?.about || { title: "Tentang Aplikasi", content: "Aplikasi ini dirancang khusus untuk mempermudah proses absensi guru..." };
  const featuresContent = cmsData?.features || { title: "Kelebihan Aplikasi Kami", items: [] };
  const statsContent = cmsData?.stats || { total_guru: 50, total_absensi_this_month: 1250 };

  return (
    <div className="bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative h-screen overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-blue-950 bg-[url('https://source.unsplash.com/1600x900/?muhammadiyah,school')] bg-cover bg-center"
          style={{ scale }}
        />
        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4 bg-black/50 text-white">
          <motion.div
            className="p-8 rounded-2xl border border-white/30 backdrop-blur-xl bg-white/10"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              {heroContent.title}
            </h1>
            <p className="text-xl md:text-2xl mb-8">
              {heroContent.subtitle}
            </p>
            <Link to="/scan" className="text-center">
              <Button size="lg" className="px-12 py-6 text-lg">
                Login Guru
              </Button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <motion.h2 
            className="text-3xl font-bold text-blue-900 mb-4"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {aboutContent.title}
          </motion.h2>
          <motion.p 
            className="text-gray-700 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {aboutContent.content}
          </motion.p>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-100">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-3xl font-bold text-blue-900 mb-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {featuresContent.title}
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresContent.items?.map((feature: any, index: number) => {
                const IconComponent = featureIcons[feature.icon as keyof typeof featureIcons];
                return (
                    <motion.div
                        key={index}
                        className="bg-white/50 p-8 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-2 backdrop-blur-sm"
                        initial={{ opacity: 0, y: 50 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: index * 0.1 }}
                        viewport={{ once: true }}
                    >
                        <div className="mb-4 text-blue-900 flex justify-center">
                            {IconComponent && <IconComponent className="h-12 w-12" />}
                        </div>
                        <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                        <p className="text-gray-600">{feature.description}</p>
                    </motion.div>
                );
            })}
          </div>
        </div>
      </section>

      {/* Statistik Section */}
      <section ref={statsRef} className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <motion.h2 
            className="text-3xl font-bold text-blue-900 mb-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {statsContent.title}
          </motion.h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <Card className="p-8 shadow-md">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Total Guru</h3>
              <p className="text-5xl font-bold text-blue-900">
                {isStatsInView && <CountUp end={statsContent.total_guru} duration={2.5} />}
              </p>
            </Card>
            <Card className="p-8 shadow-md">
              <h3 className="text-xl font-semibold text-gray-600 mb-2">Total Absensi Bulan Ini</h3>
              <p className="text-5xl font-bold text-blue-900">
                {isStatsInView && <CountUp end={statsContent.total_absensi_this_month} duration={2.5} />}
              </p>
            </Card>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-8 bg-gray-800 text-white text-center">
        <p>Made with ❤️ by SMKS Muhammadiyah Satui</p>
      </footer>
    </div>
  );
}