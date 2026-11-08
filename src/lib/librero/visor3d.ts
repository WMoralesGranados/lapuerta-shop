// Vista 3D del librero Julieta: dibuja el mismo diseño que el plano 2D. Unidades en cm.
// Réplica de mock/public/js/librero3d.js. No simplificar geometría ni cambiar valores.
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { ACABADO_MATERIAL, geoVeta, textura } from "@/lib/closets/visor3d";
import type { ColorId } from "@/lib/closets/precios";
import { LIBRERO, altoDe, resumen, type Pieza } from "@/lib/librero/calc";

export type SeleccionPieza = { m: number; i: number };
export type DatosPieza = Partial<SeleccionPieza> | null;
export type NombreVistaLibrero = "general" | "frente" | "detalle";

const { paral: PR, repisa: RP, nicho: NI } = LIBRERO;

const reducirMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export class VisorLibrero {
  private cont: HTMLElement;
  private alElegir: (datos: DatosPieza) => void;
  private sem = 1;
  private piezas: THREE.Mesh[] = [];
  private renderer: THREE.WebGLRenderer;
  private destruido = false;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private sol!: THREE.DirectionalLight;
  private ambiente!: THREE.Scene;
  private pmrem!: THREE.PMREMGenerator;
  private entorno!: THREE.Texture;
  private muro!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private piso!: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshStandardMaterial>;
  private g!: THREE.Group;
  private mLed!: THREE.MeshBasicMaterial;
  private mHalo!: THREE.MeshBasicMaterial;
  private mSel!: THREE.MeshBasicMaterial;
  private txHalo!: THREE.CanvasTexture;
  private ctrl!: OrbitControls;
  private ray!: THREE.Raycaster;
  private observador!: ResizeObserver;
  private ini: [number, number] | null = null;
  private meta: { p: THREE.Vector3; c: THREE.Vector3 } | null = null;
  private ult = 0;
  private mats: THREE.Material[] = [];
  private usadas = new Set<THREE.Texture>();
  private W: number | undefined;
  private anchoPrimero = 0;
  private alIniciarCtrl = () => {
    this.meta = null;
  };
  // Un toque sin arrastrar selecciona la pieza; arrastrar solo gira la cámara.
  private alPresionar = (e: PointerEvent) => {
    this.ini = [e.clientX, e.clientY];
  };
  private alSoltar = (e: PointerEvent) => {
    if (!this.ini || Math.hypot(e.clientX - this.ini[0], e.clientY - this.ini[1]) > 6) return;
    const el = this.renderer.domElement;
    const b = el.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((e.clientX - b.left) / b.width) * 2 - 1, -((e.clientY - b.top) / b.height) * 2 + 1), this.camera);
    const hit = this.ray.intersectObjects(this.piezas)[0];
    this.alElegir(hit ? (hit.object.userData as DatosPieza) : null);
  };

  constructor(cont: HTMLElement, alElegir: (datos: DatosPieza) => void) {
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
    const cont = this.cont;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    cont.appendChild(this.renderer.domElement);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xdedcd6);
    this.ambiente = new RoomEnvironment();
    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.entorno = this.pmrem.fromScene(this.ambiente, 0.04).texture;
    this.scene.environment = this.entorno;
    this.intensidadEntorno(0.38);
    this.camera = new THREE.PerspectiveCamera(36, 1, 1, 5000);
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xb4ab9c, 0.42));
    this.sol = new THREE.DirectionalLight(0xfff3e4, 0.8);
    this.sol.castShadow = true;
    this.sol.shadow.mapSize.set(2048, 2048);
    this.sol.shadow.bias = -0.0006;
    const c = this.sol.shadow.camera;
    c.left = -300; c.right = 300; c.top = 300; c.bottom = -300; c.far = 1800;
    this.scene.add(this.sol, this.sol.target);

    this.muro = new THREE.Mesh(new THREE.PlaneGeometry(3000, 1200), new THREE.MeshStandardMaterial({ color: 0xe4dfd5, roughness: 0.95 }));
    this.muro.position.set(0, 600, -0.3);
    this.muro.receiveShadow = true;
    this.piso = new THREE.Mesh(new THREE.PlaneGeometry(3000, 2000), new THREE.MeshStandardMaterial({ color: 0xc2bdb2, roughness: 0.5 }));
    this.piso.rotation.x = -Math.PI / 2;
    this.piso.position.z = 1000;
    this.piso.receiveShadow = true;
    this.scene.add(this.muro, this.piso);
    this.g = new THREE.Group();
    this.scene.add(this.g);
    this.mLed = new THREE.MeshBasicMaterial({ color: 0xfff3d6, toneMapped: false });
    // Resplandor alrededor de la tira, como se ve en las fotos.
    const cv = document.createElement("canvas");
    cv.width = 64; cv.height = 4;
    const ctx = cv.getContext("2d")!;
    const gr = ctx.createLinearGradient(0, 0, 64, 0);
    gr.addColorStop(0, "rgba(255,190,110,0)");
    gr.addColorStop(0.5, "rgba(255,205,135,.4)");
    gr.addColorStop(1, "rgba(255,190,110,0)");
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, 64, 4);
    this.txHalo = new THREE.CanvasTexture(cv);
    this.txHalo.colorSpace = THREE.SRGBColorSpace;
    this.mHalo = new THREE.MeshBasicMaterial({ map: this.txHalo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
    this.mSel = new THREE.MeshBasicMaterial({ color: 0xc8924f, transparent: true, opacity: 0.32, depthWrite: false });

    this.ctrl = new OrbitControls(this.camera, this.renderer.domElement);
    this.ctrl.enableDamping = !reducirMovimiento();
    this.ctrl.maxPolarAngle = Math.PI / 2 - 0.02;
    this.ctrl.minDistance = 30;
    // No deja pasar la cámara detrás del muro, donde el mueble desaparece.
    this.ctrl.minAzimuthAngle = -1.25;
    this.ctrl.maxAzimuthAngle = 1.25;
    this.ctrl.addEventListener("start", this.alIniciarCtrl);
    this.ray = new THREE.Raycaster();

    const el = this.renderer.domElement;
    el.addEventListener("pointerdown", this.alPresionar);
    el.addEventListener("pointerup", this.alSoltar);
    this.observador = new ResizeObserver(() => this.ajustar());
    this.observador.observe(cont);
    this.ajustar();
  }

  // Three 0.160 todavía no usa esta propiedad; se conserva como en el original.
  private intensidadEntorno(valor: number) {
    (this.scene as THREE.Scene & { environmentIntensity: number }).environmentIntensity = valor;
  }

  encender(si: boolean) {
    this.renderer.setAnimationLoop(si ? () => this.cuadro() : null);
    if (si) this.ajustar();
  }

  ajustar() {
    const w = this.cont.clientWidth, h = this.cont.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  }

  caja(x: number, y: number, z: number, sx: number, sy: number, sz: number, mat: THREE.Material, veta = true, datos: SeleccionPieza | null = null) {
    const m = new THREE.Mesh(veta ? geoVeta(sx, sy, sz, this.sem++) : new THREE.BoxGeometry(sx, sy, sz), mat);
    m.position.set(x + sx / 2, y + sy / 2, z + sz / 2);
    m.castShadow = true;
    m.receiveShadow = true;
    this.g.add(m);
    if (datos) { m.userData = datos; this.piezas.push(m); }
    return m;
  }

  limpiar() {
    this.g.traverse((o) => { if (o instanceof THREE.Mesh) o.geometry.dispose(); });
    this.g.clear();
    this.mats.forEach((m) => m.dispose());
    this.piezas = [];
  }

  cargar(mods: Pieza[][], color: ColorId, sel: SeleccionPieza | null, conLed = true, anchos: number[] = mods.map(() => RP.ancho)) {
    if (this.destruido) return;
    this.limpiar();
    const mapa = textura(color);
    this.usadas.add(mapa);
    const mat = new THREE.MeshStandardMaterial({ map: mapa, roughness: 0.62, ...ACABADO_MATERIAL[color] });
    // El fondo del nicho sigue el color elegido, apenas más oscuro para dar profundidad.
    const fondoNicho = new THREE.MeshStandardMaterial({ map: mapa, roughness: 0.75, ...ACABADO_MATERIAL[color] });
    fondoNicho.color.multiplyScalar(0.8);
    this.mats = [mat, fondoNicho];
    const P = PR.grosor, H = PR.alto, F = RP.fondo;
    const W = resumen(mods, anchos).ancho;
    const xMod = (m: number) => P + anchos.slice(0, m).reduce((a, w) => a + w + P, 0);
    this.anchoPrimero = anchos[0];

    for (let k = 0; k <= mods.length; k++) {
      const x = k === 0 ? 0 : xMod(k - 1) + anchos[k - 1];
      // El paral va centrado en el fondo de la repisa.
      const zParal = (F - PR.fondo) / 2;
      this.caja(x, 0, zParal, P, H, PR.fondo, mat);
    }
    // Sin LED, la luz general sube para que el mueble no se vea apagado.
    this.intensidadEntorno(conLed ? 0.38 : 0.6);
    this.sol.intensity = conLed ? 0.8 : 1.35;

    mods.forEach((items, m) => {
      const x = xMod(m), A = anchos[m];
      if (conLed) {
        // Tira LED de 11 mm al centro de la cara interior de cada paral del módulo.
        const zLed = F / 2;
        for (const [xCara, dir] of [[x, 1], [x + A, -1]]) {
          const led = new THREE.Mesh(new THREE.BoxGeometry(0.15, H - 6, 1.1), this.mLed);
          led.position.set(xCara + dir * 0.08, H / 2, zLed);
          this.g.add(led);
          const halo = new THREE.Mesh(new THREE.PlaneGeometry(6, H - 2), this.mHalo);
          halo.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
          halo.position.set(xCara + dir * 0.2, H / 2, zLed);
          this.g.add(halo);
          const luz = new THREE.PointLight(0xffc98a, 2300, 170, 1.7);
          luz.position.set(xCara + dir * 8, H * 0.55, zLed);
          this.g.add(luz);
        }
      }
      items.forEach((it, i) => {
        const datos = { m, i };
        if (it.t === "r") {
          this.caja(x, it.y, 0, A, RP.grosor, F, mat, true, datos);
        } else {
          const h = altoDe(it), t = NI.tapa;
          this.caja(x, it.y, 0, A, t, F, mat, true, datos);
          this.caja(x, it.y + h - t, 0, A, t, F, mat, true, datos);
          this.caja(x, it.y + t, 0, t, h - 2 * t, F, mat, true, datos);
          this.caja(x + A - t, it.y + t, 0, t, h - 2 * t, F, mat, true, datos);
          this.caja(x + t, it.y + t, 0, A - 2 * t, h - 2 * t, 0.6, fondoNicho, true, datos);
        }
        if (sel && sel.m === m && sel.i === i) {
          const h = altoDe(it);
          const marca = new THREE.Mesh(new THREE.BoxGeometry(A + 0.4, h + 0.8, F + 0.8), this.mSel);
          marca.position.set(x + A / 2, it.y + h / 2, F / 2);
          this.g.add(marca);
        }
      });
    });

    this.muro.position.x = this.piso.position.x = W / 2;
    this.sol.position.set(W * 0.7, H * 2.1, 360);
    this.sol.target.position.set(W / 2, H * 0.4, 0);
    const cambio = this.W !== W;
    this.W = W;
    if (cambio) this.vista("general", true);
  }

  vista(nombre: NombreVistaLibrero, inmediato = false) {
    const W = this.W as number, H = PR.alto;
    const v = THREE.MathUtils.degToRad(this.camera.fov);
    const d = Math.max((H * 1.32) / (2 * Math.tan(v / 2)), (W * 1.3) / (2 * Math.tan(v / 2) * this.camera.aspect));
    const c = new THREE.Vector3(W / 2, H * 0.49, 15);
    let p: THREE.Vector3;
    if (nombre === "frente") p = new THREE.Vector3(W / 2, H * 0.5, 40 + d);
    else if (nombre === "detalle") {
      c.set(this.anchoPrimero + PR.grosor * 1.5, 125, 25);
      p = new THREE.Vector3(this.anchoPrimero + 42, 150, 145);
    } else p = new THREE.Vector3(W / 2 + d * 0.32, H * 0.6, 40 + d * 0.95);
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
    for (const m of [this.mLed, this.mHalo, this.mSel, this.muro.material, this.piso.material]) m.dispose();
    this.txHalo.dispose();
    this.muro.geometry.dispose();
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
    this.usadas.forEach((t) => t.dispose());
    this.usadas.clear();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    el.remove();
  }
}
