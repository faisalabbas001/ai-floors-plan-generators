'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Loader2,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  Download,
  Upload,
  RefreshCw,
  FileBox,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore, usePlannerStore } from '@/lib/stores'
import { apsApi, type APSStatus, type WorkItemStatus, type RevitGenerationResult } from '@/lib/api'
import { ModelViewer } from '@/components/viewer/model-viewer'

type JobPhase = 'idle' | 'authenticating' | 'submitting' | 'processing' | 'completed' | 'failed'

export default function RevitPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { generatedPlan } = usePlannerStore()
  const [mounted, setMounted] = useState(false)

  // APS status
  const [apsStatus, setApsStatus] = useState<APSStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)

  // Generation state
  const [jobPhase, setJobPhase] = useState<JobPhase>('idle')
  const [workItemId, setWorkItemId] = useState<string | null>(null)
  const [workItemStatus, setWorkItemStatus] = useState<WorkItemStatus | null>(null)
  const [generationResult, setGenerationResult] = useState<RevitGenerationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  // Model viewer
  const [modelUrn, setModelUrn] = useState<string | null>(null)

  // Template upload
  const [isUploading, setIsUploading] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateBuildingType, setTemplateBuildingType] = useState('residential')
  const [uploadedTemplates, setUploadedTemplates] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading && !isAuthenticated) {
      router.push('/login')
    }
  }, [mounted, isAuthenticated, authLoading, router])

  // Fetch APS status
  const fetchStatus = useCallback(async () => {
    setStatusLoading(true)
    try {
      const response = await apsApi.getStatus()
      if (response.success && response.data) {
        setApsStatus(response.data)
      }
    } catch {
      setApsStatus(null)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  useEffect(() => {
    if (mounted && isAuthenticated) {
      fetchStatus()
      loadTemplates()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, isAuthenticated, fetchStatus])

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearTimeout(pollingRef.current)
      }
    }
  }, [])

  // Poll work item status
  const pollStatus = useCallback(async (itemId: string) => {
    try {
      const response = await apsApi.getWorkItemStatus(itemId)
      if (response.success && response.data) {
        setWorkItemStatus(response.data)

        if (response.data.status === 'success') {
          setJobPhase('completed')
          setGenerationResult({
            success: true,
            workItemId: itemId,
            status: 'success',
            reportUrl: response.data.reportUrl,
          })
          toast.success('Revit model generated successfully!')
          return
        }

        if (response.data.status === 'failed' || response.data.status === 'cancelled') {
          setJobPhase('failed')
          setError(`Work item ${response.data.status}: Check the report for details.`)
          toast.error(`Revit generation ${response.data.status}`)
          return
        }

        // Continue polling
        pollingRef.current = setTimeout(() => pollStatus(itemId), 5000)
      }
    } catch {
      setJobPhase('failed')
      setError('Lost connection while polling status')
      toast.error('Failed to check generation status')
    }
  }, [])

  // Generate Revit model
  const handleGenerate = async () => {
    if (!generatedPlan) {
      toast.error('No floor plan available. Generate one first.')
      return
    }

    setJobPhase('authenticating')
    setError(null)
    setGenerationResult(null)
    setWorkItemStatus(null)
    setWorkItemId(null)

    try {
      // Authenticate with APS
      const authResponse = await apsApi.authenticate()
      if (!authResponse.success) {
        throw new Error(authResponse.message || 'APS authentication failed')
      }

      setJobPhase('submitting')

      // Submit generation job
      const genResponse = await apsApi.generateRevitModel(generatedPlan)
      if (!genResponse.success || !genResponse.data) {
        throw new Error(genResponse.message || 'Failed to submit Revit generation')
      }

      const { workItemId: itemId } = genResponse.data
      setWorkItemId(itemId)
      setJobPhase('processing')
      toast.success('Revit generation job submitted!')

      // Start polling
      pollingRef.current = setTimeout(() => pollStatus(itemId), 5000)
    } catch (err: unknown) {
      setJobPhase('failed')
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate Revit model'
      setError(errorMsg)
      toast.error(errorMsg)
    }
  }

  // Load uploaded templates
  const loadTemplates = useCallback(async () => {
    try {
      const response = await apsApi.getTemplates()
      if (response.success && response.data) {
        setUploadedTemplates(response.data.templates || [])
      }
    } catch (error) {
      console.error('Failed to load templates:', error)
    }
  }, [])

  // Upload template
  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation: File type
    if (!file.name.endsWith('.rvt')) {
      toast.error('Please select a valid Revit template (.rvt) file')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validation: Template name
    if (!templateName.trim()) {
      toast.error('Please enter a template name first')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validation: Template name length
    if (templateName.trim().length < 3) {
      toast.error('Template name must be at least 3 characters long')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (templateName.trim().length > 100) {
      toast.error('Template name must be less than 100 characters')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validation: Building type
    if (!templateBuildingType) {
      toast.error('Please select a building type')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validation: File size (max 100MB for Revit templates)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      toast.error('File size exceeds 100MB limit. Please select a smaller template file.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validation: Minimum file size (Revit templates should be at least 100KB)
    const minSize = 100 * 1024 // 100KB
    if (file.size < minSize) {
      toast.error('File appears to be too small for a valid Revit template. Please check the file.')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploading(true)
    try {
      const response = await apsApi.uploadTemplate(file, templateName.trim(), templateBuildingType)
      if (response.success && response.data) {
        toast.success(`Template "${templateName.trim()}" uploaded successfully!`)
        setModelUrn(response.data.urn)
        setTemplateName('')
        setTemplateBuildingType('residential')
        if (fileInputRef.current) fileInputRef.current.value = ''
        // Reload templates list
        await loadTemplates()
      } else {
        toast.error(response.message || 'Failed to upload template')
      }
    } catch {
      toast.error('Failed to upload template')
    } finally {
      setIsUploading(false)
    }
  }

  // Reset / try again
  const handleReset = () => {
    if (pollingRef.current) clearTimeout(pollingRef.current)
    setJobPhase('idle')
    setWorkItemId(null)
    setWorkItemStatus(null)
    setGenerationResult(null)
    setError(null)
  }

  const getPhaseLabel = (phase: JobPhase): string => {
    switch (phase) {
      case 'authenticating': return 'Authenticating with Autodesk...'
      case 'submitting': return 'Submitting generation job...'
      case 'processing': return 'Generating Revit model...'
      case 'completed': return 'Generation complete!'
      case 'failed': return 'Generation failed'
      default: return 'Ready'
    }
  }

  const getProgressPercent = (phase: JobPhase, status: WorkItemStatus | null): number => {
    switch (phase) {
      case 'authenticating': return 10
      case 'submitting': return 25
      case 'processing':
        if (status?.status === 'inprogress') return 60
        return 40
      case 'completed': return 100
      case 'failed': return 0
      default: return 0
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

  const progress = getProgressPercent(jobPhase, workItemStatus)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-1">Revit Integration</h1>
            <p className="text-muted-foreground">
              Generate Autodesk Revit models from your AI-generated floor plans
            </p>
          </div>
        </div>

        {/* APS Status Card */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="w-5 h-5" />
              Autodesk Platform Services Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusLoading ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking connection...
              </div>
            ) : apsStatus ? (
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2">
                  {apsStatus.configured ? (
                    <Wifi className="w-4 h-4 text-green-500" />
                  ) : (
                    <WifiOff className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-sm">
                    {apsStatus.configured ? 'Connected' : 'Not Configured'}
                  </span>
                </div>
                {apsStatus.hasValidToken && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    Token expires in {Math.round(apsStatus.tokenExpiresIn / 60)}m
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={fetchStatus} className="gap-1">
                  <RefreshCw className="w-3 h-3" />
                  Refresh
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">
                  Unable to reach APS. Check backend configuration.
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* No Plan Warning */}
        {!generatedPlan ? (
          <Card className="border-dashed mb-6">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Floor Plan Available</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Generate a floor plan first using the AI Generator, then come back to export it as a Revit model.
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
        ) : (
          <>
            {/* Generate Revit Model Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileBox className="w-5 h-5" />
                  Generate Revit Model
                </CardTitle>
                <CardDescription>
                  Convert your floor plan into a professional Autodesk Revit (.rvt) model using the Design Automation API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Plan Info */}
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <h4 className="text-sm font-medium mb-2">Current Floor Plan</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Building</span>
                      <p className="font-medium">{generatedPlan.buildingType || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Floors</span>
                      <p className="font-medium">{generatedPlan.floors?.length || 0}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Rooms</span>
                      <p className="font-medium">
                        {generatedPlan.floors?.reduce((acc, f) => acc + (f.rooms?.length || 0), 0) || 0}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Area</span>
                      <p className="font-medium">
                        {generatedPlan.floors?.[0]?.totalArea
                          ? `${generatedPlan.floors[0].totalArea} sqft`
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                {jobPhase !== 'idle' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{getPhaseLabel(jobPhase)}</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          jobPhase === 'failed'
                            ? 'bg-red-500'
                            : jobPhase === 'completed'
                            ? 'bg-green-500'
                            : 'bg-primary'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {workItemId && (
                      <p className="text-xs text-muted-foreground">
                        Work Item: {workItemId}
                      </p>
                    )}
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-lg border border-red-200 dark:border-red-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <div>
                      <p>{error}</p>
                      {workItemStatus?.reportUrl && (
                        <a
                          href={workItemStatus.reportUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary underline mt-1"
                        >
                          View Report <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                {/* Success Result */}
                {jobPhase === 'completed' && generationResult && (
                  <div className="p-4 rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/50 space-y-3">
                    <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-medium">Revit Model Generated Successfully</span>
                    </div>
                    {generationResult.files && (
                      <div className="space-y-2">
                        {generationResult.files.rvt && (
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                            <div className="flex items-center gap-3">
                              <FileBox className="h-8 w-8 text-blue-500" />
                              <div>
                                <p className="text-sm font-medium">Revit Model (.rvt)</p>
                                <p className="text-xs text-muted-foreground">Ready for download</p>
                              </div>
                            </div>
                            <a href={generationResult.files.rvt} download>
                              <Button size="sm" variant="outline" className="gap-1">
                                <Download className="w-3 h-3" /> Download
                              </Button>
                            </a>
                          </div>
                        )}
                        {generationResult.files.pdf && (
                          <div className="flex items-center justify-between p-3 rounded-lg border bg-background">
                            <div className="flex items-center gap-3">
                              <FileBox className="h-8 w-8 text-red-500" />
                              <div>
                                <p className="text-sm font-medium">Drawings PDF</p>
                                <p className="text-xs text-muted-foreground">Print-ready drawings</p>
                              </div>
                            </div>
                            <a href={generationResult.files.pdf} download>
                              <Button size="sm" variant="outline" className="gap-1">
                                <Download className="w-3 h-3" /> Download
                              </Button>
                            </a>
                          </div>
                        )}
                      </div>
                    )}
                    {generationResult.reportUrl && (
                      <a
                        href={generationResult.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-primary underline"
                      >
                        View Full Report <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                )}

                {/* Work Item Stats */}
                {workItemStatus?.stats && jobPhase === 'completed' && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-muted-foreground">
                    {workItemStatus.stats.timeQueued != null && (
                      <div className="p-2 rounded border">
                        <span className="block font-medium text-foreground">Queued</span>
                        {(workItemStatus.stats.timeQueued / 1000).toFixed(1)}s
                      </div>
                    )}
                    {workItemStatus.stats.timeDownloadStarted != null && (
                      <div className="p-2 rounded border">
                        <span className="block font-medium text-foreground">Download</span>
                        {(workItemStatus.stats.timeDownloadStarted / 1000).toFixed(1)}s
                      </div>
                    )}
                    {workItemStatus.stats.timeInstructionsStarted != null &&
                      workItemStatus.stats.timeInstructionsEnded != null && (
                      <div className="p-2 rounded border">
                        <span className="block font-medium text-foreground">Processing</span>
                        {((workItemStatus.stats.timeInstructionsEnded - workItemStatus.stats.timeInstructionsStarted) / 1000).toFixed(1)}s
                      </div>
                    )}
                    {workItemStatus.stats.timeUploadEnded != null && (
                      <div className="p-2 rounded border">
                        <span className="block font-medium text-foreground">Upload</span>
                        {(workItemStatus.stats.timeUploadEnded / 1000).toFixed(1)}s
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  {jobPhase === 'idle' && (
                    <Button
                      onClick={handleGenerate}
                      disabled={!apsStatus?.configured}
                      className="gap-2"
                    >
                      <FileBox className="w-4 h-4" />
                      Generate Revit Model
                    </Button>
                  )}
                  {(jobPhase === 'completed' || jobPhase === 'failed') && (
                    <Button onClick={handleReset} variant="outline" className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      {jobPhase === 'failed' ? 'Try Again' : 'Generate Another'}
                    </Button>
                  )}
                  {(jobPhase === 'authenticating' || jobPhase === 'submitting' || jobPhase === 'processing') && (
                    <Button disabled className="gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {getPhaseLabel(jobPhase)}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Template Upload Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Upload className="w-5 h-5" />
              Upload Revit Template
            </CardTitle>
            <CardDescription>
              Upload a custom Revit template (.rvt) to use when generating models
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="template-name">Template Name *</Label>
              <Input
                id="template-name"
                placeholder="e.g., Faysal Bank Tier-1A"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                disabled={isUploading}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Enter a descriptive name (3-100 characters)
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="building-type">Building Type *</Label>
              <Select value={templateBuildingType} onValueChange={setTemplateBuildingType} disabled={isUploading}>
                <SelectTrigger className="max-w-md">
                  <SelectValue placeholder="Select building type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="bank">Bank</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="school">School</SelectItem>
                  <SelectItem value="restaurant">Restaurant</SelectItem>
                  <SelectItem value="warehouse">Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="template-file">Revit Template File (.rvt) *</Label>
              <Input
                id="template-file"
                ref={fileInputRef}
                type="file"
                accept=".rvt"
                onChange={handleTemplateUpload}
                disabled={isUploading || !templateName.trim()}
                className="max-w-md"
              />
              <p className="text-xs text-muted-foreground">
                Only .rvt files are accepted. Size: 100KB - 100MB. {!templateName.trim() && <span className="text-amber-600">Enter template name first.</span>}
              </p>
            </div>
            {isUploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading template...
              </div>
            )}
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-2">
                <strong className="text-foreground">Template Requirements:</strong>
              </p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Valid Autodesk Revit template file (.rvt format)</li>
                <li>File size between 100KB and 100MB</li>
                <li>Template name: 3-100 characters</li>
                <li>Templates are stored securely and matched by building type</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Uploaded Templates List */}
        {uploadedTemplates.length > 0 && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Uploaded Templates ({uploadedTemplates.length})</CardTitle>
              <CardDescription>
                These templates will be used automatically based on building type
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {uploadedTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-sm">{template.template_name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground capitalize">{template.building_type}</span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {(template.file_size / 1024 / 1024).toFixed(2)} MB
                        </span>
                        <span className="text-xs text-muted-foreground">•</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(template.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* How It Works */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Revit Integration Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-4 gap-4">
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">1</span>
                </div>
                <h4 className="text-sm font-medium mb-1">Generate Plan</h4>
                <p className="text-xs text-muted-foreground">Use AI to create a floor plan from your description</p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">2</span>
                </div>
                <h4 className="text-sm font-medium mb-1">Submit to APS</h4>
                <p className="text-xs text-muted-foreground">Plan data is sent to Autodesk Design Automation</p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">3</span>
                </div>
                <h4 className="text-sm font-medium mb-1">Cloud Processing</h4>
                <p className="text-xs text-muted-foreground">Revit generates the model using your template</p>
              </div>
              <div className="text-center p-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                  <span className="text-primary font-bold">4</span>
                </div>
                <h4 className="text-sm font-medium mb-1">Download</h4>
                <p className="text-xs text-muted-foreground">Get your .rvt model and PDF drawings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3D Model Viewer */}
        {modelUrn && (
          <ModelViewer
            urn={modelUrn}
            title="3D Model Viewer"
            className="mt-6"
          />
        )}
      </main>
    </div>
  )
}
