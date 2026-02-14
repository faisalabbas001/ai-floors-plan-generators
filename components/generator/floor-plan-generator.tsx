'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import Image from 'next/image'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sparkles,
  PenTool,
  Home,
  Wand2,
  Loader2,
  Building2,
  MapPin,
  Ruler,
  Layers,
  Square,
  Box,
  Eye,
  Edit3,
  Trash2,
  Clock,
  ChevronDown,
  ChevronUp,
  Check,
  Download,
  FileImage,
  FileText,
  FileCode,
  FileJson,
  FolderPlus,
  Shield,
  BookOpen,
  ImageIcon,
} from 'lucide-react'
import jsPDF from 'jspdf'
import { toast } from 'sonner'
import { usePlannerStore, useAuthStore, useEditorStore, useProjectsStore } from '@/lib/stores'
import type { GeneratedPlan } from '@/lib/api'
import { exportToJSON, exportToDXF, exportPlanToSVG } from '@/lib/utils/export'
import type { PlanHistoryItem } from '@/lib/stores/planner-store'

// Import types for refs
import type { Preview2DHandle } from './preview-2d'
import type { Preview3DHandle } from './preview-3d'
import type { PreviewTechnicalHandle } from './preview-technical'

// Dynamic import for 2D preview (Konva-based)
const Preview2D = dynamic(() => import('./preview-2d').then((mod) => mod.Preview2D), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

// Dynamic import for 3D preview
const Preview3D = dynamic(() => import('./preview-3d').then((mod) => mod.Preview3D), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

// Dynamic import for Technical preview
const PreviewTechnical = dynamic(() => import('./preview-technical').then((mod) => mod.PreviewTechnical), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  ),
})

// Dynamic import for CAD Export Panel
const CADExportPanel = dynamic(() => import('@/components/cad-export').then((mod) => mod.CADExportPanel), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-24">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  ),
})

// Style images with actual preview images
const STYLE_PREVIEWS = {
  technical: {
    name: 'Technical',
    description: '2D architectural blueprint style',
    image: '/images/styletechnical.png',
  },
  '2.5d': {
    name: '2.5D',
    description: 'Elevated perspective view',
    image: '/images/style2d.png',
  },
  '3d': {
    name: '3D Isometric',
    description: 'Full 3D walkthrough view',
    image: '/images/style3d.png',
  },
}

// All aspect ratio options
const ALL_ASPECT_RATIOS = [
  { value: '16:9', label: '16:9', description: 'Widescreen' },
  { value: '9:16', label: '9:16', description: 'Portrait' },
  { value: '1:1', label: '1:1', description: 'Square' },
  { value: '4:3', label: '4:3', description: 'Standard' },
  { value: '3:2', label: '3:2', description: 'Classic' },
  { value: '21:9', label: '21:9', description: 'Ultra Wide' },
  { value: '2:3', label: '2:3', description: 'Tall Portrait' },
  { value: '5:4', label: '5:4', description: 'Photo' },
]

export function FloorPlanGenerator() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { loadFromGeneratedPlan } = useEditorStore()
  const {
    prompt,
    meta,
    generatedPlan,
    isGenerating,
    error,
    selectedStyle,
    selectedRatio,
    previewMode,
    history,
    setPrompt,
    setMeta,
    setSelectedStyle,
    setSelectedRatio,
    setPreviewMode,
    generatePlan,
    clearError,
    removeFromHistory,
    loadFromHistory,
    clearHistory,
  } = usePlannerStore()

  const { createProject } = useProjectsStore()

  const [selectedModel, setSelectedModel] = useState('basic')
  const [activeTab, setActiveTab] = useState('generator')
  const [previewTab, setPreviewTab] = useState<'preview' | 'details'>('preview')
  const [showMoreRatios, setShowMoreRatios] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)

  // Refs for preview components to capture their canvas
  const preview2DRef = useRef<Preview2DHandle>(null)
  const preview3DRef = useRef<Preview3DHandle>(null)
  const previewTechnicalRef = useRef<PreviewTechnicalHandle>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const buildingTypes = [
    'Residential',
    'Commercial',
    'Bank',
    'Hospital',
    'Restaurant',
    'Office',
    'Warehouse',
    'School',
    'Other',
  ]

  const authorities = ['DHA', 'LDA', 'CDA', 'KDA', 'RDA', 'TMA', 'Other']

  const floorOptions = ['Basement', 'Ground', 'First', 'Second', 'Third', 'Fourth', 'Fifth']

  const visibleRatios = showMoreRatios ? ALL_ASPECT_RATIOS : ALL_ASPECT_RATIOS.slice(0, 4)

  const handleGenerate = async () => {
    if (!mounted) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    clearError()
    await generatePlan()
  }

  const handleFloorToggle = (floor: string) => {
    const currentFloors = meta.floors || []
    if (currentFloors.includes(floor)) {
      setMeta({ floors: currentFloors.filter((f) => f !== floor) })
    } else {
      setMeta({ floors: [...currentFloors, floor] })
    }
  }

  const handleEditInEditor = () => {
    if (generatedPlan) {
      loadFromGeneratedPlan(generatedPlan)
      router.push('/editor')
    }
  }

  const handleViewPlan = (historyItem: PlanHistoryItem) => {
    loadFromHistory(historyItem.id)
    setActiveTab('generator')
    setPreviewTab('preview')
  }

  const handleSaveAsProject = async () => {
    if (!generatedPlan) return
    if (!isAuthenticated) {
      toast.error('Please log in to save projects')
      router.push('/login')
      return
    }
    setIsSaving(true)
    try {
      const projectId = await createProject({
        name: `${generatedPlan.buildingType || 'Floor'} Plan - ${new Date().toLocaleDateString()}`,
        description: prompt || `Generated ${generatedPlan.buildingType} floor plan`,
        buildingType: generatedPlan.buildingType?.toLowerCase() || 'residential',
        plan: generatedPlan,
      })
      if (projectId) {
        toast.success('Project saved with floor plan data!')
        router.push('/projects')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleViewDrawings = () => {
    if (generatedPlan) {
      router.push('/drawings')
    }
  }

  const handleValidateBuildingCode = () => {
    if (generatedPlan) {
      router.push('/building-codes')
    }
  }

  const handleCheckBrandCompliance = () => {
    if (generatedPlan) {
      router.push('/brand-manual')
    }
  }

  // Helper function to get the current preview's data URL
  const getPreviewDataURL = (mimeType = 'image/png', quality = 1): string | null => {
    // Get data URL based on current preview mode
    if (previewMode === '2d' && preview2DRef.current) {
      return preview2DRef.current.toDataURL(mimeType, quality)
    } else if (previewMode === '3d' && preview3DRef.current) {
      return preview3DRef.current.toDataURL(mimeType, quality)
    } else if (previewMode === 'technical' && previewTechnicalRef.current) {
      return previewTechnicalRef.current.toDataURL(mimeType, quality)
    }
    return null
  }

  // Export as PNG
  const handleExportPNG = async () => {
    if (!generatedPlan) return

    setIsExporting(true)
    try {
      // Small delay to ensure canvas is rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      const dataURL = getPreviewDataURL('image/png', 1)

      if (dataURL) {
        const link = document.createElement('a')
        link.download = `floor-plan-${generatedPlan.buildingType || 'design'}-${previewMode}-${Date.now()}.png`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error('Unable to capture preview. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting PNG:', error)
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Export as PDF
  const handleExportPDF = async () => {
    if (!generatedPlan) return

    setIsExporting(true)
    try {
      // Small delay to ensure canvas is rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      const imgData = getPreviewDataURL('image/png', 1)

      if (!imgData) {
        toast.error('Unable to capture preview. Please try again.')
        setIsExporting(false)
        return
      }

      // Create an image to get dimensions
      const img = document.createElement('img')
      img.src = imgData

      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
      })

      const imgWidth = img.width
      const imgHeight = img.height

      const pdf = new jsPDF({
        orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      })

      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      // Add title
      pdf.setFontSize(18)
      pdf.setTextColor(30, 74, 124) // Brand blue color
      pdf.text(`${generatedPlan.buildingType || 'Floor'} Plan`, 10, 15)

      // Add metadata
      pdf.setFontSize(10)
      pdf.setTextColor(100, 100, 100)
      if (generatedPlan.totalArea) {
        pdf.text(`Total Area: ${generatedPlan.totalArea.toLocaleString()} sqft`, 10, 22)
      }
      pdf.text(`Generated: ${new Date().toLocaleDateString()} | View: ${previewMode.toUpperCase()}`, 10, 28)

      // Add the floor plan image
      const maxWidth = pageWidth - 20
      const maxHeight = pageHeight - 50
      let finalWidth = maxWidth
      let finalHeight = (imgHeight * finalWidth) / imgWidth

      if (finalHeight > maxHeight) {
        finalHeight = maxHeight
        finalWidth = (imgWidth * finalHeight) / imgHeight
      }

      const xOffset = (pageWidth - finalWidth) / 2
      pdf.addImage(imgData, 'PNG', xOffset, 35, finalWidth, finalHeight)

      // Add footer
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text('Generated by FloorPlan AI', pageWidth / 2, pageHeight - 10, { align: 'center' })

      pdf.save(`floor-plan-${generatedPlan.buildingType || 'design'}-${previewMode}-${Date.now()}.pdf`)
    } catch (error) {
      console.error('Error exporting PDF:', error)
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Export as JPG
  const handleExportJPG = async () => {
    if (!generatedPlan) return

    setIsExporting(true)
    try {
      // Small delay to ensure canvas is rendered
      await new Promise(resolve => setTimeout(resolve, 100))

      const dataURL = getPreviewDataURL('image/jpeg', 0.9)

      if (dataURL) {
        const link = document.createElement('a')
        link.download = `floor-plan-${generatedPlan.buildingType || 'design'}-${previewMode}-${Date.now()}.jpg`
        link.href = dataURL
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        toast.error('Unable to capture preview. Please try again.')
      }
    } catch (error) {
      console.error('Error exporting JPG:', error)
      toast.error('Export failed. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  // Export as JSON
  const handleExportJSON = () => {
    if (!generatedPlan) return

    try {
      exportToJSON(generatedPlan, {
        filename: `floor-plan-${generatedPlan.buildingType || 'design'}-${Date.now()}`,
      })
    } catch (error) {
      console.error('Error exporting JSON:', error)
      toast.error('Export failed. Please try again.')
    }
  }

  // Export as DXF (AutoCAD format)
  const handleExportDXF = () => {
    if (!generatedPlan) return

    try {
      exportToDXF(generatedPlan, 0, {
        filename: `floor-plan-${generatedPlan.buildingType || 'design'}-${Date.now()}`,
        scale: 1, // 1 foot = 1 unit in DXF
      })
    } catch (error) {
      console.error('Error exporting DXF:', error)
      toast.error('Export failed. Please try again.')
    }
  }

  // Export as SVG
  const handleExportSVG = () => {
    if (!generatedPlan) return

    try {
      exportPlanToSVG(generatedPlan, 0, {
        filename: `floor-plan-${generatedPlan.buildingType || 'design'}-${Date.now()}`,
        scale: 10, // 1 foot = 10 pixels
      })
    } catch (error) {
      console.error('Error exporting SVG:', error)
      toast.error('Export failed. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-6 sm:mb-8">
        <p className="text-center text-sm sm:text-base text-muted-foreground">
          Generate, edit, and customize detailed floor plans effortlessly.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-center">
          <TabsList className="grid w-full max-w-3xl grid-cols-4 h-auto">
            <TabsTrigger value="generator" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Generator</span>
            </TabsTrigger>
            <TabsTrigger value="editor" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
              <PenTool className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Editor</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="design" className="gap-1 sm:gap-2 py-2 sm:py-2.5 text-xs sm:text-sm">
              <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline sm:inline">Design</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Generator Tab */}
        <TabsContent value="generator" className="mt-4 sm:mt-6 md:mt-8">
          <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-[1fr,1.2fr]">
            {/* Left Panel - Controls */}
            <div className="space-y-4 sm:space-y-6">
              <Card>
                <CardHeader className="p-4 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    </div>
                    <CardTitle className="text-base sm:text-lg">AI Generate Floor Plan</CardTitle>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                    Create professional floor plans based on your requirements
                  </p>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6 pt-0 sm:pt-0">
                  {/* Error Message */}
                  {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-900">
                      {error}
                    </div>
                  )}

                  {/* Prompt */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="prompt" className="text-xs sm:text-sm">Describe Your Building</Label>
                    <Textarea
                      id="prompt"
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      className="min-h-[100px] sm:min-h-[120px] resize-none text-sm"
                      placeholder="E.g., Design a bank branch in Lahore DHA with basement parking, ground floor for customers with ATM, teller area, and manager office..."
                      disabled={isGenerating}
                    />
                  </div>

                  {/* Building Type & City */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Building2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Building Type
                      </Label>
                      <Select
                        value={meta.buildingType || ''}
                        onValueChange={(value) => setMeta({ buildingType: value })}
                        disabled={isGenerating}
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {buildingTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        City
                      </Label>
                      <Input
                        placeholder="e.g., Lahore"
                        value={meta.city || ''}
                        onChange={(e) => setMeta({ city: e.target.value })}
                        disabled={isGenerating}
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Authority & Plot Area */}
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="text-xs sm:text-sm">Authority / Zone</Label>
                      <Select
                        value={meta.authority || ''}
                        onValueChange={(value) => setMeta({ authority: value })}
                        disabled={isGenerating}
                      >
                        <SelectTrigger className="h-9 sm:h-10 text-sm">
                          <SelectValue placeholder="Select authority" />
                        </SelectTrigger>
                        <SelectContent>
                          {authorities.map((auth) => (
                            <SelectItem key={auth} value={auth}>
                              {auth}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5 sm:space-y-2">
                      <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                        <Ruler className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        Plot Area (sqft)
                      </Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5000"
                        value={meta.plotArea || ''}
                        onChange={(e) =>
                          setMeta({ plotArea: e.target.value ? Number(e.target.value) : undefined })
                        }
                        disabled={isGenerating}
                        className="h-9 sm:h-10 text-sm"
                      />
                    </div>
                  </div>

                  {/* Floors */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                      <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      Required Floors
                    </Label>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {floorOptions.map((floor) => (
                        <Button
                          key={floor}
                          type="button"
                          variant={meta.floors?.includes(floor) ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleFloorToggle(floor)}
                          disabled={isGenerating}
                          className="text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3"
                        >
                          {floor}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Style Selection with Visual Previews */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Style</Label>
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      {Object.entries(STYLE_PREVIEWS).map(([id, style]) => (
                        <button
                          key={id}
                          onClick={() => setSelectedStyle(id)}
                          disabled={isGenerating}
                          className={`group relative overflow-hidden rounded-lg border-2 transition-all ${
                            selectedStyle === id
                              ? 'border-primary ring-2 ring-primary/20'
                              : 'border-border hover:border-muted-foreground/50'
                          } ${isGenerating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="aspect-square relative bg-muted overflow-hidden">
                            <Image
                              src={style.image}
                              alt={style.name}
                              fill
                              sizes="(max-width: 640px) 30vw, 150px"
                              className="object-cover"
                              priority
                            />
                          </div>
                          {selectedStyle === id && (
                            <div className="absolute right-1 top-1 sm:right-1.5 sm:top-1.5 flex h-4 w-4 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-primary shadow-md">
                              <Check className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground" />
                            </div>
                          )}
                          <div className="border-t border-border bg-card py-1 sm:py-1.5 px-1 text-center">
                            <p className="text-[9px] sm:text-xs font-medium truncate">{style.name}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Aspect Ratio with Show More */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs sm:text-sm">Aspect Ratio</Label>
                      <button
                        onClick={() => setShowMoreRatios(!showMoreRatios)}
                        className="text-[10px] sm:text-xs text-primary hover:underline flex items-center gap-0.5 sm:gap-1"
                      >
                        {showMoreRatios ? (
                          <>
                            Show Less <ChevronUp className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </>
                        ) : (
                          <>
                            Show More <ChevronDown className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </>
                        )}
                      </button>
                    </div>
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                      {visibleRatios.map((ratio) => (
                        <Button
                          key={ratio.value}
                          variant={selectedRatio === ratio.value ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedRatio(ratio.value)}
                          className="w-full flex-col h-auto py-1.5 sm:py-2 px-1 sm:px-2"
                          disabled={isGenerating}
                        >
                          <span className="font-semibold text-[10px] sm:text-xs">{ratio.label}</span>
                          <span className="text-[8px] sm:text-[10px] opacity-70 hidden xs:block">{ratio.description}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Model */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm">Model</Label>
                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        variant={selectedModel === 'basic' ? 'default' : 'outline'}
                        onClick={() => setSelectedModel('basic')}
                        className="h-auto flex-col items-start gap-0.5 sm:gap-1 py-2 sm:py-3 px-2 sm:px-3"
                        disabled={isGenerating}
                      >
                        <span className="font-semibold text-xs sm:text-sm">Basic</span>
                        <span className="text-[10px] sm:text-xs font-normal opacity-80">Fast generation</span>
                      </Button>
                      <Button
                        variant={selectedModel === 'pro' ? 'default' : 'outline'}
                        onClick={() => setSelectedModel('pro')}
                        className="h-auto flex-col items-start gap-0.5 sm:gap-1 py-2 sm:py-3 px-2 sm:px-3"
                        disabled={isGenerating}
                      >
                        <span className="font-semibold text-xs sm:text-sm">Pro</span>
                        <span className="text-[10px] sm:text-xs font-normal opacity-80">High quality</span>
                      </Button>
                    </div>
                  </div>

                  <Button
                    className="w-full gap-2 text-sm sm:text-base"
                    size="lg"
                    onClick={handleGenerate}
                    disabled={isGenerating || !prompt || prompt.length < 10}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="hidden xs:inline">Generating Plan...</span>
                        <span className="xs:hidden">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-4 w-4" />
                        <span className="hidden xs:inline">Generate Floor Plan</span>
                        <span className="xs:hidden">Generate</span>
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Right Panel - Preview */}
            <div>
              <Card className="h-full">
                <CardHeader className="pb-2 p-3 sm:p-4 md:p-6">
                  <Tabs value={previewTab} onValueChange={(v) => setPreviewTab(v as any)}>
                    <TabsList className="grid w-full grid-cols-2 h-9 sm:h-10">
                      <TabsTrigger value="preview" className="text-xs sm:text-sm">Preview</TabsTrigger>
                      <TabsTrigger value="details" className="text-xs sm:text-sm">Details</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
                  {previewTab === 'preview' ? (
                    <div className="space-y-3 sm:space-y-4">
                      {/* View Mode Toggle - Compact buttons */}
                      {generatedPlan && (
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1 sm:gap-1.5 bg-muted/50 rounded-lg p-0.5 sm:p-1">
                            <button
                              onClick={() => setPreviewMode('2d')}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                                previewMode === '2d'
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            >
                              2.5D
                            </button>
                            <button
                              onClick={() => setPreviewMode('3d')}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                                previewMode === '3d'
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            >
                              3D
                            </button>
                            <button
                              onClick={() => setPreviewMode('technical')}
                              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md text-[10px] sm:text-xs font-medium transition-all ${
                                previewMode === 'technical'
                                  ? 'bg-primary text-primary-foreground shadow-sm'
                                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                              }`}
                            >
                              Technical
                            </button>
                          </div>
                          <span className="text-[9px] sm:text-xs text-muted-foreground">
                            {STYLE_PREVIEWS[selectedStyle as keyof typeof STYLE_PREVIEWS]?.name}
                          </span>
                        </div>
                      )}

                      {/* Preview Area */}
                      <div
                        ref={previewRef}
                        className="relative overflow-hidden rounded-lg border border-border bg-white min-h-[280px] sm:min-h-[350px] md:min-h-[450px] lg:min-h-[500px]"
                        style={{
                          aspectRatio: selectedRatio.replace(':', '/'),
                        }}
                      >
                        {generatedPlan ? (
                          previewMode === '2d' ? (
                            <Preview2D ref={preview2DRef} plan={generatedPlan} style={selectedStyle} />
                          ) : previewMode === '3d' ? (
                            <Preview3D ref={preview3DRef} plan={generatedPlan} />
                          ) : (
                            <PreviewTechnical ref={previewTechnicalRef} plan={generatedPlan} />
                          )
                        ) : (
                          <div className="flex h-full items-center justify-center p-8 bg-muted">
                            <div className="text-center">
                              {isGenerating ? (
                                <>
                                  <Loader2 className="mx-auto mb-4 h-12 w-12 text-primary animate-spin" />
                                  <p className="text-sm text-muted-foreground">
                                    Generating your architectural plan...
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-2">
                                    This may take a moment
                                  </p>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                                  <p className="text-sm text-muted-foreground">
                                    Your generated floor plan will appear here
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      {generatedPlan && (
                        <div className="flex flex-wrap gap-2">
                          <Button className="flex-1 min-w-[80px] gap-1 sm:gap-2 text-[11px] sm:text-sm h-9 sm:h-10 px-2 sm:px-4" variant="outline" onClick={() => setPreviewTab('details')}>
                            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="hidden sm:inline">View Details</span>
                            <span className="sm:hidden">Details</span>
                          </Button>
                          <Button className="flex-1 min-w-[80px] gap-1 sm:gap-2 text-[11px] sm:text-sm h-9 sm:h-10 px-2 sm:px-4" onClick={handleEditInEditor}>
                            <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0" />
                            <span className="hidden sm:inline">Edit in Editor</span>
                            <span className="sm:hidden">Edit</span>
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                className="gap-1 sm:gap-2 text-[11px] sm:text-sm h-9 sm:h-10 px-2 sm:px-3"
                                variant="outline"
                                disabled={isExporting}
                              >
                                {isExporting ? (
                                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                                ) : (
                                  <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                )}
                                <span className="hidden md:inline">Download</span>
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={handleExportPNG} className="cursor-pointer">
                                <FileImage className="h-4 w-4 mr-2 text-green-600" />
                                <span>Download PNG</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleExportJPG} className="cursor-pointer">
                                <FileImage className="h-4 w-4 mr-2 text-orange-600" />
                                <span>Download JPG</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                                <FileText className="h-4 w-4 mr-2 text-red-600" />
                                <span>Download PDF</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleExportSVG} className="cursor-pointer">
                                <FileCode className="h-4 w-4 mr-2 text-purple-600" />
                                <span>Download SVG</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleExportDXF} className="cursor-pointer">
                                <FileCode className="h-4 w-4 mr-2 text-blue-600" />
                                <span>Download DXF (CAD)</span>
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer">
                                <FileJson className="h-4 w-4 mr-2 text-yellow-600" />
                                <span>Download JSON</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      {/* Post-Generation Actions */}
                      {generatedPlan && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[100px] gap-1.5 text-[11px] sm:text-xs h-8 sm:h-9"
                            onClick={handleSaveAsProject}
                            disabled={isSaving}
                          >
                            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FolderPlus className="h-3.5 w-3.5" />}
                            Save as Project
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[100px] gap-1.5 text-[11px] sm:text-xs h-8 sm:h-9"
                            onClick={handleViewDrawings}
                          >
                            <ImageIcon className="h-3.5 w-3.5" />
                            View Drawings
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[100px] gap-1.5 text-[11px] sm:text-xs h-8 sm:h-9"
                            onClick={handleValidateBuildingCode}
                          >
                            <Shield className="h-3.5 w-3.5" />
                            Building Codes
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 min-w-[100px] gap-1.5 text-[11px] sm:text-xs h-8 sm:h-9"
                            onClick={handleCheckBrandCompliance}
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            Brand Check
                          </Button>
                        </div>
                      )}

                      {/* CAD Export Panel - AutoCAD/DXF/DWG */}
                      {generatedPlan && (
                        <CADExportPanel
                          planData={generatedPlan}
                          floorIndex={0}
                          className="mt-4"
                        />
                      )}
                    </div>
                  ) : (
                    // Details Tab
                    generatedPlan ? (
                      <PlanDetails plan={generatedPlan} onEditInEditor={handleEditInEditor} onExportJSON={handleExportJSON} />
                    ) : (
                      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
                        Generate a plan to see details
                      </div>
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Editor Tab */}
        <TabsContent value="editor" className="mt-4 sm:mt-6 md:mt-8">
          <Card>
            <CardContent className="flex min-h-[300px] sm:min-h-[400px] md:min-h-[500px] items-center justify-center p-6 sm:p-8 md:p-12">
              <div className="text-center">
                <PenTool className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg sm:text-xl font-semibold">Floor Plan Editor</h3>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-muted-foreground">
                  Draw and edit floor plans with professional tools
                </p>
                <Button onClick={() => router.push('/editor')} className="text-sm sm:text-base">Open Editor</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4 sm:mt-6 md:mt-8">
          <Card>
            <CardHeader className="p-4 sm:p-6">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-base sm:text-lg">
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                  <span className="hidden xs:inline">Generation History</span>
                  <span className="xs:hidden">History</span>
                </CardTitle>
                {history.length > 0 && (
                  <Button variant="outline" size="sm" onClick={clearHistory} className="text-xs sm:text-sm h-8 sm:h-9">
                    <span className="hidden xs:inline">Clear All</span>
                    <span className="xs:hidden">Clear</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 pt-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                  <Clock className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="font-medium mb-2 text-sm sm:text-base">No History Yet</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Your generated floor plans will appear here
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[350px] sm:h-[400px] md:h-[500px]">
                  <div className="space-y-3 sm:space-y-4">
                    {history.map((item) => (
                      <HistoryCard
                        key={item.id}
                        item={item}
                        onView={() => handleViewPlan(item)}
                        onDelete={() => removeFromHistory(item.id)}
                        onEdit={() => {
                          loadFromHistory(item.id)
                          if (item.plan) {
                            loadFromGeneratedPlan(item.plan)
                            router.push('/editor')
                          }
                        }}
                      />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="mt-4 sm:mt-6 md:mt-8">
          <Card>
            <CardContent className="flex min-h-[300px] sm:min-h-[400px] md:min-h-[500px] items-center justify-center p-6 sm:p-8 md:p-12">
              <div className="text-center">
                <Home className="mx-auto mb-3 sm:mb-4 h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg sm:text-xl font-semibold">Home Design</h3>
                <p className="mb-4 sm:mb-6 text-sm sm:text-base text-muted-foreground">
                  Transform floor plans into stunning 3D visualizations
                </p>
                <Button className="text-sm sm:text-base">Start Designing</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// History Card Component
function HistoryCard({
  item,
  onView,
  onDelete,
  onEdit,
}: {
  item: PlanHistoryItem
  onView: () => void
  onDelete: () => void
  onEdit: () => void
}) {
  const date = new Date(item.createdAt)
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="border rounded-lg p-3 sm:p-4 hover:bg-muted/50 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
            <h4 className="font-medium truncate text-sm sm:text-base">{item.plan.buildingType || 'Floor Plan'}</h4>
            <span
              className={`text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded ${
                item.viewMode === '2d' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
              }`}
            >
              {item.viewMode.toUpperCase()}
            </span>
            <span className="text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded bg-muted">
              {STYLE_PREVIEWS[item.style as keyof typeof STYLE_PREVIEWS]?.name || item.style}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2">{item.prompt}</p>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] sm:text-xs text-muted-foreground">
            <span>{formattedDate} at {formattedTime}</span>
            {item.plan.totalArea && <span>{item.plan.totalArea.toLocaleString()} sqft</span>}
            <span>{item.plan.floors.length} floor(s)</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-auto">
          <Button variant="outline" size="sm" onClick={onView} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
            <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onEdit} className="h-8 w-8 sm:h-9 sm:w-9 p-0">
            <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={onDelete} className="text-destructive hover:text-destructive h-8 w-8 sm:h-9 sm:w-9 p-0">
            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

// Plan Details Component
function PlanDetails({ plan, onEditInEditor, onExportJSON }: { plan: GeneratedPlan; onEditInEditor: () => void; onExportJSON: () => void }) {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Header Info */}
      <div className="p-3 sm:p-4 bg-muted rounded-lg">
        <div className="flex items-center justify-between mb-1.5 sm:mb-2">
          <h3 className="font-semibold text-base sm:text-lg">{plan.buildingType} Plan</h3>
          {plan.totalArea && (
            <span className="text-xs sm:text-sm text-muted-foreground">{plan.totalArea.toLocaleString()} sqft</span>
          )}
        </div>
        {plan.compliance?.authority && (
          <p className="text-xs sm:text-sm text-muted-foreground">Authority: {plan.compliance.authority}</p>
        )}
      </div>

      {/* Floors */}
      <ScrollArea className="h-[250px] sm:h-[300px]">
        <div className="space-y-2 sm:space-y-3">
          {plan.floors.map((floor, index) => (
            <div key={index} className="border rounded-lg p-3 sm:p-4">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h4 className="font-medium text-sm sm:text-base">{floor.level} Floor</h4>
                {floor.totalArea && (
                  <span className="text-[10px] sm:text-xs bg-primary/10 text-primary px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    {floor.totalArea.toLocaleString()} sqft
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                {floor.rooms.map((room, roomIndex) => (
                  <div key={roomIndex} className="bg-muted/50 p-1.5 sm:p-2 rounded text-xs sm:text-sm">
                    <p className="font-medium truncate">{room.name}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {room.areaSqft} sqft
                      {room.dimensions && (
                        <span className="hidden xs:inline">
                          {' '}
                          ({room.dimensions.length} x {room.dimensions.width} ft)
                        </span>
                      )}
                    </p>
                  </div>
                ))}
              </div>

              {floor.circulation && (
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1.5 sm:mt-2">
                  Circulation: {floor.circulation.type}
                  {floor.circulation.corridorWidth && ` (${floor.circulation.corridorWidth}ft corridor)`}
                </p>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      {/* Design Notes */}
      {plan.designNotes && plan.designNotes.length > 0 && (
        <div className="p-2.5 sm:p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
          <h4 className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2">Design Notes</h4>
          <ul className="text-[10px] sm:text-xs text-muted-foreground space-y-0.5 sm:space-y-1">
            {plan.designNotes.map((note, index) => (
              <li key={index}>• {note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10" variant="outline" onClick={onExportJSON}>
          <FileJson className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Export JSON</span>
          <span className="xs:hidden">Export</span>
        </Button>
        <Button className="flex-1 gap-1.5 sm:gap-2 text-xs sm:text-sm h-9 sm:h-10" onClick={onEditInEditor}>
          <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="hidden xs:inline">Edit in Editor</span>
          <span className="xs:hidden">Edit</span>
        </Button>
      </div>
    </div>
  )
}
