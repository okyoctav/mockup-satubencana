'use client';

import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function InteractiveParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const count = 1800;

  // Generate random positions, sizes, and colors for particles
  const { positions, colors, sizes } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);

    // Dark-themed palette with neon accents
    const palette = [
      new THREE.Color('#35a7ff'), // Electric blue
      new THREE.Color('#38618c'), // Slate blue
      new THREE.Color('#ff7f11'), // Coral orange accent
      new THREE.Color('#0ea5e9'), // Sky cyan
      new THREE.Color('#ffffff'), // White star
    ];

    for (let i = 0; i < count; i++) {
      // Create a spherical distribution for a neat cosmic cluster feel
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      const distance = 5 + Math.random() * 18;

      positions[i * 3] = distance * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = distance * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = distance * Math.cos(phi);

      const color = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = 0.05 + Math.random() * 0.12;
    }

    return { positions, colors, sizes };
  }, []);

  useFrame((state) => {
    if (!pointsRef.current) return;

    const { clock, mouse } = state;
    const time = clock.getElapsedTime();

    // Base continuous rotation
    const baseRotationY = time * 0.015;
    const baseRotationX = Math.sin(time * 0.01) * 0.05;

    // React to mouse movement by lerping to target values
    const targetX = baseRotationX + mouse.y * 0.15;
    const targetY = baseRotationY + mouse.x * 0.15;

    pointsRef.current.rotation.x = THREE.MathUtils.lerp(pointsRef.current.rotation.x, targetX, 0.05);
    pointsRef.current.rotation.y = THREE.MathUtils.lerp(pointsRef.current.rotation.y, targetY, 0.05);
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[colors, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.65}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function FloatingConstellations() {
  const lineRef = useRef<THREE.LineSegments>(null);

  const { points, nodes } = useMemo(() => {
    const nodeCount = 35;
    const nodes: THREE.Vector3[] = [];
    const points: THREE.Vector3[] = [];

    // Place key structural nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 24,
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 10
        )
      );
    }

    // Connect nodes close to each other
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 5.5) {
          points.push(nodes[i], nodes[j]);
        }
      }
    }

    return { points, nodes };
  }, []);

  const geometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame((state) => {
    if (!lineRef.current) return;
    const { clock, mouse } = state;
    const time = clock.getElapsedTime();

    // Rotation responds slightly to mouse position
    const targetX = Math.sin(time * 0.015) * 0.05 + mouse.y * 0.08;
    const targetY = time * 0.01 + mouse.x * 0.08;

    lineRef.current.rotation.x = THREE.MathUtils.lerp(lineRef.current.rotation.x, targetX, 0.05);
    lineRef.current.rotation.y = THREE.MathUtils.lerp(lineRef.current.rotation.y, targetY, 0.05);
  });

  return (
    <lineSegments ref={lineRef} geometry={geometry}>
      <lineBasicMaterial
        color="#35a7ff"
        transparent
        opacity={0.12}
        blending={THREE.AdditiveBlending}
      />
    </lineSegments>
  );
}

export default function LoginBackground() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        background: 'radial-gradient(circle at center, #0B192C 0%, #000411 100%)',
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        gl={{ antialias: true }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 5]} intensity={0.4} />
        <InteractiveParticles />
        <FloatingConstellations />
      </Canvas>
    </div>
  );
}
