export class BluetoothPrinter {
  private device: any = null;
  private server: any = null;
  private service: any = null;
  private characteristic: any = null;

  // Common Bluetooth printer service UUIDs
  private static readonly PRINTER_SERVICES = [
    '000018f0-0000-1000-8000-00805f9b34fb', // Generic thermal
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Common Chinese printers (SPP-like)
    'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Some Bluetooth printers
  ];

  private static readonly PRINTER_CHARACTERISTICS = [
    '00002af1-0000-1000-8000-00805f9b34fb', // Generic thermal write
    '49535343-8841-43f4-a8d4-ecbe34729bb3', // Common Chinese printers write
    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f', // Some Bluetooth printers write
  ];

  async connect() {
    try {
      if (!(navigator as any).bluetooth) {
        throw new Error("Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome/Edge di Android atau Desktop.");
      }

      // Request device — accept all devices for maximum compatibility
      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BluetoothPrinter.PRINTER_SERVICES,
      });

      if (!this.device || !this.device.gatt) throw new Error("Perangkat Bluetooth tidak dipilih.");

      this.server = await this.device.gatt.connect();

      // Try each service UUID until we find one that works
      for (const serviceUUID of BluetoothPrinter.PRINTER_SERVICES) {
        try {
          this.service = await this.server.getPrimaryService(serviceUUID);
          // Try each characteristic UUID
          for (const charUUID of BluetoothPrinter.PRINTER_CHARACTERISTICS) {
            try {
              this.characteristic = await this.service.getCharacteristic(charUUID);
              console.log(`Connected via service: ${serviceUUID}, char: ${charUUID}`);
              return true;
            } catch {
              continue;
            }
          }
          // If no known characteristic found, try getting all characteristics
          const chars = await this.service.getCharacteristics();
          for (const char of chars) {
            if (char.properties.write || char.properties.writeWithoutResponse) {
              this.characteristic = char;
              console.log(`Connected via service: ${serviceUUID}, char: ${char.uuid}`);
              return true;
            }
          }
        } catch {
          continue;
        }
      }

      throw new Error("Tidak dapat menemukan karakteristik printer. Pastikan printer thermal Bluetooth Anda kompatibel.");
    } catch (error) {
      console.error('Bluetooth connection failed', error);
      throw error;
    }
  }

  disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
  }

  async printReceipt(payload: {
    outletName: string;
    address?: string;
    phone?: string;
    invoiceNumber: string;
    date: string;
    cashierName: string;
    items: { product: { name: string }; quantity: number; price: number; subtotal: number }[];
    subtotal: number;
    discountAmount: number;
    tax: number;
    total: number;
    paymentMethod: string;
    amountPaid: number;
    member?: { name: string; points: number };
  }) {
    if (!this.characteristic) throw new Error("Printer tidak terhubung.");

    const ESC = "\x1B";
    const INIT = ESC + "@";
    const ALIGN_CENTER = ESC + "a" + "\x01";
    const ALIGN_LEFT = ESC + "a" + "\x00";
    const BOLD_ON = ESC + "E" + "\x01";
    const BOLD_OFF = ESC + "E" + "\x00";
    const LINE = "--------------------------------"; // 32 chars for 58mm
    const LF = "\n";

    const formatLine = (left: string, right: string) => {
      let spaceLength = 32 - left.length - right.length;
      if (spaceLength < 1) spaceLength = 1;
      return left + " ".repeat(spaceLength) + right;
    };

    const formatIDR = (num: number) => `Rp${(num || 0).toLocaleString('id-ID')}`;

    let receipt = INIT;
    
    const formatDate = (dateStr: string) => {
      const d = new Date(dateStr);
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear().toString().slice(2)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    };

    // Header
    receipt += ALIGN_CENTER + BOLD_ON + payload.outletName + LF + BOLD_OFF;
    if (payload.address) {
      receipt += ALIGN_CENTER + payload.address + LF;
    }
    if (payload.phone) {
      receipt += ALIGN_CENTER + `Telp: ${payload.phone}` + LF;
    }
    receipt += ALIGN_CENTER + LINE + LF;

    // Info
    receipt += ALIGN_LEFT;
    receipt += formatLine(`No: ${payload.invoiceNumber || '-'}`, payload.date ? formatDate(payload.date) : '-') + LF;
    receipt += formatLine(`Kasir: ${payload.cashierName.substring(0, 12)}`, `Metode: ${payload.paymentMethod}`) + LF;
    if (payload.member) {
      receipt += LINE + LF;
      receipt += formatLine(`Pelanggan: ${payload.member.name.substring(0, 10)}`, `Poin: ${payload.member.points}`) + LF;
    }
    receipt += LINE + LF;

    // Items
    for (const item of payload.items) {
      receipt += BOLD_ON + (item.product?.name || 'Produk').substring(0, 32) + BOLD_OFF + LF;
      receipt += formatLine(`${item.quantity} x ${formatIDR(item.price)}`, formatIDR(item.subtotal)) + LF;
    }
    receipt += LINE + LF;

    // Totals
    receipt += formatLine("Subtotal", formatIDR(payload.subtotal)) + LF;
    if (payload.discountAmount > 0) {
      receipt += formatLine("Diskon", `-${formatIDR(payload.discountAmount)}`) + LF;
    }
    if (payload.tax > 0) {
      receipt += formatLine("Pajak (10%)", formatIDR(payload.tax)) + LF;
    }
    receipt += BOLD_ON + formatLine("TOTAL", formatIDR(payload.total)) + BOLD_OFF + LF;
    
    if (payload.paymentMethod === 'CASH' && (payload.amountPaid > payload.total)) {
      receipt += LF;
      receipt += formatLine("Tunai / Bayar", formatIDR(payload.amountPaid)) + LF;
      const change = (payload.amountPaid || 0) - (payload.total || 0);
      receipt += formatLine("Kembali", formatIDR(change > 0 ? change : 0)) + LF;
    }
    
    receipt += LINE + LF;
    receipt += ALIGN_CENTER + "Terima kasih atas kunjungan Anda!" + LF;
    receipt += ALIGN_CENTER + "Barang yang sudah dibeli tidak" + LF;
    receipt += ALIGN_CENTER + "dapat ditukar/dikembalikan." + LF;
    receipt += LF + LF + LF + LF; // Feed lines

    // Convert to Uint8Array
    const encoder = new TextEncoder();
    const data = encoder.encode(receipt);

    // Send data in chunks (some printers need smaller chunks)
    const chunkSize = 128;
    for (let i = 0; i < data.length; i += chunkSize) {
      const chunk = data.slice(i, i + chunkSize);
      try {
        await this.characteristic.writeValue(chunk);
      } catch {
        // Fallback to writeWithoutResponse
        await this.characteristic.writeValueWithoutResponse(chunk);
      }
      // Small delay between chunks for printer buffer
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

export const bluetoothPrinter = new BluetoothPrinter();
