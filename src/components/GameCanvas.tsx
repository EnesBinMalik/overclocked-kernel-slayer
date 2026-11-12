import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { KernelSlayerGame } from '../engine/game';
import { ArenaLayerId, PlayerStats } from '../engine/types';
import { soundEngine } from '../engine/audio';

interface GameCanvasProps {
  onStatsUpdate: (stats: PlayerStats) => void;
  gameRef: React.MutableRefObject<KernelSlayerGame | null>;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({ onStatsUpdate, gameRef }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    // Detect software WebGL from GPU renderer string
    const isSoftwareGl = (() => {
      const gl = document.createElement('canvas').getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    // Initialize Game Engine
    const game = new KernelSlayerGame(canvas, isSoftwareGl, onStatsUpdate);
    gameRef.current = game;

    // RoomEnvironment procedural studio reflections (PBR standard r160+)
    const pmremGenerator = new THREE.PMREMGenerator(game.renderer);
    game.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Initial resize
    const handleResize = () => {
      if (!container) return;
      const width = container.clientWidth;
      const height = container.clientHeight;
      game.resize(width, height);
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    // Keyboard controls
    const onKeyDown = (e: KeyboardEvent) => {
      soundEngine.ensureContext();
      game.keys[e.code] = true;

      if (e.code === 'KeyQ') {
        game.triggerTeleport();
      } else if (e.code === 'KeyF' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        game.toggleOverclock();
      } else if (e.code === 'KeyE') {
        game.purgeCoolant();
      } else if (e.code === 'KeyJ') {
        game.attackSword();
      } else if (e.code === 'KeyK') {
        game.fireCompilerCannon();
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      game.keys[e.code] = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    // Mouse / Pointer Controls
    const handleMouseDown = (e: MouseEvent) => {
      soundEngine.ensureContext();
      if (!document.pointerLockElement && canvasRef.current) {
        canvasRef.current.requestPointerLock();
      }

      if (e.button === 0) {
        // Left click = Monolithic Sword
        game.attackSword();
      } else if (e.button === 2) {
        // Right click = Compiler Cannon
        e.preventDefault();
        game.fireCompilerCannon();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement === canvas) {
        const sensitivity = 0.0025;
        game.mouseLook.yaw -= e.movementX * sensitivity;
        game.mouseLook.pitch = Math.max(
          -0.4,
          Math.min(0.65, game.mouseLook.pitch + e.movementY * sensitivity)
        );
      }
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('mousemove', handleMouseMove);

    // Render Loop (with software-gl fence sync guard)
    let frameId = 0;
    let lastTime = performance.now();

    function afterDraw(cb: () => void) {
      const gl = game.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    function tick() {
      const now = performance.now();
      const delta = Math.min((now - lastTime) * 0.001, 0.05); // cap delta at 50ms
      lastTime = now;

      game.update(delta);

      if (isSoftwareGl) {
        afterDraw(tick);
      } else {
        frameId = requestAnimationFrame(tick);
      }
    }

    if (isSoftwareGl) {
      afterDraw(tick);
    } else {
      frameId = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('mousemove', handleMouseMove);
      game.dispose();
      gameRef.current = null;
    };
  }, [gameRef, onStatsUpdate]);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden select-none">
      <canvas ref={canvasRef} className="block w-full h-full cursor-crosshair touch-none" />
    </div>
  );
};
