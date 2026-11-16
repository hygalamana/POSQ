
import { Store, LayoutDashboard, ShoppingBag, PieChart, Settings } from 'lucide-react';
import { Link, usePathname } from '@/lib/routerCompat';
import { useAuthStore } from '../../stores/authStore';

export default function BottomNav() {
  const pathname = usePathname();
  const user = useAuthStore(state => state.user);
  
  const allNavItems = [
    { icon: <Store className="w-6 h-6" />, path: '/', label: 'Kasir', allowedRoles: ['OWNER', 'MANAGER', 'CASHIER'] },
    { icon: <LayoutDashboard className="w-6 h-6" />, path: '/transactions', label: 'Transaksi', allowedRoles: ['OWNER', 'MANAGER', 'CASHIER'] },
    { icon: <ShoppingBag className="w-6 h-6" />, path: '/products', label: 'Produk', allowedRoles: ['OWNER', 'MANAGER'] },
    { icon: <PieChart className="w-6 h-6" />, path: '/reports', label: 'Laporan', allowedRoles: ['OWNER', 'MANAGER'] },
    { icon: <Settings className="w-6 h-6" />, path: '/settings', label: 'Pengaturan', allowedRoles: ['OWNER'] },
  ];

  const navItems = allNavItems.filter(item => item.allowedRoles.includes(user?.role || 'CASHIER'));

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around pb-safe pt-2 px-2 z-50">
      {navItems.map((item, idx) => {
        const isActive = pathname === item.path || (item.path === '/settings' && pathname?.startsWith('/settings'));
        return (
          <Link 
            href={item.path} 
            key={idx} 
            className={`flex flex-col items-center p-2 rounded-xl transition-all
              ${isActive ? 'text-orange' : 'text-gray-400'}
            `}
          >
            <div className={`${isActive ? 'bg-orange-pale p-1.5 rounded-lg' : ''}`}>
              {item.icon}
            </div>
            <span className="text-[10px] font-semibold mt-1">{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
