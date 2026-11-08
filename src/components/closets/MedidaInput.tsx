import { useEffect, useId, useRef } from "react";
import { cn, focusRing } from "@/lib/utils";

type MedidaInputProps = {
  etiqueta: string;
  valor: number;
  rango: string;
  deshabilitado?: boolean;
  onConfirmar: (valor: string) => void;
};

// Usa el evento nativo change porque el onChange de React se dispara en cada tecla.
export default function MedidaInput({ etiqueta, valor, rango, deshabilitado = false, onConfirmar }: MedidaInputProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const ultimo = useRef({ valor, onConfirmar });

  useEffect(() => {
    ultimo.current = { valor, onConfirmar };
    const el = input.current;
    if (el && document.activeElement !== el) el.value = String(valor);
  }, [valor, onConfirmar]);

  useEffect(() => {
    const el = input.current;
    if (!el) return;
    const alCambiar = () => {
      if (el.value !== "") {
        ultimo.current.onConfirmar(el.value);
      } else if (document.activeElement !== el) {
        el.value = String(ultimo.current.valor);
      }
    };
    el.addEventListener("change", alCambiar);
    return () => el.removeEventListener("change", alCambiar);
  }, []);

  return (
    <div className="min-w-0">
      <label htmlFor={id} className="text-sm font-medium">
        {etiqueta}
      </label>
      <span className="mt-1 flex min-h-11 items-center rounded-lg border bg-background focus-within:ring-1 focus-within:ring-primary">
        <input
          ref={input}
          id={id}
          type="number"
          inputMode="decimal"
          step={1}
          defaultValue={valor}
          disabled={deshabilitado}
          onBlur={() => {
            if (input.current) input.current.value = String(ultimo.current.valor);
          }}
          className={cn(
            "h-11 w-full min-w-0 rounded-lg bg-transparent pl-2 text-base disabled:text-muted-foreground",
            focusRing,
          )}
        />
        <span className="px-2 text-xs text-muted-foreground">cm</span>
      </span>
      <small className="mt-1 block text-xs text-muted-foreground">{rango}</small>
    </div>
  );
}
