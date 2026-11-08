// Visor de venta: dibuja el closet con sus medidas, entre muros o con costado. Unidades en cm.
// Réplica de mock/public/js/venta3d.js. No simplificar geometría ni cambiar valores.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import {
  COLORES,
  MODELOS,
  TONOS,
  bariAlCentro,
  contraventanas,
  paresBari,
  puertasPorLado,
  type AcabadoId,
  type ColorId,
  type ConfigCloset,
  type Costado,
  type ModeloCloset,
} from "@/lib/closets/precios";

type Orientacion = "h" | "v";
export type NombreVista = "tres" | "frente" | "detalle";
export type OpcionesCarga = { conservarCamara?: boolean };

const E = 1.6, HOLGURA = 0.3, MURO = 40;
// [color, metal, rugosidad]. Metal a medias: con metal total la jaladera solo refleja el cuarto y
// en la mini, que es chica, casi no se distingue plata de dorado.
export const ACABADO: Record<AcabadoId, [number, number, number]> = { plata: [0xd4d8dc, 0.6, 0.28], negro: [0x1a1a1a, 0.25, 0.5], dorado: [0xd0a24a, 0.65, 0.3] };
RectAreaLightUniformsLib.init();
const cargador = new THREE.TextureLoader();
const texturas: Partial<Record<ColorId, THREE.Texture>> = {};

export function textura(id: ColorId) {
  let t = texturas[id];
  if (!t) {
    t = cargador.load(`/img/${COLORES[id].img}`);
    // Repetición en espejo para que no se note corte en la veta de las piezas largas.
    t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    texturas[id] = t;
  }
  return t;
}

function liberarTexturas() {
  for (const id of Object.keys(texturas) as ColorId[]) {
    texturas[id]?.dispose();
    delete texturas[id];
  }
}

// Ajuste de tono medido contra el video real: mate para evitar reflejos que lavan el color.
export const ACABADO_MATERIAL: Partial<Record<ColorId, { color: number; roughness: number }>> = { nogal: { color: 0xf6e6e2, roughness: 0.78 } };

// Escala real de la veta: una repetición cada 90 × 180 cm, siempre a lo largo del lado mayor.
export function geoVeta(sx: number, sy: number, sz: number, sem: number) {
  const geo = new THREE.BoxGeometry(sx, sy, sz);
  const uv = geo.attributes.uv;
  const caras = [[sz, sy], [sz, sy], [sx, sz], [sx, sz], [sx, sy], [sx, sy]];
  const ox = (sem * 0.137) % 1, oy = (sem * 0.271) % 1;
  caras.forEach(([a, b], f) => {
    for (let i = 0; i < 4; i++) {
      const j = f * 4 + i, u = uv.getX(j), v = uv.getY(j);
      if (a > b) uv.setXY(j, (v * b) / 90 + ox, (u * a) / 180 + oy);
      else uv.setXY(j, (u * a) / 90 + ox, (v * b) / 180 + oy);
    }
  });
  return geo;
}

const reducirMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class VisorVenta {
  private cont: HTMLElement;
  private abierto = false;
  private prog = 0;
  private sem = 1;
  private destruido = false;
  private renderer: THREE.WebGLRenderer;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private sol!: THREE.DirectionalLight;
  private ambiente!: THREE.Scene;
  private pmrem!: THREE.PMREMGenerator;
  private entorno!: THREE.Texture;
  private mBlanco!: THREE.MeshStandardMaterial;
  private mMuro!: THREE.MeshStandardMaterial;
  private mSombra!: THREE.MeshStandardMaterial;
  private mTubo!: THREE.MeshStandardMaterial;
  private mLed!: THREE.MeshBasicMaterial;
  private mHalo!: THREE.MeshBasicMaterial;
  private haloMapa!: THREE.CanvasTexture;
  private fondo!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private piso!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private g!: THREE.Group;
  private ctrl!: OrbitControls;
  private observador!: ResizeObserver;
  private meta: { p: THREE.Vector3; c: THREE.Vector3 } | null = null;
  private alIniciarCtrl = () => {
    this.meta = null;
  };
  private ult = 0;
  private mats: THREE.Material[] = [];
  private cantos = new Map<THREE.MeshStandardMaterial, THREE.MeshLambertMaterial>();
  private matNicho: THREE.MeshStandardMaterial | null = null;
  private pivotes: THREE.Group[] = [];
  private cajones: THREE.Group[] = [];
  private dim!: { W: number; H: number; F: number };
  private costado: Costado | undefined;

  constructor(cont: HTMLElement) {
    this.cont = cont;
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    try {
      this.iniciar();
    } catch (error) {
      this.renderer.setAnimationLoop(null);
      this.renderer.dispose();
      this.renderer.domElement.remove();
      throw error;
    }
  }

  private iniciar() {
    const cont = this.cont;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    cont.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xe7e8e6);
    this.ambiente = new RoomEnvironment();
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.entorno = this.pmrem.fromScene(this.ambiente, 0.04).texture;
    this.scene.environment = this.entorno;
    // Three 0.160 todavía no usa esta propiedad; se conserva como en el original.
    (this.scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = 0.55;
    this.camera = new THREE.PerspectiveCamera(36, 1, 1, 6000);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b4a8, 0.55));
    this.sol = new THREE.DirectionalLight(0xfff5e8, 1.5);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(2048, 2048);
    this.sol.shadow.bias = -0.0006;
    this.scene.add(this.sol, this.sol.target);

    this.mBlanco = new THREE.MeshStandardMaterial({ color: 0xf1f1ee, roughness: 0.7 });
    this.mMuro = new THREE.MeshStandardMaterial({ color: 0xdedfdb, roughness: 0.95 });
    this.mSombra = new THREE.MeshStandardMaterial({ color: 0x1c1b19, roughness: 0.8 });
    this.mTubo = new THREE.MeshStandardMaterial({ color: 0xc8ccd0, roughness: 0.3, metalness: 0.95 });
    this.mLed = new THREE.MeshBasicMaterial({ color: 0xfff3dc, toneMapped: false });
    // Degradado horizontal: brillante al centro y transparente a los lados.
    const lienzo = document.createElement("canvas");
    lienzo.width = 64; lienzo.height = 4;
    const ctx = lienzo.getContext("2d")!;
    const grad = ctx.createLinearGradient(0, 0, 64, 0);
    grad.addColorStop(0, "rgba(255,200,120,0)");
    grad.addColorStop(0.5, "rgba(255,214,150,1)");
    grad.addColorStop(1, "rgba(255,200,120,0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 4);
    this.haloMapa = new THREE.CanvasTexture(lienzo);
    this.mHalo = new THREE.MeshBasicMaterial({ map: this.haloMapa, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });

    const fondo = new THREE.Mesh(new THREE.PlaneGeometry(6000, 1600), this.mMuro);
    fondo.position.set(0, 800, -0.5);
    fondo.receiveShadow = true;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(6000, 3000), new THREE.MeshStandardMaterial({ color: 0xbdb9b0, roughness: 0.5 }));
    piso.rotation.x = -Math.PI / 2;
    piso.position.z = 1500;
    piso.receiveShadow = true;
    this.fondo = fondo;
    this.piso = piso;
    this.scene.add(fondo, piso);
    this.g = new THREE.Group();
    this.scene.add(this.g);

    this.ctrl = new OrbitControls(this.camera, this.renderer.domElement);
    this.ctrl.enableDamping = !reducirMovimiento();
    this.ctrl.maxPolarAngle = Math.PI / 2 - 0.02;
    this.ctrl.minDistance = 25;
    // No deja pasar la cámara detrás del muro.
    this.ctrl.minAzimuthAngle = -1.25;
    this.ctrl.maxAzimuthAngle = 1.25;
    this.ctrl.addEventListener("start", this.alIniciarCtrl);
    this.observador = new ResizeObserver(() => this.ajustar());
    this.observador.observe(cont);
    this.ajustar();
    this.renderer.setAnimationLoop(() => this.cuadro());
  }

  ajustar() {
    const w = this.cont.clientWidth, h = this.cont.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  caja(padre: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material, veta = false) {
    const m = new THREE.Mesh(veta ? geoVeta(sx, sy, sz, this.sem++) : new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x + sx / 2, y + sy / 2, z + sz / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    padre.add(m);
    return m;
  }

  jaladera(padre: THREE.Object3D, x: number, y: number, z: number, orient: Orientacion, c: ConfigCloset, corto = false) {
    if (c.jaladera === "gola") return;
    const [color, metal, rug] = ACABADO[c.acabado];
    const mat = new THREE.MeshStandardMaterial({ color, metalness: metal, roughness: rug });
    if (c.jaladera === "barra") {
      // 25 cm en puertas y cajones; 15 cm en contraventanas y secreter.
      const largo = corto ? 15 : 25;
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, largo, 16), mat);
      if (orient === "h") b.rotation.z = Math.PI / 2;
      b.position.set(x, y, z + 2.6);
      b.castShadow = true;
      padre.add(b);
      for (const s of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 2.6, 10), mat);
        p.rotation.x = Math.PI / 2;
        p.position.set(orient === "h" ? x + (s * largo) / 3 : x, orient === "h" ? y : y + (s * largo) / 3, z + 1.3);
        padre.add(p);
      }
    } else {
      const m = new THREE.Mesh(new THREE.BoxGeometry(orient === "h" ? 6 : 1.1, orient === "h" ? 1.1 : 6, 1.8), mat);
      m.position.set(x, y, z + 0.9);
      m.castShadow = true;
      padre.add(m);
    }
  }

  // Frente de puerta o cajón: la cara y la trasera con veta; los 4 cantos más oscuros, porque dentro de la
  // holgura de 3 mm quedan en sombra. Van mate y sin reflejo: vistos de lado, un material con brillo
  // refleja el cuarto (efecto Fresnel) y el canto se ve como una línea blanca.
  frente(padre: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, mat: THREE.MeshStandardMaterial) {
    if (!this.cantos.has(mat)) {
      const canto = new THREE.MeshLambertMaterial({ map: mat.map, color: mat.color.clone().multiplyScalar(0.3) });
      this.cantos.set(mat, canto);
      this.mats.push(canto);
    }
    const c = this.cantos.get(mat)!;
    const m = new THREE.Mesh(geoVeta(sx, sy, E, this.sem++), [c, c, c, c, mat, mat]);
    m.position.set(x + sx / 2, y + sy / 2, z + E / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    padre.add(m);
    return m;
  }

  // Junta oscura detrás de los cantos de un frente: sin ella, la holgura de 3 mm deja ver el muro
  // o el interior como una línea blanca. Va pegada al frente y se mueve con él.
  juntas(padre: THREE.Object3D, x: number, y: number, a: number, l: number, z: number) {
    // Más honda y encimada con la del frente de junto para que tampoco se vea el interior en ángulo.
    const s = 0.9, f = 1, o = HOLGURA;
    this.caja(padre, x - o, y - o, z - f, a + 2 * o, s, f, this.mSombra);
    this.caja(padre, x - o, y + l - s + o, z - f, a + 2 * o, s, f, this.mSombra);
    this.caja(padre, x - o, y - o, z - f, s, l + 2 * o, f, this.mSombra);
    this.caja(padre, x + a - s + o, y - o, z - f, s, l + 2 * o, f, this.mSombra);
  }

  // Puerta con bisagra en un borde; se guarda para animar la apertura.
  puerta(x: number, y: number, ancho: number, alto: number, F: number, bisagraIzq: boolean, matF: THREE.MeshStandardMaterial, c: ConfigCloset, jalY: number, conJal = true, corto = false) {
    const z = F - E;
    const px = bisagraIzq ? x : x + ancho;
    const piv = new THREE.Group();
    piv.position.set(px, 0, z);
    piv.userData.dir = bisagraIzq ? -1 : 1;
    const sub = new THREE.Group();
    sub.position.set(-px, 0, -z);
    piv.add(sub);
    this.g.add(piv);
    this.pivotes.push(piv);
    const a = ancho - HOLGURA, l = alto - HOLGURA;
    this.frente(sub, x + HOLGURA / 2, y + HOLGURA / 2, z, a, l, matF);
    this.juntas(sub, x + HOLGURA / 2, y + HOLGURA / 2, a, l, z);
    if (conJal) this.jaladera(sub, bisagraIzq ? x + ancho - 3 : x + 3, jalY, F, "v", c, corto);
  }

  cargar(c: ConfigCloset, { conservarCamara = false }: OpcionesCarga = {}) {
    if (this.destruido) return;
    this.limpiar();
    const m = MODELOS[c.modelo];
    const { W, H, F } = c;
    const mat = new THREE.MeshStandardMaterial({ map: textura(c.color), roughness: 0.55, ...ACABADO_MATERIAL[c.color] });
    this.mats = [mat];
    this.cantos = new Map();
    // Aura: la entrepañera con LED es melamina lisa de otro tono. Con la luz de la escena un color plano
    // se ve lavado; se baja para que se parezca a la muestra.
    this.matNicho = null;
    if (c.colorNicho) {
      this.matNicho = new THREE.MeshStandardMaterial({ color: new THREE.Color(TONOS[c.colorNicho].hex).multiplyScalar(0.62), roughness: 0.85 });
      this.mats.push(this.matNicho);
    }
    this.pivotes = [];
    this.cajones = [];

    const g = this.g;

    // Muros de preparación: se retira el del lado que lleva costado.
    const altoMuro = H + 45;
    if (c.costado !== "izq") this.caja(g, -MURO, 0, 0, MURO, altoMuro, F + 12, this.mMuro);
    if (c.costado !== "der") this.caja(g, W, 0, 0, MURO, altoMuro, F + 12, this.mMuro);
    if (c.costado === "izq") this.caja(g, -E, 0, 0, E, H, F, mat, true);
    if (c.costado === "der") this.caja(g, W, 0, 0, E, H, F, mat, true);

    if (c.modelo === "bari") this.armarBari(c, m, mat);
    else if (c.modelo === "aura") this.armarAura(c, m, mat);
    else this.armarFlorencia(c, m, mat);

    const ext = Math.max(W, H) * 1.1;
    this.sol.position.set(W * 0.75, H * 1.9, 340 + W * 0.3);
    this.sol.target.position.set(W / 2, H * 0.4, 0);
    const cam = this.sol.shadow.camera;
    cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext; cam.far = 2400;
    cam.updateProjectionMatrix();
    this.fondo.position.x = this.piso.position.x = W / 2;
    this.dim = { W, H, F };
    this.prog = this.abierto ? 1 : 0;
    this.aplicar();
    const cambioCostado = this.costado !== undefined && this.costado !== c.costado;
    this.costado = c.costado;
    if (!conservarCamara) this.vista("tres", true);
    // Al elegir costado, la cámara gira para que se vea el lado que cambió.
    else if (cambioCostado) this.vista("tres");
  }

  // Florencia: cajonera de 60 al centro con secreter, puertas a los lados y contraventanas.
  armarFlorencia(c: ConfigCloset, m: ModeloCloset, mat: THREE.MeshStandardMaterial) {
    const { W, H, F } = c;
    // hP es la altura total a la que terminan las puertas; la base queda incluida en ella.
    const hP = m.puerta, hC = Math.min(m.contra, H - hP), yTop = hP + hC, cW = 60, base = m.base || 0;
    const lado = (W - cW) / 2, x0 = lado, x1 = lado + cW;
    const n = puertasPorLado(W), nC = contraventanas(c.modelo, W);
    // La mini va una por cada par de puertas, en la unión, como en el closet real.
    const mini = c.jaladera === "mini";
    const g = this.g;

    // Interior en blanco.
    this.caja(g, 0, 0, 0, W, yTop, 0.6, this.mBlanco);
    this.caja(g, 0, base, 0.6, W, 1, F - E - 0.6, this.mBlanco);
    if (base) this.caja(g, 0, 0, F - E, W, base, E, mat, true);
    this.caja(g, 0, hP - E, 0.6, W, E, F - E - 0.6, this.mBlanco);
    this.caja(g, 0, yTop - E, 0.6, W, E, F - 0.6, this.mBlanco);
    this.caja(g, 0, hP, 0.6, E, hC, F - E - 0.6, this.mBlanco);
    this.caja(g, W - E, hP, 0.6, E, hC, F - E - 0.6, this.mBlanco);
    this.caja(g, 0, 0, 0.6, E, hP, F - E - 0.6, this.mBlanco);
    this.caja(g, W - E, 0, 0.6, E, hP, F - E - 0.6, this.mBlanco);

    // Cuatro tubos, dos por lado.
    for (const [xa, xb] of [[0, x0], [x1, W]]) for (const y of [hP - 8, hP * 0.56]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, xb - xa - 2 * E, 18), this.mTubo);
      t.rotation.z = Math.PI / 2;
      t.position.set((xa + xb) / 2, y, F * 0.5);
      t.castShadow = true;
      g.add(t);
    }

    // Cajonera: mide 60 de ancho y va siempre al frente; con más fondo queda hueco atrás.
    const matCaj = m.interiorColor ? mat : this.mBlanco;
    const fondoCaj = Math.min(50, F - E);
    const zCaj = F - E - fondoCaj;
    const abajo = m.cajonAbajo || m.altoCajon;
    const hCaj = base + abajo + (m.cajones - 1) * m.altoCajon;
    // Los laterales se ven de frente: siempre van en el color exterior, como el closet real.
    for (const x of [x0, x1 - E]) this.caja(g, x, 0, zCaj, E, hP, fondoCaj, mat, true);
    const atras = this.caja(g, x0 + E, 0, zCaj, cW - 2 * E, hP - E, 0.6, matCaj, m.interiorColor);
    atras.castShadow = false;
    this.caja(g, x0 + E, hCaj, zCaj, cW - 2 * E, E, fondoCaj, mat, true);
    this.caja(g, x0 + E, hP - E, zCaj, cW - 2 * E, E, fondoCaj + E, mat, true);

    for (let i = 0; i < m.cajones; i++) {
      const gr = new THREE.Group();
      g.add(gr);
      // El cajón de abajo puede ser más alto que los demás.
      const y = i === 0 ? base : base + abajo + (i - 1) * m.altoCajon;
      const alto = (i === 0 ? abajo : m.altoCajon) - HOLGURA;
      const gola = m.gola;
      const zF = F - E;
      this.frente(gr, x0 + E + 0.2, y + 0.15, zF, cW - 2 * E - 0.4, gola ? alto - 2.4 : alto, mat);
      this.juntas(gr, x0 + E + 0.2, y + 0.15, cW - 2 * E - 0.4, alto, zF);
      if (gola) this.caja(g, x0 + E + 0.2, y + alto - 2.25, zF - 0.5, cW - 2 * E - 0.4, 2.4, 0.5, this.mSombra);
      this.caja(gr, x0 + E + 1.3, y + 1.5, zF - 40, cW - 2 * E - 2.6, 1, 40, this.mBlanco);
      for (const dx of [1.3, cW - 2 * E - 2.9]) this.caja(gr, x0 + E + dx, y + 1.5, zF - 40, 1.6, 12, 40, this.mBlanco);
      if (!gola) this.jaladera(gr, W / 2, y + alto - 5, F, "h", c);
      this.cajones.push(gr);
    }

    const espacio = hP - hCaj - E;
    if (c.modelo === "premium") {
      // Nicho abierto: base y 2 repisas, como el modelo real.
      for (let k = 1; k <= 2; k++) this.caja(g, x0 + E, hCaj + E + (k * espacio) / 3, zCaj, cW - 2 * E, E, fondoCaj, mat, true);
    } else {
      this.caja(g, x0 + E, hCaj + E + espacio / 2, zCaj, cW - 2 * E, E, fondoCaj, this.mBlanco);
      this.puerta(x0, hCaj + E, cW / 2, hP - hCaj - E, F, true, mat, c, hCaj + 12, true, true);
      this.puerta(W / 2, hCaj + E, cW / 2, hP - hCaj - E, F, false, mat, c, hCaj + 12, !mini, true);
    }

    // Puertas laterales y contraventanas.
    const aP = lado / n;
    for (const [xB, izqFuera] of [[0, true], [x1, false]] as [number, boolean][]) {
      for (let i = 0; i < n; i++) {
        const biz = n === 1 ? izqFuera : i === 0;
        this.puerta(xB + i * aP, base, aP, hP - base, F, biz, mat, c, 105, !mini || n === 1 || i === 0);
      }
    }
    // Con 6 contraventanas, cada una queda en línea con su puerta y con la cajonera.
    const anchosC: number[] = nC === 6 ? [aP, aP, cW / 2, cW / 2, aP, aP] : Array(nC).fill(W / nC);
    let xC = 0;
    anchosC.forEach((aC, i) => {
      const izq = i % 2 === 0;
      this.puerta(xC, hP, aC, hC, F, izq, mat, c, hP + Math.min(mini ? 7 : 11, hC / 2), !mini || izq, true);
      xC += aC;
    });
    // Fijo superior que cierra hasta el techo.
    if (H > yTop) this.caja(g, 0, yTop, F - E, W, H - yTop, E, mat, true);
  }

  // Bari: zoclo de 12, cajonera de 80 o 100 (3 cajones de 20) con 2 puertas de 1.60 m arriba,
  // y pares de puertas de 2.20 m. Todas terminan a 2.32 m. Por dentro no lleva fondo ni laterales:
  // solo la entrepañera de 40 cm con sus 2 paredes, el maletero y los tubos colgados de él.
  armarBari(c: ConfigCloset, m: ModeloCloset, mat: THREE.MeshStandardMaterial) {
    const { W, H, F } = c;
    const g = this.g;
    const Z = m.zoclo as number, hP = m.puerta, cW = c.cajonera as number, aC = m.altoCajon;
    const hCaj = Z + m.cajones * aC;
    const centro = bariAlCentro(W);
    const par = (W - cW) / paresBari(W);
    const xC = centro ? par : 0;
    const zF = F - E;
    const mini = c.jaladera === "mini";

    // Zoclo al frente y piso y maletero por dentro, en el color elegido. Sin tapa arriba: cierra el fijo.
    this.caja(g, 0, 0, zF - 1, W, Z, E, mat, true);
    this.caja(g, 0, Z - E, 0.6, W, E, zF - 1.6, mat, true);
    const yMal = hP - 40;
    this.caja(g, 0, yMal, 0.6, W, E, zF - 0.6, mat, true);

    // División: separa la cajonera de las puertas altas, del zoclo al maletero (en el video llega al techo).
    // De lado hay una; con la cajonera al centro, una en cada lado de ella. Del lado del muro no hay lateral.
    const divisiones = centro ? [xC, xC + cW - E] : [cW - E];
    for (const x of divisiones) this.caja(g, x, Z, 0.6, E, yMal - Z, zF - 0.6, mat, true);

    // Cajonera: caja de su ancho hasta 72 cm; cajones de MDF blanco de 15 mm con frente de color y 3 mm entre frentes.
    const fondoCaj = Math.min(55, zF);
    const zCaj = zF - fondoCaj;
    if (!centro) this.caja(g, 0, Z, zCaj, E, hCaj - Z, fondoCaj, mat, true);
    this.caja(g, xC + E, hCaj - E, 0.6, cW - 2 * E, E, zF - 0.6, mat, true);
    this.cajonesColumna(c, m, mat, xC, cW);

    // Arriba de la cajonera: entrepañera de 40 con 2 paredes y 3 entrepaños; el resto, un tubo.
    // 40 de fondo, pegada al muro del fondo; el maletero sí va a todo el fondo (60).
    const fondoE = Math.min(40, zF);
    const zE = 0.6;
    const xE = xC;
    for (const x of [xE, xE + 40 - E]) this.caja(g, x, hCaj, zE, E, yMal - hCaj, fondoE, mat, true);
    for (let k = 1; k <= 3; k++) this.caja(g, xE + E, hCaj + (k * (yMal - hCaj)) / 4, zE, 40 - 2 * E, E, fondoE, mat, true);

    // Tubos ovalados de muro a división: uno junto a la entrepañera y dos (doble colgado) en cada par.
    const tubo = (xa: number, xb: number, y: number) => this.tuboOval(xa, xb, y, F * 0.5);
    tubo(xE + 40, xC + cW - E, yMal - 8);
    const tramos = centro ? [[0, par], [xC + cW, W]] : [[cW, W]];
    for (const [xa, xb] of tramos) {
      const a = divisiones.includes(xa) ? xa + E : xa, b = divisiones.includes(xb - E) ? xb - E : xb;
      tubo(a, b, yMal - 8);
      tubo(a, b, 100);
    }

    // Puertas: 2 de 1.60 m arriba de la cajonera y un par de 2.20 m en cada tramo.
    // La mini va una por par, en la unión; la de barra, una en cada puerta.
    const jalCorta = hCaj + 12;
    this.puerta(xC, hCaj, cW / 2, hP - hCaj, F, true, mat, c, jalCorta, true, true);
    this.puerta(xC + cW / 2, hCaj, cW / 2, hP - hCaj, F, false, mat, c, jalCorta, !mini, true);
    for (const [xa] of tramos) {
      this.puerta(xa, Z, par / 2, hP - Z, F, true, mat, c, 105, true);
      this.puerta(xa + par / 2, Z, par / 2, hP - Z, F, false, mat, c, 105, !mini);
    }
    // Fijo superior que cierra hasta el techo.
    if (H > hP) this.caja(g, 0, hP, zF, W, H - hP, E, mat, true);
  }

  // Cajones de la columna (Bari y Aura): MDF blanco de 15 mm por dentro, frente de color y 3 mm entre frentes.
  cajonesColumna(c: ConfigCloset, m: ModeloCloset, mat: THREE.MeshStandardMaterial, xC: number, cW: number) {
    const zF = c.F - E, mini = c.jaladera === "mini";
    for (let i = 0; i < m.cajones; i++) {
      const gr = new THREE.Group();
      this.g.add(gr);
      const y = (m.zoclo as number) + i * m.altoCajon;
      const alto = m.altoCajon - HOLGURA;
      this.frente(gr, xC + 0.15, y + HOLGURA / 2, zF, cW - 0.3, alto, mat);
      this.juntas(gr, xC + 0.15, y + HOLGURA / 2, cW - 0.3, alto, zF);
      this.caja(gr, xC + E + 1.3, y + 1.5, zF - 45, cW - 2 * E - 2.6, 1, 45, this.mBlanco);
      for (const dx of [1.3, cW - 2 * E - 2.9]) this.caja(gr, xC + E + dx, y + 1.5, zF - 45, 1.6, 14, 45, this.mBlanco);
      this.jaladera(gr, xC + cW / 2, y + alto - (mini ? 2 : 5), c.F, "h", c);
      this.cajones.push(gr);
    }
  }

  tuboOval(xa: number, xb: number, y: number, z: number) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, xb - xa, 18), this.mTubo);
    t.rotation.z = Math.PI / 2;
    t.scale.set(1.5, 1, 0.75);
    t.position.set((xa + xb) / 2, y, z);
    t.castShadow = true;
    this.g.add(t);
  }

  // Aura: la cajonera de Bari con una entrepañera abierta de 1.62 m encima, con LED abajo de cada
  // entrepaño, y módulos de 2 puertas con sus propios parales, todo a 2.34 m sobre la base de 12.
  armarAura(c: ConfigCloset, m: ModeloCloset, mat: THREE.MeshStandardMaterial) {
    const { W, H, F } = c;
    const g = this.g;
    const Z = m.zoclo as number, hP = m.puerta, cW = c.cajonera as number;
    const hCaj = Z + m.cajones * m.altoCajon;
    const centro = bariAlCentro(W);
    const par = (W - cW) / paresBari(W);
    const xC = centro ? par : 0;
    const zF = F - E;
    const mini = c.jaladera === "mini";

    // Base de 12 al frente y piso.
    this.caja(g, 0, 0, zF - 1, W, Z, E, mat, true);
    this.caja(g, 0, Z - E, 0.6, W, E, zF - 1.6, mat, true);

    // Columna: la cajonera va a todo el fondo; la entrepañera encima es un mueble de 50 de fondo
    // en línea con las puertas (al frente), con su trasera, techo y repisas de 40 pegadas a esa trasera.
    // Atrás queda un hueco hasta el muro.
    const fondoE = 50, zE = zF - fondoE, mN = this.matNicho || mat;
    for (const x of [xC, xC + cW - E]) {
      this.caja(g, x, Z, 0.6, E, hCaj - Z, zF - 0.6, mat, true);
      this.caja(g, x, hCaj, zE, E, hP - hCaj, fondoE, mN, true);
    }
    this.caja(g, xC + E, 0, 0, cW - 2 * E, hCaj, 0.6, mat, true);
    this.caja(g, xC + E, hCaj, zE, cW - 2 * E, hP - hCaj, E, mN, true);
    this.caja(g, xC + E, hCaj, 0.6, cW - 2 * E, E, zF - 0.6, mN, true);
    this.caja(g, xC + E, hP - E, zE, cW - 2 * E, E, fondoE, mN, true);
    this.cajonesColumna(c, m, mat, xC, cW);
    // 3 entrepaños parejos: 4 espacios.
    const libre = hP - E - (hCaj + E);
    const esp = (libre - 3 * E) / 4;
    for (let k = 1; k <= 3; k++) this.caja(g, xC + E, hCaj + E + k * esp + (k - 1) * E, zE + E, cW - 2 * E, E, 40, mN, true);
    // Tira LED de 10 mm en los 2 laterales, al frente, de piso a techo del nicho. La luz sale pareja a lo
    // largo de la tira (luz de área), no como foco.
    const yIni = hCaj + E, yFin = hP - E, largo = yFin - yIni - 1, yM = (yIni + yFin) / 2;
    for (const [xs, dir] of [[xC + E, 1], [xC + cW - E, -1]]) {
      // La tira se ve de frente: 10 mm de ancho pegada a la cara interior del lateral, junto al canto.
      const tira = new THREE.Mesh(new THREE.BoxGeometry(1, largo, 0.4), this.mLed);
      tira.position.set(xs + dir * 0.5, yM, zF - 1.2);
      g.add(tira);
      // Halo suave alrededor de la tira para que se lea encendida, como en la foto del mueble real.
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(9, largo + 4), this.mHalo);
      halo.position.set(xs + dir * 0.6, yM, zF - 0.9);
      g.add(halo);
      const luz = new THREE.RectAreaLight(0xffd6a0, 160, 1, largo);
      luz.position.set(xs + dir * 1.1, yM, zF - 1.5);
      luz.lookAt(xs + dir * 30, yM, zF - 25);
      g.add(luz);
    }

    // Módulos de puertas: 2 parales, techo y piso; sin fondo, con 3 refuerzos atrás (11 cm abajo y
    // 6 cm bajo cada repisa). Maletero de 44 cm pegado atrás y repisa intermedia a todo el fondo,
    // cada una con su tubo abajo (doble colgado).
    const yMal = 190, yMed = 100;
    const tramos = centro ? [[0, par], [xC + cW, W]] : [[cW, W]];
    for (const [xa, xb] of tramos) {
      const a = xb - xa - 2 * E;
      for (const x of [xa, xb - E]) this.caja(g, x, Z, 0.6, E, hP - Z, zF - 0.6, mat, true);
      this.caja(g, xa + E, hP - E, 0.6, a, E, zF - 0.6, mat, true);
      this.caja(g, xa + E, Z, 0.6, a, 11, E, mat, true);
      this.caja(g, xa + E, yMal - 6, 0.6, a, 6, E, mat, true);
      this.caja(g, xa + E, yMed - 6, 0.6, a, 6, E, mat, true);
      this.caja(g, xa + E, yMal, 0.6, a, E, 44, mat, true);
      this.caja(g, xa + E, yMed, 0.6, a, E, zF - 0.6, mat, true);
      this.tuboOval(xa + E, xb - E, yMal - 8, F * 0.5);
      this.tuboOval(xa + E, xb - E, yMed - 8, F * 0.5);
      this.puerta(xa, Z, par / 2, hP - Z, F, true, mat, c, 105, true);
      this.puerta(xa + par / 2, Z, par / 2, hP - Z, F, false, mat, c, 105, !mini);
    }
    // Fijo superior que cierra hasta el techo.
    if (H > hP) this.caja(g, 0, hP, zF, W, H - hP, E, mat, true);
  }

  limpiar() {
    const fijos: THREE.Material[] = [this.mBlanco, this.mMuro, this.mSombra, this.mTubo, this.mLed];
    this.g.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.geometry.dispose();
      const material = o.material as THREE.Material | THREE.Material[];
      if (Array.isArray(material)) return;
      const conColor = material as THREE.Material & { color?: THREE.Color; map?: THREE.Texture | null };
      if (conColor.color && !conColor.map && !fijos.includes(material)) material.dispose();
    });
    this.g.clear();
    this.mats.forEach((m) => m.dispose());
  }

  aplicar() {
    const e = this.prog * this.prog * (3 - 2 * this.prog);
    for (const p of this.pivotes) p.rotation.y = p.userData.dir * e * 1.75;
    this.cajones.forEach((gr, i) => { gr.position.z = (i % 2 === 0 ? 28 : 14) * e; });
  }

  alternar() { this.abierto = !this.abierto; return this.abierto; }

  vista(nombre: NombreVista, inmediato = false) {
    const { W, H, F } = this.dim;
    const v = THREE.MathUtils.degToRad(this.camera.fov);
    const d = Math.max((H * 1.3) / (2 * Math.tan(v / 2)), ((W + 2 * MURO) * 1.22) / (2 * Math.tan(v / 2) * this.camera.aspect));
    const c = new THREE.Vector3(W / 2, H * 0.48, F * 0.5);
    let p: THREE.Vector3;
    if (nombre === "frente") p = new THREE.Vector3(W / 2, H * 0.5, F + d);
    else if (nombre === "detalle") {
      c.set(W / 2, 40, F);
      p = new THREE.Vector3(W / 2 + 30, 62, F + 92);
    } else {
      const giro = this.costado === "der" ? 0.72 : this.costado === "izq" ? -0.72 : 0.2;
      p = new THREE.Vector3(W / 2 + d * giro, H * 0.55, F + d * (giro === 0.2 ? 0.98 : 0.8));
    }
    this.ctrl.maxDistance = d * 2.4;
    if (inmediato) {
      this.camera.position.copy(p);
      this.ctrl.target.copy(c);
      this.ctrl.update();
      this.meta = null;
    } else this.meta = { p, c };
  }

  zoom(f: number) {
    const dir = this.camera.position.clone().sub(this.ctrl.target);
    const l = THREE.MathUtils.clamp(dir.length() * f, this.ctrl.minDistance, this.ctrl.maxDistance);
    this.meta = { p: this.ctrl.target.clone().add(dir.setLength(l)), c: this.ctrl.target.clone() };
  }

  cuadro() {
    const ahora = performance.now();
    const dt = Math.min(0.25, (ahora - (this.ult || ahora)) / 1000);
    this.ult = ahora;
    const reducir = reducirMovimiento();
    const meta = this.abierto ? 1 : 0;
    if (this.pivotes && Math.abs(this.prog - meta) > 0.001) {
      if (reducir) this.prog = meta;
      else this.prog += Math.sign(meta - this.prog) * Math.min(dt / 0.9, Math.abs(meta - this.prog));
      this.aplicar();
    }
    if (this.meta) {
      if (reducir) {
        this.camera.position.copy(this.meta.p);
        this.ctrl.target.copy(this.meta.c);
        this.meta = null;
      } else {
        const k = 1 - Math.exp(-dt * 6);
        this.camera.position.lerp(this.meta.p, k);
        this.ctrl.target.lerp(this.meta.c, k);
        if (this.camera.position.distanceTo(this.meta.p) < 0.5) this.meta = null;
      }
    }
    this.ctrl.update();
    this.renderer.render(this.scene, this.camera);
  }

  // Libera todo lo que usa el visor. Se puede llamar más de una vez.
  destruir() {
    if (this.destruido) return;
    this.destruido = true;
    this.renderer.setAnimationLoop(null);
    this.observador.disconnect();
    this.ctrl.removeEventListener("start", this.alIniciarCtrl);
    this.ctrl.dispose();
    this.limpiar();
    this.mats = [];
    for (const m of [this.mBlanco, this.mMuro, this.mSombra, this.mTubo, this.mLed, this.mHalo, this.piso.material]) m.dispose();
    this.haloMapa.dispose();
    this.fondo.geometry.dispose();
    this.piso.geometry.dispose();
    this.sol.shadow.dispose();
    this.ambiente.traverse((o) => {
      if (!(o instanceof THREE.Mesh)) return;
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    });
    this.entorno.dispose();
    this.pmrem.dispose();
    this.scene.environment = null;
    this.scene.clear();
    liberarTexturas();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.renderer.domElement.remove();
  }
}
