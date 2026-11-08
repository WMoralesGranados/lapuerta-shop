import { useEffect, useRef, useState, type MutableRefObject } from "react";
import type { ConfigCloset, Costado } from "@/lib/closets/precios";
import type { NombreVista, OpcionesCarga, VisorVenta } from "@/lib/closets/visor3d";
import { cn, focusRing } from "@/lib/utils";

const VISTAS: [NombreVista, string][] = [
  ["tres", "General"],
  ["frente", "Frente"],
  ["detalle", "Detalle"],
];

const estiloControl = cn(
  "pointer-events-auto min-h-11 rounded-lg bg-card/95 px-3 text-sm font-medium shadow-soft",
  focusRing,
);

type VisorClosetProps = {
  cfg: ConfigCloset;
  actualizar: boolean;
  opcionesCarga: MutableRefObject<OpcionesCarga>;
};

export default function VisorCloset({ cfg, actualizar, opcionesCarga }: VisorClosetProps) {
  const lienzo = useRef<HTMLDivElement>(null);
  const visor = useRef<VisorVenta | null>(null);
  const ultimaCfg = useRef(cfg);
  const clavesVista = useRef<string | null>(null);
  const costado = useRef<Costado>(cfg.costado);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">("cargando");
  const [vista, setVista] = useState<NombreVista>("tres");
  const [abierto, setAbierto] = useState(false);

  useEffect(() => {
    const cont = lienzo.current;
    if (!cont) return;
    let cancelado = false;
    let creado: VisorVenta | null = null;

    import("@/lib/closets/visor3d")
      .then(({ VisorVenta: Visor }) => {
        if (cancelado) return;
        creado = new Visor(cont);
        creado.cargar(ultimaCfg.current);
        visor.current = creado;
        clavesVista.current = JSON.stringify(ultimaCfg.current);
        costado.current = ultimaCfg.current.costado;
        setEstado("listo");
      })
      .catch((error: unknown) => {
        console.warn(error);
        if (cancelado) return;
        creado?.destruir();
        creado = null;
        visor.current = null;
        setEstado("error");
      });

    return () => {
      cancelado = true;
      creado?.destruir();
      visor.current = null;
      clavesVista.current = null;
    };
  }, []);

  useEffect(() => {
    ultimaCfg.current = cfg;
    const opciones = opcionesCarga.current;
    opcionesCarga.current = { conservarCamara: true };
    const actual = visor.current;
    const clave = JSON.stringify(cfg);
    if (!actual || clavesVista.current === clave) return;
    clavesVista.current = clave;
    if (!actualizar) return;
    const cambioCostado = costado.current !== cfg.costado;
    costado.current = cfg.costado;
    actual.cargar(cfg, opciones);
    if (!opciones.conservarCamara || cambioCostado) setVista("tres");
  }, [cfg, actualizar, opcionesCarga]);

  function elegirVista(nombre: NombreVista) {
    if (!visor.current) return;
    setVista(nombre);
    visor.current.vista(nombre);
  }

  return (
    <div className="sticky top-0 z-10 h-[50dvh] overflow-hidden bg-[#e7e8e6] min-[900px]:relative min-[900px]:top-auto min-[900px]:h-auto">
      <div ref={lienzo} className="absolute inset-0" />

      {estado !== "listo" && (
        <p className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-muted-foreground">
          {estado === "cargando"
            ? "Preparando tu closet…"
            : "Tu navegador no pudo abrir el 3D. Puedes seguir cotizando."}
        </p>
      )}

      <span className="absolute left-3 top-3 rounded-full bg-card/95 px-3 py-1 text-xs font-medium shadow-soft">
        {`${cfg.W} × ${cfg.H} × ${cfg.F} cm`}
      </span>

      {estado === "listo" && (
        <>
          <div role="group" aria-label="Zoom" className="pointer-events-none absolute right-3 top-3 flex flex-col gap-2">
            <button
              type="button"
              aria-label="Acercar"
              onClick={() => visor.current?.zoom(0.75)}
              className={cn(estiloControl, "w-11 px-0 text-lg")}
            >
              +
            </button>
            <button
              type="button"
              aria-label="Alejar"
              onClick={() => visor.current?.zoom(1.3)}
              className={cn(estiloControl, "w-11 px-0 text-lg")}
            >
              −
            </button>
          </div>

          <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap items-center justify-center gap-2">
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
            <button
              type="button"
              onClick={() => {
                if (visor.current) setAbierto(visor.current.alternar());
              }}
              className={estiloControl}
            >
              {abierto ? "Cerrar" : "Abrir puertas y cajones"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
