
import { useQuery } from "@tanstack/react-query";
import api from "../lib/api";
import { useEffect } from "react";
import { format } from "date-fns";
import { offlineStorage } from "../lib/offlineStorage";

import { useParams } from "react-router-dom";

export default function ReceiptPage() {
  const { id = "" } = useParams<{ id: string }>();
  const { data: sale, isLoading } = useQuery({
    queryKey: ["sale", id],
    queryFn: async () => {
      // Check offline storage first if it's an offline transaction or network is offline
      if (typeof window !== "undefined" && (!navigator.onLine || id.startsWith("OFF-"))) {
        const offlineSale = offlineStorage.getSaleById(id);
        if (offlineSale) return offlineSale;
      }

      try {
        const res = await api.get(`/sales/${id}`);
        return res.data.data;
      } catch (err) {
        // Fallback to offline storage
        const offlineSale = offlineStorage.getSaleById(id);
        if (offlineSale) return offlineSale;
        throw err;
      }
    },
  });

  useEffect(() => {
    if (sale) {
      setTimeout(() => {
        window.print();
      }, 500);
    }
  }, [sale]);

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);

  if (isLoading) return <div className="p-8 text-center text-gray-500">Memuat struk...</div>;
  if (!sale) return <div className="p-8 text-center text-red">Transaksi tidak ditemukan.</div>;

  return (
    <div className="receipt-print bg-white min-h-screen p-8 text-black print:p-0 print:m-0 font-mono text-sm max-w-sm mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold mb-1">{sale.outlet?.name || "Struk Pembayaran"}</h1>
        {sale.outlet?.address && <p className="text-xs text-gray-600">{sale.outlet.address}</p>}
        {sale.outlet?.phone && <p className="text-xs text-gray-600">Telp: {sale.outlet.phone}</p>}
      </div>

      <div className="border-b border-dashed border-gray-400 pb-2 mb-2 text-xs">
        <div className="flex justify-between mb-1">
          <span>No: {sale.invoiceNumber}</span>
          <span>{format(new Date(sale.createdAt || sale.offlineCreatedAt || new Date()), "dd/MM/yy HH:mm")}</span>
        </div>
        <div className="flex justify-between">
          <span>Kasir: {sale.cashier?.name || "-"}</span>
          <span>Metode: {sale.paymentMethod}</span>
        </div>
        {sale.member && (
          <div className="flex justify-between mt-1 pt-1 border-t border-dashed border-gray-200">
            <span>Pelanggan: {sale.member.name}</span>
            {sale.member.points !== undefined && <span>Poin: {sale.member.points}</span>}
          </div>
        )}
      </div>

      <div className="border-b border-dashed border-gray-400 pb-2 mb-2">
        {sale.items?.map((item: any, idx: number) => (
          <div key={item.id || idx} className="mb-2">
            <div className="font-bold">{item.product?.name || item.variantName || "Produk"}</div>
            <div className="flex justify-between text-xs">
              <span>{item.quantity} x {formatIDR(item.unitPrice || 0)}</span>
              <span>{formatIDR(item.subtotal || 0)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="border-b border-dashed border-gray-400 pb-2 mb-4 text-xs">
        <div className="flex justify-between mb-1">
          <span>Subtotal</span>
          <span>{formatIDR(sale.subtotal || 0)}</span>
        </div>
        {sale.discountAmount > 0 && (
          <div className="flex justify-between mb-1">
            <span>Diskon</span>
            <span>-{formatIDR(sale.discountAmount)}</span>
          </div>
        )}
        {sale.taxAmount > 0 && (
          <div className="flex justify-between mb-1">
            <span>Pajak (10%)</span>
            <span>{formatIDR(sale.taxAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed border-gray-400">
          <span>TOTAL</span>
          <span>{formatIDR(sale.total || 0)}</span>
        </div>
      </div>

      {sale.paymentMethod === "CASH" && sale.amountPaid > sale.total && (
        <div className="text-xs">
          <div className="flex justify-between mb-1">
            <span>Tunai / Bayar</span>
            <span>{formatIDR(sale.amountPaid)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>Kembali</span>
            <span>{formatIDR(sale.changeAmount || 0)}</span>
          </div>
        </div>
      )}

      <div className="text-center mt-8 text-xs text-gray-500">
        <p>Terima kasih atas kunjungan Anda!</p>
        <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan.</p>
        {sale.isOffline && <p className="mt-2 text-[10px] text-orange italic">* Struk Offline Tersimpan di Perangkat</p>}
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { margin: 0; size: 80mm auto; }
          html, body {
            background-color: white !important;
          }
          .receipt-print { 
            margin: 0 !important;
            padding: 10px !important;
          }
        }
      `}} />
    </div>
  );
}
