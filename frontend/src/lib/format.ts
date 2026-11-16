export const formatIDR = (amount: number): string =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export const formatNumber = (num: number): string =>
  new Intl.NumberFormat("id-ID").format(num || 0);
