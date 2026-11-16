
import { useOfflineSync } from "../../hooks/useOfflineSync";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function NetworkStatusBadge() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useOfflineSync();

  return (
    <div className="flex items-center gap-2">
      {/* Network indicator */}
      {isOnline ? (
        <span 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200"
          title="Terhubung ke server"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <Wifi className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Online</span>
        </span>
      ) : (
        <span 
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-300"
          title="Koneksi offline. Transaksi disimpan di perangkat."
        >
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline</span>
        </span>
      )}

      {/* Pending Sync Button if any */}
      {pendingCount > 0 && (
        <button
          onClick={() => syncNow(false)}
          disabled={isSyncing || !isOnline}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-orange/10 text-orange border border-orange/30 hover:bg-orange/20 transition-all disabled:opacity-60"
          title={isOnline ? "Klik untuk menyinkronkan transaksi ke server sekarang" : "Menunggu koneksi internet untuk sinkronisasi"}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin" : ""}`} />
          <span>{pendingCount} Sync</span>
        </button>
      )}
    </div>
  );
}
