
import { useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData?: any | null;
}

export default function AccountModal({ isOpen, onClose, editData }: Props) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  const [name, setName] = useState(editData?.name || "");
  const [email, setEmail] = useState(editData?.email || "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState(editData?.role || "CASHIER");
  const [isActive, setIsActive] = useState(editData?.isActive ?? true);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      return toast.error("Nama dan Email wajib diisi");
    }
    if (!editData && !password) {
      return toast.error("Kata sandi wajib diisi untuk akun baru");
    }

    try {
      setIsLoading(true);
      const payload: any = { name, email, role, isActive };
      if (password) payload.password = password;

      if (editData) {
        await api.put(`/users/${editData.id}`, payload);
        toast.success("Akun berhasil diperbarui");
      } else {
        await api.post("/users", payload);
        toast.success("Akun berhasil ditambahkan");
      }
      
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Terjadi kesalahan");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">{editData ? "Edit Akun" : "Tambah Akun"}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Pengguna</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white"
              placeholder="Nama Kasir / Manajer"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email (Untuk Login)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white"
              placeholder="email@contoh.com"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Kata Sandi {editData && <span className="text-xs text-gray-400 font-normal">(Kosongkan jika tidak diubah)</span>}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white"
              placeholder="Minimal 6 karakter"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Hak Akses (Role)</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              disabled={editData?.role === 'OWNER'}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange bg-gray-50 focus:bg-white disabled:opacity-50"
            >
              <option value="CASHIER">KASIR (Hanya Kasir & Riwayat Transaksi)</option>
              <option value="MANAGER">MANAJER (Kasir, Transaksi, Produk, Kategori, Laporan)</option>
              <option value="OWNER">PEMILIK (Akses Penuh)</option>
            </select>
          </div>

          {editData && editData.role !== 'OWNER' && (
            <div className="flex items-center justify-between pt-2">
              <label className="text-sm font-semibold text-gray-700">Status Akun Aktif</label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isActive ? 'bg-orange' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isActive ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-6 bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark flex justify-center gap-2 disabled:opacity-70"
          >
            {isLoading ? "Menyimpan..." : <><CheckCircle2 className="w-5 h-5" /> Simpan</>}
          </button>
        </form>
      </div>
    </div>
  );
}
