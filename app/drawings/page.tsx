'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  FileImage,
  Layers,
  Table2,
  Lightbulb,
  ArrowLeft,
  AlertCircle,
  Ruler,
  Grid3X3,
} from 'lucide-react'
import { useAuthStore, usePlannerStore } from '@/lib/stores'
import { drawingsApi, projectsApi, type AllDrawingsResponse, type Elevation, type ElevationElement, type Section, type SectionElement, type Schedule, type RCP, type RCPRoom, type RCPFixture } from '@/lib/api'

// ============================================================
// PROFESSIONAL ELEVATION SVG RENDERER
// ============================================================
function ElevationSVG({ elevation }: { elevation: Elevation }) {
  const svgWidth = 720
  const svgHeight = 420
  const marginLeft = 70
  const marginRight = 40
  const marginTop = 45
  const marginBottom = 65

  const elWidth = elevation.width || 1000
  const elHeight = elevation.height || 800
  const drawAreaW = svgWidth - marginLeft - marginRight
  const drawAreaH = svgHeight - marginTop - marginBottom
  const scaleX = drawAreaW / elWidth
  const scaleY = drawAreaH / elHeight
  const scale = Math.min(scaleX, scaleY) * 0.85

  const offsetX = marginLeft + (drawAreaW - elWidth * scale) / 2
  const offsetY = marginTop + (drawAreaH - elHeight * scale) / 2

  const tx = (x: number) => offsetX + x * scale
  const ty = (y: number) => offsetY + y * scale
  const ts = (s: number) => s * scale

  // Count elements by type
  const windowCount = elevation.elements?.filter(e => e.type === 'window').length || 0
  const doorCount = elevation.elements?.filter(e => e.type === 'door').length || 0

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto" style={{ minHeight: 280, background: '#FAFBFC' }}>
      {/* SVG Definitions */}
      <defs>
        {/* Brick hatch pattern */}
        <pattern id={`brick-${elevation.direction}`} x="0" y="0" width="12" height="8" patternUnits="userSpaceOnUse">
          <rect width="12" height="8" fill="#F5F0EB" />
          <line x1="0" y1="4" x2="12" y2="4" stroke="#E0D8D0" strokeWidth="0.3" />
          <line x1="0" y1="0" x2="0" y2="4" stroke="#E0D8D0" strokeWidth="0.3" />
          <line x1="6" y1="4" x2="6" y2="8" stroke="#E0D8D0" strokeWidth="0.3" />
        </pattern>
        {/* Ground hatch pattern */}
        <pattern id={`ground-${elevation.direction}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#E8E4DF" />
          <line x1="0" y1="8" x2="8" y2="0" stroke="#D0C8C0" strokeWidth="0.4" />
        </pattern>
        {/* Window glass gradient */}
        <linearGradient id={`glass-${elevation.direction}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C8E0F8" />
          <stop offset="50%" stopColor="#A8D0F0" />
          <stop offset="100%" stopColor="#90C0E8" />
        </linearGradient>
        {/* Roof shingle pattern */}
        <pattern id={`shingle-${elevation.direction}`} x="0" y="0" width="16" height="6" patternUnits="userSpaceOnUse">
          <rect width="16" height="6" fill="#B8A898" />
          <line x1="0" y1="3" x2="16" y2="3" stroke="#A89888" strokeWidth="0.3" />
          <line x1="4" y1="0" x2="4" y2="3" stroke="#A89888" strokeWidth="0.3" />
          <line x1="12" y1="3" x2="12" y2="6" stroke="#A89888" strokeWidth="0.3" />
        </pattern>
        {/* Drop shadow */}
        <filter id="shadow">
          <feDropShadow dx="1" dy="1" stdDeviation="1" floodOpacity="0.1" />
        </filter>
      </defs>

      {/* Background drawing border */}
      <rect x="2" y="2" width={svgWidth - 4} height={svgHeight - 4} fill="none" stroke="#333" strokeWidth="1.5" />
      <rect x="5" y="5" width={svgWidth - 10} height={svgHeight - 10} fill="none" stroke="#333" strokeWidth="0.5" />

      {/* Title block - top */}
      <rect x="5" y="5" width={svgWidth - 10} height="30" fill="#2C3E50" />
      <text x={svgWidth / 2} y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white" fontFamily="'Courier New', monospace">
        {elevation.title || `${elevation.direction.toUpperCase()} ELEVATION`}
      </text>
      <text x={svgWidth - 15} y="24" textAnchor="end" fontSize="8" fill="#BDC3C7" fontFamily="'Courier New', monospace">
        SCALE 1:{elevation.scale}
      </text>

      {/* Ground line with hatching */}
      {elevation.groundLine && (
        <g>
          {/* Earth fill below ground */}
          <rect
            x={tx(-5)} y={ty(elevation.groundLine.y)}
            width={ts(elWidth / scale + 10)} height={20}
            fill={`url(#ground-${elevation.direction})`}
          />
          {/* Ground level line */}
          <line
            x1={tx(-5)} y1={ty(elevation.groundLine.y)}
            x2={tx(elevation.groundLine.width + 5)} y2={ty(elevation.groundLine.y)}
            stroke="#4A4A4A" strokeWidth="2.5"
          />
          {/* GL label */}
          <text x={tx(-8)} y={ty(elevation.groundLine.y) + 4} textAnchor="end" fontSize="7" fontWeight="bold" fill="#4A4A4A" fontFamily="'Courier New', monospace">
            GL
          </text>
          {/* Grade marks */}
          {Array.from({ length: Math.floor(ts(elWidth / scale) / 15) + 1 }).map((_, i) => (
            <line key={`grade-${i}`}
              x1={tx(-5) + i * 15} y1={ty(elevation.groundLine.y)}
              x2={tx(-5) + i * 15 - 4} y2={ty(elevation.groundLine.y) + 6}
              stroke="#4A4A4A" strokeWidth="0.8"
            />
          ))}
        </g>
      )}

      {/* Render elements */}
      {elevation.elements?.map((el: ElevationElement, i: number) => {
        switch (el.type) {
          case 'outline':
            if (el.points && el.points.length > 1) {
              const pts = el.points.map(p => `${tx(p.x)},${ty(p.y)}`).join(' ')
              return (
                <g key={i}>
                  {/* Wall fill with brick pattern */}
                  <polygon points={pts} fill={`url(#brick-${elevation.direction})`} stroke="none" />
                  {/* Wall outline */}
                  <polygon points={pts} fill="none" stroke="#2C3E50" strokeWidth="2" />
                </g>
              )
            }
            if (el.x !== undefined && el.y !== undefined && el.width && el.height) {
              return (
                <g key={i}>
                  <rect x={tx(el.x)} y={ty(el.y)} width={ts(el.width)} height={ts(el.height)}
                    fill={`url(#brick-${elevation.direction})`} stroke="none" />
                  <rect x={tx(el.x)} y={ty(el.y)} width={ts(el.width)} height={ts(el.height)}
                    fill="none" stroke="#2C3E50" strokeWidth="2" />
                </g>
              )
            }
            return null

          case 'line':
            if (el.start && el.end) {
              return (
                <g key={i}>
                  <line
                    x1={tx(el.start.x)} y1={ty(el.start.y)}
                    x2={tx(el.end.x)} y2={ty(el.end.y)}
                    stroke="#5D6D7E" strokeWidth="0.8" strokeDasharray="6,3"
                  />
                  {/* Floor level bubble */}
                  <circle cx={tx(el.start.x) - 12} cy={ty(el.start.y)} r="8" fill="white" stroke="#2C3E50" strokeWidth="1" />
                </g>
              )
            }
            return null

          case 'window':
            if (el.x !== undefined && el.y !== undefined && el.width && el.height) {
              const wx = tx(el.x)
              const wy = ty(el.y)
              const ww = ts(el.width)
              const wh = ts(el.height)
              return (
                <g key={i} filter="url(#shadow)">
                  {/* Window recess shadow */}
                  <rect x={wx - 1} y={wy - 1} width={ww + 2} height={wh + 2} fill="#D5DBDB" rx="1" />
                  {/* Window frame outer */}
                  <rect x={wx} y={wy} width={ww} height={wh} fill="none" stroke="#566573" strokeWidth="1.5" rx="0.5" />
                  {/* Glass panes */}
                  <rect x={wx + 2} y={wy + 2} width={ww / 2 - 3} height={wh - 4}
                    fill={`url(#glass-${elevation.direction})`} stroke="#7F8C8D" strokeWidth="0.5" opacity="0.85" />
                  <rect x={wx + ww / 2 + 1} y={wy + 2} width={ww / 2 - 3} height={wh - 4}
                    fill={`url(#glass-${elevation.direction})`} stroke="#7F8C8D" strokeWidth="0.5" opacity="0.85" />
                  {/* Mullion (center vertical bar) */}
                  <line x1={wx + ww / 2} y1={wy} x2={wx + ww / 2} y2={wy + wh} stroke="#566573" strokeWidth="1.2" />
                  {/* Horizontal meeting rail */}
                  <line x1={wx} y1={wy + wh * 0.45} x2={wx + ww} y2={wy + wh * 0.45} stroke="#566573" strokeWidth="0.8" />
                  {/* Sill */}
                  <rect x={wx - 2} y={wy + wh} width={ww + 4} height={2.5} fill="#AEB6BF" stroke="#7F8C8D" strokeWidth="0.5" />
                  {/* Lintel */}
                  <rect x={wx - 1} y={wy - 3} width={ww + 2} height={3} fill="#BDC3C7" stroke="#7F8C8D" strokeWidth="0.5" />
                </g>
              )
            }
            return null

          case 'door':
            if (el.x !== undefined && el.y !== undefined && el.width && el.height) {
              const dx = tx(el.x)
              const dy = ty(el.y)
              const dw = ts(el.width)
              const dh = ts(el.height)
              return (
                <g key={i} filter="url(#shadow)">
                  {/* Door recess */}
                  <rect x={dx - 1} y={dy - 1} width={dw + 2} height={dh + 2} fill="#D5DBDB" />
                  {/* Door frame */}
                  <rect x={dx} y={dy} width={dw} height={dh} fill="none" stroke="#566573" strokeWidth="1.5" />
                  {/* Door panel */}
                  <rect x={dx + 2} y={dy + 2} width={dw - 4} height={dh - 4} fill="#D4A574" stroke="#8B6914" strokeWidth="0.8" rx="1" />
                  {/* Panel divisions */}
                  <rect x={dx + 4} y={dy + 5} width={dw - 8} height={dh * 0.3} fill="none" stroke="#A0845C" strokeWidth="0.5" rx="0.5" />
                  <rect x={dx + 4} y={dy + dh * 0.4 + 2} width={dw - 8} height={dh * 0.45} fill="none" stroke="#A0845C" strokeWidth="0.5" rx="0.5" />
                  {/* Door handle */}
                  <circle cx={dx + dw * 0.78} cy={dy + dh * 0.52} r={2} fill="#B8860B" stroke="#8B6914" strokeWidth="0.5" />
                  {/* Threshold */}
                  <rect x={dx - 2} y={dy + dh} width={dw + 4} height={2} fill="#7F8C8D" rx="0.5" />
                  {/* Transom light (for exterior doors) */}
                  {dh > 40 && (
                    <g>
                      <rect x={dx + 2} y={dy + 2} width={dw - 4} height={8}
                        fill={`url(#glass-${elevation.direction})`} stroke="#7F8C8D" strokeWidth="0.5" opacity="0.7" />
                      <line x1={dx + dw / 2} y1={dy + 2} x2={dx + dw / 2} y2={dy + 10} stroke="#7F8C8D" strokeWidth="0.5" />
                    </g>
                  )}
                </g>
              )
            }
            return null

          case 'roof':
            if (el.points && el.points.length > 1) {
              const pts = el.points.map(p => `${tx(p.x)},${ty(p.y)}`).join(' ')
              return (
                <g key={i}>
                  {/* Roof fill with shingle pattern */}
                  <polygon points={pts} fill={`url(#shingle-${elevation.direction})`} stroke="none" />
                  {/* Roof outline */}
                  <polygon points={pts} fill="none" stroke="#5D4E37" strokeWidth="2" />
                  {/* Ridge line */}
                  {el.points.length >= 3 && (
                    <circle cx={tx(el.points[1].x)} cy={ty(el.points[1].y)} r="2" fill="#5D4E37" />
                  )}
                  {/* Eave detail lines */}
                  <line x1={tx(el.points[0].x)} y1={ty(el.points[0].y) + 2}
                    x2={tx(el.points[el.points.length - 1].x)} y2={ty(el.points[el.points.length - 1].y) + 2}
                    stroke="#8B7355" strokeWidth="1" />
                </g>
              )
            }
            if (el.x !== undefined && el.y !== undefined && el.width && el.height) {
              return (
                <g key={i}>
                  <rect x={tx(el.x)} y={ty(el.y)} width={ts(el.width)} height={ts(el.height)}
                    fill={`url(#shingle-${elevation.direction})`} stroke="#5D4E37" strokeWidth="1.5" />
                </g>
              )
            }
            return null

          case 'text':
            if (el.position || (el.x !== undefined && el.y !== undefined)) {
              const textX = el.position ? tx(el.position.x) : tx(el.x || 0)
              const textY = el.position ? ty(el.position.y) : ty(el.y || 0)
              return (
                <g key={i}>
                  {/* Level label inside bubble */}
                  <circle cx={textX - 12} cy={textY} r="8" fill="white" stroke="#2C3E50" strokeWidth="0.8" />
                  <text x={textX - 12} y={textY + 3} fontSize="6" fill="#2C3E50" textAnchor="middle" fontWeight="bold" fontFamily="'Courier New', monospace">
                    {el.text}
                  </text>
                </g>
              )
            }
            return null

          default:
            if (el.x !== undefined && el.y !== undefined && el.width && el.height) {
              return <rect key={i} x={tx(el.x)} y={ty(el.y)} width={ts(el.width)} height={ts(el.height)} fill="none" stroke="#BDC3C7" strokeWidth="0.5" />
            }
            return null
        }
      })}

      {/* Dimension lines - overall width at bottom */}
      {elevation.dimensions?.overall && (
        <g>
          {/* Horizontal dimension line */}
          <line x1={tx(0)} y1={svgHeight - marginBottom + 18} x2={tx(elWidth)} y2={svgHeight - marginBottom + 18}
            stroke="#E74C3C" strokeWidth="0.6" />
          {/* Tick marks */}
          <line x1={tx(0)} y1={svgHeight - marginBottom + 13} x2={tx(0)} y2={svgHeight - marginBottom + 23}
            stroke="#E74C3C" strokeWidth="0.6" />
          <line x1={tx(elWidth)} y1={svgHeight - marginBottom + 13} x2={tx(elWidth)} y2={svgHeight - marginBottom + 23}
            stroke="#E74C3C" strokeWidth="0.6" />
          {/* Arrow heads */}
          <polygon points={`${tx(0)},${svgHeight - marginBottom + 18} ${tx(0) + 5},${svgHeight - marginBottom + 15} ${tx(0) + 5},${svgHeight - marginBottom + 21}`}
            fill="#E74C3C" />
          <polygon points={`${tx(elWidth)},${svgHeight - marginBottom + 18} ${tx(elWidth) - 5},${svgHeight - marginBottom + 15} ${tx(elWidth) - 5},${svgHeight - marginBottom + 21}`}
            fill="#E74C3C" />
          {/* Dimension text */}
          <rect x={(tx(0) + tx(elWidth)) / 2 - 30} y={svgHeight - marginBottom + 23} width="60" height="14" fill="white" stroke="none" />
          <text x={(tx(0) + tx(elWidth)) / 2} y={svgHeight - marginBottom + 33} textAnchor="middle" fontSize="9" fill="#E74C3C" fontWeight="bold" fontFamily="'Courier New', monospace">
            {elevation.dimensions.overall.width}
          </text>

          {/* Vertical dimension line - right side */}
          <line x1={tx(elWidth) + 18} y1={ty(0)} x2={tx(elWidth) + 18} y2={ty(elHeight)}
            stroke="#E74C3C" strokeWidth="0.6" />
          <line x1={tx(elWidth) + 13} y1={ty(0)} x2={tx(elWidth) + 23} y2={ty(0)}
            stroke="#E74C3C" strokeWidth="0.6" />
          <line x1={tx(elWidth) + 13} y1={ty(elHeight)} x2={tx(elWidth) + 23} y2={ty(elHeight)}
            stroke="#E74C3C" strokeWidth="0.6" />
          {/* Vertical dimension text */}
          <text x={tx(elWidth) + 28} y={(ty(0) + ty(elHeight)) / 2 + 3} textAnchor="start" fontSize="8" fill="#E74C3C" fontFamily="'Courier New', monospace"
            transform={`rotate(-90, ${tx(elWidth) + 28}, ${(ty(0) + ty(elHeight)) / 2})`}>
            {elevation.dimensions.overall.height}
          </text>
        </g>
      )}

      {/* Element count badges */}
      <g transform={`translate(12, ${svgHeight - 22})`}>
        {windowCount > 0 && (
          <g>
            <rect x="0" y="-8" width="60" height="16" rx="3" fill="#2980B9" opacity="0.9" />
            <text x="30" y="3" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">
              {windowCount} Windows
            </text>
          </g>
        )}
        {doorCount > 0 && (
          <g transform={`translate(${windowCount > 0 ? 68 : 0}, 0)`}>
            <rect x="0" y="-8" width="52" height="16" rx="3" fill="#8E44AD" opacity="0.9" />
            <text x="26" y="3" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">
              {doorCount} Doors
            </text>
          </g>
        )}
      </g>

      {/* Direction indicator */}
      <g transform={`translate(${svgWidth - 35}, ${svgHeight - 22})`}>
        <rect x="-12" y="-8" width="24" height="16" rx="3" fill="#2C3E50" />
        <text x="0" y="3" textAnchor="middle" fontSize="8" fill="white" fontWeight="bold" fontFamily="'Courier New', monospace">
          {elevation.direction.charAt(0).toUpperCase()}
        </text>
      </g>
    </svg>
  )
}

// ============================================================
// PROFESSIONAL SECTION SVG RENDERER
// ============================================================
function SectionSVG({ section }: { section: Section }) {
  const svgWidth = 720
  const svgHeight = 420
  const marginLeft = 70
  const marginRight = 40
  const marginTop = 45
  const marginBottom = 55

  const elWidth = section.width || 1000
  const elHeight = section.height || 800
  const drawAreaW = svgWidth - marginLeft - marginRight
  const drawAreaH = svgHeight - marginTop - marginBottom
  const scaleX = drawAreaW / elWidth
  const scaleY = drawAreaH / elHeight
  const scale = Math.min(scaleX, scaleY) * 0.85

  const offsetX = marginLeft + (drawAreaW - elWidth * scale) / 2
  const offsetY = marginTop + (drawAreaH - elHeight * scale) / 2

  const tx = (x: number) => offsetX + x * scale
  const ty = (y: number) => offsetY + y * scale
  const ts = (s: number) => s * scale

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto" style={{ minHeight: 280, background: '#FAFBFC' }}>
      <defs>
        {/* Earth hatch */}
        <pattern id={`earth-${section.id}`} x="0" y="0" width="8" height="8" patternUnits="userSpaceOnUse">
          <rect width="8" height="8" fill="#D4C4A8" />
          <line x1="0" y1="8" x2="8" y2="0" stroke="#C0B090" strokeWidth="0.5" />
          <line x1="0" y1="4" x2="4" y2="0" stroke="#C0B090" strokeWidth="0.3" />
        </pattern>
        {/* Concrete hatch for walls */}
        <pattern id={`concrete-${section.id}`} x="0" y="0" width="6" height="6" patternUnits="userSpaceOnUse">
          <rect width="6" height="6" fill="#B0B0B0" />
          <circle cx="2" cy="2" r="0.6" fill="#999" />
          <circle cx="5" cy="5" r="0.4" fill="#999" />
        </pattern>
        {/* Floor slab hatch */}
        <pattern id={`slab-${section.id}`} x="0" y="0" width="10" height="4" patternUnits="userSpaceOnUse">
          <rect width="10" height="4" fill="#A0A0A0" />
          <line x1="0" y1="2" x2="10" y2="2" stroke="#909090" strokeWidth="0.3" />
        </pattern>
        {/* Interior wall hatch */}
        <pattern id={`intwall-${section.id}`} x="0" y="0" width="4" height="4" patternUnits="userSpaceOnUse">
          <rect width="4" height="4" fill="#8B8B8B" />
          <line x1="0" y1="4" x2="4" y2="0" stroke="#7B7B7B" strokeWidth="0.4" />
        </pattern>
      </defs>

      {/* Border */}
      <rect x="2" y="2" width={svgWidth - 4} height={svgHeight - 4} fill="none" stroke="#333" strokeWidth="1.5" />
      <rect x="5" y="5" width={svgWidth - 10} height={svgHeight - 10} fill="none" stroke="#333" strokeWidth="0.5" />

      {/* Title block */}
      <rect x="5" y="5" width={svgWidth - 10} height="30" fill="#2C3E50" />
      <text x={svgWidth / 2} y="24" textAnchor="middle" fontSize="12" fontWeight="bold" fill="white" fontFamily="'Courier New', monospace">
        {section.title}
      </text>
      <text x={svgWidth - 15} y="24" textAnchor="end" fontSize="8" fill="#BDC3C7" fontFamily="'Courier New', monospace">
        SCALE 1:{section.scale}
      </text>

      {/* Section cut indicator line */}
      <line x1={10} y1={marginTop + 5} x2={30} y2={marginTop + 5} stroke="#E74C3C" strokeWidth="1.5" />
      <text x={32} y={marginTop + 8} fontSize="7" fill="#E74C3C" fontFamily="'Courier New', monospace">
        CUT @ {section.cutPosition}&apos;
      </text>

      {/* Render elements */}
      {section.elements?.map((el: SectionElement, i: number) => {
        if (el.type === 'text' && el.position) {
          return (
            <g key={i}>
              {/* Room name with background */}
              <rect x={tx(el.position.x) - 25} y={ty(el.position.y) - 6} width="50" height="12"
                fill="white" stroke="#BDC3C7" strokeWidth="0.4" rx="2" opacity="0.9" />
              <text x={tx(el.position.x)} y={ty(el.position.y) + 3}
                fontSize="7" fill="#2C3E50" textAnchor="middle" fontWeight="bold" fontFamily="'Courier New', monospace">
                {el.text}
              </text>
            </g>
          )
        }

        // Earth/foundation hatch
        if (el.type === 'hatch' && el.bounds) {
          return (
            <g key={i}>
              <rect x={tx(el.bounds.x)} y={ty(el.bounds.y)} width={ts(el.bounds.width)} height={ts(el.bounds.height)}
                fill={`url(#earth-${section.id})`} stroke="#8B7355" strokeWidth="1" />
              {/* Ground level line */}
              <line x1={tx(el.bounds.x)} y1={ty(el.bounds.y)} x2={tx(el.bounds.x + el.bounds.width)} y2={ty(el.bounds.y)}
                stroke="#4A4A4A" strokeWidth="2" />
            </g>
          )
        }

        // Bounded rectangles (floor slabs, walls)
        if (el.bounds) {
          const isWall = el.layer === 'A-WALL' || el.layer === 'A-WALL-INTR'
          const isSlab = el.layer === 'A-FLOR-OTLN'
          let fillColor = 'none'
          if (el.fill) {
            if (isWall) fillColor = `url(#concrete-${section.id})`
            else if (isSlab) fillColor = `url(#slab-${section.id})`
            else fillColor = '#E8E4E0'
          }

          return (
            <rect key={i} x={tx(el.bounds.x)} y={ty(el.bounds.y)} width={ts(el.bounds.width)} height={ts(el.bounds.height)}
              fill={fillColor}
              stroke={isWall ? '#2C3E50' : '#7F8C8D'}
              strokeWidth={isWall ? '2' : '1'}
            />
          )
        }

        // Regular rectangles
        if (el.x !== undefined && el.y !== undefined && el.width && el.height) {
          const isWall = el.layer === 'A-WALL' || el.layer === 'A-WALL-INTR'
          const isSlab = el.layer === 'A-FLOR-OTLN'
          let fillColor = 'none'
          if (el.fill) {
            if (isWall) fillColor = `url(#concrete-${section.id})`
            else if (isSlab) fillColor = `url(#slab-${section.id})`
            else fillColor = '#E8E4E0'
          }

          return (
            <rect key={i} x={tx(el.x)} y={ty(el.y)} width={ts(el.width)} height={ts(el.height)}
              fill={fillColor}
              stroke={isWall ? '#2C3E50' : '#7F8C8D'}
              strokeWidth={isWall ? '2' : '1'}
            />
          )
        }

        // Polygons (roof)
        if (el.points && el.points.length > 1) {
          const pts = el.points.map(p => `${tx(p.x)},${ty(p.y)}`).join(' ')
          const isRoof = el.layer === 'A-ROOF'
          return (
            <g key={i}>
              <polygon points={pts} fill={isRoof ? '#C4A882' : (el.fill ? '#D4D4D4' : 'none')}
                stroke={isRoof ? '#5D4E37' : '#555'} strokeWidth={isRoof ? '2' : '1'} opacity={isRoof ? 0.7 : 1} />
              {/* Roof structure lines */}
              {isRoof && el.points.length >= 3 && (
                <g>
                  <line x1={tx(el.points[0].x)} y1={ty(el.points[0].y)}
                    x2={tx(el.points[1].x)} y2={ty(el.points[1].y)}
                    stroke="#5D4E37" strokeWidth="1.5" />
                </g>
              )}
            </g>
          )
        }

        return null
      })}

      {/* Floor-to-floor dimension lines on right */}
      {section.dimensions?.floorToFloor && section.dimensions.floorToFloor.length > 0 && (
        <g>
          {section.dimensions.floorToFloor.map((fh, j: number) => (
            <g key={`fh-${j}`}>
              <rect x={svgWidth - marginRight - 60} y={svgHeight - marginBottom - 30 - j * 16} width="55" height="14"
                fill="#ECF0F1" stroke="#BDC3C7" strokeWidth="0.5" rx="2" />
              <text x={svgWidth - marginRight - 32} y={svgHeight - marginBottom - 21 - j * 16}
                textAnchor="middle" fontSize="7" fill="#2C3E50" fontWeight="bold" fontFamily="'Courier New', monospace">
                {fh.level}: {fh.height}
              </text>
            </g>
          ))}
        </g>
      )}

      {/* Overall height dimension */}
      {section.dimensions?.overall && (
        <g>
          <rect x={12} y={svgHeight - 20} width="90" height="14" fill="#ECF0F1" stroke="#BDC3C7" strokeWidth="0.5" rx="2" />
          <text x={57} y={svgHeight - 10} textAnchor="middle" fontSize="8" fill="#E74C3C" fontWeight="bold" fontFamily="'Courier New', monospace">
            HT: {section.dimensions.overall.height}
          </text>
        </g>
      )}
    </svg>
  )
}

// ============================================================
// PROFESSIONAL RCP SVG RENDERER (Architecture-Grade)
// ============================================================
function RCPSVG({ rcp }: { rcp: RCP }) {
  const svgWidth = 820
  const svgHeight = 620
  const marginLeft = 65
  const marginRight = 30
  const marginTop = 55
  const marginBottom = 95

  const elWidth = rcp.width || 1000
  const elHeight = rcp.height || 800
  const drawAreaW = svgWidth - marginLeft - marginRight
  const drawAreaH = svgHeight - marginTop - marginBottom
  const scaleX = drawAreaW / elWidth
  const scaleY = drawAreaH / elHeight
  const scale = Math.min(scaleX, scaleY) * 0.82

  const bldgW = elWidth * scale
  const bldgH = elHeight * scale
  const offsetX = marginLeft + (drawAreaW - bldgW) / 2
  const offsetY = marginTop + (drawAreaH - bldgH) / 2

  const tx = (x: number) => offsetX + x * scale
  const ty = (y: number) => offsetY + y * scale
  const ts = (s: number) => s * scale

  // Ceiling type color palette (professional, muted tones)
  const ceilingColors: Record<string, { fill: string; stroke: string; label: string; abbr: string }> = {
    'act': { fill: '#F0ECE4', stroke: '#C8BCAA', label: 'Acoustic Ceiling Tile', abbr: 'ACT' },
    'gwb': { fill: '#F7F7F4', stroke: '#D6D0C6', label: 'Gypsum Wall Board', abbr: 'GWB' },
    'gypsum': { fill: '#F7F7F4', stroke: '#D6D0C6', label: 'Gypsum Wall Board', abbr: 'GWB' },
    'suspended': { fill: '#EDE9E0', stroke: '#C4B8A8', label: 'Suspended Ceiling', abbr: 'SUS' },
    'exposed': { fill: '#E8E2D8', stroke: '#B8AEA0', label: 'Exposed Structure', abbr: 'EXP' },
    'drywall': { fill: '#F5F5F2', stroke: '#D0CAC0', label: 'Drywall Ceiling', abbr: 'DW' },
  }

  const getCeilingInfo = (type: string) => {
    const lower = type?.toLowerCase() || ''
    for (const [key, info] of Object.entries(ceilingColors)) {
      if (lower.includes(key)) return info
    }
    return { fill: '#F5F3F0', stroke: '#D0CAC0', label: type || 'Standard', abbr: type?.toUpperCase()?.substring(0, 3) || 'STD' }
  }

  // Fixed fixture symbol sizes (pixels, not scaled)
  const LT_R = 3.8     // downlight radius
  const TR_W = 12       // troffer width
  const TR_H = 5.5      // troffer height
  const HV_S = 6.5      // HVAC supply square
  const HV_R = 7.5      // HVAC return square
  const SP_R = 2.8      // sprinkler radius

  // Pre-compute room label bounding boxes for fixture collision avoidance
  const roomLabelBoxes: Array<{x1: number; y1: number; x2: number; y2: number}> = []
  rcp.rooms?.forEach((room: RCPRoom) => {
    const cx = tx(room.bounds.x + room.bounds.width / 2)
    const cy = ty(room.bounds.y + room.bounds.height / 2)
    const rw = ts(room.bounds.width)
    const rh = ts(room.bounds.height)
    const labelW = Math.min(rw * 0.75, 80)
    const labelH = Math.min(rh * 0.5, 28)
    roomLabelBoxes.push({
      x1: cx - labelW / 2 - 3,
      y1: cy - labelH / 2 - 3,
      x2: cx + labelW / 2 + 3,
      y2: cy + labelH / 2 + 3,
    })
  })

  // Check if fixture position overlaps any label box - uses fixture-specific padding
  const overlapsLabel = (fx: number, fy: number, fixtureSize: number = 6) => {
    // Dynamic padding: at least the fixture size, plus a small clearance buffer
    const pad = fixtureSize + 3
    return roomLabelBoxes.some(box =>
      fx + pad > box.x1 && fx - pad < box.x2 && fy + pad > box.y1 && fy - pad < box.y2
    )
  }

  // Check if fixture is within the building area
  const inBounds = (fx: number, fy: number) => {
    return fx >= offsetX + 2 && fx <= offsetX + bldgW - 2 &&
           fy >= offsetY + 2 && fy <= offsetY + bldgH - 2
  }

  // Grid reference labels (architectural convention: letters across top, numbers down side)
  const gridCols = Math.max(2, Math.min(8, Math.ceil(bldgW / 80)))
  const gridRows = Math.max(2, Math.min(6, Math.ceil(bldgH / 80)))
  const gridLetters = 'ABCDEFGH'

  return (
    <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto" style={{ minHeight: 400, background: '#FCFCFB' }}>
      <defs>
        {/* ACT 2x2 ceiling tile pattern */}
        <pattern id={`rcp-act-${rcp.level}`} x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
          <rect width="18" height="18" fill="none" />
          <line x1="0" y1="17.5" x2="18" y2="17.5" stroke="#D4CBB8" strokeWidth="0.3" />
          <line x1="17.5" y1="0" x2="17.5" y2="18" stroke="#D4CBB8" strokeWidth="0.3" />
        </pattern>
        {/* GWB smooth ceiling - nearly invisible */}
        <pattern id={`rcp-gwb-${rcp.level}`} x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="none" />
          <circle cx="20" cy="20" r="0.25" fill="#E0DCD4" opacity="0.3" />
        </pattern>
        {/* Dimension arrow marker */}
        <marker id="dim-arrow" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
          <polygon points="0,0 6,2 0,4" fill="#555" />
        </marker>
        <marker id="dim-arrow-rev" markerWidth="6" markerHeight="4" refX="1" refY="2" orient="auto">
          <polygon points="6,0 0,2 6,4" fill="#555" />
        </marker>
      </defs>

      {/* Outer drawing sheet border */}
      <rect x="2" y="2" width={svgWidth - 4} height={svgHeight - 4} fill="none" stroke="#222" strokeWidth="2" />
      <rect x="5" y="5" width={svgWidth - 10} height={svgHeight - 10} fill="none" stroke="#444" strokeWidth="0.5" />

      {/* Title block - top bar */}
      <rect x="5" y="5" width={svgWidth - 10} height="34" fill="#1A3C5E" />
      <text x={svgWidth / 2} y="28" textAnchor="middle" fontSize="14" fontWeight="bold" fill="white"
        fontFamily="'Courier New', monospace" letterSpacing="3">
        {rcp.title || `REFLECTED CEILING PLAN - ${rcp.level?.toUpperCase()}`}
      </text>
      <text x={svgWidth - 14} y="28" textAnchor="end" fontSize="7.5" fill="#8BB8E0" fontFamily="'Courier New', monospace">
        SCALE 1:{rcp.scale || 100}
      </text>
      <text x="14" y="28" textAnchor="start" fontSize="7.5" fill="#8BB8E0" fontFamily="'Courier New', monospace">
        SHEET RCP-{rcp.level?.replace(/[^0-9]/g, '') || '1'}
      </text>

      {/* Grid reference circles - top (A, B, C...) */}
      {Array.from({ length: gridCols }).map((_, gi) => {
        const gx = offsetX + (gi + 0.5) * (bldgW / gridCols)
        return (
          <g key={`gc-${gi}`}>
            <circle cx={gx} cy={offsetY - 14} r="8" fill="none" stroke="#555" strokeWidth="0.8" />
            <text x={gx} y={offsetY - 10.5} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#333"
              fontFamily="'Courier New', monospace">{gridLetters[gi]}</text>
            <line x1={gx} y1={offsetY - 6} x2={gx} y2={offsetY} stroke="#888" strokeWidth="0.4" strokeDasharray="2,2" />
          </g>
        )
      })}

      {/* Grid reference circles - left (1, 2, 3...) */}
      {Array.from({ length: gridRows }).map((_, gi) => {
        const gy = offsetY + (gi + 0.5) * (bldgH / gridRows)
        return (
          <g key={`gr-${gi}`}>
            <circle cx={offsetX - 14} cy={gy} r="8" fill="none" stroke="#555" strokeWidth="0.8" />
            <text x={offsetX - 14} y={gy + 3} textAnchor="middle" fontSize="7.5" fontWeight="bold" fill="#333"
              fontFamily="'Courier New', monospace">{gi + 1}</text>
            <line x1={offsetX - 6} y1={gy} x2={offsetX} y2={gy} stroke="#888" strokeWidth="0.4" strokeDasharray="2,2" />
          </g>
        )
      })}

      {/* Building outline (dashed - RCP convention shows plan below as reflected) */}
      <rect x={offsetX} y={offsetY} width={bldgW} height={bldgH}
        fill="#F8F7F4" stroke="#666" strokeWidth="1.2" strokeDasharray="8,4" />

      {/* ---- LAYER 1: Room fills with ceiling type differentiation ---- */}
      {rcp.rooms?.map((room: RCPRoom, i: number) => {
        const ceilInfo = getCeilingInfo(room.ceilingType)
        const rx = tx(room.bounds.x)
        const ry = ty(room.bounds.y)
        const rw = ts(room.bounds.width)
        const rh = ts(room.bounds.height)
        const isACT = room.ceilingType?.toUpperCase() === 'ACT'
        const patId = isACT ? `rcp-act-${rcp.level}` : `rcp-gwb-${rcp.level}`

        return (
          <g key={`rf-${i}`}>
            {/* Solid ceiling fill */}
            <rect x={rx} y={ry} width={rw} height={rh} fill={ceilInfo.fill} stroke="none" />
            {/* Subtle tile/texture overlay */}
            <rect x={rx} y={ry} width={rw} height={rh} fill={`url(#${patId})`} stroke="none" />
            {/* Wall lines - thick solid (architectural standard) */}
            <rect x={rx} y={ry} width={rw} height={rh}
              fill="none" stroke="#2D3E4E" strokeWidth="2" strokeLinejoin="miter" />
          </g>
        )
      })}

      {/* ---- LAYER 2: Ceiling grid lines (ACT rooms only, subtle) ---- */}
      {rcp.ceilingGrid?.map((line, i: number) => (
        <line key={`cg-${i}`}
          x1={tx(line.start.x)} y1={ty(line.start.y)}
          x2={tx(line.end.x)} y2={ty(line.end.y)}
          stroke="#C5BAA8" strokeWidth="0.25" strokeDasharray="3,2" opacity="0.6"
        />
      ))}

      {/* ---- LAYER 3: Fixtures (filtered to avoid label overlap) ---- */}

      {/* Lighting fixtures */}
      {rcp.lightingFixtures?.map((fix: RCPFixture, i: number) => {
        const cx = tx(fix.position.x)
        const cy = ty(fix.position.y)
        if (!inBounds(cx, cy)) return null
        const ftype = fix.type?.toLowerCase() || ''
        const isTrofferCheck = ftype.includes('troffer') || ftype.includes('panel') || ftype.includes('2x4') || ftype.includes('2x2')
        if (overlapsLabel(cx, cy, isTrofferCheck ? TR_W / 2 : LT_R + 2)) return null
        const isTroffer = ftype.includes('troffer') || ftype.includes('panel') || ftype.includes('2x4') || ftype.includes('2x2')
        const isDownlight = ftype.includes('downlight') || ftype.includes('recessed')
        const isPendant = ftype.includes('pendant')
        const isChandelier = ftype.includes('chandelier')

        if (isTroffer) {
          return (
            <g key={`lt-${i}`} opacity="0.85">
              <rect x={cx - TR_W / 2} y={cy - TR_H / 2} width={TR_W} height={TR_H}
                fill="#FFFCE8" stroke="#D47A00" strokeWidth="0.7" rx="0.5" />
              <line x1={cx - TR_W / 2 + 1.5} y1={cy} x2={cx + TR_W / 2 - 1.5} y2={cy} stroke="#D47A00" strokeWidth="0.35" />
              <line x1={cx} y1={cy - TR_H / 2 + 1} x2={cx} y2={cy + TR_H / 2 - 1} stroke="#D47A00" strokeWidth="0.35" />
            </g>
          )
        }
        if (isDownlight) {
          return (
            <g key={`lt-${i}`} opacity="0.85">
              <circle cx={cx} cy={cy} r={LT_R} fill="none" stroke="#D47A00" strokeWidth="0.8" />
              <circle cx={cx} cy={cy} r={LT_R * 0.4} fill="#FFD54F" stroke="#D47A00" strokeWidth="0.35" />
            </g>
          )
        }
        if (isChandelier) {
          return (
            <g key={`lt-${i}`} opacity="0.85">
              <circle cx={cx} cy={cy} r={LT_R + 2.5} fill="none" stroke="#D47A00" strokeWidth="0.8" />
              <circle cx={cx} cy={cy} r={LT_R - 0.5} fill="none" stroke="#D47A00" strokeWidth="0.5" />
              <circle cx={cx} cy={cy} r="1.2" fill="#D47A00" />
            </g>
          )
        }
        if (isPendant) {
          return (
            <g key={`lt-${i}`} opacity="0.85">
              <circle cx={cx} cy={cy} r={LT_R} fill="none" stroke="#D47A00" strokeWidth="0.8" />
              <line x1={cx - 2} y1={cy} x2={cx + 2} y2={cy} stroke="#D47A00" strokeWidth="0.5" />
              <circle cx={cx} cy={cy} r="1" fill="#D47A00" />
            </g>
          )
        }
        // Default ceiling mount
        return (
          <g key={`lt-${i}`} opacity="0.85">
            <circle cx={cx} cy={cy} r={LT_R} fill="#FFFCE8" stroke="#D47A00" strokeWidth="0.7" />
            <line x1={cx - LT_R * 0.5} y1={cy} x2={cx + LT_R * 0.5} y2={cy} stroke="#D47A00" strokeWidth="0.4" />
            <line x1={cx} y1={cy - LT_R * 0.5} x2={cx} y2={cy + LT_R * 0.5} stroke="#D47A00" strokeWidth="0.4" />
          </g>
        )
      })}

      {/* HVAC supply diffusers */}
      {rcp.hvacDiffusers?.map((fix: RCPFixture, i: number) => {
        const cx = tx(fix.position.x)
        const cy = ty(fix.position.y)
        if (!inBounds(cx, cy)) return null
        const isReturn = fix.type === 'return'
        if (overlapsLabel(cx, cy, (isReturn ? HV_R : HV_S) / 2)) return null
        const s = isReturn ? HV_R : HV_S

        return (
          <g key={`hv-${i}`} opacity="0.8">
            <rect x={cx - s / 2} y={cy - s / 2} width={s} height={s}
              fill={isReturn ? '#E8F5E9' : '#E3F2FD'} stroke={isReturn ? '#2E7D32' : '#1565C0'} strokeWidth="0.7" rx="0.5" />
            {isReturn ? (
              <>
                <line x1={cx - s * 0.28} y1={cy - s * 0.28} x2={cx + s * 0.28} y2={cy + s * 0.28} stroke="#2E7D32" strokeWidth="0.45" />
                <line x1={cx + s * 0.28} y1={cy - s * 0.28} x2={cx - s * 0.28} y2={cy + s * 0.28} stroke="#2E7D32" strokeWidth="0.45" />
              </>
            ) : (
              <>
                <line x1={cx - s * 0.28} y1={cy} x2={cx + s * 0.28} y2={cy} stroke="#1565C0" strokeWidth="0.35" />
                <line x1={cx} y1={cy - s * 0.28} x2={cx} y2={cy + s * 0.28} stroke="#1565C0" strokeWidth="0.35" />
              </>
            )}
          </g>
        )
      })}

      {/* Sprinkler heads */}
      {rcp.sprinklers?.map((fix: RCPFixture, i: number) => {
        const cx = tx(fix.position.x)
        const cy = ty(fix.position.y)
        if (!inBounds(cx, cy)) return null
        if (overlapsLabel(cx, cy, SP_R)) return null
        return (
          <g key={`sp-${i}`} opacity="0.8">
            <circle cx={cx} cy={cy} r={SP_R} fill="none" stroke="#B71C1C" strokeWidth="0.7" />
            <circle cx={cx} cy={cy} r="0.9" fill="#B71C1C" />
          </g>
        )
      })}

      {/* ---- LAYER 4: Room labels (always on top of fixtures) ---- */}
      {rcp.rooms?.map((room: RCPRoom, i: number) => {
        const ceilInfo = getCeilingInfo(room.ceilingType)
        const cx = tx(room.bounds.x + room.bounds.width / 2)
        const cy = ty(room.bounds.y + room.bounds.height / 2)
        const rw = ts(room.bounds.width)
        const rh = ts(room.bounds.height)

        // Compute area in sqft (approximate)
        const areaFt = (room.bounds.width * room.bounds.height) / (rcp.scale || 1)

        // Scale label to fit room comfortably
        const labelW = Math.min(rw * 0.75, 80)
        const labelH = Math.min(rh * 0.5, 28)
        const fontSize = Math.min(Math.max(labelW / (room.name.length * 0.58), 4.5), 8.5)
        const subSize = Math.min(fontSize * 0.72, 6)

        // Skip labels for very small rooms
        if (rw < 22 || rh < 18) {
          // For tiny rooms, show just room number tag
          if (rw >= 12 && rh >= 10) {
            return (
              <g key={`tl-${i}`}>
                <rect x={cx - 6} y={cy - 5} width="12" height="10"
                  fill="white" stroke="#AAA" strokeWidth="0.4" rx="1.5" opacity="0.9" />
                <text x={cx} y={cy + 2} textAnchor="middle" fontSize="5" fill="#555" fontWeight="bold"
                  fontFamily="'Courier New', monospace">R{i + 1}</text>
              </g>
            )
          }
          return null
        }

        return (
          <g key={`label-${i}`}>
            {/* Label card background */}
            <rect x={cx - labelW / 2} y={cy - labelH / 2}
              width={labelW} height={labelH}
              fill="white" stroke="#8899AA" strokeWidth="0.6" rx="2" opacity="0.95" />
            {/* Top divider line */}
            <line x1={cx - labelW / 2 + 2} y1={cy - labelH / 2 + labelH * 0.5}
              x2={cx + labelW / 2 - 2} y2={cy - labelH / 2 + labelH * 0.5}
              stroke="#CCC" strokeWidth="0.3" />
            {/* Room name - upper half */}
            <text x={cx} y={cy - labelH * 0.08}
              textAnchor="middle" fontSize={fontSize} fill="#1A2D3E" fontWeight="bold"
              fontFamily="'Courier New', monospace">
              {room.name.toUpperCase()}
            </text>
            {/* Ceiling info - lower half */}
            <text x={cx} y={cy + labelH * 0.35}
              textAnchor="middle" fontSize={subSize} fill="#607D8B"
              fontFamily="'Courier New', monospace">
              {ceilInfo.abbr} @ {room.ceilingHeight}&apos;-0&quot;
            </text>
          </g>
        )
      })}

      {/* ---- LAYER 5: Dimension lines ---- */}
      {/* Horizontal overall dimension - bottom */}
      <g>
        <line x1={offsetX} y1={offsetY + bldgH + 16} x2={offsetX + bldgW} y2={offsetY + bldgH + 16}
          stroke="#555" strokeWidth="0.6" markerStart="url(#dim-arrow-rev)" markerEnd="url(#dim-arrow)" />
        <line x1={offsetX} y1={offsetY + bldgH + 8} x2={offsetX} y2={offsetY + bldgH + 22}
          stroke="#555" strokeWidth="0.4" />
        <line x1={offsetX + bldgW} y1={offsetY + bldgH + 8} x2={offsetX + bldgW} y2={offsetY + bldgH + 22}
          stroke="#555" strokeWidth="0.4" />
        <rect x={(offsetX + offsetX + bldgW) / 2 - 20} y={offsetY + bldgH + 10} width="40" height="12"
          fill="white" stroke="none" />
        <text x={(offsetX + offsetX + bldgW) / 2} y={offsetY + bldgH + 20}
          textAnchor="middle" fontSize="7" fill="#333" fontWeight="bold" fontFamily="'Courier New', monospace">
          {Math.round(elWidth / (rcp.scale || 1))}&apos;-0&quot;
        </text>
      </g>

      {/* Vertical overall dimension - right */}
      <g>
        <line x1={offsetX + bldgW + 16} y1={offsetY} x2={offsetX + bldgW + 16} y2={offsetY + bldgH}
          stroke="#555" strokeWidth="0.6" markerStart="url(#dim-arrow-rev)" markerEnd="url(#dim-arrow)" />
        <line x1={offsetX + bldgW + 8} y1={offsetY} x2={offsetX + bldgW + 22} y2={offsetY}
          stroke="#555" strokeWidth="0.4" />
        <line x1={offsetX + bldgW + 8} y1={offsetY + bldgH} x2={offsetX + bldgW + 22} y2={offsetY + bldgH}
          stroke="#555" strokeWidth="0.4" />
        <text x={offsetX + bldgW + 20} y={(offsetY + offsetY + bldgH) / 2 + 2}
          textAnchor="middle" fontSize="7" fill="#333" fontWeight="bold" fontFamily="'Courier New', monospace"
          transform={`rotate(-90, ${offsetX + bldgW + 20}, ${(offsetY + offsetY + bldgH) / 2})`}>
          {Math.round(elHeight / (rcp.scale || 1))}&apos;-0&quot;
        </text>
      </g>

      {/* ---- LAYER 6: Professional Legend (bottom strip) ---- */}
      <g transform={`translate(${svgWidth / 2 - 220}, ${svgHeight - 72})`}>
        {/* Legend box */}
        <rect x="-6" y="-16" width="448" height="56" fill="white" stroke="#666" strokeWidth="0.8" />
        <rect x="-6" y="-16" width="448" height="13" fill="#E8E8E8" stroke="#666" strokeWidth="0.5" />
        <text x="218" y="-6" textAnchor="middle" fontSize="7" fontWeight="bold" fill="#222"
          fontFamily="'Courier New', monospace" letterSpacing="2">SYMBOL LEGEND</text>

        {/* Row of symbols */}
        {/* 1. Downlight */}
        <circle cx="14" cy="22" r={LT_R} fill="none" stroke="#D47A00" strokeWidth="0.8" />
        <circle cx="14" cy="22" r={LT_R * 0.4} fill="#FFD54F" stroke="#D47A00" strokeWidth="0.35" />
        <text x="24" y="25" fontSize="6" fill="#333" fontFamily="'Courier New', monospace">DOWNLIGHT</text>

        {/* 2. Troffer */}
        <rect x={78} y={22 - TR_H / 2} width={TR_W} height={TR_H}
          fill="#FFFCE8" stroke="#D47A00" strokeWidth="0.7" rx="0.5" />
        <line x1={79.5} y1={22} x2={78 + TR_W - 1.5} y2={22} stroke="#D47A00" strokeWidth="0.3" />
        <text x="96" y="25" fontSize="6" fill="#333" fontFamily="'Courier New', monospace">TROFFER</text>

        {/* 3. Supply diffuser */}
        <rect x={142} y={22 - HV_S / 2} width={HV_S} height={HV_S}
          fill="#E3F2FD" stroke="#1565C0" strokeWidth="0.7" rx="0.5" />
        <line x1={142 + HV_S * 0.22} y1={22} x2={142 + HV_S * 0.78} y2={22} stroke="#1565C0" strokeWidth="0.35" />
        <line x1={142 + HV_S / 2} y1={22 - HV_S * 0.28} x2={142 + HV_S / 2} y2={22 + HV_S * 0.28} stroke="#1565C0" strokeWidth="0.35" />
        <text x="155" y="25" fontSize="6" fill="#333" fontFamily="'Courier New', monospace">SUPPLY</text>

        {/* 4. Return diffuser */}
        <rect x={196} y={22 - HV_R / 2} width={HV_R} height={HV_R}
          fill="#E8F5E9" stroke="#2E7D32" strokeWidth="0.7" rx="0.5" />
        <line x1={198} y1={19} x2={201.5} y2={25} stroke="#2E7D32" strokeWidth="0.4" />
        <line x1={201.5} y1={19} x2={198} y2={25} stroke="#2E7D32" strokeWidth="0.4" />
        <text x="210" y="25" fontSize="6" fill="#333" fontFamily="'Courier New', monospace">RETURN</text>

        {/* 5. Sprinkler */}
        <circle cx="264" cy="22" r={SP_R} fill="none" stroke="#B71C1C" strokeWidth="0.7" />
        <circle cx="264" cy="22" r="0.9" fill="#B71C1C" />
        <text x="272" y="25" fontSize="6" fill="#333" fontFamily="'Courier New', monospace">SPRINKLER</text>

        {/* 6. ACT ceiling swatch */}
        <rect x="326" y="16" width="12" height="12" fill="#F0ECE4" stroke="#C8BCAA" strokeWidth="0.5" />
        <line x1="332" y1="16" x2="332" y2="28" stroke="#C8BCAA" strokeWidth="0.3" />
        <line x1="326" y1="22" x2="338" y2="22" stroke="#C8BCAA" strokeWidth="0.3" />
        <text x="343" y="25" fontSize="6" fill="#333" fontFamily="'Courier New', monospace">ACT</text>

        {/* 7. GWB ceiling swatch */}
        <rect x="370" y="16" width="12" height="12" fill="#F7F7F4" stroke="#D6D0C6" strokeWidth="0.5" />
        <text x="387" y="25" fontSize="6" fill="#333" fontFamily="'Courier New', monospace">GWB</text>

        {/* 8. North arrow */}
        <g transform="translate(420, 22)">
          <line x1="0" y1="10" x2="0" y2="-10" stroke="#333" strokeWidth="1" />
          <polygon points="-3,-4 0,-12 3,-4" fill="#333" />
          <text x="0" y="-14" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#333"
            fontFamily="'Courier New', monospace">N</text>
        </g>
      </g>
    </svg>
  )
}

// ============================================================
// MAIN DRAWINGS PAGE
// ============================================================
function DrawingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { generatedPlan, setGeneratedPlan } = usePlannerStore()
  const [mounted, setMounted] = useState(false)
  const [drawings, setDrawings] = useState<AllDrawingsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingProject, setIsLoadingProject] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('elevations')

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, authLoading, router])

  // Helper: check if a plan object has valid floor data
  const isPlanValid = (plan: unknown): boolean => {
    if (!plan || typeof plan !== 'object') return false
    const p = plan as Record<string, unknown>
    return !!(p.floors && Array.isArray(p.floors) && (p.floors as unknown[]).length > 0)
  }

  // Load plan from projectId query param if no plan is in store
  useEffect(() => {
    const projectId = searchParams.get('projectId')
    if (mounted && isAuthenticated && !generatedPlan && projectId) {
      setIsLoadingProject(true)
      projectsApi.getProjectById(parseInt(projectId)).then((response) => {
        if (response.success && response.data?.project?.plan) {
          const projectPlan = response.data.project.plan
          if (isPlanValid(projectPlan)) {
            setGeneratedPlan(projectPlan)
          } else {
            // Project exists but has no floor plan data
            setError(`Project "${response.data.project.name || 'Untitled'}" does not have a floor plan saved. Generate a floor plan first in the AI Generator, then save it to the project.`)
          }
        } else {
          setError('Could not load plan data from this project.')
        }
        setIsLoadingProject(false)
      }).catch(() => {
        setError('Failed to load project data.')
        setIsLoadingProject(false)
      })
    }
  }, [mounted, isAuthenticated, generatedPlan, searchParams, setGeneratedPlan])

  const generateAllDrawings = async () => {
    if (!generatedPlan) return

    if (!isPlanValid(generatedPlan)) {
      setError('The current plan does not contain floor data. Please generate a floor plan first using the AI Generator.')
      return
    }

    setIsLoading(true)
    setError(null)
    try {
      const response = await drawingsApi.generateAllDrawings(generatedPlan)
      if (response.success && response.data) {
        setDrawings(response.data as unknown as AllDrawingsResponse)
      } else {
        setError(response.message || 'Failed to generate drawings')
      }
    } catch {
      setError('Failed to generate drawings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!mounted || authLoading) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </main>
    )
  }

  if (!isAuthenticated) return null

  // Stats
  const totalElevations = drawings?.elevations?.length || 0
  const totalSections = drawings?.sections?.length || 0
  const totalSchedules = drawings?.schedules ? Object.keys(drawings.schedules).length : 0
  const totalRCP = drawings?.rcp?.length || 0

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-1">Professional Drawings</h1>
            <p className="text-muted-foreground">
              Architectural elevations, sections, RCP, and schedules
            </p>
          </div>
        </div>
        {drawings && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Grid3X3 className="w-4 h-4" />
            <span>{totalElevations + totalSections + totalSchedules + totalRCP} drawing sheets</span>
          </div>
        )}
      </div>

      {/* Error display */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5 mb-6">
          <CardContent className="flex items-start gap-4 py-4">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive font-medium">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="shrink-0 text-muted-foreground">
              Dismiss
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading project data */}
      {isLoadingProject ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">Loading project data...</span>
        </div>
      ) : !generatedPlan || !isPlanValid(generatedPlan) ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Floor Plan Available</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {searchParams.get('projectId')
                ? 'This project does not have a floor plan saved yet. Generate one first using the AI Generator, then save it to your project.'
                : 'Generate a floor plan first using the AI Generator, or open a project that has a saved plan.'}
            </p>
            <div className="flex gap-3">
              <Button onClick={() => router.push('/generator')}>
                Go to Generator
              </Button>
              <Button variant="outline" onClick={() => router.push('/projects')}>
                Open Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !drawings ? (
        /* Generate Drawings CTA */
        <Card className="border-2 border-dashed border-primary/30">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <FileImage className="w-10 h-10 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Ready to Generate Drawings</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-lg">
              Generate professional architectural drawings including building elevations (N/S/E/W), cross-sections, reflected ceiling plans, and complete door/window/room/finish schedules.
            </p>
            <Button onClick={generateAllDrawings} disabled={isLoading} size="lg" className="gap-2">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Layers className="w-5 h-5" />}
              Generate All Drawings
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Drawings Viewer */
        <>
          {/* Summary stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <FileImage className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{totalElevations}</p>
                <p className="text-xs text-blue-600/70">Elevations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900">
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <Layers className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-700 dark:text-purple-400">{totalSections}</p>
                <p className="text-xs text-purple-600/70">Sections</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
              <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totalRCP}</p>
                <p className="text-xs text-amber-600/70">RCP Sheets</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Table2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-700 dark:text-green-400">{totalSchedules}</p>
                <p className="text-xs text-green-600/70">Schedules</p>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="elevations" className="gap-2">
                <FileImage className="w-4 h-4" /> Elevations
              </TabsTrigger>
              <TabsTrigger value="sections" className="gap-2">
                <Layers className="w-4 h-4" /> Sections
              </TabsTrigger>
              <TabsTrigger value="rcp" className="gap-2">
                <Lightbulb className="w-4 h-4" /> RCP
              </TabsTrigger>
              <TabsTrigger value="schedules" className="gap-2">
                <Table2 className="w-4 h-4" /> Schedules
              </TabsTrigger>
            </TabsList>

            {/* Elevations Tab */}
            <TabsContent value="elevations">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {drawings.elevations?.map((elevation: Elevation, i: number) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                            {elevation.direction.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <CardTitle className="text-sm capitalize">{elevation.direction} Elevation</CardTitle>
                            <CardDescription className="text-xs">
                              {elevation.elements?.length || 0} elements | {elevation.dimensions?.overall?.width} x {elevation.dimensions?.overall?.height}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Ruler className="w-3 h-3" />
                          <span>1:{elevation.scale}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2">
                      <ElevationSVG elevation={elevation} />
                      {elevation.dimensions?.floorHeights && elevation.dimensions.floorHeights.length > 0 && (
                        <div className="mt-2 px-2 flex gap-2 flex-wrap">
                          {elevation.dimensions.floorHeights.map((fh, j: number) => (
                            <span key={j} className="text-xs px-2 py-1 bg-muted rounded-md font-mono">
                              {fh.level}: {fh.height}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Sections Tab */}
            <TabsContent value="sections">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {drawings.sections?.map((section: Section, i: number) => (
                  <Card key={i} className="overflow-hidden">
                    <CardHeader className="pb-3 bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-700 dark:text-purple-400 font-bold text-sm">
                            {section.id}
                          </div>
                          <div>
                            <CardTitle className="text-sm">{section.title}</CardTitle>
                            <CardDescription className="text-xs">
                              {section.direction} | Cut @ {section.cutPosition}&apos; | {section.elements?.length || 0} elements
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Ruler className="w-3 h-3" />
                          <span>1:{section.scale}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-2">
                      <SectionSVG section={section} />
                      {section.dimensions?.floorToFloor && section.dimensions.floorToFloor.length > 0 && (
                        <div className="mt-2 px-2 flex gap-2 flex-wrap">
                          {section.dimensions.floorToFloor.map((fh, j: number) => (
                            <span key={j} className="text-xs px-2 py-1 bg-muted rounded-md font-mono">
                              {fh.level}: {fh.height}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* RCP Tab */}
            <TabsContent value="rcp">
              {drawings.rcp && drawings.rcp.length > 0 ? (
                <div className="space-y-6">
                  {drawings.rcp.map((rcpLevel: RCP, idx: number) => (
                    <Card key={idx} className="overflow-hidden">
                      <CardHeader className="pb-3 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
                              <Lightbulb className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                            </div>
                            <div>
                              <CardTitle className="text-sm">{rcpLevel.title || `Reflected Ceiling Plan - ${rcpLevel.level}`}</CardTitle>
                              <CardDescription className="text-xs">
                                Lighting, HVAC & Sprinkler Layout | Scale 1:{rcpLevel.scale}
                              </CardDescription>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-2">
                        <RCPSVG rcp={rcpLevel} />

                        {/* Fixture stats */}
                        <div className="mt-4 grid grid-cols-3 gap-3">
                          <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg border border-yellow-200 dark:border-yellow-900">
                            <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                              <Lightbulb className="w-4 h-4 text-yellow-700" />
                            </div>
                            <div>
                              <p className="text-xl font-bold text-yellow-700 dark:text-yellow-400">{rcpLevel.lightingFixtures?.length || 0}</p>
                              <p className="text-xs text-yellow-600/70">Lights</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
                            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <Grid3X3 className="w-4 h-4 text-blue-700" />
                            </div>
                            <div>
                              <p className="text-xl font-bold text-blue-700 dark:text-blue-400">{rcpLevel.hvacDiffusers?.length || 0}</p>
                              <p className="text-xs text-blue-600/70">HVAC</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
                              <AlertCircle className="w-4 h-4 text-red-700" />
                            </div>
                            <div>
                              <p className="text-xl font-bold text-red-700 dark:text-red-400">{rcpLevel.sprinklers?.length || 0}</p>
                              <p className="text-xs text-red-600/70">Sprinklers</p>
                            </div>
                          </div>
                        </div>

                        {/* Room ceiling info */}
                        {rcpLevel.rooms && rcpLevel.rooms.length > 0 && (
                          <div className="mt-3">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Room Ceilings</p>
                            <div className="flex flex-wrap gap-2">
                              {rcpLevel.rooms.map((room: RCPRoom, i: number) => (
                                <span key={i} className="text-xs px-2.5 py-1.5 bg-muted rounded-md font-mono border">
                                  {room.name}: {room.ceilingType} @ {room.ceilingHeight}&apos;-0&quot;
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  No RCP data available
                </div>
              )}
            </TabsContent>

            {/* Schedules Tab */}
            <TabsContent value="schedules">
              <div className="space-y-6">
                {drawings.schedules && Object.entries(drawings.schedules).map(([key, schedule]: [string, Schedule]) => (
                  <Card key={key} className="overflow-hidden">
                    <CardHeader className="bg-muted/30 pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                            <Table2 className="w-4 h-4 text-green-700 dark:text-green-400" />
                          </div>
                          <div>
                            <CardTitle className="text-sm">{schedule.title}</CardTitle>
                            <CardDescription className="text-xs capitalize">
                              {schedule.rows?.length || 0} entries
                            </CardDescription>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {schedule.rows && schedule.rows.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm table-fixed">
                            <thead>
                              <tr className="bg-muted/50">
                                {schedule.headers?.length > 0 ? schedule.headers.map((header, hi) => (
                                  <th key={header} className={`text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b ${hi === 0 ? 'w-16' : 'min-w-[80px]'}`}>
                                    {header.replace(/_/g, ' ')}
                                  </th>
                                )) : Object.keys(schedule.rows[0]).map((colKey, hi) => (
                                  <th key={colKey} className={`text-left p-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground border-b ${hi === 0 ? 'w-16' : 'min-w-[80px]'}`}>
                                    {colKey.replace(/_/g, ' ')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {schedule.rows.map((row, j: number) => (
                                <tr key={j} className={`border-b last:border-0 ${j % 2 === 0 ? 'bg-background' : 'bg-muted/20'} hover:bg-muted/40 transition-colors`}>
                                  {Object.values(row).map((val, k) => (
                                    <td key={k} className="p-3 text-sm font-mono break-words max-w-[200px]">
                                      {String(val)}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-muted-foreground p-4">No data</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="mt-6 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={generateAllDrawings}>
            Try Again
          </Button>
        </div>
      )}
    </main>
  )
}

export default function DrawingsPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Suspense fallback={
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      }>
        <DrawingsContent />
      </Suspense>
    </div>
  )
}
