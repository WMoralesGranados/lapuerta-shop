// Vista 3D del vestidor completo: cada pared es un tramo como el librero, con paral de 30 y repisas de 60.
// Réplica de mock/public/js/vestidor3d.js. No simplificar geometría ni cambiar valores.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { AcabadoId, ColorId } from "@/lib/closets/precios";
import { ACABADO, ACABADO_MATERIAL, geoVeta, textura } from "@/lib/closets/visor3d";
import { LIBRERO } from "@/lib/librero/calc";
import { CAJONERA, TUBO, VESTIDOR, altoV, type Diseno, type Pared } from "@/lib/vestidor/calc";

export type SeleccionPiezaV = { w: number; m: number; i: number };

const P = VESTIDOR.paralGrosor, H = LIBRERO.paral.alto, T = LIBRERO.nicho.tapa;
const F = VESTIDOR.repisaFondo, FP = VESTIDOR.paralFondo;
const MAX_LUCES = 8;
const MURO = 15;

const reducirMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class VisorVestidor {
  private cont: HTMLElement;
  private alElegir: (dato: SeleccionPiezaV | null) => void;
  private sem = 1;
  private piezas: THREE.Mesh[] = [];
  private renderer: THREE.WebGLRenderer;
  private destruido = false;
  private scene!: THREE.Scene;
  private ambiente!: THREE.Scene;
  private pmrem!: THREE.PMREMGenerator;
  private entorno!: THREE.Texture;
  private camera!: THREE.PerspectiveCamera;
  private hemi!: THREE.HemisphereLight;
  private sol!: THREE.DirectionalLight;
  private relleno!: THREE.DirectionalLight;
  private mMuro!: THREE.MeshStandardMaterial;
  private mPiso!: THREE.MeshStandardMaterial;
  private mCromo!: THREE.MeshStandardMaterial;
  private mJaladera!: THREE.MeshStandardMaterial;
  private mSombra!: THREE.MeshBasicMaterial;
  private mLed!: THREE.MeshBasicMaterial;
  private mSel!: THREE.MeshBasicMaterial;
  private g!: THREE.Group;
  private ctrl!: OrbitControls;
  private ray!: THREE.Raycaster;
  private observador!: ResizeObserver;
  private ini: [number, number] | null = null;
  private meta: { p: THREE.Vector3; c: THREE.Vector3 } | null = null;
  private ult = 0;
  private luces = 0;
  private mats: THREE.Material[] = [];
  private usadas = new Set<THREE.Texture>();
  private clave: string | undefined;
  private dim!: { ancho: number; fondo: number; tipo: string };
  private alIniciarCtrl = () => {
    this.meta = null;
  };
  private alPresionar = (e: PointerEvent) => {
    this.ini = [e.clientX, e.clientY];
  };
  private alSoltar = (e: PointerEvent) => {
    if (!this.ini || Math.hypot(e.clientX - this.ini[0], e.clientY - this.ini[1]) > 6) return;
    const el = this.renderer.domElement;
    const b = el.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), this.camera);
    const hit = this.ray.intersectObjects(this.piezas)[0];
    this.alElegir(hit ? (hit.object.userData as SeleccionPiezaV) : null);
  };

  constructor(cont: HTMLElement, alElegir: (dato: SeleccionPiezaV | null) => void) {
    this.cont = cont;
    this.alElegir = alElegir;
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
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.cont.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdedcd6);
    this.ambiente = new RoomEnvironment();
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.entorno = this.pmrem.fromScene(this.ambiente, 0.04).texture;
    this.scene.environment = this.entorno;
    this.camera = new THREE.PerspectiveCamera(42, 1, 1, 6000);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0xb4ab9c, 0.45);
    this.sol = new THREE.DirectionalLight(0xfff3e4, 0.9);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(2048, 2048);
    this.sol.shadow.bias = -0.0006;
    const c = this.sol.shadow.camera;
    c.left = -500; c.right = 500; c.top = 500; c.bottom = -500; c.far = 2500;
    this.scene.add(this.hemi, this.sol, this.sol.target);
    // Luz de relleno que viaja con la cámara: ilumina los frentes (cajones, cantos y parales) como la luz
    // del cuarto; sin ella quedan grises, porque el LED y el sol solo alumbran el interior y las repisas.
    this.relleno = new THREE.DirectionalLight(0xffe9cf, 0.5);
    this.relleno.position.set(0, 0, 0);
    this.relleno.target.position.set(0, -0.15, -1);
    this.camera.add(this.relleno, this.relleno.target);
    this.scene.add(this.camera);
    this.mMuro = new THREE.MeshStandardMaterial({ color: 0xe4dfd5, roughness: 0.95 });
    this.mPiso = new THREE.MeshStandardMaterial({ color: 0xc2bdb2, roughness: 0.5 });
    this.mCromo = new THREE.MeshStandardMaterial({ color: 0xe8eaec, metalness: 1, roughness: 0.18 });
    this.mJaladera = new THREE.MeshStandardMaterial();
    this.mSombra = new THREE.MeshBasicMaterial({ color: 0x1c140e });
    this.mLed = new THREE.MeshBasicMaterial({ color: 0xfff3d6, toneMapped: false });
    this.mSel = new THREE.MeshBasicMaterial({ color: 0xc8924f, transparent: true, opacity: 0.32, depthWrite: false });
    this.g = new THREE.Group();
    this.scene.add(this.g);
    this.ctrl = new OrbitControls(this.camera, this.renderer.domElement);
    this.ctrl.enableDamping = !reducirMovimiento();
    this.ctrl.maxPolarAngle = Math.PI / 2 - 0.02;
    this.ctrl.minDistance = 40;
    this.ctrl.addEventListener("start", this.alIniciarCtrl);
    this.ray = new THREE.Raycaster();
    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.alPresionar);
    el.addEventListener("pointerup", this.alSoltar);
    this.observador = new ResizeObserver(() => this.ajustar());
    this.observador.observe(this.cont);
  }

  encender(si: boolean) { this.renderer.setAnimationLoop(si ? () => this.cuadro() : null); }

  ajustar() {
    const w = this.cont.clientWidth, h = this.cont.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  caja(padre: THREE.Object3D, x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material, datos: SeleccionPiezaV | null = null) {
    const m = new THREE.Mesh(geoVeta(sx, sy, sz, this.sem++), mat);
    m.position.set(x + sx / 2, y + sy / 2, z + sz / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    padre.add(m);
    if (datos) { m.userData = datos; this.piezas.push(m); }
  }

  // Tubo ovalado cromado (3 cm de alto × 1.5 de grueso) al centro del fondo, con un soporte en cada paral.
  tubo(padre: THREE.Object3D, x: number, y: number, A: number, datos: SeleccionPiezaV) {
    const geo = new THREE.CylinderGeometry(1, 1, A - 0.4, 28);
    geo.rotateZ(Math.PI / 2);
    geo.scale(1, TUBO.alto / 2, 0.75);
    const m = new THREE.Mesh(geo, this.mCromo);
    m.position.set(x + A / 2, y + TUBO.alto / 2, F / 2);
    m.castShadow = true;
    m.userData = datos;
    padre.add(m);
    this.piezas.push(m);
    for (const xs of [x, x + A - 0.5]) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(0.5, TUBO.alto + 2, 2.6), this.mCromo);
      s.position.set(xs + 0.25, y + TUBO.alto / 2 + 0.5, F / 2);
      padre.add(s);
    }
  }

  // Cajonera de 2 cajones: caja de 50 de fondo pegada al frente, con los frentes encastrados
  // (por dentro de la caja, al ras) y jaladera mini de 8 cm en el canto de arriba de cada frente.
  cajonera(padre: THREE.Object3D, x: number, y: number, A: number, mat: THREE.Material, datos: SeleccionPiezaV) {
    const h = CAJONERA.alto, z0 = F - CAJONERA.fondo, J = 0.3;
    this.caja(padre, x, y, z0, A, T, CAJONERA.fondo, mat, datos);
    this.caja(padre, x, y + h - T, z0, A, T, CAJONERA.fondo, mat, datos);
    this.caja(padre, x, y + T, z0, T, h - 2 * T, CAJONERA.fondo, mat, datos);
    this.caja(padre, x + A - T, y + T, z0, T, h - 2 * T, CAJONERA.fondo, mat, datos);
    // Fondo oscuro detrás de las juntas para que se lean los frentes.
    const sombra = new THREE.Mesh(new THREE.BoxGeometry(A - 2 * T, h - 2 * T, 0.2), this.mSombra);
    sombra.position.set(x + A / 2, y + h / 2, F - T - 0.3);
    padre.add(sombra);
    const fh = (h - 2 * T - 3 * J) / 2;
    for (const k of [0, 1]) {
      const fy = y + T + J + k * (fh + J);
      this.caja(padre, x + T + J, fy, F - T, A - 2 * T - 2 * J, fh, T, mat, datos);
      const jal = new THREE.Mesh(new THREE.BoxGeometry(8, 1.2, 2.4), this.mJaladera);
      jal.position.set(x + A / 2, fy + fh - 0.6, F - 0.4);
      jal.castShadow = true;
      padre.add(jal);
    }
  }

  // Un tramo en coordenadas locales: x a lo largo de la pared, z hacia el cuarto.
  tramo(w: number, p: Pared, mat: THREE.Material, fondoNicho: THREE.Material, sel: SeleccionPiezaV | null, conLed: boolean) {
    const grupo = new THREE.Group();
    const xMod = (m: number) => P + p.anchos.slice(0, m).reduce((a, v) => a + v + P, 0);
    for (let k = 0; k <= p.anchos.length; k++) {
      const x = k === 0 ? 0 : xMod(k - 1) + p.anchos[k - 1];
      this.caja(grupo, x, 0, (F - FP) / 2, P, H, FP, mat);
    }
    p.mods.forEach((items, m) => {
      const x = xMod(m), A = p.anchos[m];
      if (conLed) {
        for (const [xc, dir] of [[x, 1], [x + A, -1]]) {
          const tira = new THREE.Mesh(new THREE.BoxGeometry(0.15, H - 6, 1.1), this.mLed);
          tira.position.set(xc + dir * 0.08, H / 2, F / 2);
          grupo.add(tira);
          if (this.luces < MAX_LUCES) {
            const luz = new THREE.PointLight(0xffc98a, 1700, 160, 1.7);
            luz.position.set(xc + dir * 10, H * 0.55, F / 2);
            grupo.add(luz);
            this.luces++;
          }
        }
      }
      items.forEach((it, i) => {
        const datos = { w, m, i };
        if (it.t === "r") this.caja(grupo, x, it.y, 0, A, LIBRERO.repisa.grosor, F, mat, datos);
        else if (it.t === "t") this.tubo(grupo, x, it.y, A, datos);
        else if (it.t === "c") this.cajonera(grupo, x, it.y, A, mat, datos);
        else {
          const h = altoV(it);
          this.caja(grupo, x, it.y, 0, A, T, F, mat, datos);
          this.caja(grupo, x, it.y + h - T, 0, A, T, F, mat, datos);
          this.caja(grupo, x, it.y + T, 0, T, h - 2 * T, F, mat, datos);
          this.caja(grupo, x + A - T, it.y + T, 0, T, h - 2 * T, F, mat, datos);
          this.caja(grupo, x + T, it.y + T, 0, A - 2 * T, h - 2 * T, 0.6, fondoNicho, datos);
        }
        if (sel && sel.w === w && sel.m === m && sel.i === i) {
          const h = altoV(it);
          const marca = new THREE.Mesh(new THREE.BoxGeometry(A + 0.4, h + 0.8, F + 0.8), this.mSel);
          marca.position.set(x + A / 2, it.y + h / 2, F / 2);
          grupo.add(marca);
        }
      });
    });
    return grupo;
  }

  // Muro sólido de 15 cm hacia afuera del cuarto (ox, oz), un poco más largo para cerrar las esquinas.
  muro(x1: number, z1: number, x2: number, z2: number, ox: number, oz: number) {
    const largo = Math.hypot(x2 - x1, z2 - z1) + 2 * MURO;
    const m = new THREE.Mesh(new THREE.BoxGeometry(largo, 260, MURO), this.mMuro);
    m.position.set((x1 + x2) / 2 + (ox * MURO) / 2, 130, (z1 + z2) / 2 + (oz * MURO) / 2);
    m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    m.receiveShadow = true;
    this.g.add(m);
  }

  private limpiar() {
    this.g.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    this.g.clear();
    this.mats.forEach((m) => m.dispose());
  }

  cargar(d: Diseno, color: ColorId, sel: SeleccionPiezaV | null, conLed = true, jaladera: AcabadoId = "dorado") {
    if (this.destruido) return;
    const [cJal, metal, rug] = ACABADO[jaladera] || ACABADO.dorado;
    this.mJaladera.color.set(cJal);
    this.mJaladera.metalness = metal;
    this.mJaladera.roughness = rug;
    this.limpiar();
    this.piezas = [];
    this.luces = 0;
    const mapa = textura(color);
    this.usadas.add(mapa);
    const mat = new THREE.MeshStandardMaterial({ map: mapa, roughness: 0.62, ...ACABADO_MATERIAL[color] });
    const fondoNicho = new THREE.MeshStandardMaterial({ map: mapa, roughness: 0.75, ...ACABADO_MATERIAL[color] });
    fondoNicho.color.multiplyScalar(0.8);
    this.mats = [mat, fondoNicho];
    const A = d.med.A as number, { B = 0, S = 0 } = d.med;
    // posición y giro de cada tramo; el giro hace que su "frente" mire al cuarto
    const colocar = ({
      lineal: [[0, 0, 0]],
      L: [[0, 0, 0], [0, B, Math.PI / 2]],
      U: [[0, B, Math.PI / 2], [0, 0, 0], [A, F, -Math.PI / 2]],
      espejo: [[0, 0, 0], [B, S, Math.PI]],
    })[d.tipo];
    d.paredes.forEach((p, w) => {
      if (!p.anchos.length) return;
      const [x, z, giro] = colocar[w];
      const t = this.tramo(w, p, mat, fondoNicho, sel, conLed);
      t.position.set(x, 0, z);
      t.rotation.y = giro;
      this.g.add(t);
    });
    const ancho = d.tipo === "espejo" ? Math.max(A, B) : A;
    const fondo = d.tipo === "lineal" ? 220 : d.tipo === "espejo" ? S : B;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(ancho + 400, fondo + 400), this.mPiso);
    piso.rotation.x = -Math.PI / 2;
    piso.position.set(ancho / 2, 0, fondo / 2);
    piso.receiveShadow = true;
    this.g.add(piso);
    if (d.tipo === "espejo") { this.muro(0, 0, ancho, 0, 0, -1); this.muro(0, S, ancho, S, 0, 1); }
    else {
      this.muro(0, 0, A, 0, 0, -1);
      if (d.tipo !== "lineal") this.muro(0, 0, 0, B, -1, 0);
      if (d.tipo === "U") this.muro(A, 0, A, B, 1, 0);
    }
    this.hemi.intensity = conLed ? 0.4 : 0.6;
    this.sol.intensity = conLed ? 0.8 : 1.3;
    this.relleno.intensity = conLed ? 0.55 : 0.45;
    // Three 0.160 todavía no usa esta propiedad; se conserva como en el original.
    (this.scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = conLed ? 0.38 : 0.6;
    this.sol.position.set(ancho * 0.6, 600, fondo + 300);
    this.sol.target.position.set(ancho / 2, 60, fondo / 2);
    const clave = `${d.tipo}|${A}|${B}|${S}`;
    if (clave !== this.clave) { this.clave = clave; this.dim = { ancho, fondo, tipo: d.tipo }; this.vista(true); }
  }

  vista(inmediato = false) {
    const { ancho, fondo, tipo } = this.dim;
    // Distancia para que quepa todo el frente según el tamaño de la pantalla.
    const v = THREE.MathUtils.degToRad(this.camera.fov);
    const frente = tipo === "espejo" ? fondo : ancho;
    const dist = Math.max((H * 1.35) / (2 * Math.tan(v / 2)), (frente * 1.15) / (2 * Math.tan(v / 2) * this.camera.aspect));
    const c = new THREE.Vector3(ancho / 2, 95, fondo / 2);
    const p = tipo === "espejo"
      ? new THREE.Vector3(ancho / 2 + dist + ancho / 2, 170, fondo / 2 + 30)
      : new THREE.Vector3(ancho * 0.6, 175, fondo / 2 + dist);
    this.ctrl.maxDistance = 1400;
    if (inmediato) { this.camera.position.copy(p); this.ctrl.target.copy(c); this.ctrl.update(); this.meta = null; }
    else this.meta = { p, c };
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
    if (this.meta) {
      if (reducirMovimiento()) {
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
    const el = this.renderer.domElement;
    el.removeEventListener("pointerdown", this.alPresionar);
    el.removeEventListener("pointerup", this.alSoltar);
    this.ctrl.removeEventListener("start", this.alIniciarCtrl);
    this.ctrl.dispose();
    this.limpiar();
    this.mats = [];
    this.piezas = [];
    for (const m of [this.mMuro, this.mPiso, this.mCromo, this.mJaladera, this.mSombra, this.mLed, this.mSel]) m.dispose();
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
    this.usadas.forEach((t) => t.dispose());
    this.usadas.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    el.remove();
  }
}
