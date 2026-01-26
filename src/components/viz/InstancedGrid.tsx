"use client";

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";


interface InstancedGridProps {
  data: number[][]; // 2D array of values
  position: [number, number, number];
  color?: string;
  horizontalSpacing?: number;
  verticalSpacing?: number;
  cellSize?: number;
}

export function InstancedGrid({ 
  data, 
  position, 
  color = "#4ade80", 
  horizontalSpacing = 0.6, 
  verticalSpacing = 0.6,
  cellSize = 0.5 
}: InstancedGridProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const rows = data.length;
  const cols = data[0]?.length || 0;
  const count = rows * cols;
  
  // Base geometry and material
  // We use a BoxGeometry for the "cells"
  const geometry = useMemo(() => new THREE.BoxGeometry(cellSize, cellSize, 0.1), [cellSize]);
  // Use a material that supports instance colors
  const material = useMemo(() => new THREE.MeshStandardMaterial({ 
    color: "#ffffff", // Base white, we'll tint with instanceColor
    metalness: 0.8,
    roughness: 0.2
  }), []);

  // Temp objects for updating instances without creating new objects per frame
  const tempObj = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const baseColorObj = useMemo(() => new THREE.Color(color), [color]);

  useEffect(() => {
    if (!meshRef.current) return;

    let idx = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const val = data[r][c];
        
        // Position: center the grid around local (0,0)
        // x goes from left to right (c)
        // y goes from top to bottom (r), so we negate r
        const x = (c - cols / 2) * horizontalSpacing;
        const y = (rows / 2 - r) * verticalSpacing;
        const z = 0;

        tempObj.position.set(x, y, z);
        tempObj.updateMatrix();
        meshRef.current.setMatrixAt(idx, tempObj.matrix);

        // Color based on value magnitude
        // Interpolate: 0 -> dark, 1 -> baseColor, >1 -> brighter/white
        // Just a simple heuristic for now
        const intensity = Math.min(1.5, Math.max(0.1, Math.abs(val)));
        
        tempColor.copy(baseColorObj);
        
        // If negative, maybe tint red? The user didn't specify, but standard for weights/activations
        if (val < 0) {
             tempColor.setHSL(0.02, 0.8, 0.5); // Red
        }

        tempColor.multiplyScalar(intensity);
        meshRef.current.setColorAt(idx, tempColor);
        
        idx++;
      }
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) meshRef.current.instanceColor.needsUpdate = true;
  }, [data, rows, cols, horizontalSpacing, verticalSpacing, tempObj, tempColor, baseColorObj]);

  return (
    <instancedMesh 
      ref={meshRef} 
      args={[geometry, material, count]} 
      position={position}
    />
  );
}
