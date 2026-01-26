"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, Environment } from "@react-three/drei";
import { SingleNeuronViz } from "@/components/viz/SingleNeuron";
import { MatMulViz } from "@/components/viz/MatMulViz";
import { TransformerTowerViz } from "@/components/viz/TransformerTower";
import { useState } from "react";


export default function Home() {
  return (
    <main className="w-full h-screen bg-zinc-950 relative overflow-hidden">
      <SceneSelector />
    </main>
  );
}

function SceneSelector() {
  const [mode, setMode] = useState<"neuron" | "matmul" | "tower">("neuron");
  
  return (
    <>
      <div className="absolute top-0 left-0 w-full p-6 z-10 pointer-events-none flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
            Need 4 Attention
          </h1>
          <p className="text-zinc-400 mt-1 max-w-md">
            Interactive Deep Learning Exploration.
          </p>
        </div>
        <div className="text-right pointer-events-auto flex gap-2">
           <button 
             onClick={() => setMode("neuron")}
             className={`px-4 py-2 rounded-lg backdrop-blur text-sm border transition-all ${
               mode === "neuron" ? "bg-blue-500/20 border-blue-500 text-blue-200" : "bg-white/10 border-white/5 text-white hover:bg-white/20"
             }`}
           >
            1. Single Neuron
          </button>
           <button 
             onClick={() => setMode("matmul")}
             className={`px-4 py-2 rounded-lg backdrop-blur text-sm border transition-all ${
               mode === "matmul" ? "bg-purple-500/20 border-purple-500 text-purple-200" : "bg-white/10 border-white/5 text-white hover:bg-white/20"
             }`}
           >
            2. Matrix Multiplication
          </button>
           <button 
             onClick={() => setMode("tower")}
             className={`px-4 py-2 rounded-lg backdrop-blur text-sm border transition-all ${
               mode === "tower" ? "bg-green-500/20 border-green-500 text-green-200" : "bg-white/10 border-white/5 text-white hover:bg-white/20"
             }`}
           >
            3. The Tower
          </button>
        </div>
      </div>

      <Canvas camera={{ position: [0, 5, 15], fov: 45 }}>
        <color attach="background" args={["#0a0a0a"]} />
        <fog attach="fog" args={["#0a0a0a", 5, 20]} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <Environment preset="city" />
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <group position={[0, 0, 0]}>
           {mode === "neuron" && <SingleNeuronViz />}
           {mode === "matmul" && <MatMulViz />}
           {mode === "tower" && <TransformerTowerViz />}
        </group>

        <OrbitControls makeDefault target={[0, 4, 0]} />
      </Canvas>

    </>
  );
}
