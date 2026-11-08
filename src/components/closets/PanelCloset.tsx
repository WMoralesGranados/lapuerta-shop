import type { ReactNode } from "react";
import MedidaInput from "@/components/closets/MedidaInput";
import Opcion, { OpcionTexto } from "@/components/closets/Opcion";
import {
  ACABADOS,
  BARI,
  BISAGRAS,
  COLORES,
  CORREDERAS,
  LIM,
  MODELOS,
  PRECIO_PAR_BISAGRA,
  TONOS,
  bariAlCentro,
  cajonerasBari,
  cantidadBisagras,
  extraCajonera100,
  type ConfigCloset,
  type ConfigEntrada,
  type Cotizacion,
  type ModeloId,
} from "@/lib/closets/precios";
import { formatoPrecio } from "@/lib/utils";

const ESPACIOS = [
  ["ninguno", "Tengo dos muros", "Ya hay preparación para closet"],
  ["der", "Falta el muro derecho", "Se agrega costado de ese lado"],
  ["izq", "Falta el muro izquierdo", "Se agrega costado de ese lado"],
];

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

type PanelClosetProps = {
  cfg: ConfigCloset;
  cotizacion: Cotizacion;
  onCambio: (cambio: ConfigEntrada) => void;
  onMedida: (cambio: ConfigEntrada) => void;
  onModelo: (modelo: ModeloId) => void;
};

export default function PanelCloset({ cfg, cotizacion, onCambio, onMedida, onModelo }: PanelClosetProps) {
  const m = MODELOS[cfg.modelo];
  const caben = cajonerasBari(cfg.W);
  const costoBisagra = (cantidadBisagras(cfg.modelo, cfg.W) / 2) * PRECIO_PAR_BISAGRA;
  const reducirMovimiento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const detalleCajonera = (w: number) => {
    if (!caben.includes(w)) return "No cabe en este ancho";
    if (w === 80 || !caben.includes(80)) return "Incluida";
    return `+${formatoPrecio(Math.round(extraCajonera100(cfg.modelo) * 100) / 100)}`;
  };

  return (
    <>
      <Grupo titulo="Modelo">
        <div className="grid gap-2">
          {(Object.entries(MODELOS) as [ModeloId, (typeof MODELOS)[ModeloId]][]).map(([id, x]) => (
            <Opcion key={id} activa={id === cfg.modelo} onElegir={() => onModelo(id)}>
              <OpcionTexto titulo={x.nombre} detalle={x.lema} />
            </Opcion>
          ))}
        </div>
      </Grupo>

      <Grupo titulo="Tus medidas">
        <div className="grid grid-cols-3 gap-2">
          <MedidaInput
            etiqueta="Ancho"
            valor={cfg.W}
            rango={`${LIM.W[0]} a ${LIM.W[1]}`}
            onConfirmar={(W) => onMedida({ W })}
          />
          <MedidaInput
            etiqueta="Alto"
            valor={cfg.H}
            rango={`${m.H[0]} a ${m.H[1]}`}
            onConfirmar={(H) => onMedida({ H })}
          />
          <MedidaInput
            etiqueta="Fondo"
            valor={cfg.F}
            rango={m.fondoFijo ? `Fijo de ${m.fondoFijo}` : `${LIM.F[0]} a ${LIM.F[1]}`}
            deshabilitado={Boolean(m.fondoFijo)}
            onConfirmar={(F) => onMedida({ F })}
          />
        </div>
        <p role="alert" hidden={cotizacion.ok} className="mt-3 text-sm text-destructive">
          {cotizacion.ok ? "" : cotizacion.error}
        </p>
      </Grupo>

      {cfg.cajonera !== null && cfg.cajonera !== 0 && (
        <Grupo titulo="Cajonera">
          <div className="grid grid-cols-2 gap-2">
            {BARI.cajoneras.map((w) => (
              <Opcion
                key={w}
                activa={w === cfg.cajonera}
                deshabilitada={!caben.includes(w)}
                onElegir={() => onCambio({ cajonera: w })}
              >
                <OpcionTexto titulo={`${w} cm de ancho`} detalle={detalleCajonera(w)} />
              </Opcion>
            ))}
          </div>
          <Nota>
            {bariAlCentro(cfg.W)
              ? `Desde ${BARI.centroDesde / 100} m la cajonera va al centro, con un par de puertas en cada lado.`
              : "La cajonera va a la izquierda, con un par de puertas a su lado."}
          </Nota>
        </Grupo>
      )}

      {/* Aura trae sus propios parales: no necesita costado. */}
      {!m.fondoFijo && (
        <Grupo titulo="Tu espacio">
          <div className="grid gap-2">
            {ESPACIOS.map(([id, titulo, detalle]) => (
              <Opcion key={id} activa={id === cfg.costado} onElegir={() => onCambio({ costado: id })}>
                <OpcionTexto titulo={titulo} detalle={detalle} />
              </Opcion>
            ))}
          </div>
        </Grupo>
      )}

      <Grupo titulo="Color">
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(COLORES).map(([id, c]) => (
            <Opcion key={id} activa={id === cfg.color} onElegir={() => onCambio({ color: id })}>
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

      {cfg.colorNicho && (
        <Grupo titulo="Color de la entrepañera con luz LED">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(TONOS).map(([id, c]) => (
              <Opcion key={id} activa={id === cfg.colorNicho} onElegir={() => onCambio({ colorNicho: id })}>
                <span className="mb-2 block h-12 rounded-md" style={{ background: c.hex }} aria-hidden="true" />
                <span className="text-xs font-medium">{c.nombre}</span>
              </Opcion>
            ))}
          </div>
          <Nota>Va aparte del color del closet.</Nota>
        </Grupo>
      )}

      <Grupo titulo="Jaladera">
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(m.jaladeras).map(([id, nombre]) => (
            <Opcion key={id} activa={id === cfg.jaladera} onElegir={() => onCambio({ jaladera: id })}>
              <OpcionTexto titulo={nombre} detalle={id === m.jalIncluida ? "Incluida" : "Con costo adicional"} />
            </Opcion>
          ))}
        </div>
        {cfg.modelo !== "gola" && (
          <div className="mt-2 grid grid-cols-3 gap-2">
            {Object.entries(ACABADOS).map(([id, nombre]) => (
              <Opcion key={id} activa={id === cfg.acabado} onElegir={() => onCambio({ acabado: id })}>
                <span className="text-center font-medium">{nombre}</span>
              </Opcion>
            ))}
          </div>
        )}
      </Grupo>

      <Grupo titulo="Correderas de cajón">
        {cfg.modelo === "premium" ? (
          <Nota>Cierre lento incluido en correderas y bisagras.</Nota>
        ) : (
          <div className="grid gap-2">
            {Object.entries(CORREDERAS).map(([id, r]) => (
              <Opcion key={id} activa={id === cfg.corredera} onElegir={() => onCambio({ corredera: id })}>
                <OpcionTexto titulo={r.nombre} detalle={r.precio ? `+${formatoPrecio(r.precio)} por cajón` : "Incluida"} />
              </Opcion>
            ))}
          </div>
        )}
      </Grupo>

      <Grupo titulo="Bisagras">
        {cfg.modelo === "premium" ? (
          <Nota>Cierre lento incluido.</Nota>
        ) : (
          <div className="grid gap-2">
            {Object.entries(BISAGRAS).map(([id, nombre]) => (
              <Opcion key={id} activa={id === cfg.bisagra} onElegir={() => onCambio({ bisagra: id })}>
                <OpcionTexto
                  titulo={nombre}
                  detalle={id === "oculta" ? "Incluida" : `+${formatoPrecio(costoBisagra)} en este closet`}
                />
              </Opcion>
            ))}
          </div>
        )}
      </Grupo>

      <Grupo titulo="Tu precio">
        {cotizacion.ok ? (
          <div className="space-y-2">
            {cotizacion.lineas.map((linea) => (
              <div key={linea.concepto} className="flex justify-between gap-4 text-sm">
                <span>{linea.concepto}</span>
                <span className="shrink-0 font-medium">{formatoPrecio(linea.precio)}</span>
              </div>
            ))}
          </div>
        ) : (
          <Nota>Sin precio para estas medidas.</Nota>
        )}
      </Grupo>

      <Grupo titulo="Incluye">
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-muted-foreground">
          {m.incluye.map((texto) => (
            <li key={texto}>{texto}</li>
          ))}
        </ul>
        {m.video && (
          <video
            key={m.video}
            src={`/video/${m.video}.mp4`}
            muted
            loop
            playsInline
            autoPlay={!reducirMovimiento}
            controls={reducirMovimiento}
            preload="metadata"
            aria-label="Video del closet abriendo puertas y cajones"
            className="mt-4 w-full rounded-lg"
          />
        )}
      </Grupo>
    </>
  );
}
