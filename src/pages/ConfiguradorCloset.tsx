import { useCallback, useEffect, useMemo, useRef } from "react";
import { MessageCircle } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import PanelCloset from "@/components/closets/PanelCloset";
import VisorCloset from "@/components/closets/VisorCloset";
import Layout from "@/components/layout/Layout";
import WhatsAppLink from "@/components/WhatsAppLink";
import { modelos } from "@/data/modelos";
import { mensajeCloset } from "@/lib/closets/mensajeWhatsApp";
import {
  MODELOS,
  cotizar,
  normalizar,
  validar,
  type ConfigCloset,
  type ConfigEntrada,
  type ModeloId,
} from "@/lib/closets/precios";
import type { OpcionesCarga } from "@/lib/closets/visor3d";
import { useTituloPagina } from "@/lib/useTituloPagina";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";
import NotFound from "@/pages/NotFound";

const SIN_SCROLL = { replace: true, state: { keepScroll: true } };

function altoValido(valor: string | null): valor is string {
  return valor !== null && valor !== "" && Number.isFinite(Number(valor));
}

function aParametros(c: ConfigCloset) {
  const u = new URLSearchParams({
    w: String(c.W),
    h: String(c.H),
    f: String(c.F),
    c: c.color,
    j: c.jaladera,
    a: c.acabado,
    s: c.costado,
    r: c.corredera,
    b: c.bisagra,
  });
  if (c.cajonera) u.set("k", String(c.cajonera));
  if (c.colorNicho) u.set("n", c.colorNicho);
  return u;
}

function Configurador({ modelo }: { modelo: ModeloId }) {
  useTituloPagina(`${MODELOS[modelo].nombre} | La Puerta`);
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const cfg = useMemo(() => {
    const leer = (k: string) => params.get(k) ?? undefined;
    const h = params.get("h");
    return normalizar({
      modelo,
      W: params.get("w"),
      H: altoValido(h) ? h : MODELOS[modelo].H[0],
      F: params.get("f"),
      color: leer("c"),
      jaladera: leer("j"),
      acabado: leer("a"),
      costado: leer("s"),
      corredera: leer("r"),
      bisagra: leer("b"),
      cajonera: params.get("k"),
      colorNicho: params.get("n"),
    });
  }, [modelo, params]);

  const altoEditado = useRef(cfg.H !== MODELOS[modelo].H[0]);
  const opcionesCarga = useRef<OpcionesCarga>({ conservarCamara: true });

  useEffect(() => {
    const canonica = aParametros(cfg);
    if (canonica.toString() !== params.toString()) setParams(canonica, SIN_SCROLL);
  }, [cfg, params, setParams]);

  const cotizacion = cotizar(cfg);
  // Sin lista de precios igual se muestra el 3D; solo se oculta si las medidas están fuera de rango.
  const actualizar = cotizacion.ok || (!MODELOS[cfg.modelo].precios && !validar(cfg));

  const aplicar = useCallback(
    (cambio: ConfigEntrada, conservarCamara: boolean) => {
      opcionesCarga.current = { conservarCamara };
      setParams(aParametros(normalizar({ ...cfg, ...cambio })), SIN_SCROLL);
    },
    [cfg, setParams],
  );

  const alCambiar = useCallback((cambio: ConfigEntrada) => aplicar(cambio, true), [aplicar]);

  const alCambiarMedida = useCallback(
    (cambio: ConfigEntrada) => {
      if (cambio.H !== undefined) altoEditado.current = true;
      aplicar(cambio, false);
    },
    [aplicar],
  );

  const alCambiarModelo = useCallback(
    (id: ModeloId) => {
      const nuevo = MODELOS[id];
      const destino = modelos.find((m) => m.id === id);
      if (!destino) return;
      const [hMin, hMax] = nuevo.H;
      const H = altoEditado.current ? Math.min(Math.max(cfg.H, hMin), hMax) : hMin;
      const siguiente = normalizar({
        ...cfg,
        modelo: id,
        H,
        jaladera: nuevo.jalIncluida,
        corredera: "ligera",
        bisagra: "oculta",
      });
      opcionesCarga.current = { conservarCamara: false };
      navigate({ pathname: `/closets/${destino.slug}`, search: `?${aParametros(siguiente)}` }, SIN_SCROLL);
    },
    [cfg, navigate],
  );

  const total = cotizacion.ok ? formatoPrecio(cotizacion.total) : "Con un asesor";
  const slug = modelos.find((m) => m.id === modelo)?.slug;
  const liga = `${window.location.origin}/closets/${slug}?${aParametros(cfg)}`;
  const mensaje = mensajeCloset(cfg, cotizacion, liga);

  return (
    <Layout showWhatsAppFloat={false} stickyHeader={false} mensajeWhatsApp={mensaje}>
      <div className="min-[900px]:grid min-[900px]:h-[calc(100dvh-93px)] min-[900px]:grid-cols-[minmax(0,1fr)_400px] min-[900px]:grid-rows-[minmax(0,1fr)] lg:h-[calc(100dvh-109px)]">
        <VisorCloset cfg={cfg} actualizar={actualizar} opcionesCarga={opcionesCarga} />

        <aside className="flex flex-col min-[900px]:min-h-0 min-[900px]:border-l">
          <div className="px-4 min-[900px]:min-h-0 min-[900px]:flex-1 min-[900px]:overflow-y-auto">
            <PanelCloset
              cfg={cfg}
              cotizacion={cotizacion}
              onCambio={alCambiar}
              onMedida={alCambiarMedida}
              onModelo={alCambiarModelo}
            />
          </div>

          <div className="sticky bottom-0 z-20 shrink-0 border-t bg-background p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total estimado con IVA e instalación</p>
                <p className="text-xl font-semibold text-primary">{total}</p>
              </div>
              <WhatsAppLink
                mensaje={mensaje}
                className={cn(
                  "inline-flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90",
                  focusRing,
                )}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                {cotizacion.ok ? "Cotizar por WhatsApp" : "Hablar con un asesor"}
              </WhatsAppLink>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Precio estimado. Un asesor confirma tus medidas antes de fabricar.
            </p>
          </div>
        </aside>
      </div>
    </Layout>
  );
}

export default function ConfiguradorCloset() {
  const { modelo: slug } = useParams();
  const registro = modelos.find((m) => m.categoria === "closets" && m.slug === slug);
  if (!registro) return <NotFound />;
  return <Configurador modelo={registro.id as ModeloId} />;
}
