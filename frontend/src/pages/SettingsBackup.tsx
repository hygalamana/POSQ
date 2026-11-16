
import { ArrowLeft, Download, Upload, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from '@/lib/routerCompat';
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import api from "../lib/api";

export default function BackupRestorePage() {
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackup = async () => {
    try {
      const res = await api.get('/system/backup', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup-posq-${new Date().toISOString().split('T')[0]}.db`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Backup berhasil diunduh");
    } catch (error) {
      toast.error("Gagal melakukan backup. Pastikan Anda adalah Owner.");
    }
  };

  const handleRestoreClick = () => {
    if (confirm("PERINGATAN! Melakukan Restore akan MENGHAPUS seluruh data saat ini dan menggantinya dengan data dari file backup. Apakah Anda yakin ingin melanjutkan?")) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.db')) {
      toast.error("File harus berformat .db");
      return;
    }

    const formData = new FormData();
    formData.append('database', file);

    try {
      setIsRestoring(true);
      await api.post('/system/restore', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success("Restore berhasil! Sistem akan dimuat ulang...");
      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    } catch (error) {
      toast.error("Gagal melakukan restore. Pastikan file valid.");
    } finally {
      setIsRestoring(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/settings" className="p-2 hover:bg-gray-200 rounded-xl transition-colors">
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </Link>
        <h1 className="text-2xl font-extrabold text-gray-900">Backup & Restore Database</h1>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
              <Download className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Backup Data</h2>
              <p className="text-sm text-gray-500 mb-4">Unduh seluruh data sistem saat ini (produk, transaksi, pengaturan) ke dalam satu file aman (.db) untuk disimpan di perangkat Anda.</p>
              <button 
                onClick={handleBackup}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 text-sm"
              >
                <Download className="w-4 h-4" /> Unduh Backup Sekarang
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-red shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1 h-full bg-red"></div>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-red/10 rounded-xl flex items-center justify-center text-red shrink-0">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                Restore Data <AlertTriangle className="w-4 h-4 text-orange" />
              </h2>
              <p className="text-sm text-gray-500 mb-4">Kembalikan data dari file backup (.db) yang pernah Anda unduh. <strong className="text-red">Tindakan ini akan menghapus permanen seluruh data saat ini!</strong></p>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".db"
                onChange={handleFileChange}
              />
              <button 
                onClick={handleRestoreClick}
                disabled={isRestoring}
                className="bg-red hover:bg-red-dark text-white font-bold py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
              >
                {isRestoring ? "Merestore..." : <><Upload className="w-4 h-4" /> Pilih File Backup (.db)</>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
