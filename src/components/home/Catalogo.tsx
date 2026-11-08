import { useSearchParams } from "react-router-dom";
import ProductCard from "@/components/ProductCard";
import { ETIQUETAS_CATEGORIA, modelos, type Categoria } from "@/data/modelos";
import { cn, focusRing } from "@/lib/utils";

type Filtro = Categoria | "todos";

const categorias = Object.keys(ETIQUETAS_CATEGORIA) as Categoria[];

const filtros: { id: Filtro; etiqueta: string }[] = [
  { id: "todos", etiqueta: "Todos" },
  ...categorias.map((id) => ({ id, etiqueta: ETIQUETAS_CATEGORIA[id] })),
];

function leerFiltro(valor: string | null): Filtro {
  return categorias.includes(valor as Categoria) ? (valor as Categoria) : "todos";
}

export default function Catalogo() {
  const [params, setParams] = useSearchParams();
  const activo = leerFiltro(params.get("categoria"));
  const visibles = activo === "todos" ? modelos : modelos.filter((m) => m.categoria === activo);

  function elegir(filtro: Filtro) {
    if (filtro === "todos") {
      setParams({}, { state: { keepScroll: true } });
    } else {
      setParams({ categoria: filtro });
    }
  }

  return (
    <section id="catalogo" className="scroll-mt-32 py-16 lg:py-24">
      <div className="container-custom">
        <span className="badge-category">Catálogo</span>
        <h2 className="mt-3 text-3xl font-bold lg:text-4xl">Encuentra tu mueble</h2>

        <div role="group" aria-label="Filtrar por categoría" className="mt-6 flex flex-wrap gap-2">
          {filtros.map((filtro) => (
            <button
              key={filtro.id}
              type="button"
              aria-pressed={activo === filtro.id}
              onClick={() => elegir(filtro.id)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                activo === filtro.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-border",
                focusRing,
              )}
            >
              {filtro.etiqueta}
            </button>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibles.map((modelo) => (
            <ProductCard key={modelo.id} modelo={modelo} />
          ))}
        </div>
      </div>
    </section>
  );
}
