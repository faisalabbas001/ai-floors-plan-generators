'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  BookOpen,
  Plus,
  Palette,
  LayoutGrid,
  Armchair,
  Shield,
  Trash2,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  Upload,
  FileText,
} from 'lucide-react'
import { useAuthStore, usePlannerStore } from '@/lib/stores'
import { useBrandManualStore } from '@/lib/stores/brand-manual-store'
import type { CreateBrandManualData, BrandManualPreset, BrandManualSummary } from '@/lib/api/brand-manual'

export default function BrandManualPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { generatedPlan } = usePlannerStore()
  const {
    manuals,
    presets,
    selectedManual,
    validationResult,
    isLoading,
    error,
    fetchPresets,
    fetchManuals,
    fetchManualById,
    createManual,
    deleteManual,
    validatePlan,
    parsePdf,
    clearValidation,
    clearError,
  } = useBrandManualStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState('manuals')
  const [showCreate, setShowCreate] = useState(false)
  const [newManual, setNewManual] = useState<CreateBrandManualData>({
    name: '',
    bank_name: '',
    description: '',
  })
  // PDF upload state
  const [pdfBankName, setPdfBankName] = useState('')
  const [pdfManualName, setPdfManualName] = useState('')
  const [parsedData, setParsedData] = useState<CreateBrandManualData | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
      fetchPresets()
      fetchManuals()
    }
  }, [mounted, isAuthenticated, fetchPresets, fetchManuals])

  const handleCreateManual = async () => {
    if (!newManual.name || !newManual.bank_name) return
    const success = await createManual(newManual)
    if (success) {
      setShowCreate(false)
      setNewManual({ name: '', bank_name: '', description: '' })
    }
  }

  const handleCreateFromPreset = async (preset: BrandManualPreset) => {
    const presetData: CreateBrandManualData = {
      name: `${preset.bank_name} - Custom`,
      bank_name: preset.bank_name,
      description: `Based on ${preset.name} preset`,
      status: 'draft',
    }
    const success = await createManual(presetData)
    if (success) {
      setActiveTab('manuals')
    }
  }

  const handleValidate = async (manualId: string | number) => {
    if (!generatedPlan) return
    await validatePlan(manualId, generatedPlan)
    setActiveTab('validation')
  }

  const handleDeleteManual = async (id: number) => {
    if (confirm('Are you sure you want to delete this brand manual?')) {
      await deleteManual(id)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadError(null)
    }
  }

  const handlePdfUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a PDF file first')
      return
    }
    if (!pdfBankName.trim()) {
      setUploadError('Please enter a bank name')
      return
    }

    setIsParsing(true)
    setUploadError(null)
    clearError()

    try {
      const result = await parsePdf(selectedFile, pdfBankName.trim(), pdfManualName.trim() || undefined)
      if (result) {
        setParsedData(result)
        setSelectedFile(null)
      } else {
        // parsePdf returned null - store shows toast, also show inline error
        setUploadError('Failed to parse PDF. The file might be image-based (scanned), corrupted, or too short. Please try a text-based PDF.')
      }
    } catch {
      setUploadError('Failed to parse PDF. Please try again.')
    } finally {
      setIsParsing(false)
    }
  }

  const handleSaveParsedManual = async () => {
    if (!parsedData) return
    const success = await createManual(parsedData)
    if (success) {
      setParsedData(null)
      setPdfBankName('')
      setPdfManualName('')
      setActiveTab('manuals')
    }
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Brand Manual System</h1>
            <p className="text-muted-foreground">
              Manage bank brand manuals with design tokens, layout rules, and compliance validation.
            </p>
          </div>
          <Button className="gap-2" onClick={() => { setShowCreate(true); setActiveTab('manuals') }}>
            <Plus className="w-4 h-4" /> New Manual
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="manuals" className="gap-2">
              <BookOpen className="w-4 h-4" /> My Manuals
            </TabsTrigger>
            <TabsTrigger value="presets" className="gap-2">
              <Sparkles className="w-4 h-4" /> Presets
            </TabsTrigger>
            <TabsTrigger value="details" className="gap-2" disabled={!selectedManual}>
              <Palette className="w-4 h-4" /> Details
            </TabsTrigger>
            <TabsTrigger value="upload" className="gap-2">
              <Upload className="w-4 h-4" /> PDF Upload
            </TabsTrigger>
            <TabsTrigger value="validation" className="gap-2" disabled={!validationResult}>
              <Shield className="w-4 h-4" /> Validation
            </TabsTrigger>
          </TabsList>

          {/* My Manuals Tab */}
          <TabsContent value="manuals">
            {/* Create Form */}
            {showCreate && (
              <Card className="mb-6 border-primary">
                <CardHeader>
                  <CardTitle>Create Brand Manual</CardTitle>
                  <CardDescription>Define a new bank brand manual</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Manual Name *</Label>
                        <Input
                          placeholder="e.g., Faysal Bank 2024 Standards"
                          value={newManual.name}
                          onChange={(e) => setNewManual({ ...newManual, name: e.target.value })}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Bank Name *</Label>
                        <Input
                          placeholder="e.g., Faysal Bank"
                          value={newManual.bank_name}
                          onChange={(e) => setNewManual({ ...newManual, bank_name: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea
                        placeholder="Brief description of this brand manual..."
                        value={newManual.description || ''}
                        onChange={(e) => setNewManual({ ...newManual, description: e.target.value })}
                      />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={handleCreateManual} disabled={!newManual.name || !newManual.bank_name || isLoading}>
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Create Manual
                      </Button>
                      <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Manuals List */}
            {isLoading && manuals.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : manuals.length === 0 ? (
              <div className="text-center py-16">
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No brand manuals yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create one from scratch or start from a preset.
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => setShowCreate(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Create New
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('presets')} className="gap-2">
                    <Sparkles className="w-4 h-4" /> Browse Presets
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {manuals.map((manual: BrandManualSummary) => (
                  <Card key={manual.id} className="group hover:border-primary transition-colors">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{manual.name}</CardTitle>
                          <CardDescription>{manual.bank_name}</CardDescription>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          manual.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {manual.status}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {manual.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{manual.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { fetchManualById(manual.id); setActiveTab('details') }}
                        >
                          View Details
                        </Button>
                        {generatedPlan && (
                          <Button variant="outline" size="sm" onClick={() => handleValidate(manual.id)}>
                            <Shield className="w-3 h-3 mr-1" /> Validate
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteManual(manual.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Presets Tab */}
          <TabsContent value="presets">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {presets.map((preset: BrandManualPreset) => (
                <Card key={preset.id} className="hover:border-primary transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{preset.name}</CardTitle>
                        <CardDescription>{preset.bank_name}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{preset.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <LayoutGrid className="w-3 h-3" /> {preset.tiers} tiers
                      </span>
                      <span className="flex items-center gap-1">
                        <Armchair className="w-3 h-3" /> {preset.furnitureCount} furniture
                      </span>
                      <span className="flex items-center gap-1">
                        <Palette className="w-3 h-3" /> {preset.materialCount} materials
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => { fetchManualById(preset.id); setActiveTab('details') }}
                      >
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleCreateFromPreset(preset)} className="gap-1">
                        <Copy className="w-3 h-3" /> Use as Base
                      </Button>
                      {generatedPlan && (
                        <Button variant="outline" size="sm" onClick={() => handleValidate(preset.id)}>
                          <Shield className="w-3 h-3 mr-1" /> Validate
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Details Tab */}
          <TabsContent value="details">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : selectedManual ? (
              <div className="space-y-6">
                {/* Basic Info */}
                <Card>
                  <CardHeader>
                    <CardTitle>{selectedManual.name}</CardTitle>
                    <CardDescription>{selectedManual.bank_name} | {selectedManual.status}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{selectedManual.description}</p>
                  </CardContent>
                </Card>

                {/* Design Tokens */}
                {selectedManual.design_tokens && Object.keys(selectedManual.design_tokens).length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Palette className="w-5 h-5" /> Design Tokens
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedManual.design_tokens.colors && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Colors</h4>
                          <div className="flex gap-3 flex-wrap">
                            {Object.entries(selectedManual.design_tokens.colors).map(([name, color]) => (
                              <div key={name} className="flex items-center gap-2">
                                <div
                                  className="w-8 h-8 rounded border"
                                  style={{ backgroundColor: color }}
                                />
                                <span className="text-sm">{name}: {color}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Tier Templates */}
                {selectedManual.tier_templates && selectedManual.tier_templates.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <LayoutGrid className="w-5 h-5" /> Tier Templates ({selectedManual.tier_templates.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedManual.tier_templates.map((tier) => (
                          <div key={tier.id} className="p-4 border rounded-lg">
                            <h4 className="font-medium">{tier.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {tier.totalArea} {tier.unit} | {tier.hasMorcha ? 'With Morcha' : 'Without Morcha'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {tier.rooms.length} rooms
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Furniture Specs */}
                {selectedManual.furniture_specs && selectedManual.furniture_specs.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Armchair className="w-5 h-5" /> Furniture Specs ({selectedManual.furniture_specs.length})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left p-2">Name</th>
                              <th className="text-left p-2">Dimensions (WxDxH)</th>
                              <th className="text-left p-2">Material</th>
                              <th className="text-left p-2">Zone</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedManual.furniture_specs.map((spec) => (
                              <tr key={spec.id} className="border-b last:border-0">
                                <td className="p-2">{spec.name}</td>
                                <td className="p-2">{spec.width}x{spec.depth}x{spec.height}mm</td>
                                <td className="p-2">{spec.material}</td>
                                <td className="p-2 capitalize">{spec.zone}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground">
                Select a brand manual to view details
              </div>
            )}
          </TabsContent>

          {/* PDF Upload Tab */}
          <TabsContent value="upload">
            <div className="max-w-2xl space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Upload Brand Manual PDF
                  </CardTitle>
                  <CardDescription>
                    Upload a bank design guideline PDF. AI will extract design tokens, layout rules, furniture specs, and material specifications automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Bank Name *</Label>
                      <Input
                        placeholder="e.g., Faysal Bank"
                        value={pdfBankName}
                        onChange={(e) => { setPdfBankName(e.target.value); setUploadError(null) }}
                        disabled={isParsing}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>Manual Name (optional)</Label>
                      <Input
                        placeholder="e.g., Branch Design Guide 2024"
                        value={pdfManualName}
                        onChange={(e) => setPdfManualName(e.target.value)}
                        disabled={isParsing}
                      />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>PDF File</Label>
                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={handleFileSelect}
                      disabled={isParsing}
                      className="max-w-md"
                    />
                    {selectedFile && (
                      <p className="text-xs text-primary">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">Max 20MB. Supports text-based PDF files.</p>
                  </div>

                  {uploadError && (
                    <div className="flex items-center gap-2 text-sm text-destructive p-3 bg-destructive/10 rounded-lg">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {uploadError}
                    </div>
                  )}

                  {isParsing ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 bg-muted rounded-lg">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Parsing PDF with AI... This may take 15-30 seconds.
                    </div>
                  ) : (
                    <Button
                      onClick={handlePdfUpload}
                      disabled={!selectedFile || !pdfBankName.trim() || isParsing}
                      className="gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload & Parse PDF
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Parsed Preview */}
              {parsedData && (
                <Card className="border-primary">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Extracted Data Preview
                    </CardTitle>
                    <CardDescription>
                      Review the AI-extracted data below, then save it as a brand manual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">Name:</span>
                        <p className="font-medium">{parsedData.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Bank:</span>
                        <p className="font-medium">{parsedData.bank_name}</p>
                      </div>
                    </div>

                    {parsedData.design_tokens && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Design Tokens</p>
                        <p className="text-xs text-muted-foreground">
                          Colors: {Object.keys(parsedData.design_tokens.colors || {}).length} |
                          Spacing rules: {Object.keys(parsedData.design_tokens.spacing || {}).length}
                        </p>
                      </div>
                    )}

                    {parsedData.layout_rules && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Layout Rules</p>
                        <p className="text-xs text-muted-foreground">
                          Zones: {(parsedData.layout_rules as { zones?: unknown[] })?.zones?.length || 0} |
                          Adjacency rules: {(parsedData.layout_rules as { adjacencyRules?: unknown[] })?.adjacencyRules?.length || 0}
                        </p>
                      </div>
                    )}

                    {parsedData.tier_templates && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Tier Templates</p>
                        <p className="text-xs text-muted-foreground">
                          {parsedData.tier_templates.length} tier(s) extracted
                        </p>
                      </div>
                    )}

                    {parsedData.furniture_specs && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Furniture Specs</p>
                        <p className="text-xs text-muted-foreground">
                          {parsedData.furniture_specs.length} item(s) extracted
                        </p>
                      </div>
                    )}

                    {parsedData.material_specs && (
                      <div className="p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Material Specs</p>
                        <p className="text-xs text-muted-foreground">
                          {parsedData.material_specs.length} material(s) extracted
                        </p>
                      </div>
                    )}

                    <div className="flex gap-3 pt-2">
                      <Button onClick={handleSaveParsedManual} disabled={isLoading} className="gap-2">
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        Save as Brand Manual
                      </Button>
                      <Button variant="outline" onClick={() => setParsedData(null)}>
                        Discard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Validation Tab */}
          <TabsContent value="validation">
            {validationResult ? (
              <div className="space-y-6">
                {/* Score Hero Section */}
                {(() => {
                  const scoreColor = validationResult.score >= 80 ? {
                    stroke: '#16A34A', text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30',
                    border: 'border-green-200 dark:border-green-900', label: 'Brand Compliant'
                  } : validationResult.score >= 60 ? {
                    stroke: '#CA8A04', text: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30',
                    border: 'border-yellow-200 dark:border-yellow-900', label: 'Needs Attention'
                  } : {
                    stroke: '#DC2626', text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30',
                    border: 'border-red-200 dark:border-red-900', label: 'Non-Compliant'
                  }
                  return (
                    <div className={`rounded-xl p-6 border ${scoreColor.bg} ${scoreColor.border}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                          {/* Circular score gauge */}
                          <div className="relative w-28 h-28">
                            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                              <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                              <circle cx="50" cy="50" r="42" fill="none"
                                stroke={scoreColor.stroke}
                                strokeWidth="8" strokeLinecap="round"
                                strokeDasharray={`${(validationResult.score / 100) * 264} 264`}
                              />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className={`text-3xl font-bold ${scoreColor.text}`}>
                                {validationResult.score}%
                              </span>
                            </div>
                          </div>

                          <div>
                            <h3 className="text-xl font-bold mb-1">{scoreColor.label}</h3>
                            <p className="text-muted-foreground mb-2">
                              {validationResult.manual_name} - {validationResult.bank_name}
                            </p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1.5">
                                <CheckCircle2 className="w-4 h-4 text-green-600" />
                                <strong>{validationResult.passed}</strong> passed
                              </span>
                              <span className="flex items-center gap-1.5">
                                <XCircle className="w-4 h-4 text-red-600" />
                                <strong>{validationResult.violations.filter(v => v.severity === 'error').length}</strong> errors
                              </span>
                              <span className="flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-yellow-500" />
                                <strong>{validationResult.violations.filter(v => v.severity === 'warning').length}</strong> warnings
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="hidden md:grid grid-cols-2 gap-4">
                          <div className="text-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                            <p className="text-2xl font-bold">{validationResult.totalChecks}</p>
                            <p className="text-xs text-muted-foreground">Total Checks</p>
                          </div>
                          <div className="text-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                            <p className="text-2xl font-bold">{validationResult.passed}</p>
                            <p className="text-xs text-muted-foreground">Passed</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Compliance breakdown bar */}
                {validationResult.totalChecks > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Compliance Breakdown</span>
                    </div>
                    <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                      <div className="bg-green-500 transition-all" style={{ width: `${(validationResult.passed / validationResult.totalChecks) * 100}%` }} />
                      <div className="bg-red-500 transition-all" style={{ width: `${(validationResult.violations.filter(v => v.severity === 'error').length / validationResult.totalChecks) * 100}%` }} />
                      <div className="bg-yellow-400 transition-all" style={{ width: `${(validationResult.violations.filter(v => v.severity === 'warning').length / validationResult.totalChecks) * 100}%` }} />
                      <div className="bg-blue-400 transition-all" style={{ width: `${(validationResult.violations.filter(v => v.severity === 'info').length / validationResult.totalChecks) * 100}%` }} />
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Passed</span>
                      <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Errors</span>
                      <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Warnings</span>
                      <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> Info</span>
                    </div>
                  </div>
                )}

                {/* Violations */}
                {validationResult.violations.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <XCircle className="w-4 h-4 text-destructive" /> Issues Found ({validationResult.violations.length})
                    </h3>
                    {validationResult.violations.map((v, i) => (
                      <div key={i} className={`flex items-start gap-3 p-4 rounded-lg border ${
                        v.severity === 'error' ? 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900' :
                        v.severity === 'warning' ? 'bg-yellow-50/50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900' :
                        'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900'
                      }`}>
                        {v.severity === 'error' ? (
                          <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                        ) : v.severity === 'warning' ? (
                          <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{v.message}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              v.severity === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' :
                              v.severity === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' :
                              'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                            }`}>
                              {v.severity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Passes */}
                {validationResult.passes.length > 0 && (
                  <Card className="overflow-hidden">
                    <div className="px-4 py-2 bg-green-50 dark:bg-green-950/30 border-b border-green-200 dark:border-green-900">
                      <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Passed Checks ({validationResult.passes.length})
                      </p>
                    </div>
                    <div className="divide-y">
                      {validationResult.passes.map((p, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                          <p className="text-sm">{p.message}</p>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                <div className="text-center">
                  <Button variant="outline" onClick={clearValidation} className="gap-2">
                    <Shield className="w-4 h-4" /> Clear Results
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-10 h-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No Validation Results</h3>
                <p className="text-muted-foreground mb-4">
                  Select a brand manual and run validation to see compliance results here.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {error && (
          <div className="mt-6 text-center">
            <p className="text-destructive mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={clearError}>Dismiss</Button>
          </div>
        )}
      </main>
    </div>
  )
}
