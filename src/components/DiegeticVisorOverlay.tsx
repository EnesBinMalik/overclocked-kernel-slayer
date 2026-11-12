import React from 'react';
import { PlayerStats } from '../engine/types';

interface VisorOverlayProps {
  stats: PlayerStats;
  isBulletTime: boolean;
  isOverclocked: boolean;
}

export const DiegeticVisorOverlay: React.FC<VisorOverlayProps> = ({
  stats,
  isBulletTime,
  isOverclocked,
}) => {
  const crackOpacity = Math.min(1.0, stats.visorCracks);
  const heatRatio = (stats.temperature - 25) / 75;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-10 select-none">
      {/* Bullet-Time Chromatic Lens Distortion Effect */}
      {isBulletTime && (
        <div className="absolute inset-0 bg-cyan-950/20 mix-blend-screen transition-opacity duration-200">
          <div className="absolute top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded bg-cyan-950/80 border border-cyan-400/60 text-cyan-300 font-mono text-xs tracking-widest uppercase">
            CLOCK CYCLE SLOWDOWN // 0.18x BULLET-TIME ACTIVE (*ptr = &Enes)
          </div>
        </div>
      )}

      {/* Overclock Thermal Vignette Glow */}
      {isOverclocked && (
        <div
          className="absolute inset-0 transition-opacity duration-300 pointer-events-none"
          style={{
            boxShadow: `inset 0 0 ${40 + heatRatio * 80}px ${
              heatRatio > 0.6 ? 'rgba(239, 68, 68, 0.45)' : 'rgba(245, 158, 11, 0.35)'
            }`,
          }}
        />
      )}

      {/* Realistic Diegetic Visor Micro-Cracks (Appears only upon taking damage) */}
      {crackOpacity > 0.05 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300"
          style={{ opacity: crackOpacity }}
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
        >
          {/* Top-Right Helmet Impact Fracture */}
          <path
            d="M 980 20 L 890 85 L 820 70 L 760 130 L 710 115 M 890 85 L 860 145 L 800 170 M 820 70 L 835 30"
            fill="none"
            stroke="#38bdf8"
            strokeWidth="1.8"
            className="visor-crack-path"
          />
          {/* Bottom-Left Fracture */}
          <path
            d="M 20 580 L 110 510 L 170 525 L 230 460 M 110 510 L 130 440 L 190 410"
            fill="none"
            stroke="#00f0ff"
            strokeWidth="1.5"
            className="visor-crack-path"
          />
        </svg>
      )}

      {/* Minimal Diegetic Cyber Crosshair Reticle */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
        <div className="absolute w-8 h-8 border border-cyan-500/30 rounded-full" />
        <div className="absolute -top-3 w-0.5 h-1.5 bg-cyan-400/60" />
        <div className="absolute -bottom-3 w-0.5 h-1.5 bg-cyan-400/60" />
        <div className="absolute -left-3 h-0.5 w-1.5 bg-cyan-400/60" />
        <div className="absolute -right-3 h-0.5 w-1.5 bg-cyan-400/60" />
      </div>

      {/* Tactical Combo Flash (when striking) */}
      {stats.comboCount > 1 && (
        <div className="absolute top-16 right-10 flex flex-col items-end font-mono">
          <div className="text-4xl font-extrabold text-cyan-400 tracking-tighter drop-shadow-[0_0_12px_rgba(0,240,255,0.8)] font-orbitron">
            {stats.comboCount}x
          </div>
          <div className="text-[10px] tracking-widest text-neutral-400 uppercase">
            CYCLE COMBO BURST
          </div>
        </div>
      )}
    </div>
  );
};
