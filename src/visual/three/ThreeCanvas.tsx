import { useEffect, useRef } from 'react';

export function ThreeCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let THREE: any;
    let scene: any;
    let camera: any;
    let renderer: any;
    let sphere: any;
    let animationId: number;

    const init = async () => {
      // Load Three.js from CDN
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
      script.onload = () => {
        THREE = (window as any).THREE;
        setupScene();
      };
      document.head.appendChild(script);
    };

    const setupScene = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Scene setup
      scene = new THREE.Scene();
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
      
      renderer = new THREE.WebGLRenderer({ 
        canvas: canvas, 
        alpha: true, 
        antialias: true 
      });
      renderer.setSize(w, h);
      renderer.setClearColor(0x000000, 0);

      // Create mandala texture
      const textureCanvas = document.createElement('canvas');
      textureCanvas.width = 1024;
      textureCanvas.height = 1024;
      const ctx = textureCanvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1024, 1024);
        
        // Draw mandala pattern
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.6;
        
        const cx = 512, cy = 512, r = 360;
        
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
      const geometry = new THREE.SphereGeometry(2.5, 64, 64);
      const material = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.5,
        metalness: 0.2,
        transparent: true,
        opacity: 0.8
      });
      
      sphere = new THREE.Mesh(geometry, material);
      scene.add(sphere);

      // Lighting
      scene.add(new THREE.AmbientLight(0x404040, 2));
      const light = new THREE.DirectionalLight(0x00ffff, 1.5);
      light.position.set(2, 3, 2);
      scene.add(light);

      camera.position.z = 6;

      animate();
    };

    const animate = () => {
      animationId = requestAnimationFrame(animate);
      
      if (sphere) {
        sphere.rotation.y += 0.003;
        sphere.rotation.x += 0.001;
      }
      
      if (renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    const handleResize = () => {
      if (!camera || !renderer || !canvasRef.current) return;
      
      const w = window.innerWidth;
      const h = window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    init();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      if (renderer) {
        renderer.dispose();
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
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