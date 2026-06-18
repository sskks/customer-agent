function isLikelyMojibake(value: string): boolean {
  return /[ÃÂÅÆÇÉÖØÜÝÞßà-áåçè-éîïðñò-öù-üýþÿ鎴鏁鏂鍏鐑搴瀹淇璇]/.test(value);
}

function decodeLatin1AsUtf8(value: string): string {
  const bytes = Uint8Array.from(Array.from(value).map((char) => char.charCodeAt(0) & 0xff));
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes);
}

export function repairText(value: string): string {
  if (!value || !isLikelyMojibake(value)) {
    return value;
  }

  try {
    const repaired = decodeLatin1AsUtf8(value);
    if (!repaired || repaired.includes('\uFFFD')) {
      return value;
    }

    return repaired;
  } catch {
    return value;
  }
}

export function repairData<T>(value: T): T {
  if (typeof value === 'string') {
    return repairText(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => repairData(item)) as T;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value).map(([key, item]) => [key, repairData(item)]);
    return Object.fromEntries(entries) as T;
  }

  return value;
}
