import * as THREE from 'three';
import { DebrisPiece, Particle } from './types';

// Pre-allocated math objects (Zero GC in loop)
const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();

/** Internal exposed silicon core material when a robot is sliced in two */
const slicedCoreMat = new THREE.MeshStandardMaterial({
  color: 0xff3300,
  emissive: 0xff1100,
  emissiveIntensity: 1.5,
  roughness: 0.2,
  metalness: 0.8,
});

/**
 * Real-Time Mesh Slicing & Hardware Shredding System
 * Slices enemy sub-meshes along the cut plane angle and spawns dynamic physical debris
 */
export class SlicingEngine {
  public debris: DebrisPiece[] = [];
  public particles: Particle[] = [];
  public particleGeometry: THREE.BufferGeometry;
  public particleMesh: THREE.Points;
  private particlePositions: Float32Array;
  private particleColors: Float32Array;
  private maxParticles: number = 600;

  constructor(private scene: THREE.Scene) {
    this.particlePositions = new Float32Array(this.maxParticles * 3);
    this.particleColors = new Float32Array(this.maxParticles * 3);

    this.particleGeometry = new THREE.BufferGeometry();
    this.particleGeometry.setAttribute(
      'position',
      new THREE.BufferAttribute(this.particlePositions, 3)
    );
    this.particleGeometry.setAttribute(
      'color',
      new THREE.BufferAttribute(this.particleColors, 3)
    );

    const pMat = new THREE.PointsMaterial({
      size: 0.16,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });

    this.particleMesh = new THREE.Points(this.particleGeometry, pMat);
    this.scene.add(this.particleMesh);
  }

  /**
   * Performs dynamic mesh slicing on an enemy when struck by The Bus-Blade
   * @param enemyGroup The root group of the enemy
   * @param hitPoint World position of the sword hit
   * @param slashAngle Angle of the sword swing (radians)
   * @param impulseStrength Force of the cut
   */
  public sliceEnemy(
    enemyGroup: THREE.Group,
    hitPoint: THREE.Vector3,
    slashAngle: number,
    impulseStrength: number = 8.0
  ) {
    const cutNormal = new THREE.Vector3(
      Math.cos(slashAngle),
      Math.sin(slashAngle * 0.5),
      Math.sin(slashAngle)
    ).normalize();

    // Spurt high-pressure glowing coolant & spark bursts from cut wound
    this.spawnCoolantSpurt(hitPoint, cutNormal, 35);
    this.spawnElectricalSparks(hitPoint, 25);

    // Collect meshes to slice/detach
    const meshesToSlice: THREE.Mesh[] = [];
    enemyGroup.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        meshesToSlice.push(child);
      }
    });

    // Sever each component along the cutting plane
    meshesToSlice.forEach((originalMesh) => {
      const worldPos = new THREE.Vector3();
      originalMesh.getWorldPosition(worldPos);

      // Distance from cut plane
      const delta = _v1.subVectors(worldPos, hitPoint);
      const dot = delta.dot(cutNormal);

      // Clone geometry and build severed half
      const debrisGeo = originalMesh.geometry.clone();
      const baseMat = Array.isArray(originalMesh.material)
        ? originalMesh.material[0]
        : originalMesh.material;
      const debrisMesh = new THREE.Mesh(debrisGeo, baseMat ?? slicedCoreMat);

      debrisMesh.position.copy(worldPos);
      debrisMesh.quaternion.copy(originalMesh.quaternion);
      debrisMesh.scale.copy(originalMesh.scale);

      // Impulse direction: half fly left/up, half fly right/down along cut normal
      const sign = dot >= 0 ? 1 : -1;
      const flyDir = cutNormal
        .clone()
        .multiplyScalar(sign)
        .add(new THREE.Vector3((Math.random() - 0.5) * 0.5, Math.random() * 0.8 + 0.3, (Math.random() - 0.5) * 0.5))
        .normalize();

      const velocity = flyDir.multiplyScalar(impulseStrength * (0.8 + Math.random() * 0.6));
      const rotVelocity = new THREE.Vector3(
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12
      );

      this.scene.add(debrisMesh);
      this.debris.push({
        mesh: debrisMesh,
        velocity,
        rotVelocity,
        lifetime: 0,
        maxLifetime: 4.0,
        bounceCount: 0,
        color: new THREE.Color(0x00f0ff),
      });

      // Hide original from the enemy group
      originalMesh.visible = false;
    });
  }

  /** Spawns pressurized coolant fluid spurt */
  public spawnCoolantSpurt(origin: THREE.Vector3, normal: THREE.Vector3, count: number) {
    const coolantColors = [
      new THREE.Color(0x00ffff), // Cyan coolant
      new THREE.Color(0x38bdf8), // Sky blue
      new THREE.Color(0x10b981), // Nanite green
    ];

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const color = coolantColors[Math.floor(Math.random() * coolantColors.length)];
      const vel = normal
        .clone()
        .add(new THREE.Vector3((Math.random() - 0.5) * 1.5, Math.random() * 1.5, (Math.random() - 0.5) * 1.5))
        .normalize()
        .multiplyScalar(4 + Math.random() * 6);

      this.particles.push({
        position: origin.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2, (Math.random() - 0.5) * 0.2)),
        velocity: vel,
        color,
        size: 0.18 + Math.random() * 0.15,
        alpha: 1.0,
        life: 0,
        maxLife: 0.7 + Math.random() * 0.5,
        isCoolant: true,
      });
    }
  }

  /** Spawns high-voltage electrical spark arcs */
  public spawnElectricalSparks(origin: THREE.Vector3, count: number) {
    const sparkColor = new THREE.Color(0xffe600); // Electric gold/yellow

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) break;
      const vel = new THREE.Vector3(
        (Math.random() - 0.5) * 10,
        Math.random() * 8 + 1,
        (Math.random() - 0.5) * 10
      );

      this.particles.push({
        position: origin.clone(),
        velocity: vel,
        color: sparkColor,
        size: 0.12,
        alpha: 1.0,
        life: 0,
        maxLife: 0.35 + Math.random() * 0.25,
      });
    }
  }

  /**
   * Physics step for severed robot limbs & particles
   * Checks for floor bouncing and kinematic interaction
   */
  public update(delta: number, onDebrisHitEnemy?: (pos: THREE.Vector3, damage: number) => void) {
    const gravity = -18.0;

    // 1. Update physical severed debris
    for (let i = this.debris.length - 1; i >= 0; i--) {
      const piece = this.debris[i];
      piece.lifetime += delta;

      // Gravity and air resistance
      piece.velocity.y += gravity * delta;
      piece.velocity.x *= 0.98;
      piece.velocity.z *= 0.98;

      piece.mesh.position.addScaledVector(piece.velocity, delta);
      piece.mesh.rotation.x += piece.rotVelocity.x * delta;
      piece.mesh.rotation.y += piece.rotVelocity.y * delta;
      piece.mesh.rotation.z += piece.rotVelocity.z * delta;

      // Floor bounce check (Floor is at Y = 0)
      if (piece.mesh.position.y <= 0.15) {
        piece.mesh.position.y = 0.15;
        piece.velocity.y = -piece.velocity.y * 0.45; // Elastic bounce
        piece.rotVelocity.multiplyScalar(0.7);
        piece.bounceCount++;

        // Spawn tiny spark on impact
        if (Math.abs(piece.velocity.y) > 1.5) {
          this.spawnElectricalSparks(piece.mesh.position, 4);
        }
      }

      // Check if flying debris collides with enemies
      if (onDebrisHitEnemy && piece.velocity.length() > 3.0) {
        onDebrisHitEnemy(piece.mesh.position, 15);
      }

      // Remove after lifetime expires
      if (piece.lifetime >= piece.maxLifetime) {
        this.scene.remove(piece.mesh);
        piece.mesh.geometry.dispose();
        this.debris.splice(i, 1);
      }
    }

    // 2. Update particle buffer
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life += delta;

      if (p.isCoolant) {
        p.velocity.y += -12 * delta; // Coolant drops fall
      }

      p.position.addScaledVector(p.velocity, delta);

      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // Rebuild points buffer
    const posAttr = this.particleGeometry.getAttribute('position') as THREE.BufferAttribute;
    const colAttr = this.particleGeometry.getAttribute('color') as THREE.BufferAttribute;

    const pCount = Math.min(this.particles.length, this.maxParticles);
    for (let i = 0; i < pCount; i++) {
      const p = this.particles[i];
      const i3 = i * 3;
      this.particlePositions[i3] = p.position.x;
      this.particlePositions[i3 + 1] = p.position.y;
      this.particlePositions[i3 + 2] = p.position.z;

      const fade = 1 - p.life / p.maxLife;
      this.particleColors[i3] = p.color.r * fade;
      this.particleColors[i3 + 1] = p.color.g * fade;
      this.particleColors[i3 + 2] = p.color.b * fade;
    }

    // Zero out unused slots
    for (let i = pCount; i < this.maxParticles; i++) {
      const i3 = i * 3;
      this.particlePositions[i3] = 0;
      this.particlePositions[i3 + 1] = -100;
      this.particlePositions[i3 + 2] = 0;
    }

    posAttr.needsUpdate = true;
    colAttr.needsUpdate = true;
  }

  public dispose() {
    this.debris.forEach((p) => {
      this.scene.remove(p.mesh);
      p.mesh.geometry.dispose();
    });
    this.debris = [];
    this.scene.remove(this.particleMesh);
    this.particleGeometry.dispose();
  }
}
