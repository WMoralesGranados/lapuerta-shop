import { useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { COLORES, type AcabadoId, type ColorId } from "@/lib/closets/precios";
import { LIBRERO } from "@/lib/librero/calc";
import { cn } from "@/lib/utils";
import { AJUSTE, VESTIDOR, altoV, moverV, type Pared, type PiezaV } from "@/lib/vestidor/calc";

const NOMBRE: Record<string, string> = { r: "Repisa", n: "Nicho", t: "Tubo", c: "Cajonera" };
export const COLOR_JAL: Record<AcabadoId, string> = { plata: "#c8ccd0", negro: "#222", dorado: "#c9a46a" };
const P = VESTIDOR.paralGrosor, H = LIBRERO.paral.alto;
const MADERA = "url(#mad)";
const estiloCota = "pointer-events-none fill-muted-foreground text-[6.5px] font-semibold";

export type SeleccionItem = { m: number; i: number };

type ParedVestidorProps = {
  pared: Pared;
  color: ColorId;
  led: boolean;
  jal: AcabadoId;
  modSel: number;
  seleccion: SeleccionItem | null;
  onElegirModulo: (m: number) => void;
  onSeleccionar: (sel: SeleccionItem) => void;
  onSoltar: (mods: PiezaV[][]) => void;
  onMoverTeclado: (m: number, i: number, delta: number) => void;
  onBorrar: () => void;
};

export default function ParedVestidor({
  pared: p,
  color,
  led,
  jal,
  modSel,
  seleccion,
  onElegirModulo,
  onSeleccionar,
  onSoltar,
  onMoverTeclado,
  onBorrar,
}: ParedVestidorProps) {
  const contenedor = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const arrastre = useRef<{ m: number; i: number; dif: number } | null>(null);
  const enCurso = useRef<PiezaV[][] | null>(null);
  const [temporal, setTemporal] = useState<PiezaV[][] | null>(null);

  const { anchos } = p;
  const mods = temporal ?? p.mods;
  const W = anchos.reduce((a, w) => a + w, 0) + (anchos.length + 1) * P;
  const xMod = (m: number) => P + anchos.slice(0, m).reduce((a, w) => a + w + P, 0);
  const elegido = seleccion && mods[seleccion.m]?.[seleccion.i];

  function yDe(ev: PointerEvent) {
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
    if (!g) {
      const f = objetivo.closest<SVGRectElement>("[data-fondo]");
      if (f) onElegirModulo(Number(f.dataset.fondo));
      return;
    }
    const m = Number(g.dataset.m), i = Number(g.dataset.i);
    onSeleccionar({ m, i });
    arrastre.current = { m, i, dif: p.mods[m][i].y - yDe(ev) };
    enCurso.current = p.mods;
    ev.currentTarget.setPointerCapture(ev.pointerId);
  }

  function alMover(ev: PointerEvent<HTMLDivElement>) {
    const a = arrastre.current;
    const actual = enCurso.current;
    if (!a || !actual) return;
    const nuevo = [...actual];
    nuevo[a.m] = moverV(actual[a.m], a.i, yDe(ev) + a.dif);
    enCurso.current = nuevo;
    setTemporal(nuevo);
  }

  function soltar() {
    if (!arrastre.current) return;
    arrastre.current = null;
    const final = enCurso.current;
    enCurso.current = null;
    if (final && final !== p.mods) onSoltar(final);
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
    const f = objetivo.closest<SVGRectElement>("[data-fondo]");
    if (f && accion) {
      ev.preventDefault();
      onElegirModulo(Number(f.dataset.fondo));
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

  function forma(it: PiezaV, items: PiezaV[], i: number, x: number, A: number, h: number, top: number) {
    if (it.t === "n") {
      return (
        <>
          <rect x={x} y={top} width={A} height={h} fill={MADERA} />
          <rect x={x + 1.6} y={top + 1.6} width={A - 3.2} height={h - 3.2} fill="#000" fillOpacity=".2" />
        </>
      );
    }
    if (it.t === "t") {
      // Tubo cromado y, debajo, cuánto espacio queda para colgar.
      const abajo = items[i - 1];
      const libre = Math.round(it.y - (abajo ? abajo.y + altoV(abajo) : 0));
      return (
        <>
          <rect x={x + 0.5} y={top} width={A - 1} height={h} rx="1.5" fill="url(#cromo)" stroke="#8d939a" strokeWidth=".3" />
          <text x={x + A / 2} y={H - it.y + libre / 2} textAnchor="middle" fill="#8a8f96" className="pointer-events-none text-[6.5px] font-semibold">
            {`Colgar ${libre} cm`}
          </text>
        </>
      );
    }
    if (it.t === "c") {
      // Frentes encastrados: la caja enmarca los dos cajones, que quedan al ras por dentro.
      const T = 1.6, J = 0.3, fh = (h - 2 * T - 3 * J) / 2;
      return (
        <>
          <rect x={x} y={top} width={A} height={h} fill={MADERA} />
          <rect x={x + T} y={top + T} width={A - 2 * T} height={h - 2 * T} fill="#1c140e" />
          {[0, 1].map((k) => {
            const fy = top + T + J + k * (fh + J);
            return (
              <g key={k}>
                <rect x={x + T + J} y={fy} width={A - 2 * T - 2 * J} height={fh} fill={MADERA} />
                <rect x={x + A / 2 - 4} y={fy - 0.2} width="8" height="1.4" rx=".4" fill={COLOR_JAL[jal]} />
              </g>
            );
          })}
        </>
      );
    }
    return <rect x={x} y={top} width={A} height={h} fill={MADERA} />;
  }

  const cx = elegido && seleccion ? xMod(seleccion.m) + anchos[seleccion.m] - 9 : 0;
  const cy = elegido ? H - (elegido.y + altoV(elegido) / 2) : 0;

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
        viewBox={`-16 -12 ${W + 32} ${H + 24}`}
        preserveAspectRatio="xMidYMid meet"
        role="group"
        aria-label={`Frente de ${p.nombre}`}
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
          <linearGradient id="cromo" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#fafbfc" />
            <stop offset=".45" stopColor="#b9bec4" />
            <stop offset=".55" stopColor="#6f757c" />
            <stop offset="1" stopColor="#e3e6e9" />
          </linearGradient>
        </defs>

        {/* El fondo de cada módulo se puede tocar para elegirlo antes de agregar piezas. */}
        {mods.map((_, m) => (
          <rect
            key={m}
            data-fondo={m}
            tabIndex={0}
            role="button"
            aria-label={`Elegir ${m === p.ajuste ? "módulo de ajuste" : `módulo ${m + 1}`}`}
            aria-pressed={m === modSel}
            x={xMod(m)}
            y="0"
            width={anchos[m]}
            height={H}
            fill={led ? "url(#luz)" : "#ece9e2"}
            stroke={m === modSel ? "#b58a5a" : "none"}
            strokeWidth="1.2"
            vectorEffect="non-scaling-stroke"
            className="cursor-pointer outline-none focus-visible:stroke-primary focus-visible:[stroke-width:3]"
          />
        ))}

        {mods.map((items, m) => {
          const x = xMod(m), A = anchos[m];
          return items.map((it, i) => {
            const h = altoV(it), top = H - (it.y + h);
            const sel = seleccion?.m === m && seleccion.i === i;
            return (
              <g
                key={`${m}-${i}`}
                tabIndex={0}
                role="button"
                aria-label={`${NOMBRE[it.t]} del módulo ${m + 1}, a ${it.y} cm del piso`}
                aria-pressed={sel}
                data-m={m}
                data-i={i}
                className="group cursor-grab outline-none"
              >
                {forma(it, items, i, x, A, h, top)}
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

        {Array.from({ length: mods.length + 1 }, (_, k) => (
          <rect key={k} x={k === 0 ? 0 : xMod(k - 1) + anchos[k - 1]} y="0" width={P} height={H} fill={MADERA} className="pointer-events-none" />
        ))}

        {anchos.map((w, m) => (
          <text
            key={m}
            x={xMod(m) + w / 2}
            y="-2"
            textAnchor="middle"
            className={cn(estiloCota, m === p.ajuste && "font-bold [fill:#9a6a35]")}
          >
            {m === p.ajuste ? `Ajuste ${w} cm` : `${w} cm`}
          </text>
        ))}

        {elegido && (
          <g data-borrar tabIndex={0} role="button" aria-label="Borrar pieza seleccionada" className="group cursor-pointer outline-none">
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
        <text x={W / 2} y={H + 9} textAnchor="middle" className={estiloCota}>
          {`${p.nombre}: ${Math.round(W * 10) / 10} cm de ${p.largo} cm, ${p.sobrante > AJUSTE.holgura + 1 ? `quedan ${p.sobrante} cm libres` : `${p.sobrante} cm de holgura`}`}
        </text>
      </svg>
    </div>
  );
}
