import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const canvas = document.getElementById("bajaCanvas");
const panel = document.getElementById("visualPanel");
if (!canvas || !panel) {
  // Section not present on this page — nothing to do.
  throw new Error("Baja 3D: canvas/panel not found");
}

/* ============================================================
   Renderer / Scene / Camera
   ============================================================ */
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
camera.position.set(3.1, 2.0, 3.6);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.55, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2.6;
controls.maxDistance = 7;
controls.maxPolarAngle = Math.PI * 0.49;
controls.autoRotate = true;
controls.autoRotateSpeed = 1.3;
controls.enablePan = false;

/* ============================================================
   Lighting
   ============================================================ */
scene.add(new THREE.AmbientLight(0x4a5a75, 0.65));

const keyLight = new THREE.DirectionalLight(0xffffff, 1.6);
keyLight.position.set(4, 6, 3);
scene.add(keyLight);

const rimLight = new THREE.DirectionalLight(0x3b82f6, 1.1);
rimLight.position.set(-4, 3, -4);
scene.add(rimLight);

const fillLight = new THREE.DirectionalLight(0x22d3ee, 0.35);
fillLight.position.set(0, 2, -5);
scene.add(fillLight);

/* ============================================================
   Ground disc with soft grid + radial fade (canvas texture)
   ============================================================ */
function makeGroundTexture() {
  const size = 512;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d");

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  grad.addColorStop(0, "rgba(59,130,246,0.22)");
  grad.addColorStop(0.55, "rgba(20,30,48,0.16)");
  grad.addColorStop(1, "rgba(6,10,17,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = "rgba(120,160,220,0.16)";
  ctx.lineWidth = 1;
  const step = size / 16;
  for (let i = 0; i <= 16; i++) {
    ctx.beginPath();
    ctx.moveTo(i * step, 0);
    ctx.lineTo(i * step, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * step);
    ctx.lineTo(size, i * step);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(160,200,255,0.28)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.46, 0, Math.PI * 2);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const ground = new THREE.Mesh(
  new THREE.CircleGeometry(2.6, 64),
  new THREE.MeshBasicMaterial({
    map: makeGroundTexture(),
    transparent: true,
    depthWrite: false,
  }),
);
ground.rotation.x = -Math.PI / 2;
ground.position.y = 0;
scene.add(ground);

/* ============================================================
   Helpers
   ============================================================ */
function tube(a, b, radius, material) {
  const start = new THREE.Vector3(...a);
  const end = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(end, start);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(radius, radius, len, 10);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(start).add(end).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  return mesh;
}

function mat(color, opts) {
  return new THREE.MeshStandardMaterial(
    Object.assign({ color, metalness: 0.55, roughness: 0.45 }, opts || {}),
  );
}

/* ============================================================
   Vehicle root
   ============================================================ */
const vehicle = new THREE.Group();
vehicle.position.y = 0;
scene.add(vehicle);

const COLOR = {
  chassi: 0x9db4d9,
  susp: 0x22d3ee,
  wheelRim: 0x11151d,
  wheelTire: 0x14171d,
  motor: 0x2a2f3a,
  motorAccent: 0xf5a623,
  cvtPulley: 0x8fa3c7,
  belt: 0x1c2028,
  electronics: 0x123326,
  led: 0x22d3ee,
  seat: 0x171b23,
  steer: 0x0d1016,
};

/* ---------------- Chassis (roll cage) ---------------- */
const chassisGroup = new THREE.Group();
const chassisMat = mat(COLOR.chassi, { metalness: 0.75, roughness: 0.32 });
const chassisR = 0.032;

const P = {
  LFL: [-0.42, 0.32, 1.15],
  LFR: [0.42, 0.32, 1.15],
  FHBL: [-0.4, 0.32, 0.75],
  FHBR: [0.4, 0.32, 0.75],
  MHBL: [-0.4, 0.32, -0.15],
  MHBR: [0.4, 0.32, -0.15],
  LRL: [-0.42, 0.32, -1.15],
  LRR: [0.42, 0.32, -1.15],
  FHTL: [-0.36, 0.95, 0.68],
  FHTR: [0.36, 0.95, 0.68],
  MHTL: [-0.34, 1.18, -0.2],
  MHTR: [0.34, 1.18, -0.2],
};

const chassisEdges = [
  // side rails (front -> rear, subdivided)
  ["LFL", "FHBL"],
  ["FHBL", "MHBL"],
  ["MHBL", "LRL"],
  ["LFR", "FHBR"],
  ["FHBR", "MHBR"],
  ["MHBR", "LRR"],
  // cross members
  ["LFL", "LFR"],
  ["FHBL", "FHBR"],
  ["MHBL", "MHBR"],
  ["LRL", "LRR"],
  // front hoop
  ["FHBL", "FHTL"],
  ["FHBR", "FHTR"],
  ["FHTL", "FHTR"],
  // main hoop
  ["MHBL", "MHTL"],
  ["MHBR", "MHTR"],
  ["MHTL", "MHTR"],
  // roof rails
  ["FHTL", "MHTL"],
  ["FHTR", "MHTR"],
  // rear diagonal bracing
  ["MHTL", "LRL"],
  ["MHTR", "LRR"],
  // front diagonal bracing
  ["FHTL", "MHBL"],
  ["FHTR", "MHBR"],
];

chassisEdges.forEach(([a, b]) => {
  chassisGroup.add(tube(P[a], P[b], chassisR, chassisMat));
});
chassisGroup.userData.explode = new THREE.Vector3(0, 0, 0);
vehicle.add(chassisGroup);

/* ---------------- Wheels ---------------- */
const wheelPositions = [
  { x: -0.66, z: 0.85, front: true },
  { x: 0.66, z: 0.85, front: true },
  { x: -0.66, z: -0.85, front: false },
  { x: 0.66, z: -0.85, front: false },
];
const wheelsGroup = new THREE.Group();
const rimMat = mat(COLOR.wheelRim, { metalness: 0.8, roughness: 0.3 });
const tireMat = mat(COLOR.wheelTire, { metalness: 0.1, roughness: 0.95 });

wheelPositions.forEach((pos) => {
  const w = new THREE.Group();
  const rim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.18, 0.18, 0.24, 20),
    rimMat,
  );
  rim.rotation.z = Math.PI / 2;
  const tire = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.1, 10, 24),
    tireMat,
  );
  tire.rotation.y = Math.PI / 2;
  w.add(rim, tire);
  w.position.set(pos.x, 0.27, pos.z);
  w.userData.explode = new THREE.Vector3(pos.x > 0 ? 0.45 : -0.45, -0.15, 0);
  wheelsGroup.add(w);
});
vehicle.add(wheelsGroup);

/* ---------------- Suspension ---------------- */
const suspensionGroup = new THREE.Group();
const suspMat = mat(COLOR.susp, {
  metalness: 0.7,
  roughness: 0.25,
  emissive: 0x0a3c47,
  emissiveIntensity: 0.25,
});
const armMat = mat(0x4a5568, { metalness: 0.7, roughness: 0.4 });

wheelPositions.forEach((pos) => {
  const grp = new THREE.Group();
  const innerX = pos.x > 0 ? 0.42 : -0.42;
  const hub = [pos.x, 0.3, pos.z];
  // upper + lower A-arms
  grp.add(tube([innerX, 0.42, pos.z + 0.14], hub, 0.02, armMat));
  grp.add(tube([innerX, 0.24, pos.z - 0.14], hub, 0.02, armMat));
  // coilover shock, angled
  const shockTop = [pos.x > 0 ? pos.x - 0.1 : pos.x + 0.1, 0.95, pos.z];
  const shockMesh = tube([innerX, 0.4, pos.z], shockTop, 0.028, suspMat);
  grp.add(shockMesh);
  // spring coils around shock (visual stack of thin tori)
  const dir = new THREE.Vector3(...shockTop).sub(
    new THREE.Vector3(innerX, 0.4, pos.z),
  );
  const len = dir.length();
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const coil = new THREE.Mesh(
      new THREE.TorusGeometry(0.055, 0.011, 6, 14),
      suspMat,
    );
    coil.position.set(innerX, 0.4, pos.z).addScaledVector(dir, t);
    coil.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      dir.clone().normalize(),
    );
    grp.add(coil);
  }
  grp.userData.explode = new THREE.Vector3(
    pos.x > 0 ? 0.22 : -0.22,
    0.1,
    pos.z > 0 ? 0.12 : -0.12,
  );
  suspensionGroup.add(grp);
});
vehicle.add(suspensionGroup);

/* ---------------- Motor + CVT ---------------- */
const motorCvtGroup = new THREE.Group();
const motorMat = mat(COLOR.motor, { metalness: 0.4, roughness: 0.55 });
const accentMat = mat(COLOR.motorAccent, {
  metalness: 0.3,
  roughness: 0.4,
  emissive: 0x5c3a0d,
  emissiveIntensity: 0.3,
});
const pulleyMat = mat(COLOR.cvtPulley, { metalness: 0.85, roughness: 0.25 });
const beltMat = mat(COLOR.belt, { metalness: 0.1, roughness: 0.85 });

const engineBlock = new THREE.Mesh(
  new THREE.BoxGeometry(0.42, 0.34, 0.36),
  motorMat,
);
engineBlock.position.set(0, 0.56, -0.62);
motorCvtGroup.add(engineBlock);

const cylHead = new THREE.Mesh(
  new THREE.BoxGeometry(0.14, 0.22, 0.14),
  accentMat,
);
cylHead.position.set(0, 0.82, -0.62);
cylHead.rotation.x = -0.35;
motorCvtGroup.add(cylHead);

const primaryPulley = new THREE.Mesh(
  new THREE.CylinderGeometry(0.13, 0.13, 0.07, 20),
  pulleyMat,
);
primaryPulley.rotation.z = Math.PI / 2;
primaryPulley.position.set(0.24, 0.6, -0.62);
motorCvtGroup.add(primaryPulley);

const secondaryPulley = new THREE.Mesh(
  new THREE.CylinderGeometry(0.17, 0.17, 0.07, 20),
  pulleyMat,
);
secondaryPulley.rotation.z = Math.PI / 2;
secondaryPulley.position.set(0.24, 0.42, -0.98);
motorCvtGroup.add(secondaryPulley);

// belt: two thin boxes tangent to both pulleys (top & bottom run)
const beltLen = primaryPulley.position.distanceTo(secondaryPulley.position);
[0.1, -0.1].forEach((offset) => {
  const belt = new THREE.Mesh(
    new THREE.BoxGeometry(0.045, beltLen, 0.05),
    beltMat,
  );
  belt.position.set(0.24 + offset, (0.6 + 0.42) / 2, (-0.62 + -0.98) / 2);
  belt.rotation.x = Math.atan2(0.42 - 0.6, -0.98 - -0.62) + Math.PI / 2;
  motorCvtGroup.add(belt);
});

const diff = new THREE.Mesh(
  new THREE.CylinderGeometry(0.09, 0.09, 0.5, 14),
  motorMat,
);
diff.rotation.z = Math.PI / 2;
diff.position.set(0, 0.32, -0.98);
motorCvtGroup.add(diff);

motorCvtGroup.userData.explode = new THREE.Vector3(0.05, 0.32, -0.35);
vehicle.add(motorCvtGroup);

/* ---------------- Electronics ---------------- */
const electronicsGroup = new THREE.Group();
const pcbMat = mat(COLOR.electronics, { metalness: 0.2, roughness: 0.6 });
const ledMat = new THREE.MeshBasicMaterial({ color: COLOR.led });
const wireMat = mat(0x1a1d24, { metalness: 0.1, roughness: 0.7 });

const esp = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.07), pcbMat);
esp.position.set(-0.18, 0.62, 0.05);
electronicsGroup.add(esp);
[
  [-0.2, 0.64, 0.05],
  [-0.16, 0.64, 0.07],
].forEach((p) => {
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 8), ledMat);
  led.position.set(...p);
  electronicsGroup.add(led);
});

const displayBox = new THREE.Mesh(
  new THREE.BoxGeometry(0.1, 0.07, 0.02),
  pcbMat,
);
displayBox.position.set(0, 0.66, 0.55);
displayBox.rotation.x = -0.4;
electronicsGroup.add(displayBox);

const battBox = new THREE.Mesh(
  new THREE.BoxGeometry(0.12, 0.1, 0.14),
  mat(0x1c2430, { metalness: 0.3, roughness: 0.6 }),
);
battBox.position.set(0.28, 0.42, -0.35);
electronicsGroup.add(battBox);

const antenna = tube([0, 1.18, 0.1], [0, 1.35, 0.1], 0.008, mat(0x2a2f3a));
electronicsGroup.add(antenna);

electronicsGroup.add(
  tube([-0.18, 0.6, 0.05], [0.28, 0.45, -0.3], 0.008, wireMat),
);
electronicsGroup.add(tube([-0.18, 0.6, 0.05], [0, 0.63, 0.52], 0.008, wireMat));

electronicsGroup.userData.explode = new THREE.Vector3(-0.35, 0.4, 0.3);
vehicle.add(electronicsGroup);

/* ---------------- Seat / cockpit ---------------- */
const seatGroup = new THREE.Group();
const seatMat = mat(COLOR.seat, { metalness: 0.1, roughness: 0.85 });
const seatBase = new THREE.Mesh(
  new THREE.BoxGeometry(0.34, 0.06, 0.4),
  seatMat,
);
seatBase.position.set(0, 0.42, 0.05);
seatGroup.add(seatBase);
const seatBack = new THREE.Mesh(
  new THREE.BoxGeometry(0.34, 0.44, 0.06),
  seatMat,
);
seatBack.position.set(0, 0.66, -0.14);
seatBack.rotation.x = -0.18;
seatGroup.add(seatBack);
const wheelTorus = new THREE.Mesh(
  new THREE.TorusGeometry(0.11, 0.014, 8, 20),
  mat(COLOR.steer, { roughness: 0.7 }),
);
wheelTorus.position.set(0, 0.74, 0.55);
wheelTorus.rotation.x = Math.PI / 2.6;
seatGroup.add(wheelTorus);
const column = tube([0, 0.5, 0.35], [0, 0.72, 0.53], 0.018, mat(0x2a2f3a));
seatGroup.add(column);
seatGroup.userData.explode = new THREE.Vector3(0, 0.4, -0.1);
vehicle.add(seatGroup);

/* ============================================================
   System registry (for highlight + explode)
   ============================================================ */
const systems = {
  chassi: [chassisGroup],
  suspensao: [suspensionGroup, wheelsGroup],
  motor: [motorCvtGroup],
  eletronica: [electronicsGroup],
};
const alwaysNeutral = [seatGroup, ground];
const allGroups = [
  chassisGroup,
  wheelsGroup,
  suspensionGroup,
  motorCvtGroup,
  electronicsGroup,
  seatGroup,
];

// Give every mesh a stable reference to its material so we can restore it.
allGroups.forEach((g) => {
  g.traverse((obj) => {
    if (obj.isMesh) {
      obj.userData.baseOpacity = 1;
      obj.material = obj.material.clone();
      obj.material.transparent = true;
    }
  });
});

let currentSystem = "completo";
function applyHighlight(name) {
  currentSystem = name;
  allGroups.forEach((g) => {
    const isAlwaysNeutral = alwaysNeutral.includes(g);
    let dim = false;
    if (name !== "completo" && !isAlwaysNeutral) {
      const active = systems[name] || [];
      dim = !active.includes(g);
    }
    g.traverse((obj) => {
      if (obj.isMesh) {
        obj.material.opacity = dim ? 0.16 : 1;
      }
    });
  });
}

window.addEventListener("baja:system", (e) => applyHighlight(e.detail));

/* ============================================================
   Explode toggle
   ============================================================ */
let exploded = false;
window.addEventListener("baja:explode", (e) => {
  exploded = !!e.detail;
});

/* ============================================================
   Auto-rotate toggle
   ============================================================ */
window.addEventListener("baja:autorotate", (e) => {
  controls.autoRotate = !!e.detail;
});
let userInteracting = false;
let idleTimer = null;
controls.addEventListener("start", () => {
  userInteracting = true;
  controls.autoRotate = false;
  if (idleTimer) clearTimeout(idleTimer);
});
controls.addEventListener("end", () => {
  userInteracting = false;
  const toggle = document.getElementById("rotateToggle");
  const shouldResume = toggle
    ? toggle.getAttribute("data-active") === "true"
    : true;
  if (shouldResume) {
    idleTimer = setTimeout(() => {
      controls.autoRotate = true;
    }, 2200);
  }
});

/* ============================================================
   Resize handling
   ============================================================ */
function resize() {
  const w = panel.clientWidth;
  const h = panel.clientHeight;
  if (w === 0 || h === 0) return;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}
new ResizeObserver(resize).observe(panel);
resize();

/* ============================================================
   Animation loop
   ============================================================ */
const tmpVec = new THREE.Vector3();
function animate() {
  requestAnimationFrame(animate);

  allGroups.forEach((g) => {
    const target = exploded
      ? g.userData.explode || tmpVec.set(0, 0, 0)
      : tmpVec.set(0, 0, 0);
    g.position.lerp(target, 0.09);
  });

  controls.update();
  renderer.render(scene, camera);
}

let announcedReady = false;
function firstFrame() {
  if (!announcedReady) {
    announcedReady = true;
    window.dispatchEvent(new CustomEvent("baja:ready"));
  }
}
requestAnimationFrame(() => {
  firstFrame();
  animate();
});
