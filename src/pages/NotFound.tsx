import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { cn, focusRing } from "@/lib/utils";

export default function NotFound() {
  return (
    <Layout>
      <section className="container-custom py-24 text-center">
        <h1 className="text-4xl font-bold">Página no encontrada</h1>
        <p className="mt-3 text-muted-foreground">La página que buscas no existe.</p>
        <Link
          to="/"
          className={cn(
            "mt-8 inline-flex rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90",
            focusRing,
          )}
        >
          Volver al inicio
        </Link>
      </section>
    </Layout>
  );
}
