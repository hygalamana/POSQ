
import { useState } from "react";
import CategoryTabs from "../components/pos/CategoryTabs";
import ProductGrid from "../components/pos/ProductGrid";
import CartPanel from "../components/pos/CartPanel";
import MobileCartBar from "../components/pos/MobileCartBar";
import ShiftModal from "../components/pos/ShiftModal";
import CloseShiftModal from "../components/pos/CloseShiftModal";
import NetworkStatusBadge from "../components/pos/NetworkStatusBadge";
import { LogOut, Play } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { offlineStorage } from "../lib/offlineStorage";

export default function PosPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isManualShiftModalOpen, setIsManualShiftModalOpen] = useState(false);

  const { data: activeShift } = useQuery({
    queryKey: ["active-shift"],
    queryFn: async () => {
      if (typeof window !== "undefined" && !navigator.onLine) {
        return offlineStorage.getActiveShift();
      }

      try {
        const res = await api.get("/shifts/active");
        const shift = res.data.data;
        if (shift) {
          offlineStorage.saveActiveShift(shift);
        }
        return shift;
      } catch (err) {
        return offlineStorage.getActiveShift();
      }
    },
    refetchOnWindowFocus: false,
  });

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Products Panel */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <h1 className="text-2xl font-extrabold text-orange">PosQ</h1>
            <NetworkStatusBadge />
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {activeShift ? (
              <button 
                onClick={() => setIsCloseShiftModalOpen(true)}
                className="flex items-center gap-2 bg-red-50 text-red hover:bg-red-100 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors border border-red-200 whitespace-nowrap"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Tutup Kasir</span>
              </button>
            ) : (
              <button 
                onClick={() => setIsManualShiftModalOpen(true)}
                className="flex items-center gap-2 bg-orange-pale/30 text-orange hover:bg-orange-pale/50 px-3 sm:px-4 py-2 rounded-xl font-bold text-xs sm:text-sm transition-colors border border-orange-pale whitespace-nowrap"
              >
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline">Buka Kasir</span>
              </button>
            )}
            <div className="flex-1 sm:flex-none flex items-center gap-2 bg-white border-2 border-gray-200 rounded-xl px-3 sm:px-4 py-2 w-full sm:w-64 focus-within:border-orange transition-colors">
              <input
                type="text"
                placeholder="Cari produk..."
                className="bg-transparent border-none outline-none w-full text-xs sm:text-sm text-gray-700 placeholder-gray-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <CategoryTabs 
          selectedCategory={selectedCategory} 
          onSelectCategory={setSelectedCategory} 
        />
        
        <ProductGrid 
          categoryId={selectedCategory} 
          searchQuery={searchQuery} 
        />
      </div>

      {/* Cart Panel (Desktop) */}
      <div className="hidden lg:block">
        <CartPanel />
      </div>

      <MobileCartBar />
      <ShiftModal isOpen={isManualShiftModalOpen} onClose={() => setIsManualShiftModalOpen(false)} />
      <CloseShiftModal isOpen={isCloseShiftModalOpen} onClose={() => setIsCloseShiftModalOpen(false)} />
    </div>
  );
}
