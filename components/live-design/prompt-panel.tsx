'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Loader2,
  Sparkles,
  Building2,
  Ruler,
  Layers,
  Wand2,
  RotateCcw,
  Download,
  Settings2,
} from 'lucide-react'

interface PromptPanelProps {
  onGenerate: (prompt: string, settings: DesignSettings) => Promise<void>
  isGenerating: boolean
  onExportDXF?: () => void
  onExportDWG?: () => void
}

export interface DesignSettings {
  buildingType: string
  plotWidth: number
  plotHeight: number
  floors: string[]
  style: 'technical' | '2d' | '3d'
}

const BUILDING_TYPES = [
  'Residential',
  'Commercial',
  'Bank',
  'Hospital',
  'Restaurant',
  'Office',
  'School',
  'Warehouse',
  'Other',
]

const FLOOR_OPTIONS = ['Basement', 'Ground', 'First', 'Second', 'Third', 'Fourth', 'Fifth']

const EXAMPLE_PROMPTS = [
  {
    title: '3 Bedroom House',
    prompt: '3 bedroom house on 40x60 plot, kitchen near lounge, 2 bathrooms, stairs on right side, master bedroom with attached bath',
  },
  {
    title: 'Bank Branch',
    prompt: 'Bank branch with customer area, 4 teller counters, manager office, safe room, ATM area near entrance, staff room at back',
  },
  {
    title: 'Restaurant',
    prompt: 'Restaurant with dining area 60%, commercial kitchen, storage, 2 restrooms, manager office, outdoor seating area',
  },
  {
    title: 'Office Space',
    prompt: '5 room office, reception at front, conference room center, 3 private offices, open workspace area, pantry near back',
  },
]

export function PromptPanel({ onGenerate, isGenerating, onExportDXF, onExportDWG }: PromptPanelProps) {
  const [prompt, setPrompt] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<DesignSettings>({
    buildingType: 'Residential',
    plotWidth: 40,
    plotHeight: 60,
    floors: ['Ground'],
    style: 'technical',
  })

  const handleFloorToggle = (floor: string) => {
    setSettings(prev => ({
      ...prev,
      floors: prev.floors.includes(floor)
        ? prev.floors.filter(f => f !== floor)
        : [...prev.floors, floor],
    }))
  }

  const handleGenerate = () => {
    if (prompt.trim().length < 10) return
    onGenerate(prompt, settings)
  }

  const handleExampleClick = (example: typeof EXAMPLE_PROMPTS[0]) => {
    setPrompt(example.prompt)
  }

  return (
    <div className="h-full flex flex-col bg-background">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">Live CAD Design</h2>
              <p className="text-xs text-muted-foreground">
                Describe your building and see it in real-time
              </p>
            </div>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <Label htmlFor="prompt" className="text-sm font-medium">
              Describe Your Design
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="E.g., 3 bedroom house, 40x60 plot, kitchen near lounge, 2 bathrooms, stairs on right..."
              className="min-h-[120px] resize-none"
              disabled={isGenerating}
            />
            <p className="text-xs text-muted-foreground">
              Be specific about room positions, adjacencies, and sizes for accurate results
            </p>
          </div>

          {/* Example Prompts */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Quick Examples</Label>
            <div className="grid grid-cols-2 gap-2">
              {EXAMPLE_PROMPTS.map((example, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(example)}
                  className="text-left p-2 rounded-lg border hover:bg-muted/50 transition-colors"
                  disabled={isGenerating}
                >
                  <p className="text-xs font-medium">{example.title}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
            {showSettings ? 'Hide' : 'Show'} Advanced Settings
          </button>

          {/* Advanced Settings */}
          {showSettings && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Design Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Building Type */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Building2 className="h-3.5 w-3.5" />
                    Building Type
                  </Label>
                  <Select
                    value={settings.buildingType}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, buildingType: value }))}
                    disabled={isGenerating}
                  >
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUILDING_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Plot Dimensions */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Ruler className="h-3.5 w-3.5" />
                    Plot Dimensions (feet)
                  </Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Width</Label>
                      <Input
                        type="number"
                        value={settings.plotWidth}
                        onChange={(e) => setSettings(prev => ({ ...prev, plotWidth: parseInt(e.target.value) || 40 }))}
                        className="h-8 text-sm"
                        disabled={isGenerating}
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">Depth</Label>
                      <Input
                        type="number"
                        value={settings.plotHeight}
                        onChange={(e) => setSettings(prev => ({ ...prev, plotHeight: parseInt(e.target.value) || 60 }))}
                        className="h-8 text-sm"
                        disabled={isGenerating}
                      />
                    </div>
                  </div>
                </div>

                {/* Floors */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2 text-xs">
                    <Layers className="h-3.5 w-3.5" />
                    Floors
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {FLOOR_OPTIONS.map((floor) => (
                      <Button
                        key={floor}
                        type="button"
                        variant={settings.floors.includes(floor) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleFloorToggle(floor)}
                        disabled={isGenerating}
                        className="text-xs h-7 px-2"
                      >
                        {floor}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleGenerate}
            disabled={isGenerating || prompt.trim().length < 10}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating Design...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4" />
                Generate Design
              </>
            )}
          </Button>

          {/* Info Card */}
          <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
            <CardContent className="p-3">
              <h4 className="text-xs font-medium text-blue-800 dark:text-blue-200 mb-1">
                How it works
              </h4>
              <ul className="text-[11px] text-blue-700 dark:text-blue-300 space-y-1">
                <li>1. Enter a detailed description of your building</li>
                <li>2. AI converts your text to structured room data</li>
                <li>3. Layout engine positions rooms accurately</li>
                <li>4. CAD viewer shows the design in real-time</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Export Buttons */}
      <div className="p-4 border-t space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onExportDXF}
            disabled={isGenerating}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export DXF
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExportDWG}
            disabled={isGenerating}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Export DWG
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          DXF works with AutoCAD, LibreCAD, and all CAD software
        </p>
      </div>
    </div>
  )
}

export default PromptPanel
