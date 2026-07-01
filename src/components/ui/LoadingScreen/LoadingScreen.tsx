'use client';
import { useRef } from 'react';
import LeftPanel    from './LeftPanel';
import RightPanel   from './RightPanel';
import CenterGlow   from './CenterGlow';
import Logo         from './Logo';
import LoaderText   from './LoaderText';
import DustParticles from './DustParticles';
import { useLoadingAnimation } from './useLoadingAnimation';
import './loading.css';

export function LoadingScreen() {
  const overlayRef    = useRef<HTMLDivElement>(null);
  const cameraRef     = useRef<HTMLDivElement>(null);
  const leftPanelRef  = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const seamRef       = useRef<HTMLDivElement>(null);
  const logoRef       = useRef<HTMLDivElement>(null);
  const titleRef      = useRef<HTMLDivElement>(null);
  const subtitleRef   = useRef<HTMLDivElement>(null);
  const canvasRef     = useRef<HTMLCanvasElement>(null);

  useLoadingAnimation({
    overlay:    overlayRef,
    camera:     cameraRef,
    leftPanel:  leftPanelRef,
    rightPanel: rightPanelRef,
    seam:       seamRef,
    logo:       logoRef,
    title:      titleRef,
    subtitle:   subtitleRef,
  });

  return (
    <div
      ref={overlayRef}
      style={{
        position:  'fixed',
        inset:     0,
        zIndex:    9999,
        background: '#000',
        overflow:  'hidden',
        contain:   'layout paint',
      }}
    >
      {/* Camera layer — entire overlay can be transformed for zoom effects */}
      <div
        ref={cameraRef}
        style={{
          position:        'absolute',
          inset:           0,
          willChange:      'transform',
          transformOrigin: 'center center',
        }}
      >
        <div className="grain-overlay" />
        <LeftPanel    ref={leftPanelRef} />
        <RightPanel   ref={rightPanelRef} />
        <DustParticles canvasRef={canvasRef} />
        <CenterGlow   ref={seamRef} />
      </div>

      {/* Brand elements — outside camera so they don't move with it */}
      <Logo ref={logoRef} />
      <LoaderText titleRef={titleRef} subtitleRef={subtitleRef} />
    </div>
  );
}
