import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { es } from "date-fns/locale"; // Importar el locale español

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export { es }; // Exportar el locale para usarlo en otros componentes