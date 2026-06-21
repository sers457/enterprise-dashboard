import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';

function CubeInner({ value = 85 }: { value?: number }) {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((_, delta) => {
    meshRef.current.rotation.x += delta * 0.3;
    meshRef.current.rotation.y += delta * 0.5;
  });

  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  return (
    <group>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 1.5, 1.5]} />
        {colors.map((color, i) => (
          <meshStandardMaterial key={i} attach={`material-${i}`} color={color} transparent opacity={0.8} />
        ))}
      </mesh>
      <Text
        position={[0, 0, 0.8]}
        fontSize={0.4}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {value}%
      </Text>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1} />
    </group>
  );
}

export function AnimatedKPICube({ value = 85 }: { value?: number }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 4], fov: 50 }}
      style={{ width: '100%', height: '300px' }}
      gl={{ antialias: true, alpha: true }}
    >
      <CubeInner value={value} />
    </Canvas>
  );
}
