
import { X } from "lucide-react";
import { Product } from "../../stores/cartStore";

interface Props {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onSelectVariant: (product: Product, variantName: string) => void;
}

export default function VariantModal({ product, isOpen, onClose, onSelectVariant }: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-cream/30">
          <div>
            <h2 className="text-lg font-bold text-gray-900 leading-tight">{product.name}</h2>
            <p className="text-sm text-gray-500">Pilih Varian</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          <button
            onClick={() => {
              onSelectVariant(product, "");
              onClose();
            }}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-orange hover:bg-orange-pale transition-all text-left group"
          >
            <span className="font-semibold text-gray-800 group-hover:text-orange">Original</span>
            <span className="font-bold text-orange">
              {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
            </span>
          </button>

          {product.variants?.map((variant, idx) => (
            <button
              key={idx}
              onClick={() => {
                onSelectVariant(product, variant.name);
                onClose();
              }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-orange hover:bg-orange-pale transition-all text-left group"
            >
              <span className="font-semibold text-gray-800 group-hover:text-orange">{variant.name}</span>
              <span className="font-bold text-orange">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(variant.price)}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
