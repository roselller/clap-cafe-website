/**
 * The hero cup as a real 3D object (public/models/cup.glb, built by scripts/blender/cup.py).
 *
 * Plain three.js, no React: the pour is driven by anime.js from PourStage, which calls
 * setTilt / setFill / setPose (the click spin). The scene renders on demand only (no animation loop).
 *
 * Calibration: the canvas is a 400u x 400u square centred on the cup's rim centre, where
 * `u` is the SVG viewBox unit (see `--u` in globals.css). The rim radius is 75u, so one
 * world unit is 75u and the camera is placed so that the plane through the rim centre is
 * exactly 400/75 world units tall. That keeps the CSS stream offsets valid for both cups.
 */
import {
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Plane,
  Scene,
  Vector3,
  WebGLRenderer,
} from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

export type Cup3D = {
  /** The upright pose: the cup leans toward the viewer this many degrees so its mouth shows. */
  restTilt: number;
  /** Rotation toward the viewer in real degrees (restTilt = upright, 90 = mouth facing you). */
  setTilt(deg: number): void;
  /** 0 = empty, 1 = full. */
  setFill(amount: number): void;
  /** Playful extras on top of the tilt: spin about the cup's own axis (deg), a lean of that
   *  axis toward the viewer / sideways (deg, pivoting at mid-height) and a lift (world units,
   *  75u each). */
  setPose(pose: { spin?: number; leanX?: number; leanZ?: number; lift?: number }): void;
  dispose(): void;
};

const FOV = 20;
const WORLD_HALF_HEIGHT = 200 / 75; // the canvas is 400u tall and one world unit is 75u
const REST_TILT = 11; // degrees; matches the 0.19 rim ellipse of the SVG cup
// Bottom of the liquid: BOWL_BOTTOM in cup.py (-1.74) minus the glass wall and a small gap.
const LIQUID_BOTTOM = -1.79;
const LIQUID_TOP = -0.35;
const PIVOT_Y = -0.95; // middle of the 1.9 tall cup

export async function mountCup3D(container: HTMLElement, liquidColor: string): Promise<Cup3D> {
  const renderer = new WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.localClippingEnabled = true;
  const canvas = renderer.domElement;
  canvas.className = "cup-canvas";
  container.appendChild(canvas);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  room.dispose();

  const camera = new PerspectiveCamera(FOV, 1, 1, 100);
  camera.position.set(0, 0, WORLD_HALF_HEIGHT / Math.tan((FOV / 2) * (Math.PI / 180)));

  // Undo everything created above. Used if the model fails to load or is missing a part,
  // so a failed 3D cup leaves no WebGL context or hidden canvas behind (the SVG cup takes over).
  const abort = () => {
    scene.environment?.dispose();
    pmrem.dispose();
    renderer.dispose();
    canvas.remove();
  };

  let gltf;
  try {
    gltf = await new GLTFLoader().loadAsync("/models/cup.glb");
  } catch (error) {
    abort();
    throw error;
  }
  const rig = new Group(); // tips about the rim centre (the origin)
  // `wobble` leans the cup about its middle (a spinning cup wobbles there, not at the rim);
  // the model sits inside it, shifted up by the same amount so the two cancel at rest.
  const wobble = new Group();
  wobble.position.y = PIVOT_Y;
  gltf.scene.position.y = -PIVOT_Y;
  wobble.add(gltf.scene);
  rig.add(wobble);
  scene.add(rig);

  const glass = gltf.scene.getObjectByName("Glass") as Mesh | undefined;
  const liquid = gltf.scene.getObjectByName("Liquid") as Mesh | undefined;
  const etch = gltf.scene.getObjectByName("Etch") as Mesh | undefined;
  if (!glass || !liquid || !etch) {
    abort();
    throw new Error("cup.glb is missing its Glass, Liquid or Etch mesh (see scripts/blender/cup.py)");
  }

  // Transmission needs something opaque behind the glass to refract; over a transparent
  // canvas it renders white. So the glass is a see-through physical material whose alpha
  // rises with the Fresnel edge and with the strength of the reflection, which keeps the
  // highlights bright while the middle of the walls stays clear.
  const glassMat = new MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.03,
    metalness: 0,
    ior: 1.5,
    clearcoat: 1,
    clearcoatRoughness: 0.02,
    envMapIntensity: 2.2,
    transparent: true,
    depthWrite: false,
  });
  glassMat.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <opaque_fragment>",
      `// Clear glass, as in a product photo: see-through faces, a thin soft-grey line along every
       // silhouette (the edge bends the page behind it), and bright window reflections. The room
       // environment itself is never shown as colour, because its dark patches read as smudges.
       float f = 1.0 - saturate(dot(normalize(vViewPosition), normal));
       float edge = smoothstep(0.55, 0.95, f);
       vec3 spec = reflectedLight.directSpecular + reflectedLight.indirectSpecular;
       float shine = clamp(dot(spec, vec3(0.333)) * 2.0, 0.0, 1.0);
       outgoingLight = mix(mix(vec3(1.0), vec3(0.42, 0.39, 0.37), edge), vec3(1.0), shine);
       diffuseColor.a = clamp(0.03 + edge * 0.7 + shine * 0.95, 0.0, 0.95);
       #include <opaque_fragment>`,
    );
  };
  (glass.material as MeshPhysicalMaterial).dispose();
  glass.material = glassMat;
  glass.renderOrder = 2;

  const point = new Vector3();
  const clip = new Plane(); // world-space plane keeping the liquid below the fill level
  const liquidMat = new MeshBasicMaterial({
    color: new Color(liquidColor),
    side: DoubleSide,
    clippingPlanes: [clip],
  });
  liquid.material = liquidMat;

  const etchMap = (etch.material as MeshPhysicalMaterial).map;
  etch.material = new MeshBasicMaterial({
    map: etchMap,
    transparent: true,
    depthWrite: false,
  });
  // A sticker on the outer wall: drawn after the glass, so the bowl's edge line never crosses it.
  etch.renderOrder = 3;

  let tilt = REST_TILT;
  let fill = 1;
  let spin = 0;
  let leanX = 0;
  let leanZ = 0;
  let lift = 0;
  let disposed = false;

  const draw = () => {
    if (disposed) return;
    rig.rotation.x = (tilt * Math.PI) / 180;
    gltf.scene.rotation.y = (spin * Math.PI) / 180;
    wobble.rotation.set((leanX * Math.PI) / 180, 0, (leanZ * Math.PI) / 180);
    rig.position.y = lift;
    rig.updateMatrixWorld(true);
    const level = LIQUID_BOTTOM + (LIQUID_TOP - LIQUID_BOTTOM) * fill;
    // keep model-space y <= level: the plane (0,-1,0)·p + level >= 0, moved into world space
    clip.normal.set(0, -1, 0).transformDirection(gltf.scene.matrixWorld);
    clip.constant = -clip.normal.dot(gltf.scene.localToWorld(point.set(0, level, 0)));
    liquid.visible = fill > 0.001;
    renderer.render(scene, camera);
  };

  // One WebGL render per frame at most, however many setters ran. Renders on demand only.
  let queued = false;
  let frame = 0;
  const render = () => {
    if (queued || disposed) return;
    queued = true;
    frame = requestAnimationFrame(() => {
      queued = false;
      draw();
    });
  };

  const resize = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    // cap the pixel count: the canvas is large now that the cup is big (about 2.2 MP at most)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5, 1500 / w));
    renderer.setSize(w, h, false);
    render();
  };
  // The scene only renders when something changes. After a lost WebGL context (laptop wake,
  // GPU reset) the canvas comes back empty, so redraw it as soon as the context is restored.
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
  canvas.addEventListener("webglcontextrestored", render);
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  return {
    restTilt: REST_TILT,
    setTilt(deg) {
      tilt = deg;
      render();
    },
    setFill(amount) {
      fill = amount;
      render();
    },
    setPose(pose) {
      spin = pose.spin ?? spin;
      leanX = pose.leanX ?? leanX;
      leanZ = pose.leanZ ?? leanZ;
      lift = pose.lift ?? lift;
      render();
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frame);
      ro.disconnect();
      scene.environment?.dispose();
      pmrem.dispose();
      gltf.scene.traverse((o) => {
        const mesh = o as Mesh;
        if (!mesh.isMesh) return;
        mesh.geometry.dispose();
        [mesh.material].flat().forEach((m) => m.dispose());
      });
      etchMap?.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
