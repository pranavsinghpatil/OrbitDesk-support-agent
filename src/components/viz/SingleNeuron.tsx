"use client";

import { useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";

interface NeuronProps {
  position: [number, number, number];
  activation?: number;
  label?: string;
  isInput?: boolean;
}

function Neuron({ position, activation = 0, label, isInput = false }: NeuronProps) {
  // Color interpolates from dim gray to bright electric blue based on activation
  const color = useMemo(() => {
    return new THREE.Color().setHSL(0.6, 1, 0.1 + activation * 0.5);
  }, [activation]);

  return (
    <group position={position}>
      <mesh>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={activation * 2}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>
      {label && (
        <Html position={[0, -0.5, 0]} center className="pointer-events-none select-none">
          <div className="text-xs font-mono text-zinc-400 bg-black/50 px-2 py-1 rounded backdrop-blur">
            {label} 
            <span className="block text-[10px] text-white font-bold">{activation.toFixed(2)}</span>
          </div>
        </Html>
      )}
    </group>
  );
}

interface ConnectionProps {
  start: [number, number, number];
  end: [number, number, number];
  weight: number;
}

function Connection({ start, end, weight }: ConnectionProps) {
  const startVec = new THREE.Vector3(...start);
  const endVec = new THREE.Vector3(...end);
  const direction = new THREE.Vector3().subVectors(endVec, startVec);
  const length = direction.length();
  
  // Midpoint for cylinder
  const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
  
  // Quaternion for rotation
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());

  // Thickness based on weight magnitude
  const thickness = Math.max(0.02, Math.abs(weight) * 0.1);
  const color = weight > 0 ? "#3b82f6" : "#ef4444"; // Blue for positive, Red for negative

  return (
    <mesh position={midPoint} quaternion={quaternion}>
      <cylinderGeometry args={[thickness, thickness, length, 8]} />
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={0.6 + Math.abs(weight) * 0.4} 
      />
    </mesh>
  );
}

export function SingleNeuronViz() {
  const [inputs, setInputs] = useState([0.2, 0.8, -0.5]);
  const [weights, setWeights] = useState([0.5, 1.2, -0.8]);
  const [bias, setBias] = useState(0.1);

  // Compute output
  const output = useMemo(() => {
    const raw = inputs.reduce((acc, val, i) => acc + val * weights[i], 0) + bias;
    // ReLU activation
    return Math.max(0, raw);
  }, [inputs, weights, bias]);

  return (
    <group>
      {/* Inputs */}
      {inputs.map((val, i) => (
        <Neuron 
          key={`input-${i}`} 
          position={[-3, (i - 1) * 2, 0]} 
          activation={val} // Just visualization
          label={`x${i}`}
          isInput
        />
      ))}

      {/* Output */}
      <Neuron 
        position={[3, 0, 0]} 
        activation={output} 
        label="y (ReLU)" 
      />

      {/* Connections with Weights */}
      {inputs.map((_, i) => (
        <Connection 
          key={`conn-${i}`}
          start={[-3, (i - 1) * 2, 0]}
          end={[3, 0, 0]}
          weight={weights[i]}
        />
      ))}
      
      {/* Controls Overlay HTML (In-scene strictly for labels, but controls should be DOM) */}
      <Html position={[0, -4, 0]} center>
         <div className="w-80 bg-zinc-900/90 p-4 rounded-xl border border-white/10 text-sm backdrop-blur-md shadow-2xl">
           <h3 className="font-bold text-white mb-2">Single Neuron Control</h3>
           <div className="space-y-4">
             {weights.map((w, i) => (
               <div key={i} className="flex flex-col gap-1">
                 <div className="flex justify-between text-xs text-zinc-400">
                   <span>Weight w{i}</span>
                   <span>{w.toFixed(2)}</span>
                 </div>
                 <input 
                   type="range" 
                   min="-2" max="2" step="0.1" 
                   value={w}
                   onChange={(e) => {
                     const newW = [...weights];
                     newW[i] = parseFloat(e.target.value);
                     setWeights(newW);
                   }}
                   className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                 />
               </div>
             ))}
             <div className="flex flex-col gap-1 pt-2 border-t border-white/10">
               <div className="flex justify-between text-xs text-zinc-400">
                   <span>Bias</span>
                   <span>{bias.toFixed(2)}</span>
               </div>
               <input 
                   type="range" 
                   min="-2" max="2" step="0.1" 
                   value={bias}
                   onChange={(e) => setBias(parseFloat(e.target.value))}
                   className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                 />
             </div>
           </div>
         </div>
      </Html>
    </group>
  );
}
