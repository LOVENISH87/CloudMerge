const UNITS = ["B", "KB", "MB", "GB", "TB"];

export function formatBytes(input: string | number): string {
  let n = typeof input === "string" ? Number(input) : input;
  let i = 0;
  while (n >= 1024 && i < UNITS.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(i === 0 ? 0 : 1)}${UNITS[i]}`;
}

export function formatGB(bytes: string | number): string {
  const n = typeof bytes === "string" ? Number(bytes) : bytes;
  return (n / 1024 ** 3).toFixed(1) + "GB";
}

export function formatDate(iso: string): string {
  return iso.slice(0, 10);
}
