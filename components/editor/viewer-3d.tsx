'use client'

import { useRef, useMemo, Suspense, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Html,
} from '@react-three/drei'
import * as THREE from 'three'
import { useEditorStore, Room } from '@/lib/stores/editor-store'
import { RotateCcw, Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Natural, realistic room floor colors - matching professional 3D renders
const ROOM_FLOOR_COLORS: Record<string, string> = {
  'living room': '#E8DCC8',      // Warm beige wood
  living: '#E8DCC8',
  'master bedroom': '#D4C4B0',   // Light tan wood
  bedroom: '#C9B99A',            // Natural wood
  bathroom: '#E5E5E0',           // Light gray tile
  bath: '#E5E5E0',
  'en-suite': '#E5E5E0',
  toilet: '#E5E5E0',
  kitchen: '#D5CFC5',            // Light stone/tile
  'dining room': '#E0D5C5',      // Warm cream wood
  dining: '#E0D5C5',
  office: '#C9B99A',             // Natural wood
  study: '#C9B99A',
  hallway: '#D8D0C8',            // Neutral
  corridor: '#D8D0C8',
  closet: '#C5B8A8',
  laundry: '#E0E0E0',            // Light gray
  garage: '#B5B5B5',             // Concrete gray
  porch: '#C4B5A0',              // Stone
  foyer: '#D8D0C8',
  entry: '#D8D0C8',
  default: '#D5CFC8',
}

// Constants
const WALL_THICKNESS = 0.06
const WALL_HEIGHT = 0.4  // LOW walls for cutaway view

// Get room color
const getRoomFloorColor = (roomName: string): string => {
  const type = roomName.toLowerCase()
  for (const [key, color] of Object.entries(ROOM_FLOOR_COLORS)) {
    if (type.includes(key)) return color
  }
  return ROOM_FLOOR_COLORS.default
}

// ========== REALISTIC 3D FURNITURE ==========

// Modern Bed with realistic details
function Bed3D({ position, width, depth, isDouble = true }: {
  position: [number, number, number]
  width: number
  depth: number
  isDouble?: boolean
}) {
  const bedW = isDouble ? 1.6 : 1.0
  const bedL = 2.0

  return (
    <group position={position}>
      {/* Bed platform/frame - wood */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[bedW + 0.1, 0.25, bedL + 0.1]} />
        <meshStandardMaterial color="#5C4033" roughness={0.6} />
      </mesh>

      {/* Mattress - white */}
      <mesh position={[0, 0.35, 0.05]} castShadow receiveShadow>
        <boxGeometry args={[bedW, 0.2, bedL - 0.15]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.8} />
      </mesh>

      {/* Headboard - dark wood */}
      <mesh position={[0, 0.6, -bedL / 2 + 0.05]} castShadow receiveShadow>
        <boxGeometry args={[bedW + 0.1, 0.9, 0.08]} />
        <meshStandardMaterial color="#3D2914" roughness={0.5} />
      </mesh>

      {/* Pillows */}
      {isDouble ? (
        <>
          <mesh position={[-0.35, 0.5, -bedL / 2 + 0.35]} castShadow>
            <boxGeometry args={[0.5, 0.12, 0.4]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.9} />
          </mesh>
          <mesh position={[0.35, 0.5, -bedL / 2 + 0.35]} castShadow>
            <boxGeometry args={[0.5, 0.12, 0.4]} />
            <meshStandardMaterial color="#F5F5F5" roughness={0.9} />
          </mesh>
        </>
      ) : (
        <mesh position={[0, 0.5, -bedL / 2 + 0.35]} castShadow>
          <boxGeometry args={[0.7, 0.12, 0.4]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.9} />
        </mesh>
      )}

      {/* Duvet/blanket - subtle blue */}
      <mesh position={[0, 0.48, 0.35]} castShadow>
        <boxGeometry args={[bedW - 0.1, 0.08, bedL * 0.45]} />
        <meshStandardMaterial color="#7B9BAA" roughness={0.85} />
      </mesh>

      {/* Nightstands */}
      <group position={[bedW / 2 + 0.35, 0, -bedL / 2 + 0.3]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.45, 0.45, 0.4]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* Lamp */}
        <mesh position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.1, 0.25, 16]} />
          <meshStandardMaterial color="#D4AF37" roughness={0.3} metalness={0.5} />
        </mesh>
      </group>

      <group position={[-bedW / 2 - 0.35, 0, -bedL / 2 + 0.3]}>
        <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.45, 0.45, 0.4]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
      </group>
    </group>
  )
}

// Modern Wardrobe
function Wardrobe3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 1.0, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 2.0, 0.6]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
      </mesh>
      {/* Door line */}
      <mesh position={[0, 1.0, 0.31]} castShadow>
        <boxGeometry args={[0.02, 1.9, 0.02]} />
        <meshStandardMaterial color="#E0E0E0" />
      </mesh>
      {/* Handles */}
      <mesh position={[-0.05, 1.0, 0.32]} castShadow>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.05, 1.0, 0.32]} castShadow>
        <boxGeometry args={[0.02, 0.15, 0.02]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

// Modern Toilet
function Toilet3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Tank */}
      <mesh position={[0, 0.45, -0.18]} castShadow receiveShadow>
        <boxGeometry args={[0.38, 0.45, 0.18]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </mesh>
      {/* Bowl */}
      <mesh position={[0, 0.22, 0.08]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.17, 0.4, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </mesh>
      {/* Seat */}
      <mesh position={[0, 0.44, 0.05]} castShadow>
        <cylinderGeometry args={[0.2, 0.2, 0.04, 24]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.2} />
      </mesh>
    </group>
  )
}

// Modern Sink with vanity
function Sink3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Vanity cabinet */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 0.75, 0.5]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* Countertop */}
      <mesh position={[0, 0.79, 0]} castShadow>
        <boxGeometry args={[0.85, 0.04, 0.55]} />
        <meshStandardMaterial color="#E8E8E8" roughness={0.2} />
      </mesh>
      {/* Basin */}
      <mesh position={[0, 0.78, 0.05]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.1, 24]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.05} />
      </mesh>
      {/* Faucet */}
      <mesh position={[0, 0.9, -0.15]} castShadow>
        <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
      {/* Mirror */}
      <mesh position={[0, 1.4, -0.22]} castShadow>
        <boxGeometry args={[0.6, 0.8, 0.03]} />
        <meshStandardMaterial color="#B8D4E8" roughness={0.0} metalness={0.9} />
      </mesh>
    </group>
  )
}

// Modern Bathtub
function Bathtub3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.55, 0.75]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.1} />
      </mesh>
      {/* Inner basin */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.5, 0.4, 0.55]} />
        <meshStandardMaterial color="#F0F8FF" roughness={0.05} />
      </mesh>
    </group>
  )
}

// Walk-in Shower
function Shower3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Base tray */}
      <mesh position={[0, 0.03, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.06, 1.0]} />
        <meshStandardMaterial color="#E8E8E8" roughness={0.2} />
      </mesh>
      {/* Glass panel */}
      <mesh position={[0.48, 1.0, 0]} castShadow>
        <boxGeometry args={[0.02, 2.0, 1.0]} />
        <meshStandardMaterial color="#E0F0FF" transparent opacity={0.3} roughness={0.0} />
      </mesh>
      {/* Shower head */}
      <mesh position={[-0.35, 1.9, -0.35]} castShadow>
        <cylinderGeometry args={[0.1, 0.1, 0.03, 16]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.9} roughness={0.1} />
      </mesh>
    </group>
  )
}

// Modern Kitchen with island
function Kitchen3D({ position, width, depth }: {
  position: [number, number, number]
  width: number
  depth: number
}) {
  return (
    <group position={position}>
      {/* Back wall cabinets - upper */}
      <mesh position={[0, 1.6, -depth / 2 + 0.25]} castShadow receiveShadow>
        <boxGeometry args={[Math.min(width * 0.8, 3.0), 0.7, 0.35]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Base cabinets */}
      <mesh position={[0, 0.45, -depth / 2 + 0.3]} castShadow receiveShadow>
        <boxGeometry args={[Math.min(width * 0.8, 3.0), 0.85, 0.6]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* Countertop */}
      <mesh position={[0, 0.89, -depth / 2 + 0.32]} castShadow>
        <boxGeometry args={[Math.min(width * 0.8, 3.0) + 0.05, 0.04, 0.65]} />
        <meshStandardMaterial color="#404040" roughness={0.2} />
      </mesh>

      {/* Stove/Range */}
      <mesh position={[-0.5, 0.91, -depth / 2 + 0.32]} castShadow>
        <boxGeometry args={[0.6, 0.02, 0.55]} />
        <meshStandardMaterial color="#2A2A2A" roughness={0.3} />
      </mesh>
      {/* Burners */}
      {[[-0.35, -0.12], [-0.35, 0.12], [-0.65, -0.12], [-0.65, 0.12]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.93, -depth / 2 + 0.32 + z]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 0.01, 16]} />
          <meshStandardMaterial color="#1A1A1A" />
        </mesh>
      ))}

      {/* Sink area */}
      <mesh position={[0.4, 0.88, -depth / 2 + 0.35]} castShadow>
        <boxGeometry args={[0.5, 0.08, 0.4]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Refrigerator */}
      <mesh position={[width / 2 - 0.45, 0.95, -depth / 2 + 0.4]} castShadow receiveShadow>
        <boxGeometry args={[0.85, 1.85, 0.75]} />
        <meshStandardMaterial color="#E0E0E0" roughness={0.3} />
      </mesh>
      {/* Fridge handle */}
      <mesh position={[width / 2 - 0.85, 1.1, -depth / 2 + 0.79]} castShadow>
        <boxGeometry args={[0.02, 0.4, 0.02]} />
        <meshStandardMaterial color="#A0A0A0" metalness={0.8} />
      </mesh>

      {/* Kitchen Island */}
      <mesh position={[0, 0.5, 0.3]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.95, 0.7]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* Island countertop */}
      <mesh position={[0, 0.99, 0.3]} castShadow>
        <boxGeometry args={[1.5, 0.04, 0.8]} />
        <meshStandardMaterial color="#404040" roughness={0.2} />
      </mesh>

      {/* Bar stools */}
      {[-0.4, 0, 0.4].map((x, i) => (
        <group key={i} position={[x, 0, 0.85]}>
          <mesh position={[0, 0.4, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.05, 16]} />
            <meshStandardMaterial color="#2A2A2A" />
          </mesh>
          <mesh position={[0, 0.2, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            <meshStandardMaterial color="#404040" metalness={0.8} />
          </mesh>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
            <meshStandardMaterial color="#404040" metalness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

// Modern Dining Table
function DiningTable3D({ position, width, depth }: {
  position: [number, number, number]
  width: number
  depth: number
}) {
  const tableW = Math.min(width * 0.5, 1.6)
  const tableD = Math.min(depth * 0.4, 1.0)

  return (
    <group position={position}>
      {/* Table top - wood */}
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[tableW, 0.05, tableD]} />
        <meshStandardMaterial color="#8B5A2B" roughness={0.4} />
      </mesh>

      {/* Table legs */}
      {[
        [-tableW / 2 + 0.08, -tableD / 2 + 0.08],
        [tableW / 2 - 0.08, -tableD / 2 + 0.08],
        [-tableW / 2 + 0.08, tableD / 2 - 0.08],
        [tableW / 2 - 0.08, tableD / 2 - 0.08],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.37, z]} castShadow>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color="#5C4033" roughness={0.5} />
        </mesh>
      ))}

      {/* Chairs */}
      {[
        [0, -tableD / 2 - 0.35, 0],
        [0, tableD / 2 + 0.35, Math.PI],
        [-tableW / 2 - 0.35, 0, Math.PI / 2],
        [tableW / 2 + 0.35, 0, -Math.PI / 2],
      ].map(([x, z, rot], i) => (
        <group key={i} position={[x, 0, z]} rotation={[0, rot, 0]}>
          {/* Seat */}
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.45, 0.05, 0.4]} />
            <meshStandardMaterial color="#E8E0D5" roughness={0.6} />
          </mesh>
          {/* Back */}
          <mesh position={[0, 0.75, -0.18]} castShadow>
            <boxGeometry args={[0.42, 0.55, 0.04]} />
            <meshStandardMaterial color="#E8E0D5" roughness={0.6} />
          </mesh>
          {/* Legs */}
          {[[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.15], [0.18, 0.15]].map(([lx, lz], j) => (
            <mesh key={j} position={[lx, 0.22, lz]} castShadow>
              <boxGeometry args={[0.03, 0.42, 0.03]} />
              <meshStandardMaterial color="#5C4033" roughness={0.5} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

// Modern Sectional Sofa with TV
function LivingRoom3D({ position, width, depth }: {
  position: [number, number, number]
  width: number
  depth: number
}) {
  const sofaW = Math.min(width * 0.6, 2.4)

  return (
    <group position={position}>
      {/* L-shaped sectional sofa */}
      {/* Main section */}
      <mesh position={[0, 0.25, depth * 0.15]} castShadow receiveShadow>
        <boxGeometry args={[sofaW, 0.45, 0.9]} />
        <meshStandardMaterial color="#B8A99A" roughness={0.8} />
      </mesh>
      {/* Back cushion */}
      <mesh position={[0, 0.55, depth * 0.15 - 0.35]} castShadow>
        <boxGeometry args={[sofaW, 0.35, 0.25]} />
        <meshStandardMaterial color="#B8A99A" roughness={0.85} />
      </mesh>
      {/* Seat cushions */}
      <mesh position={[-sofaW / 4, 0.5, depth * 0.15 + 0.1]} castShadow>
        <boxGeometry args={[sofaW / 2 - 0.1, 0.12, 0.5]} />
        <meshStandardMaterial color="#C5B8AA" roughness={0.9} />
      </mesh>
      <mesh position={[sofaW / 4, 0.5, depth * 0.15 + 0.1]} castShadow>
        <boxGeometry args={[sofaW / 2 - 0.1, 0.12, 0.5]} />
        <meshStandardMaterial color="#C5B8AA" roughness={0.9} />
      </mesh>

      {/* Throw pillows */}
      <mesh position={[-sofaW / 2 + 0.3, 0.6, depth * 0.15 - 0.1]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.1]} />
        <meshStandardMaterial color="#7B9BAA" roughness={0.9} />
      </mesh>
      <mesh position={[sofaW / 2 - 0.3, 0.6, depth * 0.15 - 0.1]} castShadow>
        <boxGeometry args={[0.35, 0.35, 0.1]} />
        <meshStandardMaterial color="#A89080" roughness={0.9} />
      </mesh>

      {/* Coffee table - modern glass/wood */}
      <mesh position={[0, 0.2, depth * 0.15 + 0.8]} castShadow receiveShadow>
        <boxGeometry args={[1.0, 0.38, 0.5]} />
        <meshStandardMaterial color="#3D3D3D" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.4, depth * 0.15 + 0.8]} castShadow>
        <boxGeometry args={[1.05, 0.02, 0.55]} />
        <meshStandardMaterial color="#E0E8E8" roughness={0.0} transparent opacity={0.8} />
      </mesh>

      {/* TV Console */}
      <mesh position={[0, 0.25, -depth * 0.35]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.45, 0.4]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>

      {/* TV */}
      <mesh position={[0, 0.95, -depth * 0.35]} castShadow>
        <boxGeometry args={[1.4, 0.8, 0.05]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.1} />
      </mesh>
      {/* TV screen */}
      <mesh position={[0, 0.95, -depth * 0.35 + 0.03]} castShadow>
        <boxGeometry args={[1.3, 0.72, 0.01]} />
        <meshStandardMaterial color="#2A3A4A" roughness={0.05} />
      </mesh>

      {/* Area rug */}
      <mesh position={[0, 0.01, depth * 0.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[2.0, 1.5]} />
        <meshStandardMaterial color="#8B7355" roughness={0.95} />
      </mesh>

      {/* Side table with plant */}
      <group position={[sofaW / 2 + 0.4, 0, depth * 0.05]}>
        <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.55, 16]} />
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </mesh>
        {/* Plant pot */}
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.2, 16]} />
          <meshStandardMaterial color="#4A4A4A" roughness={0.7} />
        </mesh>
        {/* Plant leaves */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <sphereGeometry args={[0.2, 8, 8]} />
          <meshStandardMaterial color="#4A7A4A" roughness={0.9} />
        </mesh>
      </group>
    </group>
  )
}

// Modern Office/Study
function Office3D({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Modern desk */}
      <mesh position={[0, 0.38, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.04, 0.7]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
      </mesh>
      {/* Desk legs - metal */}
      <mesh position={[-0.6, 0.19, 0]} castShadow>
        <boxGeometry args={[0.04, 0.36, 0.6]} />
        <meshStandardMaterial color="#303030" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.6, 0.19, 0]} castShadow>
        <boxGeometry args={[0.04, 0.36, 0.6]} />
        <meshStandardMaterial color="#303030" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Monitor */}
      <mesh position={[0, 0.65, -0.15]} castShadow>
        <boxGeometry args={[0.6, 0.38, 0.03]} />
        <meshStandardMaterial color="#1A1A1A" roughness={0.1} />
      </mesh>
      <mesh position={[0, 0.65, -0.13]} castShadow>
        <boxGeometry args={[0.55, 0.33, 0.01]} />
        <meshStandardMaterial color="#2A3A4A" roughness={0.05} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.43, -0.15]} castShadow>
        <boxGeometry args={[0.08, 0.08, 0.08]} />
        <meshStandardMaterial color="#303030" metalness={0.8} />
      </mesh>

      {/* Keyboard */}
      <mesh position={[0, 0.41, 0.1]} castShadow>
        <boxGeometry args={[0.4, 0.02, 0.12]} />
        <meshStandardMaterial color="#303030" roughness={0.5} />
      </mesh>

      {/* Office chair */}
      <group position={[0, 0, 0.6]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[0.5, 0.08, 0.45]} />
          <meshStandardMaterial color="#2A2A2A" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.75, -0.2]} castShadow>
          <boxGeometry args={[0.48, 0.55, 0.06]} />
          <meshStandardMaterial color="#2A2A2A" roughness={0.6} />
        </mesh>
        {/* Chair base */}
        <mesh position={[0, 0.22, 0]} castShadow>
          <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
          <meshStandardMaterial color="#404040" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.04, 5]} />
          <meshStandardMaterial color="#404040" metalness={0.8} />
        </mesh>
      </group>

      {/* Bookshelf */}
      <group position={[-0.9, 0, -0.2]}>
        <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.4, 1.8, 0.3]} />
          <meshStandardMaterial color="#F5F5F5" roughness={0.3} />
        </mesh>
        {/* Books */}
        <mesh position={[0, 1.5, 0.02]} castShadow>
          <boxGeometry args={[0.3, 0.25, 0.2]} />
          <meshStandardMaterial color="#4A6A8A" roughness={0.8} />
        </mesh>
        <mesh position={[0, 1.1, 0.02]} castShadow>
          <boxGeometry args={[0.28, 0.22, 0.18]} />
          <meshStandardMaterial color="#8A5A4A" roughness={0.8} />
        </mesh>
      </group>
    </group>
  )
}

// Room component in 3D with furniture
function Room3D({
  room,
  wallHeight,
  scale,
  isSelected,
  onClick,
  showLabels,
  centerOffset,
}: {
  room: Room
  wallHeight: number
  scale: number
  isSelected: boolean
  onClick: () => void
  showLabels: boolean
  centerOffset: { x: number; z: number }
}) {
  // Convert 2D coordinates to 3D (center the building at origin)
  const roomWidth = room.width / scale
  const roomDepth = room.height / scale
  const posX = room.x / scale + roomWidth / 2 - centerOffset.x
  const posZ = room.y / scale + roomDepth / 2 - centerOffset.z

  const roomType = room.name.toLowerCase()
  const floorColor = getRoomFloorColor(room.type || room.name)

  return (
    <group position={[posX, 0, posZ]}>
      {/* Floor with wood/tile texture appearance */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        receiveShadow
      >
        <planeGeometry args={[roomWidth - WALL_THICKNESS, roomDepth - WALL_THICKNESS]} />
        <meshStandardMaterial color={floorColor} roughness={0.6} />
      </mesh>

      {/* LOW Walls for cutaway view - all 4 sides */}
      {/* North wall */}
      <mesh position={[0, WALL_HEIGHT / 2, -roomDepth / 2 + WALL_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[roomWidth, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#E8E4E0" roughness={0.7} />
      </mesh>

      {/* South wall */}
      <mesh position={[0, WALL_HEIGHT / 2, roomDepth / 2 - WALL_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[roomWidth, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.7} />
      </mesh>

      {/* West wall */}
      <mesh position={[-roomWidth / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, roomDepth]} />
        <meshStandardMaterial color="#E8E4E0" roughness={0.7} />
      </mesh>

      {/* East wall */}
      <mesh position={[roomWidth / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, roomDepth]} />
        <meshStandardMaterial color="#F5F5F5" roughness={0.7} />
      </mesh>

      {/* Selection highlight */}
      {isSelected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[roomWidth + 0.2, roomDepth + 0.2]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.3} />
        </mesh>
      )}

      {/* Furniture based on room type */}
      {(roomType.includes('master') || roomType.includes('bedroom')) && (
        <>
          <Bed3D
            position={[0, 0, -roomDepth * 0.15]}
            width={roomWidth}
            depth={roomDepth}
            isDouble={roomType.includes('master')}
          />
          <Wardrobe3D position={[-roomWidth / 2 + 0.7, 0, roomDepth / 2 - 0.45]} />
        </>
      )}

      {(roomType.includes('bathroom') || roomType.includes('bath') || roomType.includes('en-suite')) && (
        <>
          <Toilet3D position={[roomWidth / 2 - 0.4, 0, -roomDepth / 2 + 0.5]} />
          <Sink3D position={[-roomWidth / 2 + 0.5, 0, -roomDepth / 2 + 0.4]} />
          {roomWidth > 2 && roomDepth > 2 && (
            roomType.includes('en-suite') ? (
              <Shower3D position={[roomWidth / 2 - 0.6, 0, roomDepth / 2 - 0.6]} />
            ) : (
              <Bathtub3D position={[0, 0, roomDepth / 2 - 0.5]} />
            )
          )}
        </>
      )}

      {roomType.includes('toilet') && (
        <>
          <Toilet3D position={[0, 0, -roomDepth / 4]} />
          <Sink3D position={[0, 0, roomDepth / 4]} />
        </>
      )}

      {roomType.includes('kitchen') && (
        <Kitchen3D position={[0, 0, 0]} width={roomWidth} depth={roomDepth} />
      )}

      {roomType.includes('dining') && (
        <DiningTable3D position={[0, 0, 0]} width={roomWidth} depth={roomDepth} />
      )}

      {roomType.includes('living') && (
        <LivingRoom3D position={[0, 0, 0]} width={roomWidth} depth={roomDepth} />
      )}

      {(roomType.includes('office') || roomType.includes('study')) && (
        <Office3D position={[0, 0, 0]} />
      )}

      {/* Room label */}
      {showLabels && (
        <Html position={[0, WALL_HEIGHT + 0.5, 0]} center>
          <div className="bg-background/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-lg border border-border whitespace-nowrap">
            <p className="text-sm font-semibold">{room.name}</p>
            <p className="text-xs text-muted-foreground">{room.areaSqft} sq ft</p>
          </div>
        </Html>
      )}
    </group>
  )
}

// Adaptive camera that adjusts position based on building size
function AdaptiveCamera({ rooms, scale: storeScale }: { rooms: Room[]; scale: number }) {
  const camDist = useMemo(() => {
    if (rooms.length === 0) return { x: 12, y: 16, z: 12 }
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    rooms.forEach(room => {
      minX = Math.min(minX, room.x)
      maxX = Math.max(maxX, room.x + room.width)
      minY = Math.min(minY, room.y)
      maxY = Math.max(maxY, room.y + room.height)
    })
    const bldgW = (maxX - minX) / storeScale
    const bldgD = (maxY - minY) / storeScale
    const maxDim = Math.max(bldgW, bldgD, 20)
    const dist = maxDim * 0.7
    return { x: dist, y: dist * 0.9, z: dist }
  }, [rooms, storeScale])

  return <PerspectiveCamera makeDefault position={[camDist.x, camDist.y, camDist.z]} fov={45} />
}

// Adaptive fog based on building size
function AdaptiveFog({ rooms, scale: storeScale }: { rooms: Room[]; scale: number }) {
  const fogRange = useMemo(() => {
    if (rooms.length === 0) return { near: 30, far: 60 }
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity
    rooms.forEach(room => {
      minX = Math.min(minX, room.x)
      maxX = Math.max(maxX, room.x + room.width)
      minY = Math.min(minY, room.y)
      maxY = Math.max(maxY, room.y + room.height)
    })
    const maxDim = Math.max((maxX - minX) / storeScale, (maxY - minY) / storeScale, 20)
    return { near: maxDim * 1.5, far: maxDim * 4 }
  }, [rooms, storeScale])

  return <fog attach="fog" args={['#E8F0F8', fogRange.near, fogRange.far]} />
}

// Scene component
function Scene() {
  const {
    floorPlan,
    selectedFloorId,
    selectedRoomId,
    wallHeight,
    scale,
    showLabels,
    selectRoom,
  } = useEditorStore()

  const currentFloor = floorPlan?.floors.find((f) => f.id === selectedFloorId)
  const rooms = currentFloor?.rooms || []

  // Calculate center offset for all rooms to center the building
  const centerOffset = useMemo(() => {
    if (rooms.length === 0) return { x: 0, z: 0 }

    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    rooms.forEach(room => {
      minX = Math.min(minX, room.x)
      maxX = Math.max(maxX, room.x + room.width)
      minY = Math.min(minY, room.y)
      maxY = Math.max(maxY, room.y + room.height)
    })

    // Calculate center point in pixel coordinates, then convert to 3D units
    const centerX = ((minX + maxX) / 2) / scale
    const centerZ = ((minY + maxY) / 2) / scale

    return { x: centerX, z: centerZ }
  }, [rooms, scale])

  // Calculate building bounds for ground plane
  const buildingBounds = useMemo(() => {
    if (rooms.length === 0) return { width: 10, depth: 10 }
    let minX = Infinity, maxX = -Infinity
    let minY = Infinity, maxY = -Infinity

    rooms.forEach(room => {
      minX = Math.min(minX, room.x)
      maxX = Math.max(maxX, room.x + room.width)
      minY = Math.min(minY, room.y)
      maxY = Math.max(maxY, room.y + room.height)
    })

    return {
      width: (maxX - minX) / scale,
      depth: (maxY - minY) / scale,
    }
  }, [rooms, scale])

  return (
    <>
      {/* Lighting - natural daylight, adaptive to building size */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[buildingBounds.width * 0.6, Math.max(25, buildingBounds.width * 0.5), buildingBounds.depth * 0.6]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={Math.max(60, buildingBounds.width * 2)}
        shadow-camera-left={-Math.max(20, buildingBounds.width * 0.8)}
        shadow-camera-right={Math.max(20, buildingBounds.width * 0.8)}
        shadow-camera-top={Math.max(20, buildingBounds.depth * 0.8)}
        shadow-camera-bottom={-Math.max(20, buildingBounds.depth * 0.8)}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-buildingBounds.width * 0.4, 20, -buildingBounds.depth * 0.4]} intensity={0.4} />
      <hemisphereLight args={['#B4D7E8', '#8B7355', 0.4]} />

      {/* Ground plane with grass texture feel - adaptive size */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[Math.max(50, buildingBounds.width * 3), Math.max(50, buildingBounds.depth * 3)]} />
        <meshStandardMaterial color="#90A868" roughness={0.95} />
      </mesh>

      {/* Concrete foundation/patio */}
      {rooms.length > 0 && (
        <mesh position={[0, 0, 0]} receiveShadow>
          <boxGeometry args={[buildingBounds.width + 2, 0.08, buildingBounds.depth + 2]} />
          <meshStandardMaterial color="#D0D0D0" roughness={0.8} />
        </mesh>
      )}

      {/* Rooms - pass center offset for proper centering */}
      {rooms.map((room) => (
        <Room3D
          key={room.id}
          room={room}
          wallHeight={WALL_HEIGHT}
          scale={scale}
          isSelected={selectedRoomId === room.id}
          onClick={() => selectRoom(room.id)}
          showLabels={showLabels}
          centerOffset={centerOffset}
        />
      ))}
    </>
  )
}

interface Viewer3DProps {
  className?: string
}

export function Viewer3D({ className }: Viewer3DProps) {
  const [isDarkMode, setIsDarkMode] = useState(false)
  const controlsRef = useRef<any>(null)

  const { floorPlan, selectedFloorId } = useEditorStore()
  const currentFloor = floorPlan?.floors.find((f) => f.id === selectedFloorId)
  const rooms = currentFloor?.rooms || []

  const resetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset()
    }
  }

  return (
    <div className={`relative flex-1 overflow-hidden ${className}`}>
      {/* Controls */}
      <div className="absolute right-4 top-4 z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={resetCamera}
          className="bg-background/80 backdrop-blur-sm"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset View
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
      </div>

      {/* Floor indicator */}
      {currentFloor && (
        <div className="absolute left-4 top-4 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-lg px-3 py-2">
          <span className="text-sm font-medium">{currentFloor.level}</span>
          <span className="text-xs text-muted-foreground ml-2">3D View</span>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute left-4 bottom-4 z-10 bg-background/80 backdrop-blur-sm border border-border rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs text-muted-foreground">
          <span className="font-medium">Controls:</span> Left-click drag to rotate,
          Right-click drag to pan, Scroll to zoom
        </p>
      </div>

      {/* Three.js Canvas */}
      <Canvas
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
        style={{
          background: isDarkMode
            ? 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)'
            : 'linear-gradient(180deg, #e0f2fe 0%, #f0f9ff 100%)',
        }}
      >
        <Suspense fallback={null}>
          <AdaptiveCamera rooms={rooms} scale={useEditorStore.getState().scale} />
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.08}
            minDistance={3}
            maxDistance={200}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 1, 0]}
          />
          <AdaptiveFog rooms={rooms} scale={useEditorStore.getState().scale} />
          <Scene />
        </Suspense>
      </Canvas>

      {/* Empty state */}
      {rooms.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center bg-background/80 backdrop-blur-sm rounded-lg p-6 border border-border">
            <p className="text-lg font-medium">No floor plan loaded</p>
            <p className="text-sm text-muted-foreground">
              Generate a plan or load one to view in 3D
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
