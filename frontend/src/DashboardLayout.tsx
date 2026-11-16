import { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useAuthStore } from "./stores/authStore";
import Sidebar from "./components/layout/Sidebar";
import BottomNav from "./components/layout/BottomNav";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const pathname = location.pathname;

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !accessToken) {
      navigate("/login", { replace: true });
    } else if (isMounted && user && pathname) {
      if (user.role === 'CASHIER' && !['/', '/transactions'].includes(pathname) && !pathname.startsWith('/receipt')) {
        navigate('/', { replace: true });
      } else if (user.role === 'MANAGER' && pathname.startsWith('/settings')) {
        navigate('/', { replace: true });
      }
    }
  }, [accessToken, user, pathname, isMounted, navigate]);

  if (!isMounted || !accessToken) {
    return (
      <div className="flex h-screen items-center justify-center bg-cream">
        <div className="w-8 h-8 border-4 border-orange border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cream print:h-auto print:overflow-visible print:bg-white">
      <div className="print:hidden">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden pb-16 md:pb-0 print:overflow-visible print:pb-0">
        <Outlet />
      </div>
      <div className="print:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
