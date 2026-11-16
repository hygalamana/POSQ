
import { useState, useEffect, useCallback } from "react";
import { offlineStorage, OfflineSale } from "../lib/offlineStorage";
import api from "../lib/api";
import toast from "react-hot-toast";

export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [pendingCount, setPendingCount] = useState<number>(0);

  // Refresh pending count
  const refreshPendingCount = useCallback(() => {
    const queue = offlineStorage.getSalesQueue();
    setPendingCount(queue.length);
  }, []);

  // Perform sync
  const syncNow = useCallback(async (silent = false) => {
    const queue = offlineStorage.getSalesQueue();
    if (queue.length === 0) {
      if (!silent) toast.success("Semua data transaksi sudah tersinkronkan.");
      return;
    }

    if (!navigator.onLine) {
      if (!silent) toast.error("Perangkat masih dalam mode offline.");
      return;
    }

    setIsSyncing(true);
    const toastId = !silent ? toast.loading(`Menyinkronkan ${queue.length} transaksi offline...`) : null;

    try {
      const res = await api.post("/sales/sync-offline", { sales: queue });
      const results: { offlineTempId: string; status: string; message?: string }[] = res.data.data || [];

      let syncedCount = 0;
      results.forEach((item) => {
        if (item.status === "SYNCED" || item.status === "SKIPPED_EXISTING") {
          offlineStorage.removeSaleFromQueue(item.offlineTempId);
          syncedCount++;
        }
      });

      refreshPendingCount();

      if (toastId) toast.dismiss(toastId);
      if (syncedCount > 0) {
        toast.success(`✅ Berhasil menyinkronkan ${syncedCount} transaksi offline ke server!`, { duration: 4000 });
      }
    } catch (err: any) {
      console.error("Sync error:", err);
      if (toastId) toast.dismiss(toastId);
      if (!silent) toast.error("Gagal menyinkronkan data offline: " + (err.response?.data?.error?.message || err.message));
    } finally {
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  useEffect(() => {
    // Initial status
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      refreshPendingCount();

      const handleOnline = () => {
        setIsOnline(true);
        toast.success("Koneksi internet terhubung kembali! Memulai sinkronisasi...", { id: "net-status", duration: 3000 });
        syncNow(true);
      };

      const handleOffline = () => {
        setIsOnline(false);
        toast.error("Mode Offline: Transaksi akan disimpan di perangkat dan disinkronkan saat online.", { id: "net-status", duration: 4000 });
      };

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);

      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, [syncNow, refreshPendingCount]);

  return {
    isOnline,
    isSyncing,
    pendingCount,
    syncNow,
    refreshPendingCount,
  };
}
