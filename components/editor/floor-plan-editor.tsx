'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { EditorHeader } from './editor-header'
import { EditorToolbar } from './editor-toolbar'
import { EditorSidebar } from './editor-sidebar'
import { EditorProperties } from './editor-properties'
import { useEditorStore } from '@/lib/stores/editor-store'
import { usePlannerStore } from '@/lib/stores/planner-store'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { PanelLeft, PanelRight } from 'lucide-react'
import type { Canvas2DHandle } from './canvas-2d'

// Dynamic imports for canvas components (they use browser APIs)
const Canvas2D = dynamic(() => import('./canvas-2d').then((mod) => mod.Canvas2D), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading 2D Editor...</p>
      </div>
    </div>
  ),
})

const Viewer3D = dynamic(() => import('./viewer-3d').then((mod) => mod.Viewer3D), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading 3D Viewer...</p>
      </div>
    </div>
  ),
})

const CanvasTechnical = dynamic(() => import('./canvas-technical').then((mod) => mod.CanvasTechnical), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center bg-muted/30">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-sm text-muted-foreground">Loading Technical View...</p>
      </div>
    </div>
  ),
})

export function FloorPlanEditor() {
  const [selectedTool, setSelectedTool] = useState('select')
  const [showProperties, setShowProperties] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [showMobileProperties, setShowMobileProperties] = useState(false)
  const canvas2DRef = useRef<Canvas2DHandle | null>(null)

  const { viewMode, floorPlan, loadFromGeneratedPlan, selectedRoomId, selectedElementId } = useEditorStore()
  const { generatedPlan } = usePlannerStore()
  const lastLoadedPlanRef = useRef<any>(null)

  // Auto-load generated plan when available or changed (e.g. new template applied)
  useEffect(() => {
    if (generatedPlan && generatedPlan.floors && Array.isArray(generatedPlan.floors) && generatedPlan.floors.length > 0) {
      // Load if no plan exists OR if generatedPlan changed (new template/generation)
      if (!floorPlan || generatedPlan !== lastLoadedPlanRef.current) {
        lastLoadedPlanRef.current = generatedPlan
        loadFromGeneratedPlan(generatedPlan)
      }
    }
  }, [generatedPlan, floorPlan, loadFromGeneratedPlan])

  // Auto-show properties on mobile when something is selected
  useEffect(() => {
    if ((selectedRoomId || selectedElementId) && window.innerWidth < 1024) {
      setShowMobileProperties(true)
    }
  }, [selectedRoomId, selectedElementId])

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <EditorHeader canvas2DRef={canvas2DRef} />
      <EditorToolbar selectedTool={selectedTool} onToolChange={setSelectedTool} />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden lg:block">
          <EditorSidebar />
        </div>

        {/* Mobile Sidebar Toggle Button */}
        <div className="lg:hidden absolute left-2 top-2 z-20">
          <Sheet open={showMobileSidebar} onOpenChange={setShowMobileSidebar}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-background shadow-md"
              >
                <PanelLeft className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetHeader className="px-4 py-3 border-b">
                <SheetTitle>Tools & Elements</SheetTitle>
              </SheetHeader>
              <EditorSidebar />
            </SheetContent>
          </Sheet>
        </div>

        {/* Main Canvas Area */}
        {viewMode === '2d' && <Canvas2D ref={canvas2DRef} />}
        {viewMode === '3d' && <Viewer3D />}
        {viewMode === 'technical' && <CanvasTechnical />}

        {/* Mobile Properties Toggle Button */}
        <div className="lg:hidden absolute right-2 top-2 z-20">
          <Sheet open={showMobileProperties} onOpenChange={setShowMobileProperties}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-10 w-10 bg-background shadow-md"
              >
                <PanelRight className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[320px] p-0">
              <EditorProperties onClose={() => setShowMobileProperties(false)} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Properties - hidden on mobile */}
        <div className="hidden lg:block">
          {showProperties && <EditorProperties onClose={() => setShowProperties(false)} />}
        </div>
      </div>
    </div>
  )
}
