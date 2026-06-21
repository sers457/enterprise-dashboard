import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const barData = [35, 55, 70, 45, 80, 60, 90, 50, 75, 65];

function BarChart3DInner() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    groupRef.current.rotation.y += delta * 0.1;
  });

  const bars = useMemo(() => {
    return barData.map((value, i) => {
      const height = (value / 100) * 3;
      const x = (i - barData.length / 2) * 0.6;
      return { x, height, value };
    });
  }, []);

  const maxHeight = 3;

  return (
    <group ref={groupRef}>
      {bars.map((bar, i) => (
        <group key={i} position={[bar.x, -1.5, 0]}>
          <mesh position={[0, bar.height / 2, 0]}>
            <boxGeometry args={[0.4, bar.height, 0.4]} />
            <meshPhysicalMaterial
              color={new THREE.Color().setHSL(0.65 - (bar.value / 100) * 0.4, 0.7, 0.5 + (bar.value / 100) * 0.2)}
              metalness={0.2}
              roughness={0.3}
              transparent
              opacity={0.85}
            />
          </mesh>
        </group>
      ))}
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 10, 5]} intensity={0.8} />
      <pointLight position={[-5, 5, -5]} intensity={0.4} />
    </group>
  );
}

export function ChartTo3D() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 50 }}
      style={{ width: '100%', height: '300px' }}
      gl={{ antialias: true, alpha: true }}
    >
      <BarChart3DInner />
    </Canvas>
  );
}
