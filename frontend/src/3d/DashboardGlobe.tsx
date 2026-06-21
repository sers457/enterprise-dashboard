import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, Line } from '@react-three/drei';
import * as THREE from 'three';

function GlobeInner() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const linesRef = useRef<THREE.Group>(null!);

  useFrame((_, delta) => {
    meshRef.current.rotation.y += delta * 0.15;
    if (linesRef.current) {
      linesRef.current.rotation.y += delta * 0.15;
    }
  });

  const dots = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 100; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.1;
      arr.push({
        pos: [r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi)],
        color: new THREE.Color().setHSL(0.65 + Math.random() * 0.2, 0.8, 0.6),
        size: 0.04 + Math.random() * 0.04,
      });
    }
    return arr;
  }, []);

  const arcs = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 15; i++) {
      const theta1 = Math.random() * Math.PI * 2;
      const phi1 = Math.acos(2 * Math.random() - 1);
      const theta2 = Math.random() * Math.PI * 2;
      const phi2 = Math.acos(2 * Math.random() - 1);
      const r = 2.1;
      const p1 = new THREE.Vector3(r * Math.sin(phi1) * Math.cos(theta1), r * Math.sin(phi1) * Math.sin(theta1), r * Math.cos(phi1));
      const p2 = new THREE.Vector3(r * Math.sin(phi2) * Math.cos(theta2), r * Math.sin(phi2) * Math.sin(theta2), r * Math.cos(phi2));
      const mid = p1.clone().add(p2).multiplyScalar(0.5).normalize().multiplyScalar(r * 1.6);
      const points = [
        p1.clone(),
        p1.clone().lerp(mid, 0.3),
        mid.clone(),
        p2.clone().lerp(mid, 0.3),
        p2.clone(),
      ];
      arr.push(points);
    }
    return arr;
  }, []);

  return (
    <group>
      <Sphere ref={meshRef} args={[2, 64, 64]}>
        <meshPhongMaterial
          color="#1a1a3e"
          emissive="#2a1a5e"
          emissiveIntensity={0.2}
          wireframe={false}
          transparent
          opacity={0.9}
        />
      </Sphere>
      <group ref={linesRef}>
        {dots.map((dot, i) => (
          <mesh key={i} position={dot.pos as [number, number, number]}>
            <sphereGeometry args={[dot.size, 8, 8]} />
            <meshBasicMaterial color={dot.color} />
          </mesh>
        ))}
        {arcs.map((arcPoints, i) => (
          <Line
            key={i}
            points={arcPoints}
            color="#6366f1"
            lineWidth={0.5}
            transparent
            opacity={0.3}
          />
        ))}
      </group>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </group>
  );
}

export function DashboardGlobe() {
  return (
    <Canvas
      camera={{ position: [0, 0, 6], fov: 45 }}
      style={{ width: '100%', height: '400px' }}
      gl={{ antialias: true, alpha: true }}
    >
      <GlobeInner />
    </Canvas>
  );
}
