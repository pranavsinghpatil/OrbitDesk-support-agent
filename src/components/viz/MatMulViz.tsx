"use client";

import { useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";

import * as THREE from "three";

interface MatrixProps {
  data: number[][];
  position: [number, number, number];
  color?: string;
  label?: string;
  highlightRow?: number | null;
  highlightCol?: number | null;
}

function Matrix({ data, position, color = "#4ade80", label, highlightRow, highlightCol }: MatrixProps) {
  const rows = data.length;
  const cols = data[0].length;
  const gap = 0.1;
  const size = 0.5;

  return (
    <group position={position}>
       {label && (
         <Text position={[0, rows * (size + gap) / 2 + 0.5, 0]} fontSize={0.5} color="white">
            {label}
         </Text>
       )}
      {data.map((row, r) =>
        row.map((val, c) => {
           const isHighlighted = (highlightRow === r) || (highlightCol === c);
           const cellColor = isHighlighted ? "#fbbf24" : color; // Amber for highlight
           
          return (
            <group key={`${r}-${c}`} position={[
              (c - cols / 2) * (size + gap),
              (rows / 2 - r) * (size + gap),
              0
            ]}>
              <mesh>
                <boxGeometry args={[size, size, 0.1]} />
                <meshStandardMaterial 
                    color={cellColor} 
                    metalness={0.8}
                    roughness={0.2}
                    emissive={cellColor}
                    emissiveIntensity={isHighlighted ? 0.5 : 0.1}
                />
              </mesh>
              <Text 
                position={[0, 0, 0.06]} 
                fontSize={0.2} 
                color="black"
                font="/fonts/Inter-Bold.ttf" // Assuming standard font or fallback
                anchorX="center" 
                anchorY="middle"
              >
                {val.toFixed(1)}
              </Text>
            </group>
          );
        })
      )}
    </group>
  );
}

export function MatMulViz() {
    // 3x2 Matrix A
    const matrixA = useMemo(() => [
        [1, 2],
        [3, 4],
        [5, 6]
    ], []);

    // 2x4 Matrix B
    const matrixB = useMemo(() => [
        [0.5, 1.0, 1.5, 2.0],
        [2.5, 3.0, 3.5, 4.0]
    ], []);

    // Result C (3x4)
    // C[i][j] = dot(A[i], B[:,j])
    // computed dynamically for highlights maybe?
    
    // Compute full C for display
    const matrixC = useMemo(() => {
        const result = [];
        for(let i=0; i<3; i++) {
            const row = [];
            for(let j=0; j<4; j++) {
                let sum = 0;
                for(let k=0; k<2; k++) {
                    sum += matrixA[i][k] * matrixB[k][j];
                }
                row.push(sum);
            }
            result.push(row);
        }
        return result;
    }, [matrixA, matrixB]);

    // Animation State
    const [targetRow, setTargetRow] = useState<number | null>(null);
    const [targetCol, setTargetCol] = useState<number | null>(null);

    useFrame(({ clock }) => {
        const t = clock.getElapsedTime();
        // Cycle through calculations every 2 seconds
        const totalCells = 3 * 4;
        const step = Math.floor(t) % totalCells;
        
        const r = Math.floor(step / 4);
        const c = step % 4;
        
        setTargetRow(r);
        setTargetCol(c);
    });

    return (
        <group scale={0.8}>
            {/* Matrix A (Left) */}
            <Matrix 
                data={matrixA} 
                position={[-4, 0, 0]} 
                label="Inputs (A)" 
                color="#60a5fa"
                highlightRow={targetRow}
            />

            {/* Matrix B (Top, conceptually, but displayed to right for visual flow) */}
            {/* Actually standard viz puts B next to A. Let's stack them or put side-by-side */}
            <Matrix 
                data={matrixB} 
                position={[0, 2, 0]} 
                label="Weights (B)" 
                color="#c084fc"
                highlightCol={targetCol}
            />
            
            <Text position={[-2, 1, 0]} fontSize={1} color="white">×</Text>

            <Text position={[2, 1, 0]} fontSize={1} color="white">=</Text>

            {/* Matrix C (Result) */}
            <Matrix 
                data={matrixC} 
                position={[5, 0, 0]} 
                label="Output (C)" 
                color="#4ade80"
                highlightRow={targetRow}
                highlightCol={targetCol}
            />
            
            {/* Visual cues lines connecting? Too messy for now, highlights are good start */}
        </group>
    );
}
