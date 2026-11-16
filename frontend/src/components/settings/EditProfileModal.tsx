
import { useState, useEffect } from "react";
import { X, User, Store, CheckCircle2, QrCode, Upload, RefreshCw, Trash2, Check, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { useAuthStore } from "../../stores/authStore";
import { useCartStore } from "../../stores/cartStore";
import jsQR from "jsqr";
import { QRCodeSVG } from "qrcode.react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ isOpen, onClose }: Props) {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [activeTab, setActiveTab] = useState<"profile" | "outlet" | "qris">("profile");
  const [isLoading, setIsLoading] = useState(false);

  // Profile State
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");

  // Outlet State
  const [outletName, setOutletName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [hasTax, setHasTax] = useState(true);
  const [taxRate, setTaxRate] = useState(10);
  
  // QRIS State
  const [qrisPayload, setQrisPayload] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setAvatar(user.avatar || "");
      if (user.outlet) {
        setOutletName(user.outlet.name || "");
        setAddress(user.outlet.address || "");
        setPhone(user.outlet.phone || "");
        setHasTax(user.outlet.hasTax ?? true);
        setTaxRate((user.outlet.taxRate || 0) * 100);
        setQrisPayload(user.outlet.qrisPayload || "");
      }
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama tidak boleh kosong");
    
    try {
      setIsLoading(true);
      const res = await api.put("/auth/me", { name, avatar });
      updateUser(res.data.data);
      toast.success("Profil berhasil diperbarui");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Gagal memperbarui profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveOutlet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outletName.trim()) return toast.error("Nama restoran tidak boleh kosong");
    
    try {
      setIsLoading(true);
      const res = await api.put("/auth/outlet", { 
        name: outletName, 
        address, 
        phone,
        hasTax,
        taxRate: taxRate / 100,
        qrisPayload: qrisPayload || null
      });
      updateUser({ outlet: res.data.data });
      useCartStore.getState().recalculate();
      toast.success("Info restoran berhasil diperbarui");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Gagal memperbarui info restoran");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveQris = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      const res = await api.put("/auth/outlet", { 
        name: outletName || user?.outlet?.name || "PosQ Outlet", 
        address: address || user?.outlet?.address || "", 
        phone: phone || user?.outlet?.phone || "",
        hasTax,
        taxRate: taxRate / 100,
        qrisPayload: qrisPayload || null
      });
      updateUser({ outlet: res.data.data });
      useCartStore.getState().recalculate();
      toast.success(qrisPayload ? "QRIS berhasil disimpan & siap digunakan!" : "Pengaturan QRIS berhasil diperbarui");
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Gagal menyimpan QRIS");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQrisUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height);
        
        if (code) {
          setQrisPayload(code.data);
          toast.success("QRIS berhasil dibaca! Klik 'Simpan QRIS' untuk menerapkan.");
        } else {
          toast.error("Tidak dapat membaca QR code dari gambar. Coba gambar yang lebih jelas.");
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Edit Profil</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "profile" ? "border-orange text-orange" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <User className="w-4 h-4" /> Profil
          </button>
          <button
            onClick={() => setActiveTab("outlet")}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "outlet" ? "border-orange text-orange" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <Store className="w-4 h-4" /> Restoran
          </button>
          <button
            onClick={() => setActiveTab("qris")}
            className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === "qris" ? "border-orange text-orange" : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            <QrCode className="w-4 h-4" /> QRIS
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          {activeTab === "profile" ? (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pengguna</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Nama Kasir / Owner"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">URL Foto Profil / Emoji</label>
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white transition-colors"
                  placeholder="https://... atau emoji 👨‍🍳"
                />
                <p className="text-xs text-gray-500 mt-2">Gunakan URL gambar dari internet atau gunakan emoji. Biarkan kosong untuk menggunakan ikon bawaan.</p>
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? "Menyimpan..." : <><CheckCircle2 className="w-5 h-5" /> Simpan Profil</>}
              </button>
            </form>
          ) : activeTab === "outlet" ? (
            <form onSubmit={handleSaveOutlet} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Restoran</label>
                <input
                  type="text"
                  value={outletName}
                  onChange={(e) => setOutletName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white transition-colors"
                  placeholder="Nama Restoran / Cafe"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor Telepon</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white transition-colors"
                  placeholder="0812..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Alamat Lengkap</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white transition-colors resize-none"
                  placeholder="Jalan..."
                />
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-semibold text-gray-700">Aktifkan Pajak (Tax)</label>
                  <button
                    type="button"
                    onClick={() => setHasTax(!hasTax)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${hasTax ? 'bg-orange' : 'bg-gray-300'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${hasTax ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                
                {hasTax && (
                  <div className="animate-in fade-in slide-in-from-top-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Persentase Pajak (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white transition-colors"
                      placeholder="Contoh: 10 atau 11"
                    />
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {isLoading ? "Menyimpan..." : <><CheckCircle2 className="w-5 h-5" /> Simpan Restoran</>}
              </button>
            </form>
          ) : activeTab === "qris" ? (
            <form onSubmit={handleSaveQris} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Konfigurasi QRIS Toko</label>
                
                {qrisPayload ? (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-green-light flex items-center justify-center text-green">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">QRIS Terbaca & Siap Digunakan</p>
                          <p className="text-xs text-gray-500">Kode QR otomatis terdeteksi</p>
                        </div>
                      </div>
                      <span className="px-2.5 py-1 bg-green-light text-green text-xs font-extrabold rounded-lg">
                        AKTIF
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex flex-col items-center justify-center gap-3">
                      <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                        <QRCodeSVG value={qrisPayload} size={150} level="M" />
                      </div>
                      <div className="text-center max-w-full">
                        <p className="text-[11px] font-mono text-gray-500 truncate max-w-[260px] bg-white px-2.5 py-1 rounded-lg border border-gray-200">
                          {qrisPayload}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 cursor-pointer flex items-center justify-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors relative">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrisUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Upload Ulang Foto QRIS</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          setQrisPayload("");
                          toast("Foto QRIS dihapus sementara, klik Simpan untuk menerapkan.", { icon: "ℹ️" });
                        }}
                        className="px-3 py-2.5 bg-red-50 hover:bg-red-100 text-red font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                        title="Hapus QRIS"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrisUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      />
                      <div className="w-full px-4 py-8 rounded-2xl border-2 border-dashed border-gray-300 hover:border-orange bg-gray-50 hover:bg-orange-pale/20 transition-all flex flex-col items-center justify-center gap-2.5 text-center cursor-pointer group">
                        <div className="w-12 h-12 rounded-full bg-orange-pale/60 text-orange flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div>
                          <span className="text-sm font-bold text-gray-700 block">Pilih atau letakkan gambar QRIS di sini</span>
                          <span className="text-xs text-gray-400">Format file JPG, PNG, atau screenshot QRIS statis</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <p>Upload gambar QRIS statis dari rekening toko Anda (BCA, Mandiri, BRI, GoPay, OVO, ShopeePay, DANA, dll). Sistem akan membaca kodenya secara otomatis.</p>
                    </div>
                  </div>
                )}
              </div>
              
              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-6 bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark transition-colors disabled:opacity-70 flex items-center justify-center gap-2 shadow-sm"
              >
                {isLoading ? "Menyimpan..." : <><CheckCircle2 className="w-5 h-5" /> Simpan QRIS</>}
              </button>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
}
