
import { useState, useEffect } from "react";
import { useAuthStore } from "../stores/authStore";
import { User, Store, LogOut, Edit2, Download, CheckCircle2, Smartphone, X } from "lucide-react";
import { useRouter } from '@/lib/routerCompat';
import toast from "react-hot-toast";
import EditProfileModal from "../components/settings/EditProfileModal";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false);

  // PWA State
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check standalone mode
    const standalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // Check iOS
    const ua = window.navigator.userAgent;
    const iOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream;
    setIsIOS(iOS);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallPWA = async () => {
    if (isStandalone) {
      toast.success("Aplikasi sudah terpasang di perangkat Anda");
      return;
    }

    if (isIOS) {
      setIsIOSModalOpen(true);
      return;
    }

    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        toast.success("Aplikasi PosQ berhasil dipasang!");
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      toast("Untuk menginstall, Anda juga bisa klik menu browser (titik tiga) lalu pilih 'Install Aplikasi' atau 'Tambahkan ke Layar Utama'.", {
        icon: "ℹ️",
        duration: 5000,
      });
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom">
      <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Pengaturan</h1>

      <div className="max-w-2xl space-y-6">
        {/* User Profile Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-orange-pale rounded-full flex items-center justify-center text-orange shrink-0 overflow-hidden text-2xl relative group-hover:shadow-md transition-all">
              {user?.avatar ? (
                user.avatar.startsWith('http') ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user.avatar}</span>
                )
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-gray-900">{user?.name || "Kasir"}</h2>
                <span className="bg-orange text-white text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
                  {user?.role || "STAFF"}
                </span>
              </div>
              <p className="text-sm text-gray-500 mb-3">{user?.email || "Email tidak tersedia"}</p>
              
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-600 bg-gray-50/50 p-2 rounded-lg border border-gray-100 inline-flex">
                <div className="flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-gray-400" />
                  <span>{(user as any)?.outlet?.name || <span className="text-orange">PosQ</span>} Pusat</span>
                </div>
                <div className="w-1 h-1 rounded-full bg-gray-300"></div>
                <div className="flex items-center gap-1.5">
                  {(user as any)?.outlet?.hasTax ? (
                    <span>Pajak: {((user as any)?.outlet?.taxRate || 0) * 100}%</span>
                  ) : (
                    <span className="text-gray-400">Tanpa Pajak</span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="p-3 text-gray-400 hover:text-orange hover:bg-orange-pale rounded-xl transition-colors"
          >
            <Edit2 className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons Group */}
        <div className="space-y-3">
          {/* Financial Action */}
          <button 
            onClick={() => router.push('/settings/cashflow')}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-colors group"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
              <div className="w-10 h-10 rounded-xl bg-green-light flex items-center justify-center text-green shrink-0">
                <span className="font-bold text-lg">Rp</span>
              </div>
              <span className="font-bold text-left text-sm sm:text-base">Manajemen Arus Kas (Cashflow)</span>
            </div>
          </button>

          {/* Member Management Action */}
          <button 
            onClick={() => router.push('/settings/members')}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-colors group"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
              <div className="w-10 h-10 rounded-xl bg-orange-pale flex items-center justify-center text-orange shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <span className="font-bold text-left text-sm sm:text-base">Manajemen Pelanggan (Member)</span>
            </div>
          </button>

          {/* System Backup Action */}
          <button 
            onClick={() => router.push('/settings/backup')}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-colors group"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              </div>
              <span className="font-bold text-left text-sm sm:text-base">Backup &amp; Restore Database</span>
            </div>
          </button>

          {/* Account Management Action */}
          <button 
            onClick={() => router.push('/settings/accounts')}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-gray-50 rounded-2xl border border-gray-100 shadow-sm transition-colors group"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-gray-700">
              <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
              </div>
              <span className="font-bold text-left text-sm sm:text-base">Manajemen Akun (Kasir &amp; Manajer)</span>
            </div>
          </button>

          {/* Install Application (PWA) Action - Positioned above Logout */}
          <button 
            onClick={handleInstallPWA}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-orange-pale/30 rounded-2xl border border-orange/20 shadow-sm transition-colors group"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-gray-800">
              <div className="w-10 h-10 rounded-xl bg-orange-pale flex items-center justify-center text-orange shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div className="flex flex-col text-left">
                <span className="font-bold text-sm sm:text-base">Install Aplikasi (PWA)</span>
                <span className="text-xs text-gray-400 font-normal">Pasang aplikasi kasir langsung ke layar perangkat Anda</span>
              </div>
            </div>
            {isStandalone ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-green bg-green-light px-2.5 py-1 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" /> Terpasang
              </span>
            ) : (
              <span className="text-xs font-semibold text-orange bg-orange-pale px-2.5 py-1 rounded-lg">
                Install
              </span>
            )}
          </button>

          {/* Logout Action */}
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-between p-3 sm:p-4 bg-white hover:bg-red/5 rounded-2xl border border-red/20 shadow-sm transition-colors group mt-6"
          >
            <div className="flex items-center gap-3 sm:gap-4 text-red">
              <div className="w-10 h-10 rounded-xl bg-red/10 flex items-center justify-center text-red shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <span className="font-bold text-sm sm:text-base">Keluar (Logout)</span>
            </div>
          </button>
        </div>
      </div>

      <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />

      {/* iOS Install Instruction Modal */}
      {isIOSModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-orange" />
                <h3 className="font-bold text-gray-900 text-base">Cara Install di iOS / iPhone</h3>
              </div>
              <button onClick={() => setIsIOSModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-pale text-orange font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">1</div>
                <p>Ketuk ikon <strong>Bagikan / Share</strong> (kotak panah atas di Safari browser).</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-pale text-orange font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">2</div>
                <p>Scroll ke bawah dan pilih <strong>&quot;Tambah ke Layar Utama&quot; (Add to Home Screen)</strong>.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-orange-pale text-orange font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">3</div>
                <p>Ketuk <strong>Tambah (Add)</strong> di pojok kanan atas.</p>
              </div>
            </div>

            <button
              onClick={() => setIsIOSModalOpen(false)}
              className="w-full py-2.5 bg-orange text-white rounded-xl font-bold text-sm hover:bg-orange-dark transition-colors"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
