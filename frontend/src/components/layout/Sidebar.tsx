
import { Store, LayoutDashboard, ShoppingBag, PieChart, Settings } from 'lucide-react';
import { Link, usePathname } from '@/lib/routerCompat';
import { useAuthStore } from '../../stores/authStore';

export default function Sidebar() {
  const pathname = usePathname();
  
  const user = useAuthStore(state => state.user);
  
  const allNavItems = [
    { icon: <Store className="w-6 h-6" />, path: '/', tooltip: 'Kasir', allowedRoles: ['OWNER', 'MANAGER', 'CASHIER'] },
    { icon: <LayoutDashboard className="w-6 h-6" />, path: '/transactions', tooltip: 'Transaksi', allowedRoles: ['OWNER', 'MANAGER', 'CASHIER'] },
    { icon: <ShoppingBag className="w-6 h-6" />, path: '/products', tooltip: 'Produk', allowedRoles: ['OWNER', 'MANAGER'] },
    { icon: <PieChart className="w-6 h-6" />, path: '/reports', tooltip: 'Laporan', allowedRoles: ['OWNER', 'MANAGER'] },
  ];

  const navItems = allNavItems.filter(item => item.allowedRoles.includes(user?.role || 'CASHIER'));

  return (
    <div className="w-[80px] bg-white border-r border-gray-100 hidden md:flex flex-col items-center py-5 gap-2 z-10 shrink-0">
      <div className="w-12 h-12 bg-orange rounded-2xl flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(249,115,22,0.35)]">
        <span className="text-white font-black text-sm tracking-wide">PosQ</span>
      </div>
      
      {navItems.map((item, idx) => {
        const isActive = pathname === item.path;
        return (
          <Link 
            href={item.path} 
            key={idx} 
            className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group mb-2
              ${isActive ? 'bg-orange-pale text-orange' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}
            `}
          >
            {item.icon}
            <div className="absolute left-[64px] bg-gray-900 text-white text-[12px] font-semibold py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 z-50">
              {item.tooltip}
            </div>
          </Link>
        );
      })}

      <div className="flex-1"></div>
      
      {user?.role === 'OWNER' && (
        <Link 
          href="/settings"
          className={`w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all relative group
            ${pathname?.startsWith('/settings') ? 'bg-orange-pale text-orange' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'}
          `}
        >
          <Settings className="w-6 h-6" />
          <div className="absolute left-[64px] bg-gray-900 text-white text-[12px] font-semibold py-1.5 px-3 rounded-lg whitespace-nowrap opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 z-50">
            Pengaturan
          </div>
        </Link>
      )}
    </div>
  );
}
