
import { useCartStore } from "../../stores/cartStore";
import { Minus, Plus, Trash2, ShoppingCart, X } from "lucide-react";
import toast from "react-hot-toast";
import { useState } from "react";
import CheckoutModal from "./CheckoutModal";
import VariantModal from "./VariantModal";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileCartDetailsModal({ isOpen, onClose }: Props) {
  const { items, totalItems, subtotal, tax, total, updateQty, updateItemVariant, clearCart } = useCartStore();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [editingVariant, setEditingVariant] = useState<{ itemId: string; product: any } | null>(null);

  const cartItemsArray = Object.values(items);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const handleCheckout = () => {
    if (cartItemsArray.length === 0) return toast.error("Keranjang kosong");
    setIsCheckoutOpen(true);
  };

  if (!isOpen && !isCheckoutOpen) return null;

  return (
    <>
      {isOpen && !isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col h-[85vh] sm:max-h-[90vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                Pesanan Anda
                <span className="bg-orange text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              </h2>
              <div className="flex items-center gap-2">
                {cartItemsArray.length > 0 && (
                  <button onClick={clearCart} className="text-red hover:bg-red/10 p-2 rounded-lg transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 scrollbar-custom">
              {cartItemsArray.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <ShoppingCart className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-sm font-semibold">Belum ada pesanan</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItemsArray.map((item) => {
                    const itemId = item.variantName ? `${item.product.id}-${item.variantName}` : item.product.id;
                    let itemPrice = item.product.price;
                    if (item.variantName && item.product.variants) {
                      const variant = item.product.variants.find(v => v.name === item.variantName);
                      if (variant) itemPrice = variant.price;
                    }

                    return (
                      <div key={itemId} className="flex items-center gap-3 pb-3 border-b border-gray-50 last:border-0">
                        <div className="w-12 h-12 bg-orange-pale rounded-xl flex items-center justify-center text-xl shrink-0">
                          {item.product.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[13px] font-bold text-gray-900 truncate">{item.product.name}</h4>
                          {item.variantName && (
                            <button 
                              onClick={() => setEditingVariant({ itemId, product: item.product })}
                              className="text-[11px] font-bold text-orange hover:text-orange-dark bg-orange-pale px-1.5 py-0.5 rounded mt-0.5 inline-block cursor-pointer transition-colors text-left"
                            >
                              Varian: {item.variantName}
                            </button>
                          )}
                          <p className="text-[12px] text-gray-500 mt-0.5">{formatIDR(itemPrice)}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => updateQty(itemId, item.quantity - 1)}
                            className="w-7 h-7 rounded-md border-2 border-gray-200 flex items-center justify-center text-gray-600 hover:border-orange hover:text-orange transition-colors"
                          >
                            <Minus className="w-3.5 h-3.5 font-bold" />
                          </button>
                          <span className="w-5 text-center text-[14px] font-bold text-gray-900">{item.quantity}</span>
                          <button 
                            onClick={() => updateQty(itemId, item.quantity + 1)}
                            className="w-7 h-7 rounded-md border-2 border-orange bg-orange flex items-center justify-center text-white hover:bg-orange-dark transition-colors"
                          >
                            <Plus className="w-3.5 h-3.5 font-bold" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-6 border-t border-gray-100 pb-safe">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-[13px] font-semibold text-gray-500">
                  <span>Subtotal</span>
                  <span className="text-gray-900">{formatIDR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[13px] font-semibold text-gray-500">
                  <span>Pajak (10%)</span>
                  <span className="text-gray-900">{formatIDR(tax)}</span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-gray-200">
                  <span className="text-[15px] font-extrabold text-gray-900">Total</span>
                  <span className="text-[18px] font-extrabold text-orange">{formatIDR(total)}</span>
                </div>
              </div>
              
              <button 
                onClick={handleCheckout}
                disabled={cartItemsArray.length === 0}
                className="w-full bg-orange hover:bg-orange-dark disabled:opacity-50 disabled:active:scale-100 text-white font-bold py-4 px-4 rounded-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(249,115,22,0.25)]"
              >
                Lanjutkan ke Pembayaran
              </button>
            </div>
          </div>
        </div>
      )}
      
      <CheckoutModal 
        isOpen={isCheckoutOpen} 
        onClose={() => {
          setIsCheckoutOpen(false);
          onClose(); // Auto close the cart details if payment was successful or dismissed
        }} 
      />

      {editingVariant && (
        <VariantModal
          product={editingVariant.product}
          isOpen={true}
          onClose={() => setEditingVariant(null)}
          onSelectVariant={(p, newVariantName) => {
            updateItemVariant(editingVariant.itemId, newVariantName);
            setEditingVariant(null);
          }}
        />
      )}
    </>
  );
}
