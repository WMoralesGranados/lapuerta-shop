import type { ReactNode } from "react";
import MedidaInput from "@/components/closets/MedidaInput";
import Opcion, { OpcionTexto } from "@/components/closets/Opcion";
import { COLOR_JAL, type SeleccionItem } from "@/components/vestidor/ParedVestidor";
import { MOSTRAR_PROMOCION } from "@/config/site";
import { ACABADOS, COLORES, type AcabadoId, type ColorId } from "@/lib/closets/precios";
import { LIBRERO } from "@/lib/librero/calc";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";
import {
  AJUSTE,
  ESPACIOS,
  ESTILOS,
  ETIQUETAS,
  LIMITES,
  VESTIDOR,
  cabeCajonera,
  cajonerasDe,
  cotizarV,
  fijosDe,
  type ClaveMedida,
  type EstiloVestidor,
  type TipoEspacio,
  type TipoPiezaV,
} from "@/lib/vestidor/calc";
import type { EstadoVestidor } from "@/lib/vestidor/url";

const NOMBRE: Record<string, string> = { r: "Repisa", n: "Nicho", t: "Tubo", c: "Cajonera" };
const F = VESTIDOR.repisaFondo;

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-b py-5 last:border-b-0">
      <h2 className="mb-3 text-base">{titulo}</h2>
      {children}
    </section>
  );
}

function Sub({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 mt-4 text-sm font-semibold">{children}</h3>;
}

function Nota({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs text-muted-foreground">{children}</p>;
}

function Centrado({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-center font-medium", className)}>{children}</span>;
}

function Icono({ tipo }: { tipo: TipoEspacio }) {
  const m = (x1: number, y1: number, x2: number, y2: number) => <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a3226" strokeWidth="3" />;
  const r = (x: number, y: number, w: number, h: number) => <rect key={`${x}-${y}-${w}-${h}`} x={x} y={y} width={w} height={h} fill="#d9b98f" />;
  const formas: Record<TipoEspacio, ReactNode[]> = {
    lineal: [r(10, 8, 80, 14), m(10, 6, 90, 6)],
    L: [r(10, 8, 80, 14), r(10, 22, 14, 30), m(8, 6, 90, 6), m(8, 6, 8, 54)],
    U: [r(10, 8, 80, 14), r(10, 22, 14, 30), r(76, 22, 14, 30), m(8, 54, 8, 6), m(8, 6, 92, 6), m(92, 6, 92, 54)],
    espejo: [r(10, 8, 80, 14), r(10, 38, 80, 14), m(10, 6, 90, 6), m(10, 54, 90, 54)],
  };
  return (
    <svg viewBox="0 0 100 60" aria-hidden="true" className="mb-1 h-10 w-full">
      {formas[tipo]}
    </svg>
  );
}

const estiloStepper = cn("h-11 w-11 rounded-lg border text-lg disabled:opacity-40", focusRing);

type PanelVestidorProps = {
  estado: EstadoVestidor;
  paredSel: number;
  modSel: number;
  seleccion: SeleccionItem | null;
  mensaje: string;
  onTipo: (t: TipoEspacio) => void;
  onMedida: (k: ClaveMedida, valor: number) => void;
  onEstilo: (e: EstiloVestidor) => void;
  onPared: (w: number) => void;
  onMasModulo: () => void;
  onMenosModulo: () => void;
  onModulo: (m: number) => void;
  onAncho: (w: number) => void;
  onAgregar: (t: TipoPiezaV) => void;
  onMover: (delta: number) => void;
  onBorrar: () => void;
  onCambio: (cambio: Partial<Pick<EstadoVestidor, "led" | "color" | "instalar" | "cl" | "jal">>) => void;
};

export default function PanelVestidor({
  estado,
  paredSel,
  modSel,
  seleccion,
  mensaje,
  onTipo,
  onMedida,
  onEstilo,
  onPared,
  onMasModulo,
  onMenosModulo,
  onModulo,
  onAncho,
  onAgregar,
  onMover,
  onBorrar,
  onCambio,
}: PanelVestidorProps) {
  const { tipo, med, estilo, color, led, instalar, cl, jal, diseno: d } = estado;
  const q = cotizarV(d.paredes, led, instalar, 0, undefined, cl);
  const p = d.paredes[paredSel];
  const it = seleccion && p.mods[seleccion.m]?.[seleccion.i];
  const esAj = modSel === p.ajuste;
  const conLed = cotizarV(d.paredes, true, false, 0, undefined, cl).total - cotizarV(d.paredes, false, false, 0, undefined, cl).total;
  const nCaj = cajonerasDe(d.paredes);
  const extraCl = cotizarV(d.paredes, led, false, 0, undefined, true).total - cotizarV(d.paredes, led, false, 0, undefined, false).total;

  const notaMedidas =
    tipo === "U" || tipo === "L"
      ? `Mide cada pared de esquina a esquina. En las esquinas, la lateral empieza a ${F} cm para no chocar con el mueble del fondo.`
      : tipo === "espejo"
        ? "La separación es de pared a pared; cada mueble ocupa 60 cm de fondo."
        : "Mide la pared de esquina a esquina.";

  const tituloSel = it
    ? `${NOMBRE[it.t]} ${it.t === "r" || it.t === "c" ? "seleccionada" : "seleccionado"}: módulo ${(seleccion as SeleccionItem).m + 1}, a ${it.y} cm del piso`
    : p.anchos.length
      ? `${p.nombre}: módulo ${modSel + 1} de ${p.anchos.length} (${p.anchos[modSel]} cm${esAj ? ", ajuste a tu pared: repisas y tubo" : ""}). Toca una pieza en la vista Pared o 3D.`
      : "";

  return (
    <>
      {MOSTRAR_PROMOCION && q.descuento > 0 && (
        <div className="mt-4 rounded-lg bg-secondary p-3 text-sm">
          <b className="block">{q.descuento}% de descuento</b>
          <span className="block">Ahorras {formatoPrecio(q.ahorro + q.ahorroPromo)} en este diseño</span>
          <small className="text-xs text-muted-foreground">Precio de lanzamiento hasta el 30 de noviembre de 2026</small>
        </div>
      )}

      <Grupo titulo="1. Tu espacio">
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(ESPACIOS) as [TipoEspacio, (typeof ESPACIOS)[TipoEspacio]][]).map(([id, e]) => (
            <Opcion key={id} activa={id === tipo} onElegir={() => onTipo(id)}>
              <Icono tipo={id} />
              <OpcionTexto titulo={e.nombre} detalle={e.desc} />
            </Opcion>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="2. Tus medidas">
        <div className="grid grid-cols-3 gap-2">
          {ESPACIOS[tipo].medidas.map((k) => (
            <MedidaInput
              key={`${tipo}-${k}`}
              etiqueta={ETIQUETAS[tipo][k] as string}
              valor={med[k] as number}
              rango={`${LIMITES[k][0]} a ${LIMITES[k][1]}`}
              onConfirmar={(v) => onMedida(k, Number(v))}
            />
          ))}
        </div>
        <Nota>{notaMedidas}</Nota>
        <p role="alert" hidden={!d.error && !d.aviso} className={cn("mt-3 text-sm font-medium", d.error ? "text-destructive" : "text-accent")}>
          {d.error || d.aviso || ""}
        </p>
      </Grupo>

      <Grupo titulo="3. Estilo">
        <div className="grid gap-2">
          {(Object.entries(ESTILOS) as [EstiloVestidor, (typeof ESTILOS)[EstiloVestidor]][]).map(([id, e]) => (
            <Opcion key={id} activa={id === estilo} onElegir={() => onEstilo(id)}>
              <OpcionTexto titulo={e.nombre} detalle={e.desc} />
            </Opcion>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Ajusta cada pared">
        <div className="grid grid-cols-3 gap-2">
          {d.paredes.map((x, w) => (
            <Opcion key={x.id} activa={w === paredSel} onElegir={() => onPared(w)}>
              <Centrado>{x.nombre}</Centrado>
            </Opcion>
          ))}
        </div>
        <Sub>Módulos en {p.nombre}</Sub>
        <div className="flex items-center gap-4">
          <button type="button" aria-label="Quitar módulo" disabled={!fijosDe(p).length} onClick={onMenosModulo} className={estiloStepper}>
            −
          </button>
          <output className="text-lg font-semibold">{p.anchos.length}</output>
          <button type="button" aria-label="Agregar módulo" onClick={onMasModulo} className={estiloStepper}>
            +
          </button>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {p.anchos.map((_, i) => (
            <Opcion key={i} activa={i === modSel} onElegir={() => onModulo(i)}>
              <Centrado>{i === p.ajuste ? "Ajuste" : `Módulo ${i + 1}`}</Centrado>
            </Opcion>
          ))}
        </div>
        <Sub>Ancho {esAj ? "del ajuste" : `del módulo ${modSel + 1}`}</Sub>
        <div className="grid grid-cols-3 gap-2">
          {LIBRERO.anchos.map((w) => (
            <Opcion key={w} activa={!esAj && w === p.anchos[modSel]} deshabilitada={esAj} onElegir={() => onAncho(w)}>
              <Centrado>{w} cm</Centrado>
            </Opcion>
          ))}
        </div>
        {esAj && (
          <Nota>{`Este módulo se ajusta solo a tu pared: hoy mide ${p.anchos[modSel]} cm. Cambia los otros y él se acomoda (de ${AJUSTE.min} a ${AJUSTE.max} cm).`}</Nota>
        )}
        <Sub>{tituloSel}</Sub>
        <div className="grid grid-cols-2 gap-2">
          <Opcion activa={false} onElegir={() => onAgregar("r")}>
            <OpcionTexto titulo="Agregar repisa" detalle="Del ancho del módulo" />
          </Opcion>
          <Opcion activa={false} onElegir={() => onAgregar("t")}>
            <OpcionTexto titulo="Agregar tubo" detalle="Ovalado, para colgar" />
          </Opcion>
          <Opcion activa={false} deshabilitada={esAj} onElegir={() => onAgregar("n")}>
            <OpcionTexto titulo="Agregar nicho" detalle="35 cm de alto" />
          </Opcion>
          <Opcion activa={false} deshabilitada={esAj || !cabeCajonera(p.anchos[modSel])} onElegir={() => onAgregar("c")}>
            <OpcionTexto titulo="Agregar cajonera" detalle="2 cajones, en 60 u 80 cm" />
          </Opcion>
        </div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Opcion activa={false} onElegir={() => onMover(5)}>
            <Centrado>Subir</Centrado>
          </Opcion>
          <Opcion activa={false} onElegir={() => onMover(-5)}>
            <Centrado>Bajar</Centrado>
          </Opcion>
          <Opcion activa={false} onElegir={onBorrar}>
            <Centrado className="text-destructive">Borrar</Centrado>
          </Opcion>
        </div>
        <p role="status" className="mt-2 text-xs text-muted-foreground">
          {mensaje}
        </p>
      </Grupo>

      {nCaj > 0 && (
        <Grupo titulo="Cajones">
          <h3 className="mb-3 text-sm font-semibold">Correderas</h3>
          <div className="grid grid-cols-2 gap-2">
            <Opcion activa={!cl} onElegir={() => onCambio({ cl: false })}>
              <OpcionTexto titulo="Normales" detalle="Incluidas" />
            </Opcion>
            <Opcion activa={cl} onElegir={() => onCambio({ cl: true })}>
              <OpcionTexto titulo="Cierre lento" detalle={`+${formatoPrecio(extraCl)} en este diseño`} />
            </Opcion>
          </div>
          <Sub>Jaladera mini</Sub>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(ACABADOS) as [AcabadoId, string][]).map(([id, n]) => (
              <Opcion key={id} activa={id === jal} onElegir={() => onCambio({ jal: id })}>
                <span className="flex items-center justify-center gap-2 font-medium">
                  <span className="h-3 w-3 rounded-full" style={{ background: COLOR_JAL[id] }} aria-hidden="true" />
                  {n}
                </span>
              </Opcion>
            ))}
          </div>
          <Nota>Va en el canto de arriba de cada cajón. Incluida en el precio.</Nota>
        </Grupo>
      )}

      <Grupo titulo="Iluminación">
        <div className="grid grid-cols-2 gap-2">
          <Opcion activa={led} onElegir={() => onCambio({ led: true })}>
            <OpcionTexto titulo="Con luz LED" detalle={`+${formatoPrecio(conLed)} en este diseño`} />
          </Opcion>
          <Opcion activa={!led} onElegir={() => onCambio({ led: false })}>
            <OpcionTexto titulo="Sin luz LED" detalle="Solo madera" />
          </Opcion>
        </div>
      </Grupo>

      <Grupo titulo="Color">
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(COLORES) as [ColorId, (typeof COLORES)[ColorId]][]).map(([id, c]) => (
            <Opcion key={id} activa={id === color} onElegir={() => onCambio({ color: id })}>
              <span className="mb-2 block h-12 rounded-md bg-cover bg-center" style={{ backgroundImage: `url(/img/${c.img})` }} aria-hidden="true" />
              <span className="text-xs font-medium">{c.nombre}</span>
            </Opcion>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Instalación">
        <div className="grid grid-cols-2 gap-2">
          <Opcion activa={!instalar} onElegir={() => onCambio({ instalar: false })}>
            <OpcionTexto titulo="Sin instalación" detalle="Tú lo instalas" />
          </Opcion>
          <Opcion activa={instalar} onElegir={() => onCambio({ instalar: true })}>
            <OpcionTexto titulo="Con instalación" detalle={`+${formatoPrecio(q.costoInstalacion)} aprox., Mty y Saltillo`} />
          </Opcion>
        </div>
        <Nota>Solo en área metropolitana de Monterrey y Saltillo.</Nota>
      </Grupo>

      <Grupo titulo="Tu vestidor">
        <div className="space-y-2 text-sm">
          {q.lineas.map((linea) => (
            <div key={linea.concepto} className="flex justify-between gap-4">
              <span>{linea.concepto}</span>
              {MOSTRAR_PROMOCION && <span className="shrink-0 font-medium">{formatoPrecio(linea.precio)}</span>}
            </div>
          ))}
          {MOSTRAR_PROMOCION && (
            <>
              <div className="flex justify-between gap-4">
                <span>Precio de lista</span>
                <span className="shrink-0 font-medium">{formatoPrecio(q.lista)}</span>
              </div>
              <div className="flex justify-between gap-4 text-primary">
                <span>Descuento {q.descuento}%</span>
                <span className="shrink-0 font-medium">−{formatoPrecio(q.ahorro)}</span>
              </div>
            </>
          )}
          {instalar && (
            <div className="flex justify-between gap-4">
              <span>Instalación (aprox.)</span>
              {MOSTRAR_PROMOCION && <span className="shrink-0 font-medium">{formatoPrecio(q.instalacion)}</span>}
            </div>
          )}
        </div>
      </Grupo>
    </>
  );
}
