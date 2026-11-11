import { useEffect, useState } from "react";
import { Menu, MessageCircle, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import Logo from "@/components/layout/Logo";
import WhatsAppLink from "@/components/WhatsAppLink";
import { ENLACES_CATEGORIAS, MENSAJE_GENERAL } from "@/config/site";
import { cn, focusRing } from "@/lib/utils";

const enlaces = [{ etiqueta: "Inicio", ruta: "/" }, ...ENLACES_CATEGORIAS];

const estiloEnlace = cn("rounded-md text-sm font-medium transition-colors hover:text-primary", focusRing);

export default function Header({ sticky = true, mensajeWhatsApp = MENSAJE_GENERAL }: { sticky?: boolean; mensajeWhatsApp?: string }) {
  const [abierto, setAbierto] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setAbierto(false);
  }, [location]);

  return (
    <header className={cn("border-b bg-background/95 backdrop-blur", sticky && "sticky top-0 z-30")}>
      <div className="bg-primary px-4 py-1.5 text-center text-xs font-medium text-primary-foreground">
        Diseñado y fabricado en Monterrey, México • Instalación en área metropolitana de Monterrey y
        Saltillo
      </div>

      <div className="container-custom flex h-16 items-center justify-between gap-4 lg:h-20">
        <Logo />

        <nav aria-label="Principal" className="hidden items-center gap-8 md:flex">
          {enlaces.map((enlace) => (
            <Link key={enlace.ruta} to={enlace.ruta} className={estiloEnlace}>
              {enlace.etiqueta}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <WhatsAppLink
            mensaje={mensajeWhatsApp}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
              focusRing,
            )}
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            WhatsApp
          </WhatsAppLink>
          <button
            type="button"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            aria-controls="menu-movil"
            onClick={() => setAbierto((valor) => !valor)}
            className={cn("rounded-md p-2 transition-colors hover:bg-secondary md:hidden", focusRing)}
          >
            {abierto ? (
              <X className="h-5 w-5" aria-hidden="true" />
            ) : (
              <Menu className="h-5 w-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {abierto && (
        <nav id="menu-movil" aria-label="Móvil" className="border-t md:hidden">
          <div className="container-custom flex flex-col gap-1 py-3">
            {enlaces.map((enlace) => (
              <Link
                key={enlace.ruta}
                to={enlace.ruta}
                onClick={() => setAbierto(false)}
                className={cn(estiloEnlace, "py-2")}
              >
                {enlace.etiqueta}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
