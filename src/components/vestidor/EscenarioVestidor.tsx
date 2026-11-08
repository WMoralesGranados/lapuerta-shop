import { useEffect, useRef, useState } from "react";
import ParedVestidor, { type SeleccionItem } from "@/components/vestidor/ParedVestidor";
import PlantaVestidor from "@/components/vestidor/PlantaVestidor";
import type { AcabadoId, ColorId } from "@/lib/closets/precios";
import { cn, focusRing } from "@/lib/utils";
import type { Diseno, PiezaV } from "@/lib/vestidor/calc";
import type { SeleccionPiezaV, VisorVestidor } from "@/lib/vestidor/visor3d";

export type VistaVestidor = "planta" | "pared" | "3d";

const VISTAS: [VistaVestidor, string][] = [
  ["planta", "Planta"],
  ["pared", "Pared"],
  ["3d", "3D"],
];

const estiloControl = cn(
  "pointer-events-auto min-h-11 rounded-lg bg-card/95 px-3 text-sm font-medium shadow-soft",
  focusRing,
);

type EscenarioVestidorProps = {
  diseno: Diseno;
  color: ColorId;
  led: boolean;
  jal: AcabadoId;
  chip: string;
  vista: VistaVestidor;
  paredSel: number;
  modSel: number;
  seleccion: SeleccionItem | null;
  seleccion3d: SeleccionPiezaV | null;
  onVista: (v: VistaVestidor) => void;
  onElegirPared: (w: number) => void;
  onElegirModulo: (m: number) => void;
  onSeleccionar: (sel: SeleccionItem) => void;
  onElegir3d: (dato: SeleccionPiezaV | null) => void;
  onSoltar: (mods: PiezaV[][]) => void;
  onMoverTeclado: (m: number, i: number, delta: number) => void;
  onBorrar: () => void;
};

export default function EscenarioVestidor({
  diseno,
  color,
  led,
  jal,
  chip,
  vista,
  paredSel,
  modSel,
  seleccion,
  seleccion3d,
  onVista,
  onElegirPared,
  onElegirModulo,
  onSeleccionar,
  onElegir3d,
  onSoltar,
  onMoverTeclado,
  onBorrar,
}: EscenarioVestidorProps) {
  const lienzo = useRef<HTMLDivElement>(null);
  const visor = useRef<VisorVestidor | null>(null);
  const montado = useRef(false);
  const alElegir = useRef(onElegir3d);
  const [cargando, setCargando] = useState(false);
  const [fallo3d, setFallo3d] = useState(false);
  const es3d = vista === "3d";
  const pared = diseno.paredes[paredSel];

  useEffect(() => {
    alElegir.current = onElegir3d;
  }, [onElegir3d]);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      visor.current?.destruir();
      visor.current = null;
    };
  }, []);

  useEffect(() => {
    if (!visor.current) return;
    visor.current.encender(es3d);
    if (es3d) visor.current.ajustar();
  }, [es3d]);

  useEffect(() => {
    if (es3d) visor.current?.cargar(diseno, color, seleccion3d, led, jal);
  }, [es3d, diseno, color, seleccion3d, led, jal]);

  // El 3D se carga la primera vez que se pide.
  async function elegirVista(v: VistaVestidor) {
    if (v === "3d" && !visor.current) {
      setCargando(true);
      setFallo3d(false);
      try {
        const { VisorVestidor: Visor } = await import("@/lib/vestidor/visor3d");
        if (!montado.current || !lienzo.current) return;
        visor.current = new Visor(lienzo.current, (dato) => alElegir.current(dato));
      } catch (error) {
        console.warn(error);
        if (!montado.current) return;
        setCargando(false);
        setFallo3d(true);
        return;
      }
      setCargando(false);
    }
    onVista(v);
  }

  const ayuda = cargando
    ? "Cargando 3D…"
    : vista === "planta"
      ? "Toca una pared para editarla"
      : vista === "pared"
        ? "Arrastra una pieza para subirla o bajarla; bórrala con la X"
        : "Gira con el dedo o el mouse; toca una pieza para seleccionarla";

  return (
    <div className="sticky top-0 z-10 h-[50dvh] overflow-hidden bg-[#dedcd6] min-[900px]:relative min-[900px]:top-auto min-[900px]:h-auto">
      <div hidden={es3d} className="absolute inset-x-2 bottom-[84px] top-10 min-[900px]:inset-x-4 min-[900px]:top-11">
        {vista === "planta" && <PlantaVestidor diseno={diseno} paredSel={paredSel} onElegirPared={onElegirPared} />}
        {vista === "pared" && pared && (
          <ParedVestidor
            pared={pared}
            color={color}
            led={led}
            jal={jal}
            modSel={modSel}
            seleccion={seleccion}
            onElegirModulo={onElegirModulo}
            onSeleccionar={onSeleccionar}
            onSoltar={onSoltar}
            onMoverTeclado={onMoverTeclado}
            onBorrar={onBorrar}
          />
        )}
      </div>
      <div ref={lienzo} hidden={!es3d} className="absolute inset-0" />

      <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-medium shadow-soft">{chip}</span>

      {es3d && (
        <div role="group" aria-label="Zoom" className="pointer-events-none absolute right-3 top-3 flex flex-col gap-2">
          <button type="button" aria-label="Acercar" onClick={() => visor.current?.zoom(0.75)} className={cn(estiloControl, "w-11 px-0 text-lg")}>
            +
          </button>
          <button type="button" aria-label="Alejar" onClick={() => visor.current?.zoom(1.3)} className={cn(estiloControl, "w-11 px-0 text-lg")}>
            −
          </button>
        </div>
      )}

      <div className="pointer-events-none absolute inset-x-3 bottom-2 flex flex-col items-center gap-1">
        <div role="group" aria-label="Vistas" className="flex gap-1">
          {VISTAS.map(([id, etiqueta]) => (
            <button
              key={id}
              type="button"
              disabled={cargando}
              aria-pressed={vista === id}
              onClick={() => void elegirVista(id)}
              className={cn(estiloControl, vista === id && "bg-primary text-primary-foreground")}
            >
              {etiqueta}
            </button>
          ))}
        </div>
        {fallo3d ? (
          <p role="alert" className="text-center text-xs font-medium text-destructive">
            Tu navegador no pudo abrir el 3D. Puedes seguir en Planta y Pared.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">{ayuda}</p>
        )}
      </div>
    </div>
  );
}
