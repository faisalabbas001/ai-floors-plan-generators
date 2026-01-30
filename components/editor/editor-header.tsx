'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import {
  ChevronDown,
  Globe,
  Download,
  FileJson,
  Image,
  FileImage,
  FileCode,
  Box,
  Square,
  Loader2,
  FileText,
} from 'lucide-react'
import { jsPDF } from 'jspdf'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useEditorStore } from '@/lib/stores/editor-store'
import { useAuthStore } from '@/lib/stores'
import { exportToJSON, exportToDXF } from '@/lib/utils/export'
import type { Canvas2DHandle } from './canvas-2d'

interface EditorHeaderProps {
  canvas2DRef?: React.RefObject<Canvas2DHandle | null>
}

export function EditorHeader({ canvas2DRef }: EditorHeaderProps) {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuthStore()
  const {
    viewMode,
    setViewMode,
    floorPlan,
    exportToJSON: getExportJSON,
    selectedFloorId,
    clearEditor,
  } = useEditorStore()

  const [isExporting, setIsExporting] = useState(false)

  const handleExportJSON = () => {
    if (!floorPlan) return
    setIsExporting(true)
    try {
      const jsonData = JSON.parse(getExportJSON())
      exportToJSON(jsonData, { filename: `floor-plan-${Date.now()}` })
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPNG = async () => {
    if (!floorPlan) {
      alert('No floor plan to export. Please generate or load a plan first.')
      return
    }
    if (viewMode !== '2d') {
      alert('Please switch to 2D view to export as PNG.')
      return
    }

    setIsExporting(true)
    try {
      // Small delay to ensure canvas is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!canvas2DRef?.current) {
        alert('Canvas not ready. Please try again.')
        setIsExporting(false)
        return
      }

      const dataURL = canvas2DRef.current.toDataURL('image/png', 1)
      if (dataURL) {
        const link = document.createElement('a')
        link.download = `floor-plan-${floorPlan.buildingType || 'design'}-${Date.now()}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('Unable to capture canvas. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting PNG:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportJPG = async () => {
    if (!floorPlan) {
      alert('No floor plan to export. Please generate or load a plan first.')
      return
    }
    if (viewMode !== '2d') {
      alert('Please switch to 2D view to export as JPG.')
      return
    }

    setIsExporting(true)
    try {
      // Small delay to ensure canvas is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!canvas2DRef?.current) {
        alert('Canvas not ready. Please try again.')
        setIsExporting(false)
        return
      }

      const dataURL = canvas2DRef.current.toDataURL('image/jpeg', 0.9)
      if (dataURL) {
        const link = document.createElement('a')
        link.download = `floor-plan-${floorPlan.buildingType || 'design'}-${Date.now()}.jpg`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        alert('Unable to capture canvas. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting JPG:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportPDF = async () => {
    if (!floorPlan) {
      alert('No floor plan to export. Please generate or load a plan first.')
      return
    }
    if (viewMode !== '2d') {
      alert('Please switch to 2D view to export as PDF.')
      return
    }

    setIsExporting(true)
    try {
      // Small delay to ensure canvas is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      if (!canvas2DRef?.current) {
        alert('Canvas not ready. Please try again.')
        setIsExporting(false)
        return
      }

      const dataURL = canvas2DRef.current.toDataURL('image/png', 1)
      if (!dataURL) {
        alert('Unable to capture canvas. Please try again.')
        setIsExporting(false)
        return
      }

      // Create PDF in landscape A4 format
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Add title
      pdf.setFontSize(18)
      pdf.setTextColor(30, 74, 124) // Brand blue
      pdf.text(floorPlan.buildingType || 'Floor Plan', 15, 15)

      // Add metadata
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      const currentFloor = floorPlan.floors.find((f) => f.id === selectedFloorId)
      if (currentFloor) {
        pdf.text(`Floor: ${currentFloor.level}`, 15, 22)
        if (currentFloor.totalArea) {
          pdf.text(`Total Area: ${currentFloor.totalArea} sq ft`, 15, 27)
        }
      }
      pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 15, currentFloor?.totalArea ? 32 : 27)

      // Load and add the floor plan image
      const img = document.createElement('img')
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = dataURL
      })

      // Calculate dimensions to fit the page with margins
      const margin = 15
      const availableWidth = pageWidth - margin * 2
      const availableHeight = pageHeight - 45 // Account for header

      const imgAspect = img.width / img.height
      const pageAspect = availableWidth / availableHeight

      let imgWidth: number, imgHeight: number
      if (imgAspect > pageAspect) {
        imgWidth = availableWidth
        imgHeight = availableWidth / imgAspect
      } else {
        imgHeight = availableHeight
        imgWidth = availableHeight * imgAspect
      }

      // Center the image horizontally
      const xOffset = margin + (availableWidth - imgWidth) / 2
      const yOffset = 40

      pdf.addImage(dataURL, 'PNG', xOffset, yOffset, imgWidth, imgHeight)

      // Add footer
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Generated by FloorPlan AI', pageWidth - 50, pageHeight - 5)

      // Save the PDF
      pdf.save(`floor-plan-${floorPlan.buildingType || 'design'}-${Date.now()}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportDXF = () => {
    if (!floorPlan) return
    setIsExporting(true)
    try {
      const currentFloor = floorPlan.floors.find((f) => f.id === selectedFloorId)
      if (currentFloor) {
        const rooms = currentFloor.rooms.map((room) => ({
          name: room.name,
          x: room.x,
          y: room.y,
          width: room.width,
          height: room.height,
          areaSqft: room.areaSqft,
        }))
        exportToDXF(rooms, { filename: `floor-plan-${Date.now()}` })
      }
    } finally {
      setIsExporting(false)
    }
  }

  const handleNewPlan = () => {
    clearEditor()
    router.push('/generator')
  }

  return (
    <header className="flex h-12 items-center justify-between border-b border-border bg-background px-2 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Link href="/" className="flex items-center">
          <NextImage
            src="/Flowplanlogo.png"
            alt="FloorPlan AI Logo"
            width={140}
            height={38}
            className="h-7 sm:h-9 w-auto"
            priority
          />
        </Link>

        <nav className="hidden items-center gap-4 lg:flex">
          <Link href="/" className="text-sm transition-colors hover:text-primary">
            Home
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm transition-colors hover:text-primary">
              Floor Plan <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <Link href="/generator">Floor Plan Generator</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/editor">Floor Plan Editor</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm transition-colors hover:text-primary">
              Home Design <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Interior Design AI</DropdownMenuItem>
              <DropdownMenuItem>Exterior Design AI</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1 text-sm transition-colors hover:text-primary">
              AI Tools <ChevronDown className="h-3 w-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Virtual Staging AI</DropdownMenuItem>
              <DropdownMenuItem>Sketch to Image AI</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        {/* View Mode Toggle */}
        <div className="flex items-center bg-muted rounded-lg p-0.5 sm:p-1">
          <Button
            variant={viewMode === '2d' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 sm:h-7 gap-1 sm:gap-1.5 px-2 sm:px-3"
            onClick={() => setViewMode('2d')}
          >
            <Square className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">2D</span>
          </Button>
          <Button
            variant={viewMode === '3d' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 sm:h-7 gap-1 sm:gap-1.5 px-2 sm:px-3"
            onClick={() => setViewMode('3d')}
          >
            <Box className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs">3D</span>
          </Button>
          <Button
            variant={viewMode === 'technical' ? 'default' : 'ghost'}
            size="sm"
            className="h-6 sm:h-7 gap-1 sm:gap-1.5 px-1.5 sm:px-3"
            onClick={() => setViewMode('technical')}
          >
            <FileCode className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
            <span className="text-[10px] sm:text-xs hidden sm:inline">Technical</span>
          </Button>
        </div>

        {/* Export Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-7 sm:h-8 gap-1 sm:gap-2 px-2 sm:px-3"
              disabled={!floorPlan || isExporting}
            >
              {isExporting ? (
                <Loader2 className="h-3 sm:h-3.5 w-3 sm:w-3.5 animate-spin" />
              ) : (
                <Download className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              )}
              <span className="hidden sm:inline text-xs">Export</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleExportJSON} disabled={!floorPlan}>
              <FileJson className="h-4 w-4 mr-2" />
              Export as JSON
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportPNG} disabled={!floorPlan || viewMode !== '2d'}>
              <Image className="h-4 w-4 mr-2" />
              Export as PNG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportJPG} disabled={!floorPlan || viewMode !== '2d'}>
              <FileImage className="h-4 w-4 mr-2" />
              Export as JPG
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExportPDF} disabled={!floorPlan || viewMode !== '2d'}>
              <FileText className="h-4 w-4 mr-2" />
              Export as PDF
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleExportDXF} disabled={!floorPlan}>
              <FileCode className="h-4 w-4 mr-2" />
              Export as DXF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* New Plan Button */}
        <Button variant="outline" size="sm" className="h-7 sm:h-8 px-2 sm:px-3 text-xs" onClick={handleNewPlan}>
          <span className="hidden sm:inline">New Plan</span>
          <span className="sm:hidden">New</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 sm:h-8 gap-1 sm:gap-2 px-1.5 sm:px-3 hidden md:flex">
              <Globe className="h-3 sm:h-3.5 w-3 sm:w-3.5" />
              <span className="hidden lg:inline">English</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>English</DropdownMenuItem>
            <DropdownMenuItem>Spanish</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {isAuthenticated && user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 gap-2">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">Dashboard</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/login">
            <Button size="sm" className="h-8">
              Login
            </Button>
          </Link>
        )}
      </div>
    </header>
  )
}
