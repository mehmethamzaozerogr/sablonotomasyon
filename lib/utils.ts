import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function parseDateValue(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return null;
  }

  const localMatch = normalized.match(
    /^(\d{1,2})\.(\d{1,2})\.(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );

  if (localMatch) {
    const [, day, month, year, hour = "0", minute = "0"] = localMatch;
    const parsed = new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
    );

    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const parsed = new Date(normalized);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDateLabel(value: string) {
  const parsedDate = parseDateValue(value);

  if (!parsedDate) {
    return "Tarih bilgisi yok";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}

export function formatCompactNumber(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
