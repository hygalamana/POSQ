
import { useProducts } from "../../hooks/useProducts";
import { useCartStore, Product } from "../../stores/cartStore";
import { Check } from "lucide-react";
import VariantModal from "./VariantModal";
import { useState } from "react";

interface Props {
  categoryId: string;
  searchQuery: string;
}

export default function ProductGrid({ categoryId, searchQuery }: Props) {
  const { data: products, isLoading } = useProducts(categoryId, searchQuery);
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 0) {
      setSelectedProduct(product);
    } else {
      addItem(product);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="animate-pulse bg-white rounded-2xl h-48 border-2 border-transparent"></div>
        ))}
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-lg font-semibold">Tidak ada produk ditemukan</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
      {products.map((product: Product) => {
        const inCart = !!cartItems[product.id];
        
        return (
          <div
            key={product.id}
            onClick={() => handleProductClick(product)}
            className={`bg-white rounded-2xl overflow-hidden cursor-pointer transition-all border-2 relative
              ${inCart ? "border-orange shadow-[0_0_0_3px_rgba(249,115,22,0.12)]" : "border-transparent hover:border-orange-light hover:shadow-lg hover:-translate-y-0.5"}
            `}
          >
            <div className={`absolute top-2 right-2 w-6 h-6 bg-orange rounded-full flex items-center justify-center transition-opacity ${inCart ? "opacity-100" : "opacity-0"}`}>
              <Check className="w-4 h-4 text-white font-bold" />
            </div>
            
            <div className="w-full h-28 bg-orange-pale flex items-center justify-center text-4xl">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
              ) : (
                product.emoji
              )}
            </div>
            <div className="p-3">
              <h3 className="text-[13px] font-bold text-gray-900 mb-1 leading-tight line-clamp-2">{product.name}</h3>
              <p className="text-[14px] font-extrabold text-orange">
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(product.price)}
              </p>
            </div>
          </div>
        );
      })}

      {selectedProduct && (
        <VariantModal
          product={selectedProduct}
          isOpen={true}
          onClose={() => setSelectedProduct(null)}
          onSelectVariant={(p, variantName) => {
            addItem(p, variantName);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
