import { precioDesdeCloset } from "@/lib/closets/precios";
import { precioDesdeLibrero } from "@/lib/librero/calc";
import { precioDesdeVestidor } from "@/lib/vestidor/calc";

export type Categoria = "closets" | "libreros" | "vestidores";

export type Modelo = {
  id: string;
  slug: string;
  nombre: string;
  categoria: Categoria;
  lema: string;
  incluye: string[];
  imagen: string;
  precioDesde: number;
  notaPrecio: string;
  ruta: string;
};

export const ETIQUETAS_CATEGORIA: Record<Categoria, string> = {
  closets: "Closets",
  libreros: "Libreros",
  vestidores: "Vestidores",
};

const NOTA_CLOSETS = "IVA e instalación incluidos";

export const modelos: Modelo[] = [
  {
    id: "classic",
    slug: "florencia-classic",
    nombre: "Florencia Classic",
    categoria: "closets",
    lema: "Cajonera con secreter y puertas lisas",
    incluye: [
      "Cajonera de 5 cajones, 60 cm de ancho",
      "Maletero a 60 cm de profundidad",
      "4 tubos ovalados",
      "Bisagras ocultas de 110° y correderas de extensión ligera",
      "Interior y cajones en blanco",
    ],
    imagen: "/img/closets/florencia-classic.webp",
    precioDesde: precioDesdeCloset("classic"),
    notaPrecio: NOTA_CLOSETS,
    ruta: "/closets/florencia-classic",
  },
  {
    id: "gola",
    slug: "florencia-gola",
    nombre: "Florencia Gola",
    categoria: "closets",
    lema: "Sin jaladeras: el perfil gola es la jaladera",
    incluye: [
      "Cajonera de 4 cajones con perfil gola, 60 cm de ancho",
      "Maletero a 60 cm de profundidad",
      "4 tubos ovalados",
      "Bisagras ocultas de 110° y correderas de extensión ligera",
      "Interior y cajones en blanco",
    ],
    imagen: "/img/closets/florencia-gola.webp",
    precioDesde: precioDesdeCloset("gola"),
    notaPrecio: NOTA_CLOSETS,
    ruta: "/closets/florencia-gola",
  },
  {
    id: "premium",
    slug: "florencia-premium",
    nombre: "Florencia Premium",
    categoria: "closets",
    lema: "Nicho abierto y cajones con perfil gola",
    incluye: [
      "Cajonera de 4 cajones con perfil gola",
      "Nicho abierto con repisas",
      "Base de 12 cm",
      "Maletero a 60 cm de profundidad",
      "4 tubos ovalados",
      "Bisagras y correderas con cierre lento",
    ],
    imagen: "/img/closets/florencia-premium.webp",
    precioDesde: precioDesdeCloset("premium"),
    notaPrecio: NOTA_CLOSETS,
    ruta: "/closets/florencia-premium",
  },
  {
    id: "bari",
    slug: "closet-bari",
    nombre: "Closet Bari",
    categoria: "closets",
    lema: "Cajonera de 3 cajones y puertas a 2.32 m",
    incluye: [
      "Cajonera de 3 cajones de 80 o 100 cm de ancho; cajones por dentro en MDF blanco de 15 mm",
      "Maletero a 60 cm de profundidad",
      "3 tubos ovalados",
      "Entrepañera de 3 entrepaños, 40 cm de ancho y 40 de fondo",
      "Base de 12 cm; toda la estructura, por dentro y por fuera, del color que elijas",
      "Bisagras ocultas y correderas de extensión ligera",
    ],
    imagen: "/img/closets/closet-bari.webp",
    precioDesde: precioDesdeCloset("bari"),
    notaPrecio: NOTA_CLOSETS,
    ruta: "/closets/closet-bari",
  },
  {
    id: "aura",
    slug: "closet-aura",
    nombre: "Closet Aura",
    categoria: "closets",
    lema: "Entrepañera abierta con luz LED sobre la cajonera",
    incluye: [
      "Cajonera de 3 cajones de 80 o 100 cm de ancho; cajones por dentro en MDF blanco de 15 mm",
      "Entrepañera abierta de 1.62 m y 50 cm de fondo, con 3 entrepaños de 40 y luz LED vertical",
      "Módulos de 2 puertas con sus propios parales, maletero y tubos",
      "Base de 12 cm",
      "Bisagras ocultas y correderas de extensión ligera",
    ],
    imagen: "/img/closets/closet-aura.webp",
    precioDesde: precioDesdeCloset("aura"),
    notaPrecio: NOTA_CLOSETS,
    ruta: "/closets/closet-aura",
  },
  {
    id: "julieta",
    slug: "librero-julieta",
    nombre: "Librero Julieta",
    categoria: "libreros",
    lema: "Módulos con repisas y nichos, con o sin luz LED.",
    incluye: [],
    imagen: "/img/librero-julieta.jpg",
    precioDesde: precioDesdeLibrero(),
    notaPrecio: "1 módulo de 80 cm con LED. Con IVA, instalación aparte",
    ruta: "/librero-julieta",
  },
  {
    id: "vestidor",
    slug: "vestidor",
    nombre: "Vestidor a tu medida",
    categoria: "vestidores",
    lema: "Lineal, en L, en U o tipo espejo, con luz LED, tubos y cajoneras.",
    incluye: [],
    imagen: "/img/vestidor-led.jpeg",
    precioDesde: precioDesdeVestidor(),
    notaPrecio: "Lineal de 2.60 m con LED. Con IVA, instalación aparte",
    ruta: "/vestidores?t=lineal&e=colgar",
  },
];
