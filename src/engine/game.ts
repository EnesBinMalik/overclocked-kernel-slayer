import * as THREE from 'three';
import {
  ArenaLayerId,
  Bullet,
  Enemy,
  PlayerStats,
} from './types';
import {
  createDDoSSwarmDrone,
  createEnesHero,
  createFirewallGuardian,
  createPolymorphicWorm,
  createRogueKernelBoss,
  createSnifferAssassin,
  EnesHeroModel,
} from './geometry';
import { SlicingEngine } from './slicing';
import { ArenaEnvironment, ARENA_CATALOG, buildArena } from './arenas';
import { soundEngine } from './audio';

// Pre-allocated math objects (Zero GC)
const _pPos = new THREE.Vector3();
const _diff = new THREE.Vector3();
const _camTarget = new THREE.Vector3();

export class KernelSlayerGame {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public slicing: SlicingEngine;

  // Hero
  public hero: EnesHeroModel;
  public playerPos: THREE.Vector3 = new THREE.Vector3(0, 0, 5);
  public playerVelocity: THREE.Vector3 = new THREE.Vector3();
  public playerRotation: number = 0;
  public isGrounded: boolean = true;

  // Combat State
  public stats: PlayerStats = {
    health: 100,
    maxHealth: 100,
    temperature: 25,
    maxTemperature: 100,
    overclocked: false,
    clockFrequency: 5.2,
    comboCount: 0,
    comboTimer: 0,
    bladeCharge: 0.3,
    compilerAmmo: 12,
    maxCompilerAmmo: 12,
    isTeleporting: false,
    bulletTimeRemaining: 0,
    visorCracks: 0,
    score: 0,
    enemiesKilled: 0,
    currentArena: 1,
  };

  // Attack animations
  private isSlashing: boolean = false;
  private slashTimer: number = 0;
  private slashIndex: number = 0;
  private attackCooldown: number = 0;
  private hitStopTimer: number = 0;

  // Bullets & Entities
  public bullets: Bullet[] = [];
  public enemies: Enemy[] = [];
  private currentArenaEnv: ArenaEnvironment | null = null;
  private nextEnemyId: number = 1;
  private nextBulletId: number = 1;
  private spawnTimer: number = 0;

  // Input states
  public keys: Record<string, boolean> = {};
  public mouseLook: { yaw: number; pitch: number } = { yaw: 0, pitch: 0.25 };
  public isPointerLocked: boolean = false;

  // Lighting & Rig
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.HemisphereLight;

  constructor(
    canvas: HTMLCanvasElement,
    private isSoftwareGl: boolean,
    public onStatsUpdate?: (stats: PlayerStats) => void
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(ARENA_CATALOG[1].fogColor);
    this.scene.fog = new THREE.FogExp2(ARENA_CATALOG[1].fogColor, 0.025);

    this.camera = new THREE.PerspectiveCamera(
      65,
      canvas.clientWidth / canvas.clientHeight,
      0.1,
      150
    );

    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;
    this.renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Studio Lighting
    this.keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    this.keyLight.position.set(15, 25, 15);
    if (!isSoftwareGl) {
      this.keyLight.castShadow = true;
      this.keyLight.shadow.mapSize.set(1024, 1024);
      this.keyLight.shadow.bias = -0.0005;
      this.keyLight.shadow.camera.left = -25;
      this.keyLight.shadow.camera.right = 25;
      this.keyLight.shadow.camera.top = 25;
      this.keyLight.shadow.camera.bottom = -25;
    }
    this.scene.add(this.keyLight);

    this.fillLight = new THREE.HemisphereLight(0x0284c7, 0x0f172a, 1.2);
    this.scene.add(this.fillLight);

    // Slicing engine
    this.slicing = new SlicingEngine(this.scene);

    // Hero
    this.hero = createEnesHero();
    this.scene.add(this.hero.group);

    // Build default Arena
    this.switchArena(1);

    // Seed initial enemies
    this.spawnEnemyWave();
  }

  public switchArena(layerId: ArenaLayerId) {
    if (this.currentArenaEnv) {
      this.scene.remove(this.currentArenaEnv.root);
    }

    // Clear existing enemies and bullets
    this.enemies.forEach((e) => this.scene.remove(e.mesh));
    this.enemies = [];
    this.bullets.forEach((b) => this.scene.remove(b.mesh));
    this.bullets = [];

    this.stats.currentArena = layerId;
    const info = ARENA_CATALOG[layerId];
    this.scene.background = new THREE.Color(info.fogColor);
    if (this.scene.fog) {
      this.scene.fog.color = new THREE.Color(info.fogColor);
    }
    this.fillLight.color = new THREE.Color(info.ambientColor);

    this.currentArenaEnv = buildArena(layerId, this.scene);
    this.playerPos.set(0, 0, 8);
    this.playerVelocity.set(0, 0, 0);

    // Spawn layer-specific enemies
    this.spawnEnemyWave();

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  private spawnEnemyWave() {
    const layer = this.stats.currentArena;

    if (layer === 1) {
      // PCIe: Swarms & Guardians
      this.spawnEnemy('guardian', new THREE.Vector3(-8, 0, -10));
      this.spawnEnemy('guardian', new THREE.Vector3(8, 0, -10));
      for (let i = 0; i < 4; i++) {
        this.spawnEnemy('swarm', new THREE.Vector3((i - 1.5) * 6, 0, -16));
      }
    } else if (layer === 2) {
      // Turbines: Worms & Assassins
      this.spawnEnemy('worm', new THREE.Vector3(-6, 0, -12));
      this.spawnEnemy('worm', new THREE.Vector3(6, 0, -12));
      this.spawnEnemy('assassin', new THREE.Vector3(0, 0, -15));
    } else if (layer === 3) {
      // Firewall: Heavy Guardians & Swarms
      this.spawnEnemy('guardian', new THREE.Vector3(-10, 0, -8));
      this.spawnEnemy('guardian', new THREE.Vector3(10, 0, -8));
      this.spawnEnemy('guardian', new THREE.Vector3(0, 0, -14));
      this.spawnEnemy('swarm', new THREE.Vector3(-5, 0, -18));
      this.spawnEnemy('swarm', new THREE.Vector3(5, 0, -18));
    } else if (layer === 4) {
      // Cryptographic: Assassins & Worms
      this.spawnEnemy('assassin', new THREE.Vector3(-8, 0, -10));
      this.spawnEnemy('assassin', new THREE.Vector3(8, 0, -10));
      this.spawnEnemy('worm', new THREE.Vector3(0, 0, -15));
    } else if (layer === 5) {
      // The Silicon Throne: The Rogue Kernel Boss
      this.spawnEnemy('boss', new THREE.Vector3(0, 0, -14));
      this.spawnEnemy('swarm', new THREE.Vector3(-8, 0, -8));
      this.spawnEnemy('swarm', new THREE.Vector3(8, 0, -8));
    }
  }

  public spawnEnemy(type: Enemy['type'], pos: THREE.Vector3) {
    let mesh: THREE.Group;
    let maxHealth = 100;
    let speed = 4.5;
    let shieldMesh: THREE.Mesh | undefined;
    let segments: THREE.Group[] | undefined;

    if (type === 'guardian') {
      const g = createFirewallGuardian();
      mesh = g.group;
      shieldMesh = g.shield;
      maxHealth = 180;
      speed = 3.2;
    } else if (type === 'assassin') {
      mesh = createSnifferAssassin();
      maxHealth = 80;
      speed = 7.5;
    } else if (type === 'swarm') {
      mesh = createDDoSSwarmDrone();
      maxHealth = 45;
      speed = 6.0;
    } else if (type === 'worm') {
      const w = createPolymorphicWorm();
      mesh = w.group;
      segments = w.segments;
      maxHealth = 130;
      speed = 4.0;
    } else {
      // Boss
      const b = createRogueKernelBoss();
      mesh = b.group;
      maxHealth = 800;
      speed = 2.5;
    }

    mesh.position.copy(pos);
    this.scene.add(mesh);

    this.enemies.push({
      id: this.nextEnemyId++,
      type,
      mesh,
      health: maxHealth,
      maxHealth,
      speed,
      position: pos.clone(),
      velocity: new THREE.Vector3(),
      attackCooldown: 1.5,
      isStunned: false,
      stunTimer: 0,
      targetPos: this.playerPos.clone(),
      shieldMesh,
      segments,
    });
  }

  // -------------------------------------------------------------------
  // ACTIONS & COMBAT
  // -------------------------------------------------------------------

  /** Monolithic Kinetic Sword (The Bus-Blade) Combo Attack */
  public attackSword() {
    if (this.isSlashing && this.slashTimer > 0.1) return;

    this.isSlashing = true;
    this.slashTimer = 0.28;
    this.slashIndex = (this.slashIndex + 1) % 3;

    soundEngine.playSwordSwing(this.stats.bladeCharge);

    // Hit check in front arc of Enes
    const forward = new THREE.Vector3(
      -Math.sin(this.playerRotation),
      0,
      -Math.cos(this.playerRotation)
    );

    const slashRadius = 4.2;
    let hitAny = false;

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      _diff.subVectors(e.position, this.playerPos);
      const dist = _diff.length();

      if (dist <= slashRadius) {
        _diff.normalize();
        const dot = forward.dot(_diff);
        if (dot > 0.25) {
          // HIT!
          hitAny = true;
          const damage = (38 + this.stats.bladeCharge * 40) * (this.stats.overclocked ? 1.5 : 1.0);
          e.health -= damage;

          // Pushback
          e.velocity.addScaledVector(forward, 6.0);

          // Real-time mesh slicing
          const slashAngle = this.slashIndex === 0 ? 0 : this.slashIndex === 1 ? Math.PI / 4 : Math.PI / 2;
          const hitPoint = e.position.clone().add(new THREE.Vector3(0, 1.2, 0));
          this.slicing.sliceEnemy(e.mesh, hitPoint, slashAngle, 10.0);

          // Hit-stop trigger (milisaniye clock slowdown & bass impact)
          this.hitStopTimer = 0.045;
          soundEngine.playMeshSliceImpact();

          // Increase combo & blade charge
          this.stats.comboCount++;
          this.stats.comboTimer = 3.5;
          this.stats.bladeCharge = Math.min(1.0, this.stats.bladeCharge + 0.15);
          this.stats.score += Math.round(damage * 10);

          // Enemy Death
          if (e.health <= 0) {
            this.killEnemy(e, i);
          }
        }
      }
    }

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  /** The Compiler Cannon: Corrupted Packets & NULL Pointer Bullets */
  public fireCompilerCannon() {
    if (this.stats.compilerAmmo <= 0) {
      // Auto reload if out
      this.stats.compilerAmmo = this.stats.maxCompilerAmmo;
      return;
    }

    this.stats.compilerAmmo--;
    const isNullPointer = this.stats.bladeCharge >= 0.7;

    if (isNullPointer) {
      // Consume portion of blade charge for super NULL pointer bullet
      this.stats.bladeCharge = Math.max(0.2, this.stats.bladeCharge - 0.35);
    }

    soundEngine.playCompilerCannonShot(isNullPointer);

    // Muzzle position at Enes left hand
    const forward = new THREE.Vector3(
      -Math.sin(this.playerRotation),
      0,
      -Math.cos(this.playerRotation)
    );
    const spawnPos = this.playerPos.clone().add(new THREE.Vector3(0, 1.3, 0)).addScaledVector(forward, 0.8);

    const bulletGeo = new THREE.SphereGeometry(isNullPointer ? 0.3 : 0.16, 8, 8);
    const bulletMat = new THREE.MeshBasicMaterial({
      color: isNullPointer ? 0x00f0ff : 0xff3b30,
    });
    const bulletMesh = new THREE.Mesh(bulletGeo, bulletMat);
    bulletMesh.position.copy(spawnPos);
    this.scene.add(bulletMesh);

    const speed = isNullPointer ? 42 : 32;
    this.bullets.push({
      id: this.nextBulletId++,
      mesh: bulletMesh,
      position: spawnPos,
      velocity: forward.clone().multiplyScalar(speed),
      lifetime: 0,
      isNullPointer,
      damage: isNullPointer ? 120 : 45,
    });

    // Recoil
    this.hero.leftArm.rotation.x = -0.6;

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  /** Pointer Teleportation: *ptr = &Enes with Bullet-Time */
  public triggerTeleport() {
    if (!this.currentArenaEnv || this.currentArenaEnv.memoryNodes.length === 0) return;

    // Find nearest or forward memory node
    let bestNode = this.currentArenaEnv.memoryNodes[0];
    let minScore = Infinity;

    const forward = new THREE.Vector3(
      -Math.sin(this.playerRotation),
      0,
      -Math.cos(this.playerRotation)
    );

    this.currentArenaEnv.memoryNodes.forEach((node) => {
      _diff.subVectors(node.position, this.playerPos);
      const dist = _diff.length();
      if (dist < 1.0) return; // don't pick current spot

      _diff.normalize();
      const dot = forward.dot(_diff);
      // Prefer nodes we are facing
      const score = dist - dot * 10;
      if (score < minScore) {
        minScore = score;
        bestNode = node;
      }
    });

    // Blink Enes to node address!
    soundEngine.playTeleport();

    // Spawn teleport flash particles at departure & arrival
    this.slicing.spawnCoolantSpurt(this.playerPos.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3(0, 1, 0), 20);
    this.playerPos.copy(bestNode.position);
    this.playerPos.y = 0.5; // land cleanly
    this.playerVelocity.set(0, 0, 0);
    this.slicing.spawnCoolantSpurt(this.playerPos.clone().add(new THREE.Vector3(0, 1, 0)), new THREE.Vector3(0, 1, 0), 20);

    // Enter Bullet-Time (Clock Cycle Slowdown)
    this.stats.bulletTimeRemaining = 2.4;
    this.stats.score += 250;

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  /** Overclock Mode: Toggle Voltage Limit */
  public toggleOverclock() {
    this.stats.overclocked = !this.stats.overclocked;
    this.stats.clockFrequency = this.stats.overclocked ? 10.4 : 5.2;

    soundEngine.playOverclockToggle(this.stats.overclocked);

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  /** Coolant Purge: Vent steam and freeze surrounding enemies */
  public purgeCoolant() {
    if (this.stats.temperature < 20) return;

    soundEngine.playCoolantPurge();

    // Cool down by 45°C
    this.stats.temperature = Math.max(20, this.stats.temperature - 45);

    // Cryogenic shockwave
    this.slicing.spawnCoolantSpurt(this.playerPos.clone().add(new THREE.Vector3(0, 0.5, 0)), new THREE.Vector3(0, 1, 0), 45);

    // Freeze enemies in 8m radius
    this.enemies.forEach((e) => {
      if (e.position.distanceTo(this.playerPos) <= 8.0) {
        e.isStunned = true;
        e.stunTimer = 2.5;
        e.velocity.set(0, 0, 0);
      }
    });

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  private killEnemy(e: Enemy, index: number) {
    this.scene.remove(e.mesh);
    this.enemies.splice(index, 1);
    this.stats.enemiesKilled++;
    this.stats.score += 500;

    // Killing enemies purges 12°C heat in Overclock
    if (this.stats.overclocked) {
      this.stats.temperature = Math.max(20, this.stats.temperature - 12);
    }

    // Respawn wave if arena cleared
    if (this.enemies.length === 0) {
      setTimeout(() => this.spawnEnemyWave(), 1200);
    }
  }

  // -------------------------------------------------------------------
  // MAIN UPDATE LOOP (Enes-Overclock Engine)
  // -------------------------------------------------------------------
  public update(realDelta: number) {
    // Hit-stop pause
    if (this.hitStopTimer > 0) {
      this.hitStopTimer -= realDelta;
      return;
    }

    // Bullet-time time-dilation calculation
    let delta = realDelta;
    if (this.stats.bulletTimeRemaining > 0) {
      this.stats.bulletTimeRemaining -= realDelta;
      delta = realDelta * 0.18; // 18% clock cycle speed
    }

    // 1. Overclock Thermals & Frequency
    if (this.stats.overclocked) {
      this.stats.temperature = Math.min(100, this.stats.temperature + realDelta * 14.0);

      // Spawn steam particles from exhaust pipes
      if (Math.random() < 0.4) {
        this.hero.exhaustPipes.forEach((pipe) => {
          const worldPos = new THREE.Vector3();
          pipe.getWorldPosition(worldPos);
          this.slicing.spawnElectricalSparks(worldPos, 2);
        });
      }

      // Thermal throttling hull damage if over 90°C
      if (this.stats.temperature >= 90) {
        this.stats.health -= realDelta * 8.0;
        this.stats.visorCracks = Math.min(1.0, this.stats.visorCracks + realDelta * 0.15);
        if (Math.random() < 0.08) soundEngine.playThermalAlarm();
      }
    } else {
      // Passive cooling
      this.stats.temperature = Math.max(25, this.stats.temperature - realDelta * 6.0);
    }

    // Diegetic armor update: Spine Coolant Tubes color transition
    // Cyan (<40°C) -> Amber (40-75°C) -> Fiery Red/White (>75°C)
    const heatRatio = (this.stats.temperature - 25) / 75;
    const spineColor = new THREE.Color();
    if (heatRatio < 0.5) {
      spineColor.lerpColors(new THREE.Color(0x00ffff), new THREE.Color(0xf59e0b), heatRatio * 2);
    } else {
      spineColor.lerpColors(new THREE.Color(0xf59e0b), new THREE.Color(0xff0044), (heatRatio - 0.5) * 2);
    }

    this.hero.spineTubes.forEach((tube) => {
      const mat = tube.material as THREE.MeshStandardMaterial;
      mat.color.copy(spineColor);
      mat.emissive.copy(spineColor);
      mat.emissiveIntensity = 0.8 + heatRatio * 1.5;
    });

    // Diegetic Bus-Blade Crystal Glow (charge indicator)
    const crystalMat = this.hero.bladeCrystal.material as THREE.MeshStandardMaterial;
    crystalMat.emissiveIntensity = 0.5 + this.stats.bladeCharge * 2.5;

    // 2. Combo Timer Decay
    if (this.stats.comboTimer > 0) {
      this.stats.comboTimer -= delta;
      if (this.stats.comboTimer <= 0) {
        this.stats.comboCount = 0;
      }
    }

    // Audio system dynamic BPM & intensity update
    soundEngine.updateBattleIntensity(
      this.stats.comboCount,
      this.stats.overclocked,
      this.stats.temperature / 100
    );

    // 3. Player Movement & Physics
    const moveSpeed = (this.stats.overclocked ? 16.0 : 8.5);
    const moveDir = new THREE.Vector3();

    // Calculate forward & right relative to camera yaw
    const camForward = new THREE.Vector3(-Math.sin(this.mouseLook.yaw), 0, -Math.cos(this.mouseLook.yaw));
    const camRight = new THREE.Vector3(Math.cos(this.mouseLook.yaw), 0, -Math.sin(this.mouseLook.yaw));

    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveDir.add(camForward);
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveDir.sub(camForward);
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveDir.add(camRight);
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveDir.sub(camRight);

    if (moveDir.lengthSq() > 0.001) {
      moveDir.normalize();
      this.playerVelocity.x = moveDir.x * moveSpeed;
      this.playerVelocity.z = moveDir.z * moveSpeed;

      // Face direction of movement
      const targetAngle = Math.atan2(-moveDir.x, -moveDir.z);
      this.playerRotation = THREE.MathUtils.damp(this.playerRotation, targetAngle, 12, delta);
    } else {
      this.playerVelocity.x *= 0.85;
      this.playerVelocity.z *= 0.85;
    }

    // Jump / Gravity
    if (this.keys['Space'] && this.isGrounded) {
      this.playerVelocity.y = 8.5;
      this.isGrounded = false;
    }

    if (!this.isGrounded) {
      this.playerVelocity.y += -22.0 * delta;
    }

    // Apply Velocity
    this.playerPos.addScaledVector(this.playerVelocity, delta);

    // Floor collision
    if (this.playerPos.y <= 0) {
      this.playerPos.y = 0;
      this.playerVelocity.y = 0;
      this.isGrounded = true;
    }

    // Arena boundary clamp (23m radius)
    const distFromCenter = Math.sqrt(this.playerPos.x * this.playerPos.x + this.playerPos.z * this.playerPos.z);
    if (distFromCenter > 23.5) {
      const angle = Math.atan2(this.playerPos.z, this.playerPos.x);
      this.playerPos.x = Math.cos(angle) * 23.5;
      this.playerPos.z = Math.sin(angle) * 23.5;
    }

    // Update Enes 3D model transform
    this.hero.group.position.copy(this.playerPos);
    this.hero.group.rotation.y = this.playerRotation;

    // Sword Slash Animation
    if (this.isSlashing) {
      this.slashTimer -= delta;
      const progress = 1 - this.slashTimer / 0.28;
      this.hero.bladeGroup.rotation.x = 0.5 + Math.sin(progress * Math.PI) * 1.8;
      this.hero.bladeGroup.rotation.z = Math.cos(progress * Math.PI) * 1.2;
      if (this.slashTimer <= 0) {
        this.isSlashing = false;
        this.hero.bladeGroup.rotation.set(0.5, 0, 0);
      }
    }

    // Cannon recoil recovery
    this.hero.leftArm.rotation.x = THREE.MathUtils.damp(this.hero.leftArm.rotation.x, 0, 10, delta);

    // 4. Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.lifetime += delta;
      b.position.addScaledVector(b.velocity, delta);
      b.mesh.position.copy(b.position);

      // Check hit against enemies
      let hit = false;
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (b.position.distanceTo(e.position) <= 1.8) {
          hit = true;
          e.health -= b.damage;
          this.slicing.spawnElectricalSparks(b.position, 15);

          if (b.isNullPointer) {
            // Null pointer instant digital explosion & shockwave
            this.slicing.sliceEnemy(e.mesh, b.position, Math.random() * Math.PI, 12.0);
          }

          if (e.health <= 0) {
            this.killEnemy(e, j);
          }
          break;
        }
      }

      if (hit || b.lifetime > 1.5) {
        this.scene.remove(b.mesh);
        b.mesh.geometry.dispose();
        this.bullets.splice(i, 1);
      }
    }

    // 5. Update Enemy AI & Behaviors
    this.enemies.forEach((e) => {
      if (e.isStunned) {
        e.stunTimer -= delta;
        if (e.stunTimer <= 0) e.isStunned = false;
        return;
      }

      _diff.subVectors(this.playerPos, e.position);
      const dist = _diff.length();
      _diff.y = 0;
      _diff.normalize();

      // Look at player
      const targetAngle = Math.atan2(_diff.x, _diff.z);
      e.mesh.rotation.y = THREE.MathUtils.damp(e.mesh.rotation.y, targetAngle, 8, delta);

      if (e.type === 'guardian') {
        // Heavy advance with shield
        if (dist > 3.0) {
          e.position.addScaledVector(_diff, e.speed * delta);
        } else {
          // Shield slam attack
          e.attackCooldown -= delta;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 2.0;
            this.damagePlayer(15);
          }
        }
      } else if (e.type === 'assassin') {
        // Agile flanking / stealth blink
        if (dist > 2.5) {
          // Circle around Enes
          const flankDir = new THREE.Vector3(-_diff.z, 0, _diff.x);
          e.position.addScaledVector(_diff.addScaledVector(flankDir, 0.5).normalize(), e.speed * delta);
        } else {
          e.attackCooldown -= delta;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 1.2;
            this.damagePlayer(20);
          }
        }
      } else if (e.type === 'swarm') {
        // Fast kamikaze dive
        e.position.addScaledVector(_diff, e.speed * delta);
        if (dist < 1.6) {
          this.damagePlayer(25);
          // Explode on hit
          this.slicing.spawnElectricalSparks(e.position, 25);
          e.health = 0;
        }
      } else if (e.type === 'worm') {
        // Serpentine undulating motion
        e.position.addScaledVector(_diff, e.speed * delta);
        if (e.segments) {
          e.segments.forEach((seg, sIdx) => {
            seg.position.x = Math.sin(Date.now() * 0.008 + sIdx * 0.8) * 0.4;
          });
        }
        if (dist < 2.0) {
          e.attackCooldown -= delta;
          if (e.attackCooldown <= 0) {
            e.attackCooldown = 1.5;
            this.damagePlayer(18);
          }
        }
      } else if (e.type === 'boss') {
        // The Rogue Kernel Boss: rotate rings & hover
        e.position.addScaledVector(_diff, e.speed * 0.6 * delta);
        e.attackCooldown -= delta;
        if (e.attackCooldown <= 0) {
          e.attackCooldown = 3.0;
          // Spawn laser sweep or mini swarms
          this.damagePlayer(30);
          this.slicing.spawnElectricalSparks(this.playerPos, 20);
        }
      }

      e.mesh.position.copy(e.position);
    });

    // 6. Update Arena Animated Props (turbines, trains, colosseum pillars)
    if (this.currentArenaEnv) {
      const time = performance.now() * 0.001;
      this.currentArenaEnv.animatedProps.forEach((prop) => prop.update(time, delta));

      // Arena Hazard Check
      this.currentArenaEnv.hazardZones.forEach((hz) => {
        if (this.playerPos.distanceTo(hz.center) < hz.radius) {
          this.damagePlayer(hz.damage * delta);
        }
      });
    }

    // 7. Update Slicing Engine (Physics debris, bouncing limbs, and coolant spurts)
    this.slicing.update(delta, (debrisPos, debrisDamage) => {
      // Secondary kinetic damage if severed robot limb hits another enemy
      this.enemies.forEach((enemy) => {
        if (enemy.position.distanceTo(debrisPos) < 1.5) {
          enemy.health -= debrisDamage * delta;
        }
      });
    });

    // 8. 3rd-Person Cyber-Kinetic Camera Follow
    const camDist = 6.8;
    const camHeight = 3.2;
    const camX = this.playerPos.x + Math.sin(this.mouseLook.yaw) * camDist;
    const camZ = this.playerPos.z + Math.cos(this.mouseLook.yaw) * camDist;
    const camY = this.playerPos.y + camHeight + this.mouseLook.pitch * 3.0;

    this.camera.position.set(camX, camY, camZ);
    _camTarget.copy(this.playerPos).add(new THREE.Vector3(0, 1.6, 0));
    this.camera.lookAt(_camTarget);

    // Keep lights centered around player
    this.keyLight.position.set(this.playerPos.x + 15, this.playerPos.y + 25, this.playerPos.z + 15);
    this.keyLight.target = this.hero.group;

    // Render frame
    this.renderer.render(this.scene, this.camera);
  }

  public damagePlayer(amount: number) {
    this.stats.health = Math.max(0, this.stats.health - amount);
    this.stats.visorCracks = Math.min(1.0, this.stats.visorCracks + amount * 0.025);
    soundEngine.playVisorDamage();

    if (this.onStatsUpdate) this.onStatsUpdate({ ...this.stats });
  }

  public resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public dispose() {
    this.slicing.dispose();
    this.renderer.dispose();
  }
}
