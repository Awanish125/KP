'use client';
import { useEffect } from 'react';

interface DustParticlesProps {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  side: 'left' | 'right';
}

export default function DustParticles({ canvasRef }: DustParticlesProps) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;
    const particles: Particle[] = [];

    function resize() {
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function spawn(): Particle {
      const side = Math.random() < 0.5 ? 'left' : 'right';
      const cx   = window.innerWidth / 2;
      return {
        x:     side === 'left'
                 ? Math.random() * cx
                 : cx + Math.random() * cx,
        y:     window.innerHeight + Math.random() * 60,
        vx:    (Math.random() - 0.5) * 0.4,
        vy:    -(0.3 + Math.random() * 0.6),
        size:  0.8 + Math.random() * 1.6,
        alpha: 0.15 + Math.random() * 0.35,
        side,
      };
    }

    resize();
    for (let i = 0; i < 60; i++) {
      const p = spawn();
      p.y = Math.random() * window.innerHeight; // start scattered
      particles.push(p);
    }

    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const p of particles) {
        p.x  += p.vx;
        p.y  += p.vy;
        p.alpha -= 0.0005;

        if (p.y < -10 || p.alpha <= 0) {
          Object.assign(p, spawn());
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.side === 'left'
          ? `rgba(21,85,194,${p.alpha})`
          : `rgba(245,130,31,${p.alpha})`;
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    draw();
    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
    };
  }, [canvasRef]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position:      'absolute',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        1,
      }}
    />
  );
}
