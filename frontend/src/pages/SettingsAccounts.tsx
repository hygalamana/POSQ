
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, User, Trash2, Edit2 } from "lucide-react";
import { useRouter } from '@/lib/routerCompat';
import api from "../lib/api";
import AccountModal from "../components/settings/AccountModal";
import toast from "react-hot-toast";
import { useAuthStore } from "../stores/authStore";

export default function AccountsPage() {
  const router = useRouter();
  const currentUser = useAuthStore(state => state.user);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data: users, isLoading, refetch } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get("/users");
      return res.data.data;
    },
    enabled: currentUser?.role === 'OWNER',
  });

  const handleDelete = async (user: any) => {
    if (user.role === 'OWNER') {
      return toast.error("Akun Pemilik tidak dapat dihapus");
    }
    if (confirm(`Apakah Anda yakin ingin menghapus akun ${user.name}?`)) {
      try {
        await api.delete(`/users/${user.id}`);
        toast.success("Akun berhasil dihapus");
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.error?.message || "Gagal menghapus akun");
      }
    }
  };

  if (currentUser?.role !== 'OWNER') {
    return <div className="p-8 text-center text-red">Akses ditolak. Hanya Pemilik (OWNER) yang dapat mengakses halaman ini.</div>;
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-cream overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 p-4 md:p-6 shrink-0 flex items-center gap-4">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-extrabold text-gray-900">Manajemen Akun</h1>
          <p className="text-sm text-gray-500">Kelola akses kasir dan manajer untuk restoran Anda</p>
        </div>
        <button
          onClick={() => {
            setEditData(null);
            setIsModalOpen(true);
          }}
          className="bg-orange hover:bg-orange-dark text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Tambah Akun</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-custom">
        {isLoading ? (
          <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl"></div>)}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {users?.map((user: any) => (
              <div key={user.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    user.role === 'OWNER' ? 'bg-orange text-white' : 
                    user.role === 'MANAGER' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{user.name}</h3>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-gray-500">{user.email}</span>
                      {!user.isActive && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                          <span className="text-red font-semibold">Tidak Aktif</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditData(user);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-orange-pale text-gray-400 hover:text-orange rounded-xl transition-colors"
                    title="Edit Akun"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  {user.role !== 'OWNER' && (
                    <button
                      onClick={() => handleDelete(user)}
                      className="p-2 hover:bg-red/10 text-gray-400 hover:text-red rounded-xl transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AccountModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        editData={editData} 
      />
    </div>
  );
}
