import { ArrowLeft, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import WhatsAppLink from "@/components/WhatsAppLink";
import { modelos } from "@/data/modelos";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";
import NotFound from "@/pages/NotFound";

// Página temporal del vestidor: luego será su configurador.
export default function ModeloTemporal({ slug }: { slug: string }) {
  const modelo = modelos.find((m) => m.slug === slug);

  if (!modelo) return <NotFound />;

  return (
    <Layout>
      <section className="container-custom max-w-3xl py-16 lg:py-24">
        <Link
          to="/#catalogo"
          className={cn(
            "inline-flex items-center gap-2 rounded-md text-sm font-medium text-primary",
            focusRing,
          )}
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver al catálogo
        </Link>

        <h1 className="mt-6 text-4xl font-bold">{modelo.nombre}</h1>
        <p className="mt-3 text-lg text-muted-foreground">{modelo.lema}</p>
        <p className="mt-6 text-2xl font-semibold text-primary">
          Desde {formatoPrecio(modelo.precioDesde)}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{modelo.notaPrecio}</p>

        {modelo.incluye.length > 0 && (
          <>
            <h2 className="mt-8 text-xl">Incluye</h2>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-muted-foreground">
              {modelo.incluye.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </>
        )}

        <WhatsAppLink
          mensaje={`Hola, me interesa cotizar el modelo ${modelo.nombre}.`}
          className={cn(
            "mt-8 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90",
            focusRing,
          )}
        >
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Cotizar por WhatsApp
        </WhatsAppLink>
      </section>
    </Layout>
  );
}
