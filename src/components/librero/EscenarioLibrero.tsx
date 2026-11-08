import { useEffect, useRef, useState } from "react";
import PlanoLibrero from "@/components/librero/PlanoLibrero";
import type { ColorId } from "@/lib/closets/precios";
import type { Pieza } from "@/lib/librero/calc";
import type { DatosPieza, NombreVistaLibrero, SeleccionPieza, VisorLibrero } from "@/lib/librero/visor3d";
import { cn, focusRing } from "@/lib/utils";

const VISTAS: [NombreVistaLibrero, string][] = [
  ["general", "General"],
  ["frente", "Frente"],
  ["detalle", "Detalle"],
];

const estiloControl = cn(
  "pointer-events-auto min-h-11 rounded-lg bg-card/95 px-3 text-sm font-medium shadow-soft",
  focusRing,
);

type EscenarioLibreroProps = {
  mods: Pieza[][];
  anchos: number[];
  color: ColorId;
  led: boolean;
  seleccion: SeleccionPieza | null;
  ancho: number;
  alto: number;
  onSeleccionar: (sel: SeleccionPieza | null) => void;
  onSoltar: (mods: Pieza[][]) => void;
  onMoverTeclado: (m: number, i: number, delta: number) => void;
  onBorrar: () => void;
};

export default function EscenarioLibrero({
  mods,
  anchos,
  color,
  led,
  seleccion,
  ancho,
  alto,
  onSeleccionar,
  onSoltar,
  onMoverTeclado,
  onBorrar,
}: EscenarioLibreroProps) {
  const lienzo = useRef<HTMLDivElement>(null);
  const visor = useRef<VisorLibrero | null>(null);
  const montado = useRef(false);
  const ultimoAncho = useRef<number | null>(null);
  const alElegir = useRef(onSeleccionar);
  const [en3d, setEn3d] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [fallo3d, setFallo3d] = useState(false);
  const [vista, setVista] = useState<NombreVistaLibrero>("general");

  useEffect(() => {
    alElegir.current = onSeleccionar;
  }, [onSeleccionar]);

  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      visor.current?.destruir();
      visor.current = null;
    };
  }, []);

  useEffect(() => {
    visor.current?.encender(en3d);
  }, [en3d]);

  useEffect(() => {
    if (!en3d || !visor.current) return;
    visor.current.cargar(mods, color, seleccion, led, anchos);
    if (ultimoAncho.current !== ancho) setVista("general");
    ultimoAncho.current = ancho;
  }, [en3d, mods, color, seleccion, led, anchos, ancho]);

  // Vista 3D: se carga la primera vez que se pide, para que el plano abra rápido.
  async function cambiarModo() {
    const quiere3d = !en3d;
    if (quiere3d && !visor.current) {
      setCargando(true);
      setFallo3d(false);
      try {
        const { VisorLibrero: Visor } = await import("@/lib/librero/visor3d");
        if (!montado.current || !lienzo.current) return;
        visor.current = new Visor(lienzo.current, (datos: DatosPieza) => {
          alElegir.current(datos && datos.m != null && datos.i != null ? { m: datos.m, i: datos.i } : null);
        });
      } catch (error) {
        console.warn(error);
        if (!montado.current) return;
        setCargando(false);
        setFallo3d(true);
        return;
      }
      setCargando(false);
    }
    setEn3d(quiere3d);
  }

  function elegirVista(nombre: NombreVistaLibrero) {
    if (!visor.current) return;
    setVista(nombre);
    visor.current.vista(nombre);
  }

  const etiquetaModo = cargando ? "Cargando 3D…" : en3d ? "Ver en 2D" : "Ver en 3D";
  const ayuda = en3d
    ? "Gira con el dedo o el mouse. Toca una pieza para seleccionarla."
    : "Toca una pieza para moverla o borrarla con la X";

  return (
    <div className="sticky top-0 z-10 h-[50dvh] overflow-hidden bg-[#dedcd6] min-[900px]:relative min-[900px]:top-auto min-[900px]:h-auto">
      <div hidden={en3d} className="absolute inset-x-2 bottom-[84px] top-10 min-[900px]:inset-x-4 min-[900px]:top-11">
        <PlanoLibrero
          mods={mods}
          anchos={anchos}
          color={color}
          led={led}
          seleccion={seleccion}
          onSeleccionar={onSeleccionar}
          onSoltar={onSoltar}
          onMoverTeclado={onMoverTeclado}
          onBorrar={onBorrar}
        />
      </div>
      <div ref={lienzo} hidden={!en3d} className="absolute inset-0" />

      <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-medium shadow-soft">
        {`${ancho} × ${alto} cm`}
      </span>

      {en3d && (
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
        <div className="flex flex-wrap items-center justify-center gap-2">
          {en3d && (
            <div role="group" aria-label="Vistas" className="flex gap-1">
              {VISTAS.map(([id, etiqueta]) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={vista === id}
                  onClick={() => elegirVista(id)}
                  className={cn(estiloControl, vista === id && "bg-primary text-primary-foreground")}
                >
                  {etiqueta}
                </button>
              ))}
            </div>
          )}
          <button type="button" disabled={cargando} onClick={cambiarModo} className={estiloControl}>
            {etiquetaModo}
          </button>
        </div>
        {fallo3d ? (
          <p role="alert" className="text-center text-xs font-medium text-destructive">
            Tu navegador no pudo abrir el 3D. Puedes seguir armando en 2D.
          </p>
        ) : (
          <p className="text-center text-xs text-muted-foreground">{ayuda}</p>
        )}
      </div>
    </div>
  );
}
