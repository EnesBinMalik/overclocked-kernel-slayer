import * as THREE from 'three';
import { ArenaInfo, ArenaLayerId, MemoryNode } from './types';
import { createCircuitFloorTexture, createMemoryNode } from './geometry';

export const ARENA_CATALOG: Record<ArenaLayerId, ArenaInfo> = {
  1: {
    id: 1,
    name: 'PCIe Expressways',
    codename: 'KATMAN 1 - THE PCIE EXPRESSWAYS',
    description: 'Terabytes/sec multi-lane bridges above high-voltage plasma abyss.',
    hazard: 'High-speed data trains & plasma canyon drops',
    ambientColor: 0x0284c7,
    fogColor: 0x030712,
  },
  2: {
    id: 2,
    name: 'Liquid-Nitrogen Turbines',
    codename: 'KATMAN 2 - LIQUID-NITROGEN TURBINES',
    description: 'Giant cooling fan hurricane wind tunnels with floating frost crystals.',
    hazard: 'Cryogenic updrafts & spinning turbine blades',
    ambientColor: 0x06b6d4,
    fogColor: 0x041f2d,
  },
  3: {
    id: 3,
    name: 'Firewall Bastion',
    codename: 'KATMAN 3 - FIREWALL BASTION',
    description: 'Molten silicon walls, shifting laser tripwires, and hydraulic presses.',
    hazard: 'Laser barricades & crushing hydraulic rams',
    ambientColor: 0xe11d48,
    fogColor: 0x21060d,
  },
  4: {
    id: 4,
    name: 'Cryptographic Colosseum',
    codename: 'KATMAN 4 - CRYPTOGRAPHIC COLOSSEUM',
    description: 'Rotating algorithmic monolith pillars creating dynamic cover and cliffs.',
    hazard: 'Shifting rotating walls & laser targeting lines',
    ambientColor: 0x8b5cf6,
    fogColor: 0x13082b,
  },
  5: {
    id: 5,
    name: 'The Silicon Throne',
    codename: 'KATMAN 5 - THE SILICON THRONE',
    description: 'The Rogue Kernel Core chamber where disintegrating chip tiles face raw lightning.',
    hazard: 'Falling lightning arcs & crumbling core hex tiles',
    ambientColor: 0xf59e0b,
    fogColor: 0x1c1002,
  },
};

export interface ArenaEnvironment {
  root: THREE.Group;
  animatedProps: {
    mesh: THREE.Object3D;
    update: (time: number, delta: number) => void;
  }[];
  memoryNodes: MemoryNode[];
  hazardZones: { center: THREE.Vector3; radius: number; damage: number }[];
  floorMesh: THREE.Mesh;
}

export function buildArena(layerId: ArenaLayerId, scene: THREE.Scene): ArenaEnvironment {
  const root = new THREE.Group();
  root.name = `Arena_Layer_${layerId}`;

  const animatedProps: ArenaEnvironment['animatedProps'] = [];
  const memoryNodes: MemoryNode[] = [];
  const hazardZones: ArenaEnvironment['hazardZones'] = [];

  const circuitTexture = createCircuitFloorTexture();

  // 1. Central Hardware Arena Floor (45m x 45m grounded at Y = 0)
  const floorGeo = new THREE.PlaneGeometry(50, 50, 32, 32);
  const floorMat = new THREE.MeshStandardMaterial({
    map: circuitTexture,
    metalness: 0.9,
    roughness: 0.25,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.receiveShadow = true;
  root.add(floorMesh);

  // Outer Perimeter Pillars / Bus Traces (Never box in a void)
  const boundaryMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    metalness: 0.9,
    roughness: 0.2,
  });

  for (let i = 0; i < 16; i++) {
    const angle = (i * Math.PI * 2) / 16;
    const r = 24.5;
    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;

    const pillarGeo = new THREE.BoxGeometry(1.4, 7, 1.4);
    const pillar = new THREE.Mesh(pillarGeo, boundaryMat);
    pillar.position.set(x, 3.5, z);
    pillar.castShadow = true;
    root.add(pillar);

    // Glowing bus trace on each pillar
    const neonGeo = new THREE.BoxGeometry(0.1, 6.5, 0.1);
    const neonMat = new THREE.MeshBasicMaterial({
      color: ARENA_CATALOG[layerId].ambientColor,
    });
    const neon = new THREE.Mesh(neonGeo, neonMat);
    neon.position.set(x * 0.96, 3.5, z * 0.96);
    root.add(neon);
  }

  // 2. LAYER-SPECIFIC ARCHITECTURE & KINEMATICS
  if (layerId === 1) {
    // LAYER 1: PCIe Expressways - Elevated bus tracks with high-speed data trains
    const bridgeMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.9,
      roughness: 0.25,
    });

    [-12, 12].forEach((zPos) => {
      const bridgeGeo = new THREE.BoxGeometry(40, 0.6, 4);
      const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
      bridge.position.set(0, 3.2, zPos);
      root.add(bridge);

      // Moving Data Train Block
      const trainGeo = new THREE.BoxGeometry(6, 1.2, 3.2);
      const trainMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.9,
        metalness: 0.8,
      });
      const train = new THREE.Mesh(trainGeo, trainMat);
      train.position.set(-15, 4.0, zPos);
      root.add(train);

      animatedProps.push({
        mesh: train,
        update: (_time, delta) => {
          train.position.x += (zPos > 0 ? 18 : -18) * delta;
          if (train.position.x > 25) train.position.x = -25;
          if (train.position.x < -25) train.position.x = 25;
        },
      });
    });

    // High-voltage plasma river in the center
    const riverGeo = new THREE.PlaneGeometry(8, 48);
    const riverMat = new THREE.MeshBasicMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.7,
    });
    const river = new THREE.Mesh(riverGeo, riverMat);
    river.rotation.x = -Math.PI / 2;
    river.position.set(0, 0.02, 0);
    root.add(river);

    animatedProps.push({
      mesh: river,
      update: (time) => {
        riverMat.opacity = 0.5 + Math.sin(time * 6) * 0.2;
      },
    });
  } else if (layerId === 2) {
    // LAYER 2: Liquid-Nitrogen Turbines - Giant cooling fan blades and frost updrafts
    const fanMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      metalness: 0.95,
      roughness: 0.15,
    });

    [-10, 10].forEach((xPos) => {
      const turbineHub = new THREE.Group();
      turbineHub.position.set(xPos, 5, 0);

      const hubGeo = new THREE.CylinderGeometry(1.2, 1.2, 0.8, 16);
      const hub = new THREE.Mesh(hubGeo, fanMat);
      hub.rotation.x = Math.PI / 2;
      turbineHub.add(hub);

      // 4 Fan Blades
      for (let b = 0; b < 4; b++) {
        const bladeGeo = new THREE.BoxGeometry(0.6, 5.5, 0.1);
        const blade = new THREE.Mesh(bladeGeo, fanMat);
        blade.position.y = 3.2;
        blade.rotation.z = (b * Math.PI) / 2;
        turbineHub.add(blade);
      }

      root.add(turbineHub);

      animatedProps.push({
        mesh: turbineHub,
        update: (_time, delta) => {
          turbineHub.rotation.z += 3.5 * delta;
        },
      });
    });

    // Updraft hazard
    hazardZones.push({ center: new THREE.Vector3(-10, 0, 0), radius: 4, damage: 5 });
    hazardZones.push({ center: new THREE.Vector3(10, 0, 0), radius: 4, damage: 5 });
  } else if (layerId === 3) {
    // LAYER 3: Firewall Bastion - Laser tripwires & hydraulic smash rams
    const ramMat = new THREE.MeshStandardMaterial({
      color: 0x7f1d1d,
      metalness: 0.9,
      roughness: 0.3,
    });

    [-8, 8].forEach((xPos) => {
      const ramGeo = new THREE.BoxGeometry(3, 4, 3);
      const ram = new THREE.Mesh(ramGeo, ramMat);
      ram.position.set(xPos, 6, 0);
      root.add(ram);

      animatedProps.push({
        mesh: ram,
        update: (time) => {
          // Hydraulic slam down and slow rise
          const cycle = Math.sin(time * 3);
          ram.position.y = cycle > 0.8 ? 1.5 : 5.5 + cycle * 0.5;
        },
      });

      hazardZones.push({ center: new THREE.Vector3(xPos, 0, 0), radius: 2.5, damage: 25 });
    });

    // Laser barrier lines
    const laserMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      transparent: true,
      opacity: 0.8,
    });
    for (let l = -14; l <= 14; l += 7) {
      const laserGeo = new THREE.CylinderGeometry(0.04, 0.04, 30, 8);
      const laser = new THREE.Mesh(laserGeo, laserMat);
      laser.rotation.z = Math.PI / 2;
      laser.position.set(0, 1.2, l);
      root.add(laser);
    }
  } else if (layerId === 4) {
    // LAYER 4: Cryptographic Colosseum - Dynamic revolving cryptographic columns
    const colMat = new THREE.MeshStandardMaterial({
      color: 0x2e1065,
      metalness: 0.9,
      roughness: 0.2,
    });

    const colPositions = [
      new THREE.Vector3(-10, 3, -10),
      new THREE.Vector3(10, 3, -10),
      new THREE.Vector3(-10, 3, 10),
      new THREE.Vector3(10, 3, 10),
      new THREE.Vector3(0, 3.5, 0),
    ];

    colPositions.forEach((pos, idx) => {
      const colGeo = new THREE.BoxGeometry(2.5, 6, 2.5);
      const col = new THREE.Mesh(colGeo, colMat);
      col.position.copy(pos);
      root.add(col);

      animatedProps.push({
        mesh: col,
        update: (_time, delta) => {
          col.rotation.y += (idx % 2 === 0 ? 0.8 : -0.8) * delta;
        },
      });
    });
  } else if (layerId === 5) {
    // LAYER 5: The Silicon Throne - Crumbling hexagonal platform & raw lightning arcs
    const hexGeo = new THREE.CylinderGeometry(20, 20, 1.5, 6);
    const throneMat = new THREE.MeshStandardMaterial({
      color: 0x1c1917,
      metalness: 0.95,
      roughness: 0.15,
    });
    const throneBase = new THREE.Mesh(hexGeo, throneMat);
    throneBase.position.y = -0.75;
    root.add(throneBase);

    // Floating cracked peripheral tiles
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI * 2) / 8;
      const tileGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.5, 6);
      const tile = new THREE.Mesh(tileGeo, throneMat);
      tile.position.set(Math.cos(angle) * 16, 0.2, Math.sin(angle) * 16);
      root.add(tile);

      animatedProps.push({
        mesh: tile,
        update: (time) => {
          tile.position.y = 0.2 + Math.sin(time * 2 + i) * 0.4;
        },
      });
    }
  }

  // 3. SPAWN MEMORY NODES (Floating pointer targets: *ptr = &Enes)
  const nodeCoords = [
    { pos: new THREE.Vector3(-12, 2.8, -12), addr: '0x7FFF0010' },
    { pos: new THREE.Vector3(12, 2.8, -12), addr: '0x8048000' },
    { pos: new THREE.Vector3(-12, 2.8, 12), addr: '0xDEADBEEF' },
    { pos: new THREE.Vector3(12, 2.8, 12), addr: '0xCAFEBABE' },
    { pos: new THREE.Vector3(0, 4.2, 0), addr: '*ptr=&Enes' },
  ];

  nodeCoords.forEach((nc, idx) => {
    const nodeGroup = createMemoryNode(nc.addr);
    nodeGroup.position.copy(nc.pos);
    root.add(nodeGroup);

    memoryNodes.push({
      id: idx,
      mesh: nodeGroup,
      position: nc.pos.clone(),
      addressLabel: nc.addr,
      active: true,
      pulseTime: Math.random() * Math.PI,
    });

    animatedProps.push({
      mesh: nodeGroup,
      update: (time) => {
        nodeGroup.rotation.y = time * 1.2;
        nodeGroup.position.y = nc.pos.y + Math.sin(time * 3 + idx) * 0.3;
      },
    });
  });

  scene.add(root);

  return {
    root,
    animatedProps,
    memoryNodes,
    hazardZones,
    floorMesh,
  };
}
