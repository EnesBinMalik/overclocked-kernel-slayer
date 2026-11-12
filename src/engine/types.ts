import * as THREE from 'three';

export type ArenaLayerId = 1 | 2 | 3 | 4 | 5;

export interface ArenaInfo {
  id: ArenaLayerId;
  name: string;
  codename: string;
  description: string;
  hazard: string;
  ambientColor: number;
  fogColor: number;
}

export type EnemyType = 'guardian' | 'assassin' | 'swarm' | 'worm' | 'boss';

export interface Enemy {
  id: number;
  type: EnemyType;
  mesh: THREE.Group;
  health: number;
  maxHealth: number;
  speed: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  attackCooldown: number;
  isStunned: boolean;
  stunTimer: number;
  isStealthed?: boolean;
  targetPos: THREE.Vector3;
  slicedParts?: THREE.Mesh[];
  segments?: THREE.Group[]; // for polymorphic worm
  shieldMesh?: THREE.Mesh;  // for guardian
}

export interface MemoryNode {
  id: number;
  mesh: THREE.Group;
  position: THREE.Vector3;
  addressLabel: string;
  active: boolean;
  pulseTime: number;
}

export interface Bullet {
  id: number;
  mesh: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  lifetime: number;
  isNullPointer: boolean;
  damage: number;
}

export interface DebrisPiece {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  rotVelocity: THREE.Vector3;
  lifetime: number;
  maxLifetime: number;
  bounceCount: number;
  color: THREE.Color;
}

export interface Particle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: THREE.Color;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  isCoolant?: boolean;
}

export interface PlayerStats {
  health: number;
  maxHealth: number;
  temperature: number; // 0 - 100°C (overclock heat)
  maxTemperature: number;
  overclocked: boolean;
  clockFrequency: number; // e.g. 5.2 GHz -> 10.4 GHz in Overclock
  comboCount: number;
  comboTimer: number;
  bladeCharge: number; // 0 to 1
  compilerAmmo: number;
  maxCompilerAmmo: number;
  isTeleporting: boolean;
  bulletTimeRemaining: number;
  visorCracks: number; // 0 to 1 damage severity
  score: number;
  enemiesKilled: number;
  currentArena: ArenaLayerId;
}
