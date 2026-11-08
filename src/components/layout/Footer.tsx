import { MapPin, MessageCircle, Ruler } from "lucide-react";
import { Link } from "react-router-dom";
import Logo from "@/components/layout/Logo";
import WhatsAppLink from "@/components/WhatsAppLink";
import { COBERTURA, ENLACES_CATEGORIAS, MENSAJE_GENERAL } from "@/config/site";
import { cn, focusRing } from "@/lib/utils";

const beneficios = [
  { icono: Ruler, texto: "Fabricado a tu medida" },
  { icono: MapPin, texto: "Instalación en Monterrey y Saltillo" },
  { icono: MessageCircle, texto: "Cotiza por WhatsApp" },
];

const estiloEnlace = cn("rounded-sm text-sm text-muted-foreground hover:text-foreground", focusRing);

export default function Footer() {
  return (
    <footer className="border-t bg-secondary">
      <div className="border-b">
        <div className="container-custom grid gap-4 py-6 sm:grid-cols-3">
          {beneficios.map(({ icono: Icono, texto }) => (
            <div key={texto} className="flex items-center justify-center gap-3 text-sm font-medium">
              <Icono className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              {texto}
            </div>
          ))}
        </div>
      </div>

      <div className="container-custom grid gap-10 py-12 md:grid-cols-[2fr_1fr_1fr]">
        <div>
          <Logo siempreNombre />
          <p className="mt-4 max-w-xs text-sm text-muted-foreground">
            Muebles a medida diseñados y fabricados en Monterrey, México.
          </p>
        </div>

        <div>
          <h2 className="text-sm">Modelos</h2>
          <ul className="mt-4 space-y-2.5">
            {ENLACES_CATEGORIAS.map((enlace) => (
              <li key={enlace.ruta}>
                <Link to={enlace.ruta} className={estiloEnlace}>
                  {enlace.etiqueta}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-sm">Contacto</h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <WhatsAppLink mensaje={MENSAJE_GENERAL} className={estiloEnlace}>
                WhatsApp
              </WhatsAppLink>
            </li>
            <li className="text-sm text-muted-foreground">{COBERTURA}</li>
          </ul>
        </div>
      </div>

      <div className="border-t">
        <p className="container-custom py-5 text-xs text-muted-foreground">
          © 2026 La Puerta. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
