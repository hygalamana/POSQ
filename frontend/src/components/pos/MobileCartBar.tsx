
import { useCartStore } from "../../stores/cartStore";
import { useState, useRef } from "react";
import { ArrowRight } from "lucide-react";
import MobileCartDetailsModal from "./MobileCartDetailsModal";

export default function MobileCartBar() {
  const { totalItems, total } = useCartStore();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const mountTime = useRef(0);
  const previousTotal = useRef(totalItems);

  // Track exactly when the cart bar becomes visible
  if (previousTotal.current === 0 && totalItems > 0) {
    mountTime.current = Date.now();
  }
  previousTotal.current = totalItems;

  const handleOpenDetails = (e: React.MouseEvent) => {
    e.preventDefault();
    // Ignore any click events within 1000ms of the bar appearing to prevent ghost clicks
    if (Date.now() - mountTime.current < 1000) return;
    setIsDetailsOpen(true);
  };

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  if (totalItems === 0 && !isDetailsOpen) return null;

  return (
    <>
      {totalItems > 0 && (
        <div 
          className="lg:hidden fixed bottom-[84px] left-4 right-4 bg-white rounded-2xl p-3.5 flex items-center justify-between border border-gray-100 shadow-[0_10px_40px_rgba(0,0,0,0.15)] z-40 animate-in fade-in slide-in-from-bottom-4 duration-300"
        >
        <div className="flex items-center gap-3">
          <div className="bg-orange text-white w-8 h-8 rounded-xl flex items-center justify-center text-sm font-extrabold">
            {totalItems}
          </div>
          <div>
            <div className="text-[12px] text-gray-500">{totalItems} item dipilih</div>
            <div className="text-[16px] font-extrabold text-gray-900">{formatIDR(total)}</div>
          </div>
        </div>
        <button 
          onClick={handleOpenDetails}
          className="bg-orange text-white border-none rounded-xl px-4 py-2 text-[13px] font-bold flex items-center gap-2 transition-transform active:scale-[0.95]"
        >
          Lanjut <ArrowRight className="w-4 h-4" />
        </button>
        </div>
      )}

      {/* Show cart details first on mobile */}
      <MobileCartDetailsModal isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)} />
    </>
  );
}
