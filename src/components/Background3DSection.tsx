// components/Background3DSection.tsx
"use client";

import React, { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere } from "@react-three/drei";
import { pointsInner, pointsOuter } from "./utils";
import { Group } from "three";

export default function Background3DSection({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-[#0B1210] py-16 text-white md:py-24">
      {/* 3D Canvas Background */}
      <div className="absolute inset-0 z-0 opacity-50 pointer-events-auto">
        <Canvas
          camera={{
            position: [10, -7.5, -5],
          }}
          style={{ height: "100%", width: "100%" }}
        >
          <OrbitControls maxDistance={20} minDistance={10} enableZoom={false} />
          <directionalLight />
          <pointLight position={[-30, 0, -30]} power={10.0} />
          <PointCircle />
        </Canvas>
      </div>

      {/* تدرج لوني خفيف فوق الخلفية لضمان قراءة النصوص بوضوح */}
      <div className="absolute inset-0 z-1 bg-gradient-to-r from-[#0B1210] via-[#0B1210]/80 to-transparent pointer-events-none" />

      {/* المحتوى (موبايل + نصوص) يظهر فوق الخلفية */}
      <div className="relative z-10 mx-auto max-w-6xl px-5">{children}</div>
    </section>
  );
}

const PointCircle = () => {
  const ref = useRef<Group | null>(null);

  useFrame(({ clock }) => {
    if (ref.current?.rotation) {
      ref.current.rotation.z = clock.getElapsedTime() * 0.05;
    }
  });

  return (
    <group ref={ref}>
      {pointsInner.map((point) => (
        <Point key={point.idx} position={point.position} color={point.color} />
      ))}
      {pointsOuter.map((point) => (
        <Point key={point.idx} position={point.position} color={point.color} />
      ))}
    </group>
  );
};

const Point = ({ position, color }: { position: number[]; color: string }) => {
  return (
    // @ts-expect-error - Vector array
    <Sphere position={position} args={[0.1, 10, 10]}>
      <meshStandardMaterial
        emissive={color}
        emissiveIntensity={0.5}
        roughness={0.5}
        color={color}
      />
    </Sphere>
  );
};