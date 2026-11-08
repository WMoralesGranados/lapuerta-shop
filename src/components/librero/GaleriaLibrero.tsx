import { useRef, useState } from "react";
import { cn, focusRing } from "@/lib/utils";

const FOTOS = [
  ["/img/librero/1.jpg", "Librero Julieta de dos módulos visto de frente, con la luz LED encendida"],
  ["/img/librero/2.jpg", "Detalle de la tira LED al centro del paral"],
  ["/img/librero/3.jpg", "Librero con nichos, repisas y plantas"],
  ["/img/librero/4.jpg", "Vista lateral del librero con repisas de 40 cm de fondo"],
  ["/img/librero/5.jpg", "Librero instalado en una sala con luz cálida"],
  ["/img/librero/6.jpg", "Vista general del librero instalado junto a plantas"],
];

export default function GaleriaLibrero() {
  const dialogo = useRef<HTMLDialogElement>(null);
  const [foto, setFoto] = useState<string[] | null>(null);

  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        {FOTOS.map(([src, alt]) => (
          <button
            key={src}
            type="button"
            aria-label={`Ampliar foto: ${alt}`}
            onClick={() => {
              setFoto([src, alt]);
              dialogo.current?.showModal();
            }}
            className={cn("overflow-hidden rounded-lg", focusRing)}
          >
            <img src={src} alt="" loading="lazy" className="aspect-square w-full object-cover" />
          </button>
        ))}
      </div>

      <dialog
        ref={dialogo}
        aria-label="Foto ampliada del librero"
        className="max-h-[90dvh] max-w-[min(92vw,56rem)] overflow-hidden rounded-xl p-0 backdrop:bg-foreground/70"
      >
        <button
          type="button"
          aria-label="Cerrar foto"
          onClick={() => dialogo.current?.close()}
          className={cn("absolute right-2 top-2 h-11 w-11 rounded-full bg-card/95 text-xl shadow-soft", focusRing)}
        >
          ×
        </button>
        {foto && <img src={foto[0]} alt={foto[1]} className="max-h-[90dvh] w-full object-contain" />}
      </dialog>
    </>
  );
}
