import { useEffect } from 'react';
import gsap from 'gsap';
import SplitType from 'split-type';

interface Refs {
  overlay:    React.RefObject<HTMLDivElement | null>;
  camera:     React.RefObject<HTMLDivElement | null>;
  leftPanel:  React.RefObject<HTMLDivElement | null>;
  rightPanel: React.RefObject<HTMLDivElement | null>;
  seam:       React.RefObject<HTMLDivElement | null>;
  logo:       React.RefObject<HTMLDivElement | null>;
  title:      React.RefObject<HTMLDivElement | null>;
  subtitle:   React.RefObject<HTMLDivElement | null>;
}

export function useLoadingAnimation(refs: Refs) {
  useEffect(() => {
    const { overlay, camera, leftPanel, rightPanel, seam, logo, title, subtitle } = refs;
    if (
      !overlay.current || !camera.current ||
      !leftPanel.current || !rightPanel.current ||
      !seam.current || !logo.current ||
      !title.current || !subtitle.current
    ) return;

    document.body.style.overflow = 'hidden';

    const split = new SplitType(title.current, { types: 'chars' });
    const chars = split.chars ?? [];

    /* Track whether 3D is ready — set before any async can fire */
    let sceneLoaded = false;
    const onSceneLoaded = () => { sceneLoaded = true; };
    window.addEventListener('kp:sceneLoaded', onSceneLoaded, { once: true });

    /* Hero starts zoomed in; animates to 1 when doors open */
    gsap.set('#s1', { scale: 1.08, transformOrigin: 'center center' });

    const tl = gsap.timeline({ defaults: { ease: 'power4.inOut' } });

    // ── ① Static initial state — doors closed, everything invisible ───────
    tl.set(leftPanel.current,  { x: '0%' })
      .set(rightPanel.current, { x: '0%' })
      .set(seam.current,       { opacity: 0 })
      .set(logo.current,       { opacity: 0, scale: 0.7, rotateY: 15 })
      .set(chars,              { opacity: 0, y: 22, willChange: 'transform, opacity' })
      .set(subtitle.current,   { opacity: 0, y: 10 });

    // ── ② WAIT — nothing plays until 3D model is fully loaded ─────────────
    tl.call(() => {
      window.removeEventListener('kp:sceneLoaded', onSceneLoaded);
      if (!sceneLoaded) {
        tl.pause();
        window.addEventListener('kp:sceneLoaded', () => tl.resume(), { once: true });
      }
    });

    // ── ③ Seam appears (first thing after 3D ready) ───────────────────────
    tl.to(seam.current, { opacity: 1, duration: 0.45, ease: 'power2.out' });

    // ── ④ Logo reveal ─────────────────────────────────────────────────────
    tl.to(logo.current, {
      opacity: 1, scale: 1, rotateY: 0, duration: 0.65, ease: 'back.out(1.4)',
    }, '+=0.05');

    tl.to(logo.current, { filter: 'brightness(1.3)', duration: 0.2 }, '+=0.1');
    tl.to(logo.current, { filter: 'brightness(1)',   duration: 0.4 });

    // ── ⑤ Title characters rise in ────────────────────────────────────────
    tl.to(chars, {
      opacity: 1, y: 0, duration: 0.5, stagger: 0.038, ease: 'power3.out',
    }, '-=0.3');

    // ── ⑥ Subtitle ────────────────────────────────────────────────────────
    tl.to(subtitle.current, {
      opacity: 1, y: 0, duration: 0.55, ease: 'power3.out',
    }, '+=0.05');

    // ── ⑦ Hold ────────────────────────────────────────────────────────────
    tl.to({}, { duration: 0.5 });

    // ── ⑧ Fade out brand + seam before doors open ─────────────────────────
    tl.to([logo.current, title.current, subtitle.current], {
      opacity: 0, y: -10, duration: 0.28, ease: 'power2.in',
    });
    tl.to(seam.current, { opacity: 0, duration: 0.2 }, '<');

    // ── ⑨ Doors open + hero zoom (simultaneous) ───────────────────────────
    tl.to(leftPanel.current,  { x: '-102%', duration: 1.35, ease: 'power4.inOut' });
    tl.to(rightPanel.current, { x:  '102%', duration: 1.35, ease: 'power4.inOut' }, '<');
    tl.to('#s1',              { scale: 1,   duration: 1.5,  ease: 'power3.out'   }, '<');

    // ── Cleanup ────────────────────────────────────────────────────────────
    tl.add(() => {
      if (overlay.current) overlay.current.style.display = 'none';
      document.body.style.overflow = '';
      document.documentElement.classList.add('page-revealed');
      window.dispatchEvent(new Event('kp:loaded'));
    });

    return () => {
      tl.kill();
      split.revert();
      document.body.style.overflow = '';
      window.removeEventListener('kp:sceneLoaded', onSceneLoaded);
      gsap.set('#s1', { clearProps: 'all' });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
