'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Minimize2,
  FileImage,
  FileText,
  Sofa,
  Menu,
  X,
  Grid3X3,
  Tag,
  Ruler,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuthStore, usePlannerStore } from '@/lib/stores'
import { generateAccurateLayout, type FloorLayout, type LayoutResult } from '@/lib/engines/layout-engine'
import type { ProfessionalCADViewerHandle } from '@/components/live-design/professional-cad-viewer'
import type { DesignSettings } from '@/components/live-design/prompt-panel'
import { cadApi } from '@/lib/api/cad'

// Dynamic imports for client-side only components
const ProfessionalCADViewer = dynamic(
  () => import('@/components/live-design/professional-cad-viewer').then(mod => mod.ProfessionalCADViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)

const PromptPanel = dynamic(
  () => import('@/components/live-design/prompt-panel').then(mod => mod.PromptPanel),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    ),
  }
)

export default function LiveDesignPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const { generatePlan, setPrompt, setMeta, generatedPlan } = usePlannerStore()

  const viewerRef = useRef<ProfessionalCADViewerHandle>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null)
  const [currentFloorIndex, setCurrentFloorIndex] = useState(0)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [viewSettings, setViewSettings] = useState({
    showGrid: true,
    showDimensions: true,
    showRoomLabels: true,
    showFurniture: true,
  })

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/live-design')
    }
  }, [isAuthenticated, router])

  // Generate design from prompt
  const handleGenerate = useCallback(async (prompt: string, settings: DesignSettings) => {
    setIsGenerating(true)

    try {
      // Update planner store with prompt and settings
      setPrompt(prompt)
      setMeta({
        buildingType: settings.buildingType,
        plotArea: settings.plotWidth * settings.plotHeight,
        floors: settings.floors,
      })

      // Call AI to generate structured plan
      await generatePlan()

      // Get the generated plan from store
      const plan = usePlannerStore.getState().generatedPlan

      if (plan) {
        // Generate accurate geometric layout using layout engine
        const result = generateAccurateLayout(
          {
            buildingType: plan.buildingType,
            totalArea: plan.totalArea,
            plotDimensions: { width: settings.plotWidth, height: settings.plotHeight },
            floors: plan.floors.map(floor => ({
              level: floor.level,
              rooms: floor.rooms.map(room => ({
                name: room.name,
                type: room.type,
                areaSqft: room.areaSqft,
                dimensions: room.dimensions,
                position: room.position,
              })),
            })),
          },
          prompt
        )

        setLayoutResult(result)
        setCurrentFloorIndex(0)
      }
    } catch (error) {
      console.error('Design generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [generatePlan, setPrompt, setMeta])

  // Export to DXF
  const handleExportDXF = useCallback(async () => {
    if (!generatedPlan) return

    try {
      const response = await cadApi.generate({
        planData: generatedPlan,
        outputFormats: { dxf: true, dwg: false },
        floorIndex: currentFloorIndex,
        scale: 1,
      })

      if (response.files?.dxf) {
        cadApi.downloadFile(response.files.dxf)
      }
    } catch (error) {
      console.error('DXF export failed:', error)
    }
  }, [generatedPlan, currentFloorIndex])

  // Export to DWG
  const handleExportDWG = useCallback(async () => {
    if (!generatedPlan) return

    try {
      const response = await cadApi.generate({
        planData: generatedPlan,
        outputFormats: { dxf: false, dwg: true },
        floorIndex: currentFloorIndex,
        scale: 1,
      })

      if (response.files?.dwg) {
        cadApi.downloadFile(response.files.dwg)
      }
    } catch (error) {
      console.error('DWG export failed:', error)
    }
  }, [generatedPlan, currentFloorIndex])

  // Export to PNG
  const handleExportPNG = useCallback(() => {
    viewerRef.current?.exportToPNG()
  }, [])

  // Export to PDF
  const handleExportPDF = useCallback(() => {
    viewerRef.current?.exportToPDF()
  }, [])

  // Get current floor layout
  const currentFloor = layoutResult?.floors?.[currentFloorIndex] || null

  // Floor navigation
  const canGoNext = layoutResult && currentFloorIndex < (layoutResult.floors.length - 1)
  const canGoPrev = currentFloorIndex > 0

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Mobile Header with Menu Button */}
        <div className="lg:hidden flex items-center justify-between p-3 border-b bg-card">
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Menu className="h-4 w-4" />
                Design Panel
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] sm:w-[380px] p-0">
              <PromptPanel
                onGenerate={(prompt, settings) => {
                  setMobileMenuOpen(false)
                  handleGenerate(prompt, settings)
                }}
                isGenerating={isGenerating}
                onExportDXF={handleExportDXF}
                onExportDWG={handleExportDWG}
              />
            </SheetContent>
          </Sheet>

          {/* Mobile View Toggles */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewSettings.showGrid ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewSettings(s => ({ ...s, showGrid: !s.showGrid }))}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewSettings.showRoomLabels ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewSettings(s => ({ ...s, showRoomLabels: !s.showRoomLabels }))}
            >
              <Tag className="h-4 w-4" />
            </Button>
            <Button
              variant={viewSettings.showDimensions ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewSettings(s => ({ ...s, showDimensions: !s.showDimensions }))}
            >
              <Ruler className="h-4 w-4" />
            </Button>
            <Button
              variant={viewSettings.showFurniture ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setViewSettings(s => ({ ...s, showFurniture: !s.showFurniture }))}
            >
              <Sofa className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile Export */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0" disabled={!layoutResult}>
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={handleExportPNG} className="cursor-pointer">
                <FileImage className="h-4 w-4 mr-2 text-green-600" />
                Download PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-red-600" />
                Download PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDXF} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Download DXF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportDWG} className="cursor-pointer">
                <FileText className="h-4 w-4 mr-2 text-purple-600" />
                Download DWG
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Left Panel - Prompt Input (Desktop only) */}
        <div
          className={`hidden lg:block border-r bg-card transition-all duration-300 flex-shrink-0 ${
            sidebarCollapsed ? 'w-0 overflow-hidden' : 'w-[380px]'
          } ${isFullscreen ? '!hidden' : ''}`}
        >
          <PromptPanel
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
            onExportDXF={handleExportDXF}
            onExportDWG={handleExportDWG}
          />
        </div>

        {/* Collapse Toggle (Desktop only) */}
        {!isFullscreen && (
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex absolute top-1/2 -translate-y-1/2 z-10 bg-card border rounded-r-lg p-1.5 hover:bg-muted transition-colors shadow-md"
            style={{ left: sidebarCollapsed ? 0 : '380px' }}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>
        )}

        {/* Right Panel - CAD Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {/* Viewer Toolbar (Desktop) */}
          <div className="hidden lg:flex border-b px-4 py-2 items-center justify-between gap-4 bg-card">
            <div className="flex items-center gap-3">
              {/* Floor Selector */}
              {layoutResult && layoutResult.floors.length > 1 && (
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFloorIndex(i => Math.max(0, i - 1))}
                    disabled={!canGoPrev}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-medium px-3 min-w-[100px] text-center">
                    {currentFloor?.level || 'Ground'} Floor
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentFloorIndex(i => Math.min(layoutResult.floors.length - 1, i + 1))}
                    disabled={!canGoNext}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Floor tabs */}
              {layoutResult && layoutResult.floors.length > 1 && (
                <Tabs value={String(currentFloorIndex)} onValueChange={(v) => setCurrentFloorIndex(Number(v))}>
                  <TabsList className="h-8">
                    {layoutResult.floors.map((floor, index) => (
                      <TabsTrigger key={index} value={String(index)} className="text-xs px-3 h-7">
                        {floor.level}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* View Settings */}
              <div className="flex items-center gap-3 text-xs border-r pr-3">
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={viewSettings.showGrid}
                    onChange={(e) => setViewSettings(s => ({ ...s, showGrid: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded"
                  />
                  Grid
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={viewSettings.showDimensions}
                    onChange={(e) => setViewSettings(s => ({ ...s, showDimensions: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded"
                  />
                  Dimensions
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={viewSettings.showRoomLabels}
                    onChange={(e) => setViewSettings(s => ({ ...s, showRoomLabels: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded"
                  />
                  Labels
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    checked={viewSettings.showFurniture}
                    onChange={(e) => setViewSettings(s => ({ ...s, showFurniture: e.target.checked }))}
                    className="h-3.5 w-3.5 rounded"
                  />
                  <Sofa className="h-3.5 w-3.5" />
                </label>
              </div>

              {/* Export Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2" disabled={!layoutResult}>
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={handleExportPNG} className="cursor-pointer">
                    <FileImage className="h-4 w-4 mr-2 text-green-600" />
                    Download PNG
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-red-600" />
                    Download PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportDXF} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-blue-600" />
                    Download DXF (CAD)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportDWG} className="cursor-pointer">
                    <FileText className="h-4 w-4 mr-2 text-purple-600" />
                    Download DWG (AutoCAD)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Fullscreen Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="h-8 w-8 p-0"
              >
                {isFullscreen ? (
                  <Minimize2 className="h-4 w-4" />
                ) : (
                  <Maximize2 className="h-4 w-4" />
                )}
              </Button>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewerRef.current?.zoomOut()}
                  className="h-8 w-8 p-0 font-bold"
                >
                  -
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewerRef.current?.resetView()}
                  className="h-8 text-xs px-3"
                >
                  FIT
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewerRef.current?.zoomIn()}
                  className="h-8 w-8 p-0 font-bold"
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Floor Selector */}
          {layoutResult && layoutResult.floors.length > 1 && (
            <div className="lg:hidden flex items-center justify-center gap-2 py-2 border-b bg-card">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFloorIndex(i => Math.max(0, i - 1))}
                disabled={!canGoPrev}
                className="h-8 w-8 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium min-w-[100px] text-center">
                {currentFloor?.level || 'Ground'} Floor
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFloorIndex(i => Math.min(layoutResult.floors.length - 1, i + 1))}
                disabled={!canGoNext}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Professional CAD Viewer */}
          <div className="flex-1 relative">
            <ProfessionalCADViewer
              ref={viewerRef}
              layout={currentFloor}
              floorIndex={currentFloorIndex}
              showGrid={viewSettings.showGrid}
              showDimensions={viewSettings.showDimensions}
              showRoomLabels={viewSettings.showRoomLabels}
              showFurniture={viewSettings.showFurniture}
              scale={8}
              title={layoutResult ? `${currentFloor?.level || 'Ground'} Floor Plan` : 'Floor Plan'}
            />

            {/* Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-white/90 flex items-center justify-center z-20">
                <div className="text-center">
                  <Loader2 className="h-16 w-16 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-800">Generating Professional Design...</p>
                  <p className="text-sm text-gray-500 mt-2">
                    AI is converting your requirements to accurate CAD layout
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="inline-block w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {/* Stats Panel - Responsive */}
            {layoutResult && currentFloor && (
              <div className="absolute top-2 left-2 sm:top-4 sm:left-4 bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-4 text-xs sm:text-sm shadow-lg max-w-[160px] sm:max-w-none">
                <h3 className="font-bold text-gray-800 mb-1 sm:mb-2 text-sm sm:text-base">{currentFloor.level} Floor</h3>
                <div className="space-y-0.5 sm:space-y-1.5 text-gray-600">
                  <p className="flex justify-between gap-2 sm:gap-4">
                    <span>Plot:</span>
                    <span className="font-medium text-gray-800">
                      {layoutResult.plotDimensions.width}' x {layoutResult.plotDimensions.height}'
                    </span>
                  </p>
                  <p className="flex justify-between gap-2 sm:gap-4">
                    <span>Area:</span>
                    <span className="font-medium text-gray-800">
                      {(layoutResult.plotDimensions.width * layoutResult.plotDimensions.height).toLocaleString()} sqft
                    </span>
                  </p>
                  <p className="flex justify-between gap-2 sm:gap-4">
                    <span>Rooms:</span>
                    <span className="font-medium text-gray-800">{currentFloor.rooms.length}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Room Legend - Hidden on mobile, visible on tablet+ */}
            {layoutResult && currentFloor && currentFloor.rooms.length > 0 && (
              <div className="hidden sm:block absolute top-2 right-2 sm:top-4 sm:right-4 bg-white/95 backdrop-blur-sm border-2 border-gray-200 rounded-lg sm:rounded-xl p-2 sm:p-4 text-xs sm:text-sm shadow-lg max-h-[200px] sm:max-h-[250px] overflow-auto max-w-[200px] sm:max-w-[280px]">
                <h3 className="font-bold text-gray-800 mb-2 sm:mb-3 text-sm">Room Schedule</h3>
                <div className="space-y-1 sm:space-y-2">
                  {currentFloor.rooms.map((room, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-3 py-0.5 sm:py-1 border-b border-gray-100 last:border-0">
                      <div
                        className="w-3 h-3 sm:w-4 sm:h-4 rounded border flex-shrink-0"
                        style={{ backgroundColor: getRoomColor(room.type) }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-gray-700 text-xs sm:text-sm truncate block">{room.name}</span>
                        <span className="text-gray-500 text-[10px] sm:text-xs">
                          {room.width.toFixed(0)}' x {room.height.toFixed(0)}'
                        </span>
                      </div>
                      <span className="text-gray-600 font-medium text-xs hidden md:block">
                        {Math.round(room.width * room.height)} sqft
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Helper function to get room color
function getRoomColor(type: string): string {
  const colors: Record<string, string> = {
    bedroom: '#fef3c7',
    'master bedroom': '#fde68a',
    'living room': '#dbeafe',
    lounge: '#dbeafe',
    'drawing room': '#e0e7ff',
    kitchen: '#fee2e2',
    bathroom: '#cffafe',
    toilet: '#cffafe',
    'w.c': '#cffafe',
    dining: '#d1fae5',
    office: '#ede9fe',
    garage: '#e5e7eb',
    store: '#f3f4f6',
    lobby: '#fce7f3',
    corridor: '#f9fafb',
    staircase: '#fed7aa',
    veranda: '#ecfdf5',
    porch: '#ecfdf5',
    parking: '#f3f4f6',
    garden: '#d9f99d',
    'service yard': '#fef9c3',
    pooja: '#fef3c7',
  }
  return colors[type.toLowerCase()] || '#f9fafb'
}
