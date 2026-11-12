import * as THREE from 'three';

// Texture generators (procedural canvas textures - zero 404s)

/** Generates assembly instructions running along the kinetic Bus-Blade */
export function createBusBladeTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#050b14';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Hex bus traces
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 2;
  for (let y = 10; y < 120; y += 22) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(200, y);
    ctx.lineTo(240, y + 10);
    ctx.lineTo(512, y + 10);
    ctx.stroke();
  }

  // ASM text
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 16px "JetBrains Mono", monospace';
  const asmSnippets = [
    '0x00: MOV RAX, 0xKERNEL_SLAYER',
    '0x08: XOR RDX, RDX ; OVERCLOCK',
    '0x10: CMP BYTE [RSI], 0xNULL',
    '0x18: JNZ .FLUSH_CACHE',
    '0x20: INT 0x80 ; HARDWARE_SHRED'
  ];

  asmSnippets.forEach((text, i) => {
    ctx.fillText(text, 20, 24 + i * 22);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

/** Generates cyber circuit pattern for hardware floors and armor */
export function createCircuitFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0a0d14';
  ctx.fillRect(0, 0, 512, 512);

  // Chip tiles
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 4;
  ctx.strokeRect(10, 10, 492, 492);

  // Micro traces
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 1.5;
  for (let i = 40; i < 480; i += 60) {
    ctx.beginPath();
    ctx.moveTo(i, 40);
    ctx.lineTo(i, 200);
    ctx.lineTo(i + 30, 230);
    ctx.lineTo(i + 30, 470);
    ctx.stroke();

    // Solder pads
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(i, 40, 4, 0, Math.PI * 2);
    ctx.arc(i + 30, 470, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(12, 12);
  return texture;
}

// ---------------------------------------------------------------------
// ENES ÖZTÜRK HERO CHARACTER MODEL (Composite 3-12 parts)
// ---------------------------------------------------------------------
export interface EnesHeroModel {
  group: THREE.Group;
  visorMesh: THREE.Mesh;
  spineTubes: THREE.Mesh[];
  bladeGroup: THREE.Group;
  bladeCrystal: THREE.Mesh;
  bladePlasmaEdge: THREE.Mesh;
  compilerCannon: THREE.Group;
  cannonCylinders: THREE.Mesh;
  exhaustPipes: THREE.Mesh[];
  leftArm: THREE.Group;
  rightArm: THREE.Group;
}

export function createEnesHero(): EnesHeroModel {
  const root = new THREE.Group();
  root.name = 'Enes_Hero_Root';

  // Base materials
  const armorMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.9,
    roughness: 0.22,
  });

  const secondaryMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.6,
    roughness: 0.45,
  });

  const goldTrimMat = new THREE.MeshStandardMaterial({
    color: 0xe2b340,
    metalness: 0.95,
    roughness: 0.18,
  });

  // 1. Torso & Chestplate
  const torsoGroup = new THREE.Group();
  const chestGeo = new THREE.BoxGeometry(0.7, 0.9, 0.45);
  const chest = new THREE.Mesh(chestGeo, armorMat);
  chest.position.y = 1.35;
  chest.castShadow = true;
  torsoGroup.add(chest);

  // Carbon fiber breastplate bevel
  const plateGeo = new THREE.BoxGeometry(0.58, 0.5, 0.15);
  const breastplate = new THREE.Mesh(plateGeo, secondaryMat);
  breastplate.position.set(0, 1.45, 0.2);
  torsoGroup.add(breastplate);

  // 2. Spine Coolant Conduits (Diegetic temperature readout)
  const spineTubes: THREE.Mesh[] = [];
  for (let i = 0; i < 4; i++) {
    const tubeGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.14, 8);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: 0x00ffff,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.5,
    });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.x = Math.PI / 2;
    tube.position.set(0, 1.15 + i * 0.16, -0.22);
    torsoGroup.add(tube);
    spineTubes.push(tube);
  }

  // Exhaust vents on upper shoulders
  const exhaustPipes: THREE.Mesh[] = [];
  [-0.26, 0.26].forEach((x) => {
    const ventGeo = new THREE.CylinderGeometry(0.05, 0.07, 0.25, 8);
    const ventMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.9,
      roughness: 0.3,
    });
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(x, 1.85, -0.15);
    vent.rotation.x = -0.3;
    torsoGroup.add(vent);
    exhaustPipes.push(vent);
  });

  // 3. Helmet & Visor
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.95, 0);

  const helmetGeo = new THREE.BoxGeometry(0.38, 0.38, 0.42);
  const helmet = new THREE.Mesh(helmetGeo, armorMat);
  helmet.castShadow = true;
  headGroup.add(helmet);

  // Angular visor (shows cracks and color state)
  const visorGeo = new THREE.BoxGeometry(0.32, 0.12, 0.08);
  const visorMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.2,
  });
  const visor = new THREE.Mesh(visorGeo, visorMat);
  visor.position.set(0, 0.02, 0.21);
  headGroup.add(visor);
  torsoGroup.add(headGroup);

  // 4. Legs & Greaves
  const createLeg = (xOffset: number) => {
    const legGroup = new THREE.Group();
    legGroup.position.set(xOffset, 0.95, 0);

    const thighGeo = new THREE.BoxGeometry(0.24, 0.5, 0.26);
    const thigh = new THREE.Mesh(thighGeo, secondaryMat);
    thigh.position.y = -0.22;
    thigh.castShadow = true;
    legGroup.add(thigh);

    const kneeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const knee = new THREE.Mesh(kneeGeo, goldTrimMat);
    knee.position.y = -0.48;
    legGroup.add(knee);

    const calfGeo = new THREE.BoxGeometry(0.22, 0.5, 0.24);
    const calf = new THREE.Mesh(calfGeo, armorMat);
    calf.position.y = -0.72;
    calf.castShadow = true;
    legGroup.add(calf);

    const bootGeo = new THREE.BoxGeometry(0.25, 0.18, 0.38);
    const boot = new THREE.Mesh(bootGeo, armorMat);
    boot.position.set(0, -0.9, 0.06);
    boot.castShadow = true;
    legGroup.add(boot);

    return legGroup;
  };

  const leftLeg = createLeg(-0.2);
  const rightLeg = createLeg(0.2);
  root.add(leftLeg);
  root.add(rightLeg);

  // 5. Arms & Hands
  // Right Arm (holds The Bus-Blade)
  const rightArm = new THREE.Group();
  rightArm.position.set(0.46, 1.7, 0);

  const rShoulderGeo = new THREE.BoxGeometry(0.26, 0.26, 0.28);
  const rShoulder = new THREE.Mesh(rShoulderGeo, goldTrimMat);
  rShoulder.castShadow = true;
  rightArm.add(rShoulder);

  const rForearmGeo = new THREE.BoxGeometry(0.18, 0.42, 0.18);
  const rForearm = new THREE.Mesh(rForearmGeo, armorMat);
  rForearm.position.set(0.04, -0.28, 0.1);
  rForearm.rotation.x = -0.2;
  rForearm.castShadow = true;
  rightArm.add(rForearm);

  // 6. Monolithic Kinetic Sword (The Bus-Blade)
  const bladeGroup = new THREE.Group();
  bladeGroup.position.set(0.04, -0.48, 0.2);
  bladeGroup.rotation.x = 0.5;

  // Hilt & Crossguard
  const hiltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8);
  const hilt = new THREE.Mesh(hiltGeo, secondaryMat);
  bladeGroup.add(hilt);

  const guardGeo = new THREE.BoxGeometry(0.35, 0.08, 0.12);
  const guard = new THREE.Mesh(guardGeo, goldTrimMat);
  guard.position.y = 0.18;
  bladeGroup.add(guard);

  // Crystal Power Tube in hilt (Diegetic blade charge meter)
  const crystalGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.18, 8);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 1.0,
    roughness: 0.1,
    metalness: 0.3,
  });
  const bladeCrystal = new THREE.Mesh(crystalGeo, crystalMat);
  bladeCrystal.position.set(0, 0, 0);
  bladeGroup.add(bladeCrystal);

  // The Monolithic Blade (engraved with assembly instructions)
  const bladeTexture = createBusBladeTexture();
  const bladeGeo = new THREE.BoxGeometry(0.14, 1.6, 0.04);
  const bladeMat = new THREE.MeshStandardMaterial({
    map: bladeTexture,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x004060,
    emissiveIntensity: 0.5,
  });
  const blade = new THREE.Mesh(bladeGeo, bladeMat);
  blade.position.y = 1.0;
  blade.castShadow = true;
  bladeGroup.add(blade);

  // High-frequency plasma cutting edge
  const plasmaGeo = new THREE.BoxGeometry(0.18, 1.66, 0.06);
  const plasmaMat = new THREE.MeshBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.45,
    wireframe: true,
  });
  const bladePlasmaEdge = new THREE.Mesh(plasmaGeo, plasmaMat);
  bladePlasmaEdge.position.y = 1.0;
  bladeGroup.add(bladePlasmaEdge);

  rightArm.add(bladeGroup);
  torsoGroup.add(rightArm);

  // 7. Left Arm (holds The Compiler Cannon)
  const leftArm = new THREE.Group();
  leftArm.position.set(-0.46, 1.7, 0);

  const lShoulderGeo = new THREE.BoxGeometry(0.26, 0.26, 0.28);
  const lShoulder = new THREE.Mesh(lShoulderGeo, goldTrimMat);
  lShoulder.castShadow = true;
  leftArm.add(lShoulder);

  const lForearmGeo = new THREE.BoxGeometry(0.18, 0.42, 0.18);
  const lForearm = new THREE.Mesh(lForearmGeo, armorMat);
  lForearm.position.set(-0.04, -0.28, 0.1);
  lForearm.rotation.x = -0.3;
  lForearm.castShadow = true;
  leftArm.add(lForearm);

  // The Compiler Cannon
  const compilerCannon = new THREE.Group();
  compilerCannon.position.set(-0.05, -0.45, 0.25);
  compilerCannon.rotation.x = -Math.PI / 2 + 0.3;

  const barrelGeo = new THREE.BoxGeometry(0.16, 0.5, 0.2);
  const cannonBody = new THREE.Mesh(barrelGeo, armorMat);
  compilerCannon.add(cannonBody);

  // Rotating cylinder pack
  const cylinderGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.32, 6);
  const cylinderMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.25,
  });
  const cannonCylinders = new THREE.Mesh(cylinderGeo, cylinderMat);
  cannonCylinders.position.set(0, 0.1, 0.08);
  cannonCylinders.rotation.x = Math.PI / 2;
  compilerCannon.add(cannonCylinders);

  // Muzzle glow
  const muzzleGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
  const muzzleMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
  const muzzle = new THREE.Mesh(muzzleGeo, muzzleMat);
  muzzle.position.set(0, 0.32, 0);
  compilerCannon.add(muzzle);

  leftArm.add(compilerCannon);
  torsoGroup.add(leftArm);

  root.add(torsoGroup);

  return {
    group: root,
    visorMesh: visor,
    spineTubes,
    bladeGroup,
    bladeCrystal,
    bladePlasmaEdge,
    compilerCannon,
    cannonCylinders,
    exhaustPipes,
    leftArm,
    rightArm,
  };
}

// ---------------------------------------------------------------------
// ENEMY PROCEDURAL MODELS (Structured for real-time slicing)
// ---------------------------------------------------------------------

/** Firewall Guardian (Heavy shielded cyber-tank) */
export function createFirewallGuardian(): { group: THREE.Group; shield: THREE.Mesh } {
  const root = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xd97706, // Industrial amber armor
    metalness: 0.9,
    roughness: 0.3,
  });
  const darkMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    metalness: 0.8,
    roughness: 0.4,
  });

  // Main chassis
  const chassisGeo = new THREE.BoxGeometry(1.2, 1.4, 0.8);
  const chassis = new THREE.Mesh(chassisGeo, bodyMat);
  chassis.position.y = 1.3;
  chassis.castShadow = true;
  root.add(chassis);

  // Head sensor core
  const coreGeo = new THREE.SphereGeometry(0.28, 8, 8);
  const coreMat = new THREE.MeshBasicMaterial({ color: 0xff3300 });
  const core = new THREE.Mesh(coreGeo, coreMat);
  core.position.set(0, 2.1, 0.1);
  root.add(core);

  // Heavy hydraulic legs
  [-0.45, 0.45].forEach((x) => {
    const legGeo = new THREE.BoxGeometry(0.3, 0.8, 0.35);
    const leg = new THREE.Mesh(legGeo, darkMat);
    leg.position.set(x, 0.4, 0);
    leg.castShadow = true;
    root.add(leg);
  });

  // Massive Energy Shield
  const shieldGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.08, 6);
  const shieldMat = new THREE.MeshStandardMaterial({
    color: 0xff4500,
    emissive: 0xff3300,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.85,
    roughness: 0.1,
  });
  const shield = new THREE.Mesh(shieldGeo, shieldMat);
  shield.rotation.x = Math.PI / 2;
  shield.position.set(0.65, 1.4, 0.6);
  root.add(shield);

  return { group: root, shield };
}

/** Sniffer Assassin (Agile cloaked ninja) */
export function createSnifferAssassin(): THREE.Group {
  const root = new THREE.Group();

  const stealthMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    metalness: 0.95,
    roughness: 0.1,
    transparent: true,
    opacity: 0.85,
  });

  const neonMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 }); // Purple nanite glow

  // Torso
  const torsoGeo = new THREE.ConeGeometry(0.35, 1.0, 5);
  const torso = new THREE.Mesh(torsoGeo, stealthMat);
  torso.rotation.x = Math.PI;
  torso.position.y = 1.2;
  root.add(torso);

  // Head visor
  const headGeo = new THREE.SphereGeometry(0.2, 8, 8);
  const head = new THREE.Mesh(headGeo, neonMat);
  head.position.set(0, 1.8, 0);
  root.add(head);

  // Twin nano-daggers
  [-0.4, 0.4].forEach((x) => {
    const daggerGeo = new THREE.BoxGeometry(0.04, 0.8, 0.02);
    const dagger = new THREE.Mesh(daggerGeo, neonMat);
    dagger.position.set(x, 0.9, 0.3);
    dagger.rotation.x = 0.5;
    root.add(dagger);
  });

  // Hovering nanite thrusters
  const thrusterGeo = new THREE.CylinderGeometry(0.12, 0.02, 0.4, 6);
  const thruster = new THREE.Mesh(thrusterGeo, neonMat);
  thruster.position.set(0, 0.4, 0);
  root.add(thruster);

  return root;
}

/** DDoS Swarm Kamikaze Drone */
export function createDDoSSwarmDrone(): THREE.Group {
  const root = new THREE.Group();

  const shellMat = new THREE.MeshStandardMaterial({
    color: 0xef4444,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Core octahedron
  const coreGeo = new THREE.OctahedronGeometry(0.35);
  const core = new THREE.Mesh(coreGeo, shellMat);
  core.position.y = 1.0;
  root.add(core);

  // Glowing center eye
  const eyeGeo = new THREE.SphereGeometry(0.15, 8, 8);
  const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  const eye = new THREE.Mesh(eyeGeo, eyeMat);
  eye.position.set(0, 1.0, 0.2);
  root.add(eye);

  // 3 Kamikaze ramming spikes
  for (let i = 0; i < 3; i++) {
    const spikeGeo = new THREE.ConeGeometry(0.06, 0.4, 4);
    const spike = new THREE.Mesh(spikeGeo, shellMat);
    const angle = (i * Math.PI * 2) / 3;
    spike.position.set(Math.cos(angle) * 0.35, 1.0, Math.sin(angle) * 0.35);
    spike.rotation.z = -Math.cos(angle) * 0.8;
    root.add(spike);
  }

  return root;
}

/** Polymorphic Nanite Worm (Segmented body) */
export function createPolymorphicWorm(): { group: THREE.Group; segments: THREE.Group[] } {
  const root = new THREE.Group();
  const segments: THREE.Group[] = [];

  const wormMat = new THREE.MeshStandardMaterial({
    color: 0x10b981, // Emerald nanite venom
    metalness: 0.85,
    roughness: 0.25,
  });
  const glowMat = new THREE.MeshBasicMaterial({ color: 0x34d399 });

  const numSegments = 5;
  for (let i = 0; i < numSegments; i++) {
    const segGroup = new THREE.Group();
    const radius = 0.35 - i * 0.04;
    const geo = new THREE.CylinderGeometry(radius, radius, 0.45, 8);
    const mesh = new THREE.Mesh(geo, wormMat);
    mesh.rotation.x = Math.PI / 2;
    segGroup.add(mesh);

    // Glowing register band
    const bandGeo = new THREE.TorusGeometry(radius + 0.02, 0.03, 6, 12);
    const band = new THREE.Mesh(bandGeo, glowMat);
    segGroup.add(band);

    segGroup.position.set(0, 0.4, -i * 0.5);
    root.add(segGroup);
    segments.push(segGroup);
  }

  // Mandible jaws on head
  [-0.2, 0.2].forEach((x) => {
    const jawGeo = new THREE.ConeGeometry(0.08, 0.35, 4);
    const jaw = new THREE.Mesh(jawGeo, glowMat);
    jaw.position.set(x, 0.4, 0.35);
    jaw.rotation.x = Math.PI / 2;
    root.add(jaw);
  });

  return { group: root, segments };
}

/** The Rogue Kernel Boss (Gigantic Corrupted CPU Die Entity) */
export function createRogueKernelBoss(): {
  group: THREE.Group;
  rings: THREE.Mesh[];
  coreEye: THREE.Mesh;
} {
  const root = new THREE.Group();
  root.position.y = 3.5;

  const monolithMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    metalness: 0.95,
    roughness: 0.15,
  });

  // Massive CPU die core
  const dieGeo = new THREE.BoxGeometry(2.4, 2.4, 1.2);
  const die = new THREE.Mesh(dieGeo, monolithMat);
  die.castShadow = true;
  root.add(die);

  // Core Eye (The Corrupted Kernel Root)
  const eyeGeo = new THREE.SphereGeometry(0.8, 16, 16);
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0xff0055,
    emissive: 0xff0055,
    emissiveIntensity: 1.8,
    roughness: 0.1,
  });
  const coreEye = new THREE.Mesh(eyeGeo, eyeMat);
  coreEye.position.z = 0.5;
  root.add(coreEye);

  // 3 Orbiting segmented rings
  const rings: THREE.Mesh[] = [];
  const ringSizes = [3.2, 4.2, 5.2];
  ringSizes.forEach((r, idx) => {
    const ringGeo = new THREE.TorusGeometry(r, 0.12, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: idx % 2 === 0 ? 0xef4444 : 0x8b5cf6,
      emissive: idx % 2 === 0 ? 0x991b1b : 0x5b21b6,
      emissiveIntensity: 0.8,
      metalness: 0.9,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3 + idx * 0.4;
    ring.rotation.y = idx * 0.5;
    root.add(ring);
    rings.push(ring);
  });

  return { group: root, rings, coreEye };
}

// ---------------------------------------------------------------------
// MEMORY NODES (Floating pointers: *ptr = &Enes)
// ---------------------------------------------------------------------
export function createMemoryNode(address: string): THREE.Group {
  const node = new THREE.Group();

  const crystalGeo = new THREE.IcosahedronGeometry(0.45, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00d8e6,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.4,
  });
  const crystal = new THREE.Mesh(crystalGeo, crystalMat);
  node.add(crystal);

  const ringGeo = new THREE.TorusGeometry(0.65, 0.03, 8, 16);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff, wireframe: true });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI / 2;
  node.add(ring);

  // Address label canvas plane
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgba(5, 11, 20, 0.85)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(4, 4, 248, 56);
  ctx.fillStyle = '#00f0ff';
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(address, 128, 38);

  const labelTex = new THREE.CanvasTexture(canvas);
  labelTex.colorSpace = THREE.SRGBColorSpace;
  const labelGeo = new THREE.PlaneGeometry(1.2, 0.3);
  const labelMat = new THREE.MeshBasicMaterial({
    map: labelTex,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const labelPlane = new THREE.Mesh(labelGeo, labelMat);
  labelPlane.position.y = 0.85;
  node.add(labelPlane);

  return node;
}
