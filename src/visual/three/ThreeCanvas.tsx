import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { ErrorMonitor } from '../../core/monitoring/ErrorMonitor';

export function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Skip WebGL entirely when user prefers reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    let animationId: number;

    // Scene setup
    const scene = new THREE.Scene();
    const w = window.innerWidth;
    const h = window.innerHeight;
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      });
    } catch (err) {
      ErrorMonitor.report('webgl_failed', err instanceof Error ? err.message : 'WebGL init failed');
      return; // graceful degradation — canvas stays hidden
    }
    renderer.setSize(w, h);
    // Cap pixel ratio at 1.5 — retina has diminishing returns at 30% opacity
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);

    // Create mandala texture (drawn once on a 512px canvas — sufficient at 30% opacity)
    const textureCanvas = document.createElement('canvas');
    textureCanvas.width = 512;
    textureCanvas.height = 512;
    const ctx = textureCanvas.getContext('2d');

    if (ctx) {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, 512, 512);

      ctx.strokeStyle = '#00ffff';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.6;

      const cx = 256, cy = 256, r = 180;

      // Center circle
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();

      // 6 surrounding circles
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI * 2) / 6;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Inner rings
      ctx.globalAlpha = 0.3;
      for (let ring = 1; ring <= 3; ring++) {
        ctx.beginPath();
        ctx.arc(cx, cy, r * ring / 3, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    const texture = new THREE.CanvasTexture(textureCanvas);
    // Lower segment count — imperceptible difference at 30% opacity
    const geometry = new THREE.SphereGeometry(2.5, 32, 32);
    const material = new THREE.MeshStandardMaterial({
      map: texture,
      roughness: 0.5,
      metalness: 0.2,
      transparent: true,
      opacity: 0.8,
    });

    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Lighting
    scene.add(new THREE.AmbientLight(0x404040, 2));
    const light = new THREE.DirectionalLight(0x00ffff, 1.5);
    light.position.set(2, 3, 2);
    scene.add(light);

    camera.position.z = 6;

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      sphere.rotation.y += 0.003;
      sphere.rotation.x += 0.001;
      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      const nw = window.innerWidth;
      const nh = window.innerHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', handleResize, { passive: true });

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 1,
        opacity: 0.3,
        pointerEvents: 'none',
      }}
    />
  );
}
