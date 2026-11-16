import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../lib/api";
import toast from "react-hot-toast";
import { X, Save, Trash2 } from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CategoryModal({ isOpen, onClose, onSuccess }: CategoryModalProps) {
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🏷️");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ["modal-categories"],
    queryFn: async () => {
      const res = await api.get("/categories");
      return res.data.data;
    },
    enabled: isOpen,
  });

  if (!isOpen) return null;

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus kategori ${name}?`)) {
      try {
        await api.delete(`/categories/${id}`);
        toast.success("Kategori berhasil dihapus");
        refetchCategories();
        onSuccess();
      } catch (error) {
        toast.error("Gagal menghapus kategori");
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Nama kategori wajib diisi");

    setIsSubmitting(true);
    try {
      await api.post("/categories", { name, icon });
      toast.success("Kategori berhasil ditambahkan");
      setName("");
      setIcon("🏷️");
      refetchCategories();
      onSuccess();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Gagal menambahkan kategori");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Tambah Kategori</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Kategori</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors"
                placeholder="Contoh: Minuman Dingin"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ikon / Emoji</label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors"
                placeholder="Contoh: 🥤"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              {isSubmitting ? "Menyimpan..." : "Simpan Kategori"}
            </button>
          </div>
        </form>

        <div className="p-5 border-t border-gray-100 bg-gray-50/50">
          <h3 className="text-sm font-bold text-gray-900 mb-3">Kategori Saat Ini</h3>
          <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2 scrollbar-custom">
            {categories?.map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{cat.emoji || cat.icon}</span>
                  <span className="font-semibold text-sm text-gray-800">{cat.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(cat.id, cat.name)}
                  className="p-2 text-gray-400 hover:text-red hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {!categories?.length && (
              <div className="text-center text-sm text-gray-500 py-4">Belum ada kategori</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
