export const sanitizeForLog = (data: any): string => {
  if (typeof data === 'string') {
    return data.replace(/[\n\r\t]/g, ' ').substring(0, 200);
  }
  if (typeof data === 'object' && data !== null) {
    try {
      return JSON.stringify(data).replace(/[\n\r\t]/g, ' ').substring(0, 200);
    } catch {
      return '[Invalid Object]';
    }
  }
  return String(data);
};

export const sanitizeInput = (input: string, maxLength: number = 255): string => {
  return input.replace(/[<>]/g, '').trim().substring(0, maxLength);
};
