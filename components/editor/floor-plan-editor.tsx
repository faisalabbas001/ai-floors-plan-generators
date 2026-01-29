'use client'

import { useState } from 'react'
import { EditorHeader } from './editor-header'
import { EditorToolbar } from './editor-toolbar'
import { EditorSidebar } from './editor-sidebar'
import { EditorCanvas } from './editor-canvas'
import { EditorProperties } from './editor-properties'

export function FloorPlanEditor() {
  const [selectedTool, setSelectedTool] = useState('select')
  const [showProperties, setShowProperties] = useState(true)

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <EditorHeader />
      <EditorToolbar selectedTool={selectedTool} onToolChange={setSelectedTool} />
      
      <div className="flex flex-1 overflow-hidden">
        <EditorSidebar />
        <EditorCanvas />
        {showProperties && <EditorProperties onClose={() => setShowProperties(false)} />}
      </div>
    </div>
  )
}
