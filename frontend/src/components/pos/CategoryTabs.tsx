
import { useCategories } from "../../hooks/useCategories";

interface Props {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export default function CategoryTabs({ selectedCategory, onSelectCategory }: Props) {
  const { data: categories, isLoading } = useCategories();

  if (isLoading) return <div className="animate-pulse h-10 bg-gray-200 rounded-xl mb-6 w-full max-w-md"></div>;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 mb-6 scrollbar-none">
      <button
        onClick={() => onSelectCategory("")}
        className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2
          ${selectedCategory === "" 
            ? "bg-orange text-white border-orange shadow-[0_2px_8px_rgba(249,115,22,0.25)]" 
            : "bg-white text-gray-500 border-gray-200 hover:border-orange-light hover:text-orange"}
        `}
      >
        Semua
      </button>
      {categories?.map((cat) => (
        <button
          key={cat.id}
          onClick={() => onSelectCategory(cat.id)}
          className={`px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all border-2 flex items-center gap-2
            ${selectedCategory === cat.id 
              ? "bg-orange text-white border-orange shadow-[0_2px_8px_rgba(249,115,22,0.25)]" 
              : "bg-white text-gray-500 border-gray-200 hover:border-orange-light hover:text-orange"}
          `}
        >
          {cat.icon && <span>{cat.icon}</span>}
          {cat.name}
        </button>
      ))}
    </div>
  );
}
