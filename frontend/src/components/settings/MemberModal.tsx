
import { useState, useEffect } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  editData?: any;
}

export default function MemberModal({ isOpen, onClose, editData }: Props) {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    points: 0,
  });

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          name: editData.name,
          phone: editData.phone || "",
          email: editData.email || "",
          points: editData.points || 0,
        });
      } else {
        setFormData({
          name: "",
          phone: "",
          email: "",
          points: 0,
        });
      }
    }
  }, [isOpen, editData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      
      const payload = {
        name: formData.name,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        points: editData ? Number(formData.points) : undefined,
      };

      if (editData) {
        await api.put(`/members/${editData.id}`, payload);
        toast.success("Member berhasil diperbarui");
      } else {
        await api.post("/members", payload);
        toast.success("Member berhasil ditambahkan");
      }
      
      queryClient.invalidateQueries({ queryKey: ["members"] });
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || "Gagal menyimpan member");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">
            {editData ? "Edit Member" : "Tambah Member Baru"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nama Member <span className="text-red">*</span></label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange bg-gray-50 focus:bg-white transition-all"
              placeholder="Masukkan nama lengkap"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nomor HP</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange bg-gray-50 focus:bg-white transition-all"
              placeholder="Contoh: 08123456789"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange bg-gray-50 focus:bg-white transition-all"
              placeholder="contoh@email.com"
            />
          </div>

          {editData && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Poin Loyalitas</label>
              <input
                type="number"
                min="0"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange bg-gray-50 focus:bg-white transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">Sesuaikan poin member secara manual jika diperlukan.</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark transition-colors disabled:opacity-70 shadow-lg shadow-orange/30"
            >
              {isLoading ? "Menyimpan..." : "Simpan Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
