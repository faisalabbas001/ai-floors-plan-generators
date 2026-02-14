'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import {
  Search,
  LayoutGrid,
  Building2,
  Home,
  Hotel,
  UtensilsCrossed,
  Briefcase,
  Loader2,
  ArrowRight,
  Layers,
  X,
  DoorOpen,
  Maximize2,
  CheckCircle2,
  Eye,
  Sparkles,
  Ruler,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, usePlannerStore } from '@/lib/stores'
import { templatesApi, type TemplateInfo, type TemplateCategory, type TemplateRoomSummary } from '@/lib/api'

// Room type colors for mini floor plan preview
const ROOM_PREVIEW_COLORS: Record<string, string> = {
  lobby: '#E3F2FD',
  vestibule: '#E8EAF6',
  service: '#FFF3E0',
  office: '#F3E5F5',
  vault: '#EFEBE9',
  storage: '#F5F5F5',
  break_room: '#E8F5E9',
  bathroom: '#E0F7FA',
  utility: '#ECEFF1',
  corridor: '#FAFAFA',
  bedroom: '#FFF8E1',
  living: '#E8F5E9',
  dining: '#FFF3E0',
  kitchen: '#FFFDE7',
  staircase: '#F5F5F5',
  default: '#F8F9FA',
}

const getRoomPreviewColor = (type: string): string => {
  const t = (type || '').toLowerCase()
  for (const [key, color] of Object.entries(ROOM_PREVIEW_COLORS)) {
    if (t.includes(key)) return color
  }
  return ROOM_PREVIEW_COLORS.default
}

const categoryIcons: Record<string, React.ReactNode> = {
  bank: <Building2 className="w-5 h-5" />,
  residential: <Home className="w-5 h-5" />,
  hotel: <Hotel className="w-5 h-5" />,
  restaurant: <UtensilsCrossed className="w-5 h-5" />,
  commercial: <Briefcase className="w-5 h-5" />,
}

const categoryColors: Record<string, string> = {
  bank: 'from-blue-500/10 to-blue-600/5 border-blue-200',
  residential: 'from-green-500/10 to-green-600/5 border-green-200',
  hotel: 'from-purple-500/10 to-purple-600/5 border-purple-200',
  restaurant: 'from-orange-500/10 to-orange-600/5 border-orange-200',
  commercial: 'from-slate-500/10 to-slate-600/5 border-slate-200',
}

// Mini Floor Plan SVG Preview Component
function MiniFloorPlan({ rooms, buildingDimensions, category }: {
  rooms: TemplateRoomSummary[]
  buildingDimensions?: { width: number; depth: number }
  category: string
}) {
  const svgData = useMemo(() => {
    if (!rooms || rooms.length === 0 || !buildingDimensions) return null

    const bw = buildingDimensions.width
    const bd = buildingDimensions.depth
    const padding = 8
    const svgW = 280
    const svgH = 160
    const scaleX = (svgW - padding * 2) / bw
    const scaleY = (svgH - padding * 2) / bd
    const s = Math.min(scaleX, scaleY)
    const offsetX = (svgW - bw * s) / 2
    const offsetY = (svgH - bd * s) / 2

    return { bw, bd, s, offsetX, offsetY, svgW, svgH }
  }, [rooms, buildingDimensions])

  if (!svgData) {
    return (
      <div className="w-full h-40 bg-muted/30 rounded-lg flex items-center justify-center">
        <Layers className="w-8 h-8 text-muted-foreground/40" />
      </div>
    )
  }

  const { bw, bd, s, offsetX, offsetY, svgW, svgH } = svgData

  return (
    <div className="w-full rounded-lg overflow-hidden bg-white border border-border/50">
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-40">
        {/* Background */}
        <rect width={svgW} height={svgH} fill="#FAFBFC" />

        {/* Building outline */}
        <rect
          x={offsetX}
          y={offsetY}
          width={bw * s}
          height={bd * s}
          fill="white"
          stroke="#1a1a1a"
          strokeWidth="2.5"
        />

        {/* Rooms */}
        {rooms.map((room) => {
          const rx = offsetX + (room.position?.x || 0) * s
          const ry = offsetY + (room.position?.y || 0) * s
          const rw = (room.dimensions?.width || 10) * s
          const rh = (room.dimensions?.length || 10) * s
          const color = getRoomPreviewColor(room.type)
          const fontSize = Math.min(rw / room.name.length * 1.4, rh * 0.28, 7.5)

          return (
            <g key={room.id}>
              <rect
                x={rx + 0.5}
                y={ry + 0.5}
                width={Math.max(rw - 1, 1)}
                height={Math.max(rh - 1, 1)}
                fill={color}
                stroke="#666"
                strokeWidth="0.8"
              />
              {/* Room name - only show if room is large enough */}
              {rw > 12 && rh > 10 && (
                <text
                  x={rx + rw / 2}
                  y={ry + rh / 2 + fontSize * 0.35}
                  textAnchor="middle"
                  fill="#333"
                  fontSize={fontSize}
                  fontFamily="Arial, sans-serif"
                  fontWeight="600"
                >
                  {room.name.length > 12 ? room.name.substring(0, 10) + '..' : room.name}
                </text>
              )}
            </g>
          )
        })}

        {/* Category badge */}
        <rect x={svgW - 60} y={4} width={56} height={16} rx={8} fill="rgba(0,0,0,0.6)" />
        <text x={svgW - 32} y={15} textAnchor="middle" fill="white" fontSize="7" fontFamily="Arial" fontWeight="600">
          {category.toUpperCase()}
        </text>
      </svg>
    </div>
  )
}

// Template Detail Modal
function TemplateDetailModal({
  template,
  onClose,
  onApply,
  isApplying,
}: {
  template: TemplateInfo
  onClose: () => void
  onApply: (id: string) => void
  isApplying: boolean
}) {
  const rooms = template.roomSummary || []
  const totalArea = rooms.reduce((sum, r) => sum + (r.areaSqft || 0), 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              {categoryIcons[template.category] || <Layers className="w-5 h-5 text-primary" />}
            </div>
            <div>
              <h2 className="text-xl font-bold">{template.name}</h2>
              <p className="text-sm text-muted-foreground capitalize">{template.category} Template</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {/* Floor Plan Preview */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Floor Plan Preview</h3>
            <MiniFloorPlan
              rooms={rooms}
              buildingDimensions={template.buildingDimensions}
              category={template.category}
            />
          </div>

          {/* Description */}
          <div>
            <p className="text-muted-foreground">{template.description}</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Maximize2 className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{template.minArea.toLocaleString()}-{template.maxArea.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Sq. Ft. Range</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <DoorOpen className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{rooms.length}</p>
              <p className="text-xs text-muted-foreground">Rooms</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Layers className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{template.floors}</p>
              <p className="text-xs text-muted-foreground">Floor{template.floors > 1 ? 's' : ''}</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-center">
              <Ruler className="w-4 h-4 mx-auto mb-1 text-primary" />
              <p className="text-lg font-bold">{template.buildingDimensions ? `${template.buildingDimensions.width}×${template.buildingDimensions.depth}` : '-'}</p>
              <p className="text-xs text-muted-foreground">Dimensions (ft)</p>
            </div>
          </div>

          {/* Highlights */}
          {template.highlights && template.highlights.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Key Features</h3>
              <div className="flex flex-wrap gap-2">
                {template.highlights.map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* Room Breakdown */}
          <div>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Room Breakdown ({rooms.length} rooms, {totalArea.toLocaleString()} sq ft total)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-muted/30 transition-colors"
                >
                  <div
                    className="w-3 h-8 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: getRoomPreviewColor(room.type) }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{room.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {room.areaSqft} sqft &middot; {room.dimensions?.width}×{room.dimensions?.length} ft
                    </p>
                  </div>
                  {room.features && room.features.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded flex-shrink-0">
                      {room.features.length} features
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => onApply(template.id)}
            disabled={isApplying}
            className="gap-2 min-w-[180px]"
          >
            {isApplying ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isApplying ? 'Applying...' : 'Use This Template'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function TemplatesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { setGeneratedPlan } = usePlannerStore()
  const [mounted, setMounted] = useState(false)
  const [templates, setTemplates] = useState<TemplateInfo[]>([])
  const [categories, setCategories] = useState<TemplateCategory[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isApplying, setIsApplying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateInfo | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, authLoading, router])

  useEffect(() => {
    if (mounted && isAuthenticated) {
      loadData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated])

  const loadData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [templatesRes, categoriesRes] = await Promise.all([
        templatesApi.getAllTemplates(),
        templatesApi.getCategories(),
      ])

      if (templatesRes.success && templatesRes.data) {
        setTemplates(templatesRes.data.templates)
      }
      if (categoriesRes.success && categoriesRes.data) {
        setCategories(categoriesRes.data.categories)
      }
    } catch {
      setError('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = async () => {
    setIsLoading(true)
    const filters = selectedCategory !== 'all' ? { category: selectedCategory } : undefined
    const response = await templatesApi.searchTemplates(searchQuery, filters)
    if (response.success && response.data) {
      setTemplates(response.data.templates)
    }
    setIsLoading(false)
  }

  const handleCategoryChange = async (category: string) => {
    setSelectedCategory(category)
    setIsLoading(true)
    if (category === 'all') {
      const response = await templatesApi.getAllTemplates()
      if (response.success && response.data) {
        setTemplates(response.data.templates)
      }
    } else {
      const response = await templatesApi.getTemplatesByCategory(category)
      if (response.success && response.data) {
        setTemplates(response.data.templates)
      }
    }
    setIsLoading(false)
  }

  const handleApplyTemplate = async (templateId: string) => {
    setIsApplying(true)
    const response = await templatesApi.applyTemplate(templateId)
    if (response.success && response.data) {
      setGeneratedPlan(response.data.plan)
      toast.success(`Template "${response.data.templateName}" applied successfully!`)
      setSelectedTemplate(null)
      router.push('/editor')
    } else {
      toast.error(response.message || 'Failed to apply template')
    }
    setIsApplying(false)
  }

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <main className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </main>
      </div>
    )
  }

  if (!isAuthenticated) return null

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Layers className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Template Library</h1>
              <p className="text-muted-foreground">
                Browse professional floor plan templates for banks, hotels, offices, and more.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search templates by name, type, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} className="gap-2">
            <Search className="w-4 h-4" />
            Search
          </Button>
        </div>

        {/* Category Tabs */}
        <Tabs value={selectedCategory} onValueChange={handleCategoryChange} className="mb-8">
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all" className="gap-2">
              <LayoutGrid className="w-4 h-4" />
              All
            </TabsTrigger>
            {categories.map((cat) => (
              <TabsTrigger key={cat.id} value={cat.id} className="gap-2">
                {categoryIcons[cat.id] || <Layers className="w-4 h-4" />}
                {cat.name} ({cat.count})
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={selectedCategory} className="mt-6">
            {error && (
              <div className="text-center py-8">
                <p className="text-destructive mb-4">{error}</p>
                <Button variant="outline" onClick={loadData}>
                  Try Again
                </Button>
              </div>
            )}

            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : templates.length === 0 ? (
              <div className="text-center py-16">
                <LayoutGrid className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  {searchQuery
                    ? 'Try a different search query'
                    : 'No templates available in this category'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => {
                  const rooms = template.roomSummary || []
                  const totalArea = rooms.reduce((sum, r) => sum + (r.areaSqft || 0), 0)

                  return (
                    <Card
                      key={template.id}
                      className={`group hover:shadow-lg transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 bg-gradient-to-br ${categoryColors[template.category] || 'from-gray-50 to-gray-100 border-gray-200'}`}
                      onClick={() => setSelectedTemplate(template)}
                    >
                      {/* Mini Floor Plan Preview */}
                      <div className="p-4 pb-0">
                        <MiniFloorPlan
                          rooms={rooms}
                          buildingDimensions={template.buildingDimensions}
                          category={template.category}
                        />
                      </div>

                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors flex-shrink-0">
                            {categoryIcons[template.category] || <Layers className="w-5 h-5 text-primary" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base mb-0.5">{template.name}</CardTitle>
                            <p className="text-xs text-muted-foreground capitalize">{template.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
                          {template.description}
                        </p>
                      </CardHeader>

                      <CardContent className="pt-0 space-y-3">
                        {/* Stats Row */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Maximize2 className="w-3.5 h-3.5" />
                            <span>{template.minArea.toLocaleString()}-{template.maxArea.toLocaleString()} sqft</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>{rooms.length} rooms</span>
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Layers className="w-3.5 h-3.5" />
                            <span>{template.floors} floor{template.floors > 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        {/* Highlight Tags */}
                        {template.highlights && template.highlights.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {template.highlights.slice(0, 3).map((h, i) => (
                              <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/80 text-[10px] font-medium text-muted-foreground border border-border/50">
                                <CheckCircle2 className="w-2.5 h-2.5 text-green-500" />
                                {h}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Room Preview Tags */}
                        <div className="flex flex-wrap gap-1">
                          {rooms.slice(0, 4).map((room) => (
                            <span key={room.id} className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground border border-border/30">
                              {room.name}
                            </span>
                          ))}
                          {rooms.length > 4 && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-background/60 text-muted-foreground border border-border/30">
                              +{rooms.length - 4} more
                            </span>
                          )}
                        </div>

                        <Separator />

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTemplate(template)
                            }}
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Preview
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 gap-1.5 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleApplyTemplate(template.id)
                            }}
                          >
                            Use Template <ArrowRight className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Template Detail Modal */}
      {selectedTemplate && (
        <TemplateDetailModal
          template={selectedTemplate}
          onClose={() => setSelectedTemplate(null)}
          onApply={handleApplyTemplate}
          isApplying={isApplying}
        />
      )}
    </div>
  )
}
