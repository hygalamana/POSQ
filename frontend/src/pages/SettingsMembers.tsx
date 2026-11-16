
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Users, Trash2, Edit2 } from "lucide-react";
import { useRouter } from '@/lib/routerCompat';
import api from "../lib/api";
import MemberModal from "../components/settings/MemberModal";
import PointsSettingsModal from "../components/settings/PointsSettingsModal";
import toast from "react-hot-toast";

export default function MembersPage() {
  const router = useRouter();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data: members, isLoading, refetch } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      const res = await api.get("/members");
      return res.data.data;
    },
  });

  const handleDelete = async (member: any) => {
    if (confirm(`Apakah Anda yakin ingin menghapus member ${member.name}?`)) {
      try {
        await api.delete(`/members/${member.id}`);
        toast.success("Member berhasil dihapus");
        refetch();
      } catch (error: any) {
        toast.error(error.response?.data?.error?.message || "Gagal menghapus member");
      }
    }
  };

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
          <h1 className="text-xl font-extrabold text-gray-900">Manajemen Pelanggan</h1>
          <p className="text-sm text-gray-500">Kelola data member dan poin loyalitas pelanggan Anda</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPointsModalOpen(true)}
            className="bg-white border-2 border-orange text-orange hover:bg-orange-pale font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
          >
            <span className="hidden sm:inline">Set Poin</span>
            <span className="sm:hidden">Poin</span>
          </button>
          <button
            onClick={() => {
              setEditData(null);
              setIsModalOpen(true);
            }}
            className="bg-orange hover:bg-orange-dark text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">Tambah Member</span>
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 scrollbar-custom">
        {isLoading ? (
          <div className="animate-pulse space-y-4 max-w-4xl mx-auto">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-xl"></div>)}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-4">
            {members?.map((member: any) => (
              <div key={member.id} className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-orange transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 bg-orange-pale text-orange">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg">{member.name}</h3>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-500 mt-1">
                      {member.phone && <span>📞 {member.phone}</span>}
                      {member.email && <span className="hidden sm:inline">•</span>}
                      {member.email && <span>✉️ {member.email}</span>}
                      <span className="hidden sm:inline">•</span>
                      <span className="font-semibold text-orange bg-orange/10 px-2 rounded-lg">{member.points} Poin</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditData(member);
                      setIsModalOpen(true);
                    }}
                    className="p-2 hover:bg-orange-pale text-gray-400 hover:text-orange rounded-xl transition-colors"
                    title="Edit Member"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(member)}
                    className="p-2 hover:bg-red/10 text-gray-400 hover:text-red rounded-xl transition-colors"
                    title="Hapus Member"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
            {!members?.length && (
              <div className="text-center py-12 text-gray-500">
                Belum ada data member.
              </div>
            )}
          </div>
        )}
      </div>

      <MemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editData={editData}
        onSuccess={refetch}
      />

      <PointsSettingsModal
        isOpen={isPointsModalOpen}
        onClose={() => setIsPointsModalOpen(false)}
      />
    </div>
  );
}
