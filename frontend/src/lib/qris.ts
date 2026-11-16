export function crc16Ccitt(str: string): string {
  let crc = 0xffff;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }
  let hex = (crc & 0xffff).toString(16).toUpperCase();
  return hex.padStart(4, "0");
}

export function generateDynamicQris(payload: string, amount: number): string {
  if (!payload || amount <= 0) return payload;

  const crcTagIndex = payload.lastIndexOf('6304');
  if (crcTagIndex === -1) return payload;

  let basePayload = payload.substring(0, crcTagIndex);

  let parsedPayload = '';
  let i = 0;
  let inserted54 = false;
  
  while (i < basePayload.length) {
    const tag = basePayload.substring(i, i + 2);
    const lengthStr = basePayload.substring(i + 2, i + 4);
    const length = parseInt(lengthStr, 10);
    const value = basePayload.substring(i + 4, i + 4 + length);
    
    // Point of Initiation Method: '11' is static, '12' is dynamic
    if (tag === '01') {
      parsedPayload += '010212';
    } else if (tag === '54') {
      // skip existing 54 (transaction amount)
    } else {
      parsedPayload += tag + lengthStr + value;
    }
    
    // Inject 54 right after 53 (Currency Code)
    if (tag === '53') {
      const amountStr = amount.toString();
      const amountLen = amountStr.length.toString().padStart(2, '0');
      parsedPayload += `54${amountLen}${amountStr}`;
      inserted54 = true;
    }

    i += 4 + length;
  }
  
  if (!inserted54) {
      const amountStr = amount.toString();
      const amountLen = amountStr.length.toString().padStart(2, '0');
      parsedPayload += `54${amountLen}${amountStr}`;
  }

  const toCrc = parsedPayload + '6304';
  const crc = crc16Ccitt(toCrc);

  return toCrc + crc;
}
