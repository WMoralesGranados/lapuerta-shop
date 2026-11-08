import type { ReactNode } from "react";
import { ESPACIOS, VESTIDOR, type Diseno } from "@/lib/vestidor/calc";

const P = VESTIDOR.paralGrosor, F = VESTIDOR.repisaFondo;

type Tramo = { x: number; z: number; dir: "x" | "z"; sentido: number };
type Geometria = { w: number; h: number; muros: number[][]; tramos: Tramo[] };

function geometria(d: Diseno): Geometria {
  const A = d.med.A as number, { B = 0, S = 0 } = d.med;
  if (d.tipo === "lineal") return { w: A, h: 200, muros: [[0, 0, A, 0]], tramos: [{ x: 0, z: 0, dir: "x", sentido: 1 }] };
  if (d.tipo === "L") return { w: A, h: B, muros: [[0, 0, A, 0], [0, 0, 0, B]], tramos: [{ x: 0, z: 0, dir: "x", sentido: 1 }, { x: 0, z: B, dir: "z", sentido: -1 }] };
  if (d.tipo === "U") return { w: A, h: B, muros: [[0, B, 0, 0], [0, 0, A, 0], [A, 0, A, B]], tramos: [{ x: 0, z: B, dir: "z", sentido: -1 }, { x: 0, z: 0, dir: "x", sentido: 1 }, { x: A, z: F, dir: "z", sentido: 1 }] };
  const L = Math.max(A, B);
  return { w: L, h: S, muros: [[0, 0, A, 0], [0, S, B, S]], tramos: [{ x: 0, z: 0, dir: "x", sentido: 1 }, { x: B, z: S, dir: "x", sentido: -1 }] };
}

const estiloTxt = "pointer-events-none fill-foreground text-[9px] font-semibold";
const estiloTxtS = "pointer-events-none fill-muted-foreground text-[7px] font-medium";

type PlantaVestidorProps = {
  diseno: Diseno;
  paredSel: number;
  onElegirPared: (w: number) => void;
};

export default function PlantaVestidor({ diseno: d, paredSel, onElegirPared }: PlantaVestidorProps) {
  const g = geometria(d);
  const m = 22;
  const piezas: ReactNode[] = [];

  d.paredes.forEach((p, w) => {
    const t = g.tramos[w];
    const largo = p.anchos.reduce((a, x) => a + x, 0) + (p.anchos.length + 1) * P;
    let rx: number, rz: number, rw: number, rh: number;
    if (t.dir === "x") {
      rw = largo; rh = F; rx = t.sentido > 0 ? t.x : t.x - largo; rz = t.sentido > 0 ? t.z : t.z - F;
    } else {
      rw = F; rh = largo; rx = t.sentido > 0 ? t.x - F : t.x; rz = t.sentido > 0 ? t.z : t.z - largo;
    }
    const sel = w === paredSel;
    piezas.push(
      <rect
        key={`t${w}`}
        x={rx}
        y={rz}
        width={rw}
        height={rh}
        fill={sel ? "#e9c891" : "#d9b98f"}
        stroke={sel ? "#b58a5a" : "#7a5a40"}
        strokeWidth={sel ? 1.6 : 0.6}
        tabIndex={0}
        role="button"
        aria-label={`Editar ${p.nombre}`}
        className="cursor-pointer outline-none focus-visible:stroke-primary focus-visible:[stroke-width:3]"
        onClick={() => onElegirPared(w)}
        onKeyDown={(ev) => {
          if (ev.key === "Enter" || ev.key === " ") {
            ev.preventDefault();
            onElegirPared(w);
          }
        }}
      />,
    );
    let acc = P;
    p.anchos.forEach((a, k) => {
      if (k === p.ajuste) {
        const ini = t.sentido > 0 ? acc : largo - acc - a;
        piezas.push(
          t.dir === "x" ? (
            <rect key={`a${w}-${k}`} x={rx + ini} y={rz} width={a} height={F} fill="#fff" fillOpacity=".35" className="pointer-events-none" />
          ) : (
            <rect key={`a${w}-${k}`} x={rx} y={rz + ini} width={F} height={a} fill="#fff" fillOpacity=".35" className="pointer-events-none" />
          ),
        );
      }
      acc += a + P;
      if (acc >= largo - 1) return;
      const pos = t.sentido > 0 ? acc : largo - acc;
      piezas.push(
        t.dir === "x" ? (
          <line key={`d${w}-${k}`} x1={rx + pos} x2={rx + pos} y1={rz} y2={rz + F} stroke="#7a5a40" strokeWidth=".5" className="pointer-events-none" />
        ) : (
          <line key={`d${w}-${k}`} x1={rx} x2={rx + F} y1={rz + pos} y2={rz + pos} stroke="#7a5a40" strokeWidth=".5" className="pointer-events-none" />
        ),
      );
    });
    // En las laterales el texto va girado para que quepa a lo largo del mueble.
    const cx = rx + rw / 2, cz = rz + rh / 2;
    piezas.push(
      <g key={`x${w}`} transform={t.dir === "z" ? `rotate(-90 ${cx} ${cz})` : undefined}>
        <text x={cx} y={cz - 1} textAnchor="middle" className={estiloTxt}>{p.nombre}</text>
        <text x={cx} y={cz + 8} textAnchor="middle" className={estiloTxtS}>
          {`${p.anchos.length} ${p.anchos.length === 1 ? "módulo" : "módulos"} · ${Math.round(largo)} cm`}
        </text>
      </g>,
    );
  });

  // Muros de 12 cm por fuera del cuarto, para que no tapen el mueble.
  const G = 12;
  const muros = g.muros.map(([x1, z1, x2, z2], i) => {
    if (z1 === z2) {
      const z = z1 + (z1 === 0 ? -G / 2 : G / 2), a = Math.min(x1, x2) - G / 2, b = Math.max(x1, x2) + G / 2;
      return <line key={i} x1={a} y1={z} x2={b} y2={z} stroke="#4a3226" strokeWidth="12" />;
    }
    const x = x1 + (x1 === 0 ? -G / 2 : G / 2), a = Math.min(z1, z2) - G / 2, b = Math.max(z1, z2) + G / 2;
    return <line key={i} x1={x} y1={a} x2={x} y2={b} stroke="#4a3226" strokeWidth="12" />;
  });

  let pasillo: ReactNode = null;
  if (d.pasillo != null) {
    const [x1, z1, x2, z2] = d.tipo === "U"
      ? [F, (d.med.B as number) * 0.75, (d.med.A as number) - F, (d.med.B as number) * 0.75]
      : [g.w * 0.8, F, g.w * 0.8, (d.med.S as number) - F];
    pasillo = (
      <>
        <line x1={x1} y1={z1} x2={x2} y2={z2} stroke="#a12c20" strokeWidth=".8" strokeDasharray="3 2" className="pointer-events-none" />
        <text x={(x1 + x2) / 2 + (d.tipo === "U" ? 0 : 16)} y={(z1 + z2) / 2 - 3} textAnchor="middle" className={estiloTxtS}>
          {`pasillo ${d.pasillo} cm`}
        </text>
      </>
    );
  }

  return (
    <svg
      viewBox={`${-m} ${-m} ${g.w + 2 * m} ${g.h + 2 * m}`}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={`Planta del vestidor ${ESPACIOS[d.tipo].nombre}`}
      className="block h-full w-full touch-none select-none"
    >
      <rect x="0" y="0" width={g.w} height={g.h} fill="#efece6" />
      {piezas}
      {muros}
      {pasillo}
    </svg>
  );
}
