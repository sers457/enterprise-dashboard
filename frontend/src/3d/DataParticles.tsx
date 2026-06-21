import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';
import * as THREE from 'three';

function ParticlesInner() {
  const ref = useRef<THREE.Points>(null!);
  const count = 2000;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
    }
    return pos;
  }, []);

  const colors = useMemo(() => {
    const col = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const t = Math.random();
      col[i * 3] = 0.4 + t * 0.3;
      col[i * 3 + 1] = 0.2 + t * 0.4;
      col[i * 3 + 2] = 0.6 + t * 0.3;
    }
    return col;
  }, []);

  useFrame((_, delta) => {
    ref.current.rotation.x += delta * 0.02;
    ref.current.rotation.y += delta * 0.03;
    const positions = ref.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      positions[i * 3 + 1] += Math.sin(Date.now() * 0.001 + i) * 0.002;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3}>
      <PointMaterial
        transparent
        vertexColors
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
      <bufferAttribute attach="attributes-color" args={[colors, 3]} />
    </Points>
  );
}

export function DataParticles() {
  return (
    <Canvas
      camera={{ position: [0, 0, 8], fov: 60 }}
      style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0 }}
      gl={{ antialias: true, alpha: true }}
    >
      <ParticlesInner />
    </Canvas>
  );
}
