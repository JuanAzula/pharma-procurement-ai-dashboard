import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { enUS, es, nl } from "date-fns/locale"
import type { Locale } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getDateLocale(language: string): Locale {
  switch (language) {
    case "es":
      return es;
    case "nl":
      return nl;
    default:
      return enUS;
  }
}
