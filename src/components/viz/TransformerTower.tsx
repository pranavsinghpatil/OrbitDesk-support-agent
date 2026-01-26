"use client";

import { useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import { InstancedGrid } from "./InstancedGrid";
import * as THREE from "three";
import { Text } from "@react-three/drei";

export function TransformerTowerViz() {
  // We will simulate a "Residual Stream" flowing upwards.
  // Layer 1: Attention Output
  // Layer 2: MLP Output
  // The Residual Stream is the trunk.
  
  // Generate some dummy data that changes over time
  const [tick, setTick] = useState(0);

  useFrame((state) => {
    // Throttle updates for visual clarity
    const t = Math.floor(state.clock.elapsedTime * 4); 
    if (t !== tick) setTick(t);
  });

  const streamWidth = 8; // Embedding Dimension
  const streamLength = 1; // Just 1 token for this view, or sequence length? 
                          // Let's visualize the vector state at one position.
  
  const generateLayerData = useCallback((offset: number) => {
      // Create a 1 x D vector
      const vec = [];
      const row = [];
      for(let i=0; i<streamWidth; i++) {
          // Sine wave pattern moving through
          row.push(Math.sin(i * 0.5 + offset + tick * 0.1) + (Math.random() * 0.2));
      }
      vec.push(row);
      return vec;
  }, [tick, streamWidth]);


  const inputEmbedding = useMemo(() => generateLayerData(0), [generateLayerData]);
  const attnOutput = useMemo(() => generateLayerData(1), [generateLayerData]);
  const mlpOutput = useMemo(() => generateLayerData(2), [generateLayerData]);
  const finalState = useMemo(() => generateLayerData(3), [generateLayerData]);


  return (
    <group position={[0, -2, 0]}>
        {/* The Residual Stream "Spine" */}
        <mesh position={[0, 4, -1]}>
            <cylinderGeometry args={[0.2, 0.2, 14, 8]} />
            <meshStandardMaterial color="#333" transparent opacity={0.5} />
        </mesh>

        {/* Layer 0: Input Embedding */}
        <group position={[0, 0, 0]}>
             <InstancedGrid data={inputEmbedding} position={[0, 0, 0]} color="#3b82f6" />
             <Text position={[-3, 0, 0]} fontSize={0.4}>Input Embedding</Text>
             <Text position={[0, 0.5, 0]} fontSize={0.3} color="gray">+</Text>
        </group>

        {/* Layer 1: Attention Block */}
        <group position={[0, 3, 0]}>
             {/* The "Addition" to the stream */}
             <InstancedGrid data={attnOutput} position={[2, 0, 0]} color="#a855f7" />
             <Text position={[-3, 0, 0]} fontSize={0.4}>Attention Output</Text>
             <Text position={[0, 0, 0]} fontSize={0.5} color="white">⊕</Text>
             
             {/* Connection lines from stream to block and back? */}
             <Line start={[0, -1.5, 0]} end={[2, 0, 0]} color="#555" />
             <Line start={[2, 0, 0]} end={[0, 1.5, 0]} color="#a855f7" />
        </group>

        {/* Layer 2: MLP Block */}
        <group position={[0, 6, 0]}>
             <InstancedGrid data={mlpOutput} position={[-2, 0, 0]} color="#f97316" />
             <Text position={[3, 0, 0]} fontSize={0.4}>MLP Output</Text>
             <Text position={[0, 0, 0]} fontSize={0.5} color="white">⊕</Text>
             
             <Line start={[0, -1.5, 0]} end={[-2, 0, 0]} color="#555" />
             <Line start={[-2, 0, 0]} end={[0, 1.5, 0]} color="#f97316" />
        </group>

        {/* Layer 3: Final Norm / Output */}
        <group position={[0, 9, 0]}>
             <InstancedGrid data={finalState} position={[0, 0, 0]} color="#22c55e" />
             <Text position={[-3, 0, 0]} fontSize={0.4}>Final State</Text>
        </group>

    </group>
  );
}

function Line({ start, end, color }: { start: [number, number, number], end: [number, number, number], color: string }) {
    const points = useMemo(() => [new THREE.Vector3(...start), new THREE.Vector3(...end)], [start, end]);
    const lineGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);
    
    return (
        <line>
            <primitive object={lineGeo} attach="geometry" />
            <lineBasicMaterial attach="material" color={color} />
        </line>
    );
}

