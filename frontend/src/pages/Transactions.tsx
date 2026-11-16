
import TransactionHistoryView from "../components/transactions/TransactionHistoryView";

export default function TransactionsPage() {
  return (
    <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-7 bg-cream scrollbar-custom relative">
      <TransactionHistoryView 
        showTitle={true} 
        showLogout={true} 
        showExportExcel={false} 
        showKpiCards={false} 
        showFilters={false} 
        subTitle="Daftar riwayat transaksi pesanan kasir Anda"
      />
    </div>
  );
}
