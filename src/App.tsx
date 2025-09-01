import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "@/pages/landing/LandingPage";
import Login from "@/pages/login/Login";
import ScanPage from "@/pages/scan/ScanPage";
import DashboardAdminTU from "@/pages/admin-tu/DashboardAdminTU";
import ManageTeachers from "@/pages/super-admin/ManageTeachers";
import MainLayout from "@/components/MainLayout";
import ManageCMS from "@/pages/super-admin/ManageCMS"; // Impor halaman CMS
import DashboardKepsek from "@/pages/kepala-sekolah/DashboardKepsek"; // Import
import DashboardWaka from "@/pages/waka-kurikulum/DashboardWaka"; // Import
import DashboardGuru from "@/pages/guru/DashboardGuru"; // Impor halaman guru
import BrandingSettings from "@/pages/super-admin/BrandingSettings";
import "./index.css";

function App() {
  return (
    <Router>
      <Routes>
        {/* Rute publik */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/scan" element={<ScanPage />} />

        {/* Rute yang dilindungi */}
        <Route element={<MainLayout />}>
          <Route path="/admin_tu/dashboard" element={<DashboardAdminTU />} />
          <Route path="/super_admin/teachers" element={<ManageTeachers />} />
          <Route path="/super_admin/cms" element={<ManageCMS />} />
          <Route path="/kepala_sekolah/dashboard" element={<DashboardKepsek />} />
          <Route path="/waka_kurikulum/dashboard" element={<DashboardWaka />} />
          <Route path="/guru/dashboard" element={<DashboardGuru />} /> {/* Rute baru */}
          <Route path="/super_admin/branding" element={<BrandingSettings />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App