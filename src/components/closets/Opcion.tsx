import type { ReactNode } from "react";
import { cn, focusRing } from "@/lib/utils";

type OpcionProps = {
  activa: boolean;
  onElegir: () => void;
  deshabilitada?: boolean;
  children: ReactNode;
};

export default function Opcion({ activa, onElegir, deshabilitada = false, children }: OpcionProps) {
  return (
    <button
      type="button"
      aria-pressed={activa}
      disabled={deshabilitada}
      onClick={onElegir}
      className={cn(
        "flex min-h-11 w-full flex-col justify-center rounded-lg border p-3 text-left text-sm transition-colors",
        activa ? "border-primary ring-1 ring-primary" : "hover:bg-secondary",
        deshabilitada && "cursor-not-allowed opacity-50 hover:bg-transparent",
        focusRing,
      )}
    >
      {children}
    </button>
  );
}

export function OpcionTexto({ titulo, detalle }: { titulo: string; detalle: string }) {
  return (
    <>
      <span className="font-medium">{titulo}</span>
      <span className="mt-0.5 text-xs text-muted-foreground">{detalle}</span>
    </>
  );
}
