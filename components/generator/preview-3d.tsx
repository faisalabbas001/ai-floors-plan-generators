'use client'

import { useRef, useState, useMemo, Suspense, forwardRef, useImperativeHandle } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera, Text, RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import type { GeneratedPlan } from '@/lib/api'

// Export handle type for parent components
export interface Preview3DHandle {
  toDataURL: (mimeType?: string, quality?: number) => string | null
}

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

// Wall colors
const EXTERIOR_WALL_COLOR = '#F8F5F0'  // Off-white
const INTERIOR_WALL_COLOR = '#FAFAF8'  // Slightly warmer white

// Get room color
const getRoomFloorColor = (roomName: string): string => {
  const type = roomName.toLowerCase()
  for (const [key, color] of Object.entries(ROOM_FLOOR_COLORS)) {
    if (type.includes(key)) return color
  }
  return ROOM_FLOOR_COLORS.default
}

// Constants
const WALL_THICKNESS = 0.08
const WALL_HEIGHT = 0.5  // Slightly taller walls for better visibility
const DOOR_WIDTH = 0.9  // ~3ft standard door
const DOOR_HEIGHT = 0.45  // Relative to wall height for cutaway
const WINDOW_HEIGHT = 0.25
const WINDOW_BOTTOM = 0.15
const SCALE_FACTOR = 0.3  // feet to meters conversion

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

// ========== DOOR OPENING COMPONENT ==========

function DoorOpening3D({
  position,
  rotation,
  width,
  height,
  isExterior
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  width: number
  height: number
  isExterior: boolean
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Door frame */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width + 0.04, height, 0.04]} />
        <meshStandardMaterial color={isExterior ? '#5C4033' : '#8B7355'} roughness={0.6} />
      </mesh>
      {/* Door panel - slightly open */}
      <mesh position={[width * 0.3, height / 2, 0.05]} rotation={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[width * 0.9, height - 0.02, 0.03]} />
        <meshStandardMaterial color={isExterior ? '#4A3728' : '#A08060'} roughness={0.5} />
      </mesh>
      {/* Door handle */}
      <mesh position={[width * 0.55, height / 2, 0.08]} castShadow>
        <boxGeometry args={[0.03, 0.08, 0.03]} />
        <meshStandardMaterial color="#C0C0C0" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  )
}

// ========== WINDOW COMPONENT ==========

function Window3D({
  position,
  rotation,
  width,
  height,
  sillHeight
}: {
  position: [number, number, number]
  rotation: [number, number, number]
  width: number
  height: number
  sillHeight: number
}) {
  return (
    <group position={position} rotation={rotation}>
      {/* Window frame */}
      <mesh position={[0, sillHeight + height / 2, 0]} castShadow>
        <boxGeometry args={[width + 0.04, height + 0.04, 0.04]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
      {/* Window glass */}
      <mesh position={[0, sillHeight + height / 2, 0.01]}>
        <boxGeometry args={[width - 0.02, height - 0.02, 0.01]} />
        <meshStandardMaterial color="#87CEEB" transparent opacity={0.4} roughness={0.0} />
      </mesh>
      {/* Window sill */}
      <mesh position={[0, sillHeight - 0.02, 0.04]} castShadow>
        <boxGeometry args={[width + 0.08, 0.03, 0.08]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.4} />
      </mesh>
      {/* Center mullion */}
      <mesh position={[0, sillHeight + height / 2, 0.02]} castShadow>
        <boxGeometry args={[0.02, height - 0.04, 0.02]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
      </mesh>
    </group>
  )
}

// ========== ROOM COMPONENT ==========

function Room3D({
  room,
  position,
  size,
  isExterior,
  scale = SCALE_FACTOR
}: {
  room: any
  position: [number, number, number]
  size: [number, number, number]
  isExterior: { north: boolean; south: boolean; east: boolean; west: boolean }
  scale?: number
}) {
  const [width, , depth] = size
  const roomType = room.name.toLowerCase()
  const floorColor = getRoomFloorColor(room.type || room.name)

  // Get doors and windows from room data
  const doors = room.doors || []
  const windows = room.windows || []

  // Helper to calculate door/window position on wall
  const getOpeningPosition = (wall: string, positionFt: number, openingWidth: number): [number, number, number] => {
    const posScaled = positionFt * scale
    const halfWidth = width / 2
    const halfDepth = depth / 2

    switch (wall) {
      case 'north':
        return [posScaled - halfWidth + openingWidth / 2, 0, -halfDepth + WALL_THICKNESS / 2]
      case 'south':
        return [posScaled - halfWidth + openingWidth / 2, 0, halfDepth - WALL_THICKNESS / 2]
      case 'east':
        return [halfWidth - WALL_THICKNESS / 2, 0, posScaled - halfDepth + openingWidth / 2]
      case 'west':
        return [-halfWidth + WALL_THICKNESS / 2, 0, posScaled - halfDepth + openingWidth / 2]
      default:
        return [0, 0, 0]
    }
  }

  const getOpeningRotation = (wall: string): [number, number, number] => {
    switch (wall) {
      case 'north':
      case 'south':
        return [0, 0, 0]
      case 'east':
      case 'west':
        return [0, Math.PI / 2, 0]
      default:
        return [0, 0, 0]
    }
  }

  return (
    <group position={position}>
      {/* Floor with material based on room type */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width - WALL_THICKNESS, depth - WALL_THICKNESS]} />
        <meshStandardMaterial color={floorColor} roughness={0.6} />
      </mesh>

      {/* Walls - rendered with gaps for doors/windows */}
      {/* North wall */}
      <mesh position={[0, WALL_HEIGHT / 2, -depth / 2 + WALL_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={isExterior.north ? '#E8E4E0' : '#F5F5F5'} roughness={0.7} />
      </mesh>

      {/* South wall */}
      <mesh position={[0, WALL_HEIGHT / 2, depth / 2 - WALL_THICKNESS / 2]} castShadow receiveShadow>
        <boxGeometry args={[width, WALL_HEIGHT, WALL_THICKNESS]} />
        <meshStandardMaterial color={isExterior.south ? '#E8E4E0' : '#F5F5F5'} roughness={0.7} />
      </mesh>

      {/* West wall */}
      <mesh position={[-width / 2 + WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, depth]} />
        <meshStandardMaterial color={isExterior.west ? '#E8E4E0' : '#F5F5F5'} roughness={0.7} />
      </mesh>

      {/* East wall */}
      <mesh position={[width / 2 - WALL_THICKNESS / 2, WALL_HEIGHT / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[WALL_THICKNESS, WALL_HEIGHT, depth]} />
        <meshStandardMaterial color={isExterior.east ? '#E8E4E0' : '#F5F5F5'} roughness={0.7} />
      </mesh>

      {/* Render doors from AI data */}
      {doors.map((door: any, index: number) => {
        const doorWidth = (door.width || 3) * scale
        const doorHeight = DOOR_HEIGHT
        const doorPos = getOpeningPosition(door.wall, door.position || 0, doorWidth)
        const doorRot = getOpeningRotation(door.wall)
        const isExteriorDoor = door.connectsTo === 'exterior'

        return (
          <DoorOpening3D
            key={`door-${index}`}
            position={doorPos}
            rotation={doorRot}
            width={doorWidth}
            height={doorHeight}
            isExterior={isExteriorDoor}
          />
        )
      })}

      {/* Render windows from AI data - only on exterior walls */}
      {windows.map((window: any, index: number) => {
        const windowWall = window.wall
        const isOnExterior =
          (windowWall === 'north' && isExterior.north) ||
          (windowWall === 'south' && isExterior.south) ||
          (windowWall === 'east' && isExterior.east) ||
          (windowWall === 'west' && isExterior.west)

        if (!isOnExterior) return null

        const windowWidth = (window.width || 3) * scale
        const windowHeight = WINDOW_HEIGHT
        const windowPos = getOpeningPosition(window.wall, window.position || 0, windowWidth)
        const windowRot = getOpeningRotation(window.wall)

        return (
          <Window3D
            key={`window-${index}`}
            position={windowPos}
            rotation={windowRot}
            width={windowWidth}
            height={windowHeight}
            sillHeight={WINDOW_BOTTOM}
          />
        )
      })}

      {/* Fallback windows if none provided by AI */}
      {windows.length === 0 && !roomType.includes('bathroom') && !roomType.includes('toilet') && (
        <>
          {isExterior.north && (
            <Window3D
              position={[0, 0, -depth / 2 + WALL_THICKNESS / 2]}
              rotation={[0, 0, 0]}
              width={Math.min(width * 0.4, 1.2)}
              height={WINDOW_HEIGHT}
              sillHeight={WINDOW_BOTTOM}
            />
          )}
          {isExterior.east && (
            <Window3D
              position={[width / 2 - WALL_THICKNESS / 2, 0, 0]}
              rotation={[0, Math.PI / 2, 0]}
              width={Math.min(depth * 0.4, 1.2)}
              height={WINDOW_HEIGHT}
              sillHeight={WINDOW_BOTTOM}
            />
          )}
        </>
      )}

      {/* Room label - 3D text floating above room */}
      <Text
        position={[0, WALL_HEIGHT + 0.15, 0]}
        fontSize={0.15}
        color="#333333"
        anchorX="center"
        anchorY="middle"
        rotation={[-Math.PI / 4, 0, 0]}
      >
        {room.name}
      </Text>

      {/* Furniture based on room type */}
      {(roomType.includes('master') || roomType.includes('bedroom')) && (
        <>
          <Bed3D
            position={[0, 0, -depth * 0.15]}
            width={width}
            depth={depth}
            isDouble={roomType.includes('master')}
          />
          <Wardrobe3D position={[-width / 2 + 0.7, 0, depth / 2 - 0.45]} />
        </>
      )}

      {(roomType.includes('bathroom') || roomType.includes('bath') || roomType.includes('en-suite')) && (
        <>
          <Toilet3D position={[width / 2 - 0.4, 0, -depth / 2 + 0.5]} />
          <Sink3D position={[-width / 2 + 0.5, 0, -depth / 2 + 0.4]} />
          {width > 2 && depth > 2 && (
            roomType.includes('en-suite') ? (
              <Shower3D position={[width / 2 - 0.6, 0, depth / 2 - 0.6]} />
            ) : (
              <Bathtub3D position={[0, 0, depth / 2 - 0.5]} />
            )
          )}
        </>
      )}

      {roomType.includes('toilet') && (
        <>
          <Toilet3D position={[0, 0, -depth / 4]} />
          <Sink3D position={[0, 0, depth / 4]} />
        </>
      )}

      {roomType.includes('kitchen') && (
        <Kitchen3D position={[0, 0, 0]} width={width} depth={depth} />
      )}

      {roomType.includes('dining') && (
        <DiningTable3D position={[0, 0, 0]} width={width} depth={depth} />
      )}

      {roomType.includes('living') && (
        <LivingRoom3D position={[0, 0, 0]} width={width} depth={depth} />
      )}

      {(roomType.includes('office') || roomType.includes('study')) && (
        <Office3D position={[0, 0, 0]} />
      )}
    </group>
  )
}

// ========== SCENE ==========

function Scene({ plan, selectedFloor }: { plan: GeneratedPlan; selectedFloor: number }) {
  const floor = plan.floors[selectedFloor]
  if (!floor) return null

  const scale = 0.3  // feet to meters (roughly)
  const rooms = floor.rooms

  const hasPositionData = rooms.some(r => r.position && typeof r.position.x === 'number')

  const layoutedRooms = useMemo(() => {
    const result: Array<{
      room: typeof rooms[0]
      position: [number, number, number]
      size: [number, number, number]
      isExterior: { north: boolean; south: boolean; east: boolean; west: boolean }
    }> = []

    if (hasPositionData) {
      // Calculate building bounds first
      let minPosX = Infinity, maxPosX = -Infinity, minPosY = Infinity, maxPosY = -Infinity

      rooms.forEach(room => {
        const x = room.position?.x || 0
        const y = room.position?.y || 0
        const w = room.dimensions?.width || Math.sqrt(room.areaSqft)
        const l = room.dimensions?.length || Math.sqrt(room.areaSqft)
        minPosX = Math.min(minPosX, x)
        maxPosX = Math.max(maxPosX, x + w)
        minPosY = Math.min(minPosY, y)
        maxPosY = Math.max(maxPosY, y + l)
      })

      const buildingWidth = maxPosX - minPosX
      const buildingDepth = maxPosY - minPosY

      rooms.forEach((room) => {
        const roomWidth = (room.dimensions?.width || Math.sqrt(room.areaSqft)) * scale
        const roomDepth = (room.dimensions?.length || Math.sqrt(room.areaSqft)) * scale
        const posX = room.position?.x || 0
        const posY = room.position?.y || 0

        const x = (posX + (room.dimensions?.width || Math.sqrt(room.areaSqft)) / 2 - minPosX - buildingWidth / 2) * scale
        const z = (posY + (room.dimensions?.length || Math.sqrt(room.areaSqft)) / 2 - minPosY - buildingDepth / 2) * scale

        // Determine exterior walls
        const tolerance = 0.1
        const isExterior = {
          north: posY <= minPosX + tolerance,
          south: posY + (room.dimensions?.length || Math.sqrt(room.areaSqft)) >= maxPosY - tolerance,
          west: posX <= minPosX + tolerance,
          east: posX + (room.dimensions?.width || Math.sqrt(room.areaSqft)) >= maxPosX - tolerance,
        }

        result.push({
          room,
          position: [x, 0, z],
          size: [roomWidth, WALL_HEIGHT, roomDepth],
          isExterior,
        })
      })
      return result
    }

    // Fallback grid layout
    const cols = Math.ceil(Math.sqrt(rooms.length))
    let currentX = 0, currentZ = 0, rowMaxDepth = 0, col = 0

    rooms.forEach((room, index) => {
      const roomWidth = Math.max((room.dimensions?.width || Math.sqrt(room.areaSqft)) * scale, 2.5)
      const roomDepth = Math.max((room.dimensions?.length || Math.sqrt(room.areaSqft)) * scale, 2.5)

      if (col >= cols) {
        currentX = 0
        currentZ += rowMaxDepth
        rowMaxDepth = 0
        col = 0
      }

      const isExterior = {
        north: currentZ === 0,
        south: col < cols && index >= rooms.length - cols,
        west: col === 0,
        east: col === cols - 1,
      }

      result.push({
        room,
        position: [currentX + roomWidth / 2, 0, currentZ + roomDepth / 2],
        size: [roomWidth, WALL_HEIGHT, roomDepth],
        isExterior,
      })

      currentX += roomWidth
      rowMaxDepth = Math.max(rowMaxDepth, roomDepth)
      col++
    })

    // Center the layout
    const maxX = Math.max(...result.map(r => r.position[0] + r.size[0] / 2))
    const maxZ = Math.max(...result.map(r => r.position[2] + r.size[2] / 2))
    return result.map(r => ({
      ...r,
      position: [r.position[0] - maxX / 2, 0, r.position[2] - maxZ / 2] as [number, number, number],
    }))
  }, [rooms, scale, hasPositionData])

  const buildingBounds = useMemo(() => {
    if (layoutedRooms.length === 0) {
      return { width: 10, depth: 10, centerX: 0, centerZ: 0, minX: -5, maxX: 5, minZ: -5, maxZ: 5 }
    }
    const minX = Math.min(...layoutedRooms.map(r => r.position[0] - r.size[0] / 2))
    const maxX = Math.max(...layoutedRooms.map(r => r.position[0] + r.size[0] / 2))
    const minZ = Math.min(...layoutedRooms.map(r => r.position[2] - r.size[2] / 2))
    const maxZ = Math.max(...layoutedRooms.map(r => r.position[2] + r.size[2] / 2))
    return {
      width: maxX - minX,
      depth: maxZ - minZ,
      centerX: (minX + maxX) / 2,
      centerZ: (minZ + maxZ) / 2,
      minX, maxX, minZ, maxZ
    }
  }, [layoutedRooms])

  const cameraDistance = Math.max(buildingBounds.width, buildingBounds.depth) * 1.2 + 8

  return (
    <>
      {/* Lighting - natural daylight */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[15, 25, 15]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[4096, 4096]}
        shadow-camera-far={60}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />
      <directionalLight position={[-10, 20, -10]} intensity={0.4} />
      <hemisphereLight args={['#B4D7E8', '#8B7355', 0.4]} />

      {/* Ground plane with grass texture feel */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#90A868" roughness={0.95} />
      </mesh>

      {/* Concrete foundation/patio */}
      <mesh position={[buildingBounds.centerX, 0, buildingBounds.centerZ]} receiveShadow>
        <boxGeometry args={[buildingBounds.width + 2, 0.08, buildingBounds.depth + 2]} />
        <meshStandardMaterial color="#D0D0D0" roughness={0.8} />
      </mesh>

      {/* Rooms */}
      {layoutedRooms.map((item, index) => (
        <Room3D
          key={index}
          room={item.room}
          position={item.position}
          size={item.size}
          isExterior={item.isExterior}
          scale={scale}
        />
      ))}

      {/* NO ROOF - cutaway view for visibility */}
    </>
  )
}

// ========== MAIN COMPONENT ==========

export const Preview3D = forwardRef<Preview3DHandle, { plan: GeneratedPlan }>(({ plan }, ref) => {
  const [selectedFloor, setSelectedFloor] = useState(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Expose toDataURL method to parent via ref
  useImperativeHandle(ref, () => ({
    toDataURL: (mimeType = 'image/png', quality = 1) => {
      // Find the canvas element inside the container
      const canvas = canvasRef.current?.parentElement?.querySelector('canvas')
      if (canvas) {
        return canvas.toDataURL(mimeType, quality)
      }
      return null
    }
  }))

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-sky-200 to-sky-100">
      {/* Floor selector */}
      {plan.floors.length > 1 && (
        <div className="absolute top-3 left-3 z-10 flex gap-2">
          {plan.floors.map((f, index) => (
            <button
              key={index}
              onClick={() => setSelectedFloor(index)}
              className={`px-4 py-2 text-sm font-medium rounded-lg shadow-lg transition-all ${
                selectedFloor === index
                  ? 'bg-blue-600 text-white'
                  : 'bg-white/95 hover:bg-white text-gray-700'
              }`}
            >
              {f.level}
            </button>
          ))}
        </div>
      )}

      {/* Controls hint */}
      <div className="absolute bottom-3 left-3 z-10 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
        <p className="text-xs text-gray-600">
          Drag to rotate | Scroll to zoom | Right-click to pan
        </p>
      </div>

      <Canvas
        ref={canvasRef}
        shadows
        gl={{ preserveDrawingBuffer: true, antialias: true }}
      >
        <Suspense fallback={null}>
          <PerspectiveCamera makeDefault position={[12, 16, 12]} fov={45} />
          <OrbitControls
            enableDamping
            dampingFactor={0.08}
            minDistance={6}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.1}
            target={[0, 1, 0]}
          />
          <fog attach="fog" args={['#E8F0F8', 30, 60]} />
          <Scene plan={plan} selectedFloor={selectedFloor} />
        </Suspense>
      </Canvas>
    </div>
  )
})

Preview3D.displayName = 'Preview3D'
