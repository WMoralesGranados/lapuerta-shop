import { ArrowDown, MessageCircle } from "lucide-react";
import WhatsAppLink from "@/components/WhatsAppLink";
import { MENSAJE_GENERAL } from "@/config/site";
import { modelos } from "@/data/modelos";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";

const closetsDesde = Math.min(
  ...modelos.filter((modelo) => modelo.categoria === "closets").map((modelo) => modelo.precioDesde),
);

const estiloBoton =
  "inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium transition-colors";

export default function Hero() {
  return (
    <section className="hero-gradient py-16 lg:py-24">
      <div className="container-custom grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="badge-category">Fabricado en Monterrey, México</span>
          <h1 className="mt-5 text-4xl font-bold lg:text-6xl">
            Diseña tu mueble <span className="text-primary">a tu medida</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            Escoge el modelo, pon tus medidas y conoce tu precio al momento. Cierra tu compra
            directo por WhatsApp con un asesor.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#catalogo"
              className={cn(
                estiloBoton,
                "bg-primary text-primary-foreground hover:bg-primary/90",
                focusRing,
              )}
            >
              Ver modelos
              <ArrowDown className="h-4 w-4" aria-hidden="true" />
            </a>
            <WhatsAppLink
              mensaje={MENSAJE_GENERAL}
              className={cn(estiloBoton, "border bg-card hover:bg-secondary", focusRing)}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              Hablar por WhatsApp
            </WhatsAppLink>
          </div>
        </div>

        <div className="relative">
          <img
            src="/img/librero/5.jpg"
            alt="Mueble a medida de La Puerta"
            className="aspect-[4/3] w-full rounded-2xl object-cover shadow-elevated"
          />
          <div className="absolute -bottom-5 left-4 rounded-xl bg-card px-5 py-3 shadow-product">
            <p className="text-xs text-muted-foreground">Closets desde</p>
            <p className="text-xl font-semibold text-primary">{formatoPrecio(closetsDesde)}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
