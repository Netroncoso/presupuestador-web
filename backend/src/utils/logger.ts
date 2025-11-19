const sanitizeLogData = (data: any): string => {
  if (typeof data === 'string') {
    return data.replace(/[\n\r\t]/g, ' ').substring(0, 500);
  }
  if (typeof data === 'object' && data !== null) {
    try {
      return JSON.stringify(data).replace(/[\n\r\t]/g, ' ').substring(0, 500);
    } catch {
      return '[Circular or Invalid Object]';
    }
  }
  return String(data);
};

export const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${sanitizeLogData(message)}${meta ? ` | ${sanitizeLogData(meta)}` : ''}`);
  },
  error: (message: string, meta?: any) => {
    console.error(`[ERROR] ${sanitizeLogData(message)}${meta ? ` | ${sanitizeLogData(meta)}` : ''}`);
  },
  warn: (message: string, meta?: any) => {
    console.warn(`[WARN] ${sanitizeLogData(message)}${meta ? ` | ${sanitizeLogData(meta)}` : ''}`);
  }
};
