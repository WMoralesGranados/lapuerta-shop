import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { COLORES, type ColorId } from "@/lib/closets/precios";
import { LIBRERO, altoDe, moverItem, resumen, type Pieza } from "@/lib/librero/calc";
import type { SeleccionPieza } from "@/lib/librero/visor3d";
import { cn } from "@/lib/utils";

const P = LIBRERO.paral.grosor, H = LIBRERO.paral.alto, MARGEN = 16;
const MADERA = "url(#mad)";

type PlanoLibreroProps = {
  mods: Pieza[][];
  anchos: number[];
  color: ColorId;
  led: boolean;
  seleccion: SeleccionPieza | null;
  onSeleccionar: (sel: SeleccionPieza) => void;
  onSoltar: (mods: Pieza[][]) => void;
  onMoverTeclado: (m: number, i: number, delta: number) => void;
  onBorrar: () => void;
};

export default function PlanoLibrero({
  mods,
  anchos,
  color,
  led,
  seleccion,
  onSeleccionar,
  onSoltar,
  onMoverTeclado,
  onBorrar,
}: PlanoLibreroProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const arrastre = useRef<{ m: number; i: number; dif: number } | null>(null);
  const enCurso = useRef<Pieza[][] | null>(null);
  const [temporal, setTemporal] = useState<Pieza[][] | null>(null);

  const dibujo = temporal ?? mods;
  const r = resumen(dibujo, anchos);
  const W = r.ancho;
  const yS = (y: number) => H - y;
  const xMod = (m: number) => P + anchos.slice(0, m).reduce((a, w) => a + w + P, 0);
  const elegido = seleccion && dibujo[seleccion.m]?.[seleccion.i];

  function yDeEvento(ev: PointerEvent) {
    const matriz = svg.current?.getScreenCTM();
    if (!matriz) return 0;
    return H - new DOMPoint(ev.clientX, ev.clientY).matrixTransform(matriz.inverse()).y;
  }

  function borrarYEnfocar() {
    onBorrar();
    contenedor.current?.focus({ preventScroll: true });
  }

  function alPresionar(ev: PointerEvent<HTMLDivElement>) {
    const objetivo = ev.target as Element;
    if (objetivo.closest("[data-borrar]")) {
      borrarYEnfocar();
      return;
    }
    const g = objetivo.closest<SVGGElement>("[data-i]");
    if (!g) return;
    const m = Number(g.dataset.m), i = Number(g.dataset.i);
    onSeleccionar({ m, i });
    arrastre.current = { m, i, dif: mods[m][i].y - yDeEvento(ev) };
    enCurso.current = mods;
    ev.currentTarget.setPointerCapture(ev.pointerId);
  }

  function alMover(ev: PointerEvent<HTMLDivElement>) {
    const a = arrastre.current;
    const actual = enCurso.current;
    if (!a || !actual) return;
    const nuevo = [...actual];
    nuevo[a.m] = moverItem(actual[a.m], a.i, yDeEvento(ev) + a.dif);
    enCurso.current = nuevo;
    setTemporal(nuevo);
  }

  function soltar() {
    if (!arrastre.current) return;
    arrastre.current = null;
    const final = enCurso.current;
    enCurso.current = null;
    if (final && final !== mods) onSoltar(final);
    setTemporal(null);
  }

  function alTeclear(ev: KeyboardEvent<HTMLDivElement>) {
    const objetivo = ev.target as Element;
    const accion = ev.key === "Enter" || ev.key === " ";
    if (objetivo.closest("[data-borrar]") && accion) {
      ev.preventDefault();
      borrarYEnfocar();
      return;
    }
    if ((ev.key === "Delete" || ev.key === "Backspace") && seleccion) {
      ev.preventDefault();
      borrarYEnfocar();
      return;
    }
    const g = objetivo.closest<SVGGElement>("[data-i]");
    if (!g) return;
    const m = Number(g.dataset.m), i = Number(g.dataset.i);
    const delta = ev.key === "ArrowUp" ? 1 : ev.key === "ArrowDown" ? -1 : 0;
    if (accion) {
      ev.preventDefault();
      onSeleccionar({ m, i });
    } else if (delta) {
      ev.preventDefault();
      onSeleccionar({ m, i });
      onMoverTeclado(m, i, delta);
    }
  }

  const cx = elegido && seleccion ? xMod(seleccion.m) + anchos[seleccion.m] - 9 : 0;
  const cy = elegido ? yS(elegido.y + altoDe(elegido) / 2) : 0;

  return (
    <div
      ref={contenedor}
      tabIndex={-1}
      className="h-full w-full outline-none"
      onPointerDown={alPresionar}
      onPointerMove={alMover}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onKeyDown={alTeclear}
    >
      <svg
        ref={svg}
        viewBox={`${-MARGEN} -8 ${W + 2 * MARGEN} ${H + 20}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={`Librero de ${r.modulos} módulos, ${r.repisas} repisas y ${r.nichos} nichos`}
        className="block h-full w-full touch-none select-none"
      >
        <defs>
          <pattern id="mad" patternUnits="userSpaceOnUse" width="90" height="60">
            <image href={`/img/${COLORES[color].img}`} width="90" height="60" preserveAspectRatio="xMidYMid slice" />
          </pattern>
          <linearGradient id="luz" x1="0" x2="1">
            <stop offset="0" stopColor="#fbe6c4" />
            <stop offset=".5" stopColor="#f5f1e9" />
            <stop offset="1" stopColor="#fbe6c4" />
          </linearGradient>
        </defs>

        {/* Luz cálida detrás de cada módulo y parales con su tira LED. */}
        {dibujo.map((_, m) => (
          <rect key={m} x={xMod(m)} y="0" width={anchos[m]} height={H} fill={led ? "url(#luz)" : "#ece9e2"} />
        ))}

        {dibujo.map((items, m) => {
          const x = xMod(m), A = anchos[m];
          return items.map((it, i) => {
            const h = altoDe(it), top = yS(it.y + h);
            const sel = seleccion?.m === m && seleccion.i === i;
            const etiqueta = it.t === "n" ? "Nicho" : "Repisa";
            return (
              <g
                key={`${m}-${i}`}
                tabIndex={0}
                role="button"
                aria-label={`${etiqueta} del módulo ${m + 1}, a ${it.y} cm del piso`}
                aria-pressed={sel}
                data-m={m}
                data-i={i}
                className="group cursor-grab outline-none"
              >
                <rect x={x} y={top} width={A} height={h} fill={MADERA} />
                {it.t === "n" && (
                  <rect x={x + 1.6} y={top + 1.6} width={A - 3.2} height={h - 3.2} fill="#000" fillOpacity=".2" />
                )}
                <rect
                  x={x}
                  y={top - 5}
                  width={A}
                  height={h + 10}
                  className={cn(
                    "group-focus-visible:fill-primary/15 group-focus-visible:stroke-primary group-focus-visible:stroke-2",
                    sel ? "fill-primary/15 stroke-primary stroke-2" : "fill-transparent",
                  )}
                />
              </g>
            );
          });
        })}

        {Array.from({ length: dibujo.length + 1 }, (_, k) => (
          <rect
            key={k}
            x={k === 0 ? 0 : xMod(k - 1) + anchos[k - 1]}
            y="0"
            width={P}
            height={H}
            fill={MADERA}
            className="pointer-events-none"
          />
        ))}

        {/* Botón de borrar sobre la pieza seleccionada. */}
        {elegido && (
          <g
            data-borrar
            tabIndex={0}
            role="button"
            aria-label="Borrar pieza seleccionada"
            className="group cursor-pointer outline-none"
          >
            <circle cx={cx} cy={cy} r="14" fill="transparent" />
            <circle cx={cx} cy={cy} r="7" className="fill-destructive group-focus-visible:stroke-foreground group-focus-visible:stroke-2" />
            <path
              d={`M${cx - 2.6} ${cy - 2.6}L${cx + 2.6} ${cy + 2.6}M${cx + 2.6} ${cy - 2.6}L${cx - 2.6} ${cy + 2.6}`}
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </g>
        )}

        <line x1="-20" x2={W + 20} y1={H} y2={H} stroke="#9c988e" strokeWidth=".6" />
        <text x={W / 2} y={H + 9} textAnchor="middle" className="fill-muted-foreground text-[6.5px] font-semibold">
          {W} cm de ancho
        </text>
      </svg>
    </div>
  );
}
