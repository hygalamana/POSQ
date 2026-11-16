
import { useState } from "react";
import { useCartStore } from "../../stores/cartStore";
import { useAuthStore } from "../../stores/authStore";
import { useQuery } from "@tanstack/react-query";
import { X, CheckCircle2, Printer, Percent, DollarSign, User, Search, Bluetooth } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../lib/api";
import Link from '@/lib/routerCompat';
import { QRCodeSVG } from 'qrcode.react';
import { generateDynamicQris } from '../../lib/qris';
import { bluetoothPrinter } from "../../lib/bluetoothPrinter";

import { offlineStorage, OfflineSale } from "../../lib/offlineStorage";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function CheckoutModal({ isOpen, onClose }: Props) {
  const { items, subtotal, tax, total, discountType, discountValue, discountAmount, setDiscount, clearCart } = useCartStore();
  const hasTax = useAuthStore(state => state.user?.outlet?.hasTax ?? true);
  const [showDiscount, setShowDiscount] = useState(false);
  const [showMember, setShowMember] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [completedSaleId, setCompletedSaleId] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<any>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");
  const [memberSearch, setMemberSearch] = useState("");
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const [isWaitingQris, setIsWaitingQris] = useState(false);

  const { data: members } = useQuery({
    queryKey: ["members"],
    queryFn: async () => {
      if (typeof window !== "undefined" && !navigator.onLine) {
        return offlineStorage.getMembers();
      }
      try {
        const res = await api.get("/members");
        const memberList = res.data.data;
        if (Array.isArray(memberList)) {
          offlineStorage.saveMembers(memberList);
        }
        return memberList;
      } catch (err) {
        return offlineStorage.getMembers();
      }
    },
    enabled: isOpen,
  });

  const formatIDR = (amount: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);

  const selectedMember = members?.find((m: any) => m.id === selectedMemberId);

  const maxPointsToUse = selectedMember ? Math.min(selectedMember.points, total) : 0;
  const pointsDiscountAmount = usePoints ? maxPointsToUse : 0;
  const finalTotal = Math.max(0, total - pointsDiscountAmount);

  if (!isOpen) return null;

  const saveOfflineTransaction = (paid: number) => {
    const user = useAuthStore.getState().user;
    const offlineId = offlineStorage.generateOfflineInvoiceNumber();
    const change = paymentMethod === "CASH" ? Math.max(0, paid - finalTotal) : 0;

    const offlineSale: OfflineSale = {
      offlineTempId: offlineId,
      invoiceNumber: offlineId,
      offlineCreatedAt: new Date().toISOString(),
      paymentMethod,
      amountPaid: paymentMethod === "CASH" ? paid : finalTotal,
      discountAmount: discountAmount + pointsDiscountAmount,
      subtotal,
      taxAmount: tax,
      total: finalTotal,
      changeAmount: change,
      usePoints,
      memberId: selectedMemberId || undefined,
      customerName: selectedMember?.name,
      items: Object.values(items).map(item => ({
        productId: item.product.id,
        quantity: item.quantity,
        variantName: item.variantName || undefined,
        unitPrice: item.variantName ? (item.product.variants?.find((v: any) => v.name === item.variantName)?.price || item.product.price) : item.product.price,
        subtotal: (item.variantName ? (item.product.variants?.find((v: any) => v.name === item.variantName)?.price || item.product.price) : item.product.price) * item.quantity,
        product: {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          emoji: item.product.emoji,
        },
      })),
      cashier: {
        id: user?.id || 'cashier',
        name: user?.name || 'Kasir',
      },
      outlet: user?.outlet ? {
        id: user.outlet.id,
        name: user.outlet.name,
        address: user.outlet.address,
        phone: user.outlet.phone,
      } : undefined,
      member: selectedMember ? {
        id: selectedMember.id,
        name: selectedMember.name,
        points: selectedMember.points,
      } : undefined,
      isOffline: true,
    };

    offlineStorage.saveSaleToQueue(offlineSale);
    setCompletedSale(offlineSale);
    setCompletedSaleId(offlineSale.offlineTempId);
    setIsSuccess(true);
    clearCart();
    toast.success("💾 Transaksi disimpan di perangkat (Mode Offline)", { duration: 4000 });
  };

  const handleCheckout = async (skipQrisCheck = false) => {
    const paid = amountPaid === "" ? finalTotal : Number(amountPaid); // Default exact amount if empty
    if (paymentMethod === "CASH" && paid < finalTotal) {
      return toast.error("Nominal uang kurang dari total");
    }

    if (paymentMethod === "QRIS" && !skipQrisCheck && useAuthStore.getState().user?.outlet?.qrisPayload) {
      setIsWaitingQris(true);
      return;
    }

    // Check if offline
    if (typeof window !== "undefined" && !navigator.onLine) {
      saveOfflineTransaction(paid);
      return;
    }

    try {
      setIsLoading(true);
      const payload = {
        paymentMethod,
        amountPaid: paymentMethod === "CASH" ? paid : finalTotal,
        discountAmount,
        usePoints,
        memberId: selectedMemberId || undefined,
        items: Object.values(items).map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          variantName: item.variantName || undefined,
        })),
      };

      const res = await api.post("/sales", payload);
      setCompletedSale(res.data.data);
      setCompletedSaleId(res.data.data.id);
      setIsSuccess(true);
      clearCart();
    } catch (error: any) {
      // If server unreachable / network failure, automatically save offline
      if (!error.response || error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
        saveOfflineTransaction(paid);
      } else {
        toast.error(error.response?.data?.error?.message || "Gagal membuat transaksi");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full flex flex-col items-center">
          <div className="w-16 h-16 bg-green-light rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-10 h-10 text-green" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran Berhasil</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">Transaksi telah tersimpan ke dalam sistem.</p>
          <div className="w-full space-y-3">
            {completedSaleId && (
              <button
                onClick={() => {
                  const iframe = document.createElement('iframe');
                  iframe.style.position = 'absolute';
                  iframe.style.width = '0';
                  iframe.style.height = '0';
                  iframe.style.border = 'none';
                  iframe.src = `/receipt/${completedSaleId}`;
                  document.body.appendChild(iframe);
                  setTimeout(() => { document.body.removeChild(iframe); }, 10000);
                }}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Printer className="w-5 h-5" /> Cetak Struk
              </button>
            )}
            {completedSale && (
              <button
                onClick={async () => {
                  try {
                    toast.loading("Menghubungkan printer...", { id: "bt" });
                    await bluetoothPrinter.connect();
                    toast.loading("Mencetak...", { id: "bt" });
                    
                    const user = useAuthStore.getState().user;
                    
                    await bluetoothPrinter.printReceipt({
                      outletName: user?.outlet?.name || "PosQ",
                      address: user?.outlet?.address || "",
                      phone: user?.outlet?.phone || "",
                      invoiceNumber: completedSale.invoiceNumber,
                      date: completedSale.createdAt,
                      cashierName: user?.name || "Kasir",
                      items: completedSale.items.map((i: any) => ({
                        product: { name: i.product?.name || 'Produk' },
                        quantity: i.quantity || 0,
                        price: i.unitPrice || 0,
                        subtotal: i.subtotal || 0,
                      })),
                      subtotal: completedSale.subtotal || 0,
                      discountAmount: completedSale.discountAmount || 0,
                      tax: completedSale.taxAmount || 0,
                      total: completedSale.total || 0,
                      paymentMethod: completedSale.paymentMethod || 'CASH',
                      amountPaid: completedSale.amountPaid || completedSale.total || 0,
                      member: completedSale.member ? { name: completedSale.member.name, points: completedSale.member.points || 0 } : undefined,
                    });

                    toast.success("Berhasil dicetak", { id: "bt" });
                    setTimeout(() => bluetoothPrinter.disconnect(), 2000);
                  } catch (error: any) {
                    toast.error(error.message || "Gagal mencetak Bluetooth", { id: "bt" });
                    bluetoothPrinter.disconnect();
                  }
                }}
                className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <Bluetooth className="w-5 h-5" /> Cetak Bluetooth (Thermal)
              </button>
            )}
            <button
              onClick={() => {
                setIsSuccess(false);
                setCompletedSaleId(null);
                setCompletedSale(null);
                onClose();
              }}
              className="w-full bg-orange text-white font-bold py-3 px-4 rounded-xl hover:bg-orange-dark transition-colors"
            >
              Selesai & Tutup
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isWaitingQris) {
    const qrisPayload = useAuthStore.getState().user?.outlet?.qrisPayload;
    const dynamicQris = qrisPayload ? generateDynamicQris(qrisPayload, total) : "";
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl p-8 max-w-sm w-full flex flex-col items-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Pembayaran QRIS</h2>
          <p className="text-sm text-gray-500 mb-6 text-center">Silakan minta pelanggan scan kode QR di bawah ini untuk membayar sebesar <span className="font-bold text-orange">{formatIDR(finalTotal)}</span>.</p>
          
          <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm mb-6 flex justify-center">
            {dynamicQris ? (
              <QRCodeSVG value={dynamicQris} size={200} />
            ) : (
              <div className="w-[200px] h-[200px] flex items-center justify-center text-gray-400 bg-gray-50 rounded-lg text-center p-4 text-sm font-semibold border-2 border-dashed border-gray-200">
                Data QRIS tidak valid. Cek pengaturan profil Anda.
              </div>
            )}
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={() => handleCheckout(true)}
              disabled={isLoading}
              className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm disabled:opacity-70"
            >
              {isLoading ? "Memproses..." : "Konfirmasi Berhasil Dibayar"}
            </button>
            <button
              onClick={() => setIsWaitingQris(false)}
              disabled={isLoading}
              className="w-full bg-gray-100 text-gray-600 font-bold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors"
            >
              Kembali
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Checkout</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Subtotal</span>
              <span className="text-gray-900 font-semibold">{formatIDR(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500 mb-2">
                <span>Diskon</span>
                <span className="text-red font-semibold">-{formatIDR(discountAmount)}</span>
              </div>
            )}
            {hasTax && (
              <div className="flex justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
                <span>Pajak ({useAuthStore.getState().user?.outlet?.taxRate ? (useAuthStore.getState().user?.outlet?.taxRate! * 100) : 10}%)</span>
                <span className="text-gray-900 font-semibold">{formatIDR(tax)}</span>
              </div>
            )}
            {usePoints && pointsDiscountAmount > 0 && (
              <div className="flex justify-between text-sm text-gray-500 mb-3 pb-3 border-b border-gray-200">
                <span className="text-orange">Potongan Poin ({maxPointsToUse} Poin)</span>
                <span className="text-orange font-semibold">-{formatIDR(pointsDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-extrabold text-gray-900">
              <span>{usePoints && pointsDiscountAmount > 0 ? 'Total Akhir' : 'Total'}</span>
              <span className="text-orange">{formatIDR(finalTotal)}</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Tambah Diskon</label>
              <button
                type="button"
                onClick={() => {
                  setShowDiscount(!showDiscount);
                  if (showDiscount) setDiscount('nominal', 0); // Reset discount if closing
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showDiscount ? 'bg-orange' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showDiscount ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {showDiscount && (
              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2">
                <button
                  onClick={() => setDiscount('nominal', discountValue)}
                  className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${discountType === 'nominal' ? 'bg-orange-pale border-orange text-orange' : 'border-gray-200 text-gray-500'}`}
                  title="Nominal (Rp)"
                >
                  <DollarSign className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDiscount('percentage', discountValue)}
                  className={`px-3 rounded-xl border flex items-center justify-center transition-colors ${discountType === 'percentage' ? 'bg-orange-pale border-orange text-orange' : 'border-gray-200 text-gray-500'}`}
                  title="Persen (%)"
                >
                  <Percent className="w-4 h-4" />
                </button>
                <input
                  type="number"
                  value={discountValue || ""}
                  onChange={(e) => setDiscount(discountType, Number(e.target.value))}
                  placeholder={discountType === 'percentage' ? "0 - 100" : "0"}
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors bg-gray-50 focus:bg-white"
                />
              </div>
            )}
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">Tambah Pelanggan (Member)</label>
              <button
                type="button"
                onClick={() => {
                  setShowMember(!showMember);
                  if (showMember) setSelectedMemberId(""); // Reset member if closing
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${showMember ? 'bg-orange' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showMember ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            
            {showMember && (
              <div className="relative animate-in fade-in slide-in-from-top-2">
                {selectedMemberId ? (
                  <div className="flex items-center justify-between p-3 rounded-xl border-2 border-orange bg-orange-pale text-orange shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm text-orange">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-bold text-sm">{selectedMember?.name}</div>
                        <div className="text-xs opacity-90">{selectedMember?.points} Poin Loyalitas</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      {selectedMember?.points > 0 && (
                        <div className="flex items-center gap-2 pr-4 border-r border-orange/20">
                          <input 
                            type="checkbox" 
                            id="usePoints" 
                            checked={usePoints}
                            onChange={(e) => setUsePoints(e.target.checked)}
                            className="w-6 h-6 text-orange border-white rounded focus:ring-orange accent-white cursor-pointer"
                          />
                          <label htmlFor="usePoints" className="text-sm font-bold cursor-pointer text-white">
                            Gunakan Poin
                          </label>
                        </div>
                      )}
                      <button 
                        type="button"
                        onClick={() => {
                          setSelectedMemberId("");
                          setUsePoints(false);
                        }} 
                        className="p-2 hover:bg-white/60 rounded-xl transition-colors text-orange"
                        title="Batal Pilih Member"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari & Pilih Member (Ketik nama/nomor HP)..."
                      value={memberSearch}
                      onChange={(e) => {
                        setMemberSearch(e.target.value);
                        setIsMemberDropdownOpen(true);
                      }}
                      onFocus={() => setIsMemberDropdownOpen(true)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange focus:ring-1 focus:ring-orange bg-white transition-all text-sm shadow-sm"
                    />
                    
                    {isMemberDropdownOpen && (
                      <>
                        <div 
                          className="fixed inset-0 z-0" 
                          onClick={() => setIsMemberDropdownOpen(false)}
                        ></div>
                        <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-56 overflow-y-auto overflow-hidden animate-in fade-in slide-in-from-top-2">
                          {members?.filter((m: any) => 
                            m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                            (m.phone && m.phone.includes(memberSearch))
                          ).length === 0 ? (
                            <div className="p-4 text-sm text-gray-500 text-center flex flex-col items-center gap-2">
                              <User className="w-8 h-8 text-gray-300" />
                              <p>Member tidak ditemukan</p>
                            </div>
                          ) : (
                            members?.filter((m: any) => 
                              m.name.toLowerCase().includes(memberSearch.toLowerCase()) || 
                              (m.phone && m.phone.includes(memberSearch))
                            ).map((member: any) => (
                              <button
                                type="button"
                                key={member.id}
                                onClick={() => {
                                  setSelectedMemberId(member.id);
                                  setIsMemberDropdownOpen(false);
                                  setMemberSearch("");
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-orange-pale hover:text-orange border-b border-gray-50 last:border-0 transition-colors flex items-center gap-3 group"
                              >
                                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-orange group-hover:text-white transition-colors shrink-0 text-gray-400">
                                  <User className="w-5 h-5" />
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900 group-hover:text-orange text-sm mb-0.5">{member.name}</div>
                                  <div className="text-xs text-gray-500">{member.phone || '-'} • <span className="font-semibold text-orange">{member.points} Poin</span></div>
                                </div>
                              </button>
                            ))
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Metode Pembayaran</label>
            <div className="grid grid-cols-2 gap-3">
              {['CASH', 'QRIS', 'CARD', 'TRANSFER'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`py-3 rounded-xl border-2 font-semibold text-sm transition-all ${
                    paymentMethod === method
                      ? 'border-orange bg-orange-pale text-orange'
                      : 'border-gray-200 text-gray-500 hover:border-orange-light'
                  }`}
                >
                  {method}
                </button>
              ))}
            </div>
          </div>

          {paymentMethod === 'CASH' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Uang Diterima (Rp)</label>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(e.target.value)}
                placeholder={finalTotal.toString()}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-orange transition-colors bg-gray-50 focus:bg-white text-lg font-bold"
              />
              {amountPaid !== "" && Number(amountPaid) >= finalTotal && (
                <p className="text-sm text-green mt-2 font-medium">
                  Kembalian: {formatIDR(Number(amountPaid) - finalTotal)}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 bg-white">
          <button
            onClick={() => handleCheckout(false)}
            disabled={isLoading}
            className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg disabled:opacity-70"
          >
            {isLoading ? "Memproses..." : "Konfirmasi Pembayaran"}
          </button>
        </div>
      </div>
    </div>
  );
}
