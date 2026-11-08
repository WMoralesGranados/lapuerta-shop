import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ETIQUETAS_CATEGORIA, type Modelo } from "@/data/modelos";
import { cn, focusRing, formatoPrecio } from "@/lib/utils";

export default function ProductCard({ modelo }: { modelo: Modelo }) {
  return (
    <Link to={modelo.ruta} className={cn("card-product group flex flex-col", focusRing)}>
      <div className="relative overflow-hidden">
        <img
          src={modelo.imagen}
          alt={modelo.nombre}
          loading="lazy"
          className="aspect-square w-full object-cover transition-transform duration-500 motion-safe:group-hover:scale-105"
        />
        <span className="badge-category absolute left-3 top-3">
          {ETIQUETAS_CATEGORIA[modelo.categoria]}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-1 font-medium transition-colors group-hover:text-primary">
          {modelo.nombre}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{modelo.lema}</p>
        <p className="mt-3 text-lg font-semibold text-primary">
          Desde {formatoPrecio(modelo.precioDesde)}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">{modelo.notaPrecio}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-medium text-primary">
          Diseñar y cotizar
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </Link>
  );
}
