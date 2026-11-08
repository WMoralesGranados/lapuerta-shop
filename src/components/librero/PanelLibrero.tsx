import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import Opcion, { OpcionTexto } from "@/components/closets/Opcion";
import GaleriaLibrero from "@/components/librero/GaleriaLibrero";
import { MOSTRAR_PROMOCION } from "@/config/site";
import { COLORES, type ColorId } from "@/lib/closets/precios";
import {
  LIBRERO,
  PLANTILLAS,
  aTexto,
  cotizar,
  precioDesdeLibrero,
  resumen,
  type Pieza,
  type TipoPieza,
} from "@/lib/librero/calc";
import type { SeleccionPieza } from "@/lib/librero/visor3d";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";

function Grupo({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="border-b py-5 last:border-b-0">
      <h2 className="mb-3 text-base">{titulo}</h2>
      {children}
    </section>
  );
}

function Nota({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-xs text-muted-foreground">{children}</p>;
}

function Centrado({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn("text-center font-medium", className)}>{children}</span>;
}

const estiloStepper = cn("h-11 w-11 rounded-lg border text-lg disabled:opacity-40", focusRing);

type PanelLibreroProps = {
  mods: Pieza[][];
  anchos: number[];
  color: ColorId;
  led: boolean;
  instalar: boolean;
  modSel: number;
  seleccion: SeleccionPieza | null;
  aviso: string;
  onDesde: () => void;
  onMasModulo: () => void;
  onMenosModulo: () => void;
  onElegirModulo: (m: number) => void;
  onAncho: (w: number) => void;
  onAgregar: (t: TipoPieza) => void;
  onMoverSeleccion: (delta: number) => void;
  onBorrar: () => void;
  onLed: (si: boolean) => void;
  onColor: (id: ColorId) => void;
  onInstalar: (si: boolean) => void;
};

export default function PanelLibrero({
  mods,
  anchos,
  color,
  led,
  instalar,
  modSel,
  seleccion,
  aviso,
  onDesde,
  onMasModulo,
  onMenosModulo,
  onElegirModulo,
  onAncho,
  onAgregar,
  onMoverSeleccion,
  onBorrar,
  onLed,
  onColor,
  onInstalar,
}: PanelLibreroProps) {
  const r = resumen(mods, anchos);
  const q = cotizar(mods, anchos, led, instalar);
  // Lo que realmente cambia el total, ya con descuentos.
  const costoLed = cotizar(mods, anchos, true, false).total - cotizar(mods, anchos, false, false).total;
  const inicio = PLANTILLAS[0];
  const it = seleccion && mods[seleccion.m]?.[seleccion.i];
  const tituloSel = it
    ? `${it.t === "n" ? "Nicho seleccionado" : "Repisa seleccionada"}: a ${it.y} cm del piso`
    : "Toca una pieza del dibujo para moverla o borrarla";

  return (
    <>
      {MOSTRAR_PROMOCION && q.descuento > 0 && (
        <div className="mt-4 rounded-lg bg-secondary p-3 text-sm">
          <b className="block">{q.descuento}% de descuento</b>
          <span className="block">Ahorras {formatoPrecio(q.ahorro + q.ahorroPromo)} en este diseño</span>
          <small className="text-xs text-muted-foreground">Precio de lanzamiento hasta el 30 de noviembre de 2026</small>
        </div>
      )}

      <Link
        to={{ search: `?d=${aTexto([inicio])}&a=80&c=${color}&l=1&i=0` }}
        replace
        state={{ keepScroll: true }}
        onClick={onDesde}
        className={cn("mt-4 block rounded-md text-sm font-medium text-primary", focusRing)}
      >
        {`Desde ${formatoPrecio(precioDesdeLibrero())}: 1 módulo con LED, 4 repisas y 1 nicho. Ver →`}
      </Link>

      <Grupo titulo="Módulos">
        <div className="flex items-center gap-4">
          <button
            type="button"
            aria-label="Quitar módulo"
            disabled={r.modulos <= LIBRERO.modulos[0]}
            onClick={onMenosModulo}
            className={estiloStepper}
          >
            −
          </button>
          <output className="text-lg font-semibold">{r.modulos}</output>
          <button
            type="button"
            aria-label="Agregar módulo"
            disabled={r.modulos >= LIBRERO.modulos[1]}
            onClick={onMasModulo}
            className={estiloStepper}
          >
            +
          </button>
        </div>
        <Nota>Cada módulo mide 2.00 m de alto. Los módulos juntos comparten el paral de en medio.</Nota>
      </Grupo>

      <Grupo titulo="Elige módulo para agregar">
        <div className="grid grid-cols-2 gap-2">
          {mods.map((_, i) => (
            <Opcion key={i} activa={i === modSel} onElegir={() => onElegirModulo(i)}>
              <Centrado>Módulo {i + 1}</Centrado>
            </Opcion>
          ))}
        </div>
        <h3 className="mb-3 mt-4 text-sm font-semibold">Ancho del módulo {modSel + 1}</h3>
        <div className="grid grid-cols-3 gap-2">
          {LIBRERO.anchos.map((w) => (
            <Opcion key={w} activa={w === anchos[modSel]} onElegir={() => onAncho(w)}>
              <Centrado>{w} cm</Centrado>
            </Opcion>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Opcion activa={false} onElegir={() => onAgregar("r")}>
            <OpcionTexto titulo="Agregar repisa" detalle="Del ancho del módulo" />
          </Opcion>
          <Opcion activa={false} onElegir={() => onAgregar("n")}>
            <OpcionTexto titulo="Agregar nicho" detalle="35 cm de alto" />
          </Opcion>
        </div>
        <p role="alert" hidden={!aviso} className="mt-3 text-sm text-destructive">
          {aviso}
        </p>
      </Grupo>

      <Grupo titulo={tituloSel}>
        <div className="grid grid-cols-3 gap-2">
          <Opcion activa={false} onElegir={() => onMoverSeleccion(5)}>
            <Centrado>Subir</Centrado>
          </Opcion>
          <Opcion activa={false} onElegir={() => onMoverSeleccion(-5)}>
            <Centrado>Bajar</Centrado>
          </Opcion>
          <Opcion activa={false} onElegir={onBorrar}>
            <Centrado className="text-destructive">Borrar</Centrado>
          </Opcion>
        </div>
      </Grupo>

      <Grupo titulo="Iluminación">
        <div className="grid grid-cols-2 gap-2">
          <Opcion activa={led} onElegir={() => onLed(true)}>
            <OpcionTexto titulo="Con luz LED" detalle={`+${formatoPrecio(costoLed)} en este diseño`} />
          </Opcion>
          <Opcion activa={!led} onElegir={() => onLed(false)}>
            <OpcionTexto titulo="Sin luz LED" detalle="Solo madera" />
          </Opcion>
        </div>
      </Grupo>

      <Grupo titulo="Color">
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(COLORES) as [ColorId, (typeof COLORES)[ColorId]][]).map(([id, c]) => (
            <Opcion key={id} activa={id === color} onElegir={() => onColor(id)}>
              <span
                className="mb-2 block h-12 rounded-md bg-cover bg-center"
                style={{ backgroundImage: `url(/img/${c.img})` }}
                aria-hidden="true"
              />
              <span className="text-xs font-medium">{c.nombre}</span>
            </Opcion>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Instalación">
        <div className="grid grid-cols-2 gap-2">
          <Opcion activa={!instalar} onElegir={() => onInstalar(false)}>
            <OpcionTexto titulo="Sin instalación" detalle="Tú lo instalas" />
          </Opcion>
          <Opcion activa={instalar} onElegir={() => onInstalar(true)}>
            <OpcionTexto
              titulo="Con instalación"
              detalle={`+${formatoPrecio(q.costoInstalacion)} aprox., Mty y Saltillo`}
            />
          </Opcion>
        </div>
        <Nota>Solo en área metropolitana de Monterrey y Saltillo.</Nota>
      </Grupo>

      <Grupo titulo="Tu librero">
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

      <Grupo titulo="Mira cómo se arma">
        <video
          controls
          playsInline
          preload="metadata"
          poster="/img/librero/video-portada.jpg"
          src="/video/librero.mp4"
          aria-label="Video del librero Julieta sin voz: armado con desarmador, repisas ajustables y luz LED"
          className="w-full rounded-lg"
        />
      </Grupo>

      <Grupo titulo="Así se ve instalado">
        <GaleriaLibrero />
      </Grupo>
    </>
  );
}
