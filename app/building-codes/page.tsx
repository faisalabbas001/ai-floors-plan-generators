'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  BookOpen,
  Building2,
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useAuthStore, usePlannerStore } from '@/lib/stores'
import {
  rulesApi,
  projectsApi,
  type BuildingCodeInfo,
  type ValidationResult,
} from '@/lib/api'

// Extended validation display with computed score, passes, violations
interface ValidationDisplay {
  valid: boolean
  codeUsed?: string
  score: number
  totalChecks: number
  passed: number
  violations: Array<{ type: string; message: string; severity: string; rule: string; floor?: string; room?: string; actual?: number | string; required?: number | string; recommended?: number | string }>
  passes: Array<{ rule: string; message: string; type: string; category: string }>
  errors: ValidationResult['errors']
  warnings: ValidationResult['warnings']
  summary: ValidationResult['summary']
}

// Rule category metadata for grouping and icons
const RULE_CATEGORIES: Record<string, { label: string; color: string; bgColor: string; borderColor: string }> = {
  'SPATIAL': { label: 'Spatial Requirements', color: 'text-blue-700 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-950/30', borderColor: 'border-blue-200 dark:border-blue-900' },
  'STRUCTURAL': { label: 'Structural Integrity', color: 'text-purple-700 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-950/30', borderColor: 'border-purple-200 dark:border-purple-900' },
  'SAFETY': { label: 'Fire & Life Safety', color: 'text-red-700 dark:text-red-400', bgColor: 'bg-red-50 dark:bg-red-950/30', borderColor: 'border-red-200 dark:border-red-900' },
  'ACCESSIBILITY': { label: 'Accessibility', color: 'text-green-700 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-950/30', borderColor: 'border-green-200 dark:border-green-900' },
  'GENERAL': { label: 'General Compliance', color: 'text-gray-700 dark:text-gray-400', bgColor: 'bg-gray-50 dark:bg-gray-950/30', borderColor: 'border-gray-200 dark:border-gray-800' },
}

function getCategory(type: string): string {
  if (['MIN_SIZE', 'MIN_WIDTH', 'MIN_LENGTH', 'MIN_DIMENSIONS', 'ROOM_BOUNDS', 'ROOM_OVERFLOW'].includes(type)) return 'SPATIAL'
  if (['OVERLAP', 'STRUCTURAL'].includes(type)) return 'STRUCTURAL'
  if (['FIRE_EXITS', 'FIRE_SAFETY', 'EGRESS'].includes(type)) return 'SAFETY'
  if (['DOOR_WIDTH', 'ACCESSIBILITY', 'CORRIDOR_WIDTH'].includes(type)) return 'ACCESSIBILITY'
  return 'GENERAL'
}

function BuildingCodesContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading: authLoading } = useAuthStore()
  const { generatedPlan, setGeneratedPlan } = usePlannerStore()
  const [mounted, setMounted] = useState(false)
  const [codes, setCodes] = useState<BuildingCodeInfo[]>([])
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const [validationResult, setValidationResult] = useState<ValidationDisplay | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('codes')
  const [expandedViolations, setExpandedViolations] = useState<Record<string, boolean>>({})

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
      loadCodes()
    }
  }, [mounted, isAuthenticated])

  // Load plan from projectId query param if no plan is in store
  useEffect(() => {
    const projectId = searchParams.get('projectId')
    if (mounted && isAuthenticated && !generatedPlan && projectId) {
      projectsApi.getProjectById(parseInt(projectId)).then((response) => {
        if (response.success && response.data?.project?.plan) {
          setGeneratedPlan(response.data.project.plan)
        }
      }).catch(() => {})
    }
  }, [mounted, isAuthenticated, generatedPlan, searchParams, setGeneratedPlan])

  const loadCodes = async () => {
    setIsLoading(true)
    const response = await rulesApi.getAvailableCodes()
    if (response.success && response.data) {
      setCodes(response.data.codes || [])
    } else {
      setError(response.message)
    }
    setIsLoading(false)
  }

  const handleValidate = async () => {
    if (!selectedCode || !generatedPlan) return

    setIsValidating(true)
    setError(null)
    const response = await rulesApi.validatePlan(generatedPlan, selectedCode)
    if (response.success && response.data) {
      const raw = response.data as ValidationResult
      const roomsChecked = raw.summary?.roomsChecked || 0

      // Build violations list from errors + warnings
      const violations = [
        ...(raw.errors || []).map(e => ({ ...e, severity: 'error' as const, rule: e.type || 'Code Violation' })),
        ...(raw.warnings || []).map(w => ({ ...w, severity: 'warning' as const, rule: w.type || 'Warning' })),
      ]

      // Determine what checks were performed and build meaningful passes
      const passes: Array<{ rule: string; message: string; type: string; category: string }> = []

      if (roomsChecked > 0) {
        passes.push({ rule: 'ROOMS_CHECKED', message: `${roomsChecked} rooms analyzed against ${codes.find(c => c.id === selectedCode)?.name || selectedCode}`, type: 'ROOMS_CHECKED', category: 'GENERAL' })
      }

      const errorTypes = new Set((raw.errors || []).map(e => e.type))

      if (!errorTypes.has('MIN_SIZE') && roomsChecked > 0) {
        passes.push({ rule: 'MIN_SIZE', message: 'All rooms meet minimum area requirements', type: 'MIN_SIZE', category: 'SPATIAL' })
      }
      if (!errorTypes.has('MIN_WIDTH') && !errorTypes.has('MIN_LENGTH') && roomsChecked > 0) {
        passes.push({ rule: 'MIN_DIMENSIONS', message: 'All rooms meet minimum width & length requirements', type: 'MIN_DIMENSIONS', category: 'SPATIAL' })
      }
      if (!errorTypes.has('MIN_CEILING') && roomsChecked > 0) {
        passes.push({ rule: 'CEILING_HEIGHT', message: 'All ceiling heights comply with code minimums', type: 'CEILING_HEIGHT', category: 'SPATIAL' })
      }
      if (!errorTypes.has('DOOR_WIDTH') && roomsChecked > 0) {
        passes.push({ rule: 'DOOR_WIDTH', message: 'All doorway widths meet accessibility standards', type: 'DOOR_WIDTH', category: 'ACCESSIBILITY' })
      }
      if (!errorTypes.has('OVERLAP') && roomsChecked > 0) {
        passes.push({ rule: 'NO_OVERLAP', message: 'No room geometry overlaps detected', type: 'NO_OVERLAP', category: 'STRUCTURAL' })
      }
      if (!errorTypes.has('ROOM_OVERFLOW') && roomsChecked > 0) {
        passes.push({ rule: 'ROOM_BOUNDS', message: 'All rooms contained within building envelope', type: 'ROOM_BOUNDS', category: 'STRUCTURAL' })
      }
      if (!errorTypes.has('FIRE_EXITS')) {
        passes.push({ rule: 'FIRE_EXITS', message: 'Fire egress requirements satisfied', type: 'FIRE_EXITS', category: 'SAFETY' })
      }

      const totalChecks = passes.length + violations.length
      const passed = passes.length
      const score = totalChecks > 0 ? Math.round((passed / totalChecks) * 100) : 0

      setValidationResult({
        ...raw,
        score,
        totalChecks,
        passed: Math.max(0, passed),
        violations,
        passes,
      })
      setActiveTab('results')
    } else {
      setError(response.message || 'Validation failed')
    }
    setIsValidating(false)
  }

  const toggleCategory = (cat: string) => {
    setExpandedViolations(prev => ({ ...prev, [cat]: !prev[cat] }))
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

  // Group violations by category
  const violationsByCategory: Record<string, ValidationDisplay['violations']> = {}
  validationResult?.violations.forEach(v => {
    const cat = getCategory(v.rule)
    if (!violationsByCategory[cat]) violationsByCategory[cat] = []
    violationsByCategory[cat].push(v)
  })

  // Group passes by category
  const passesByCategory: Record<string, ValidationDisplay['passes']> = {}
  validationResult?.passes.forEach(p => {
    const cat = p.category || 'GENERAL'
    if (!passesByCategory[cat]) passesByCategory[cat] = []
    passesByCategory[cat].push(p)
  })

  // Score ring color
  const getScoreColor = (score: number) => {
    if (score >= 80) return { stroke: '#16A34A', text: 'text-green-600', bg: 'bg-green-50 dark:bg-green-950/30', label: 'Compliant' }
    if (score >= 60) return { stroke: '#CA8A04', text: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-950/30', label: 'Needs Attention' }
    return { stroke: '#DC2626', text: 'text-red-600', bg: 'bg-red-50 dark:bg-red-950/30', label: 'Non-Compliant' }
  }

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold mb-1">Building Code Validation</h1>
          <p className="text-muted-foreground">
            Validate floor plans against international building codes and standards
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="codes" className="gap-2">
            <BookOpen className="w-4 h-4" /> Available Codes
          </TabsTrigger>
          <TabsTrigger value="validate" className="gap-2">
            <Shield className="w-4 h-4" /> Validate Plan
          </TabsTrigger>
          {validationResult && (
            <TabsTrigger value="results" className="gap-2">
              <BarChart3 className="w-4 h-4" /> Results
            </TabsTrigger>
          )}
        </TabsList>

        {/* Available Codes Tab */}
        <TabsContent value="codes">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {codes.map((code) => (
                <Card
                  key={code.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    selectedCode === code.id ? 'border-primary shadow-md bg-primary/5' : 'hover:border-primary/50 hover:shadow-sm'
                  }`}
                  onClick={() => setSelectedCode(code.id)}
                >
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedCode === code.id ? 'bg-primary text-primary-foreground' : 'bg-primary/10'
                      }`}>
                        <Building2 className={`w-6 h-6 ${selectedCode === code.id ? '' : 'text-primary'}`} />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-base">{code.name}</CardTitle>
                        <CardDescription className="text-xs">{code.jurisdiction}</CardDescription>
                      </div>
                      {selectedCode === code.id && (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{code.description}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="px-2 py-1 bg-muted rounded-md font-mono">{code.version}</span>
                      {code.region && <span className="px-2 py-1 bg-muted rounded-md">{code.region}</span>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Validate Tab */}
        <TabsContent value="validate">
          <Card className="border-2 border-dashed border-primary/30">
            <CardContent className="py-10">
              {!generatedPlan ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Floor Plan Available</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Generate or open a floor plan before running validation.
                  </p>
                  <Button onClick={() => router.push('/generator')}>Go to Generator</Button>
                </div>
              ) : !selectedCode ? (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <BookOpen className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Select a Building Code</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Choose a building code from the Available Codes tab to validate against.
                  </p>
                  <Button variant="outline" onClick={() => setActiveTab('codes')}>Browse Codes</Button>
                </div>
              ) : (
                <div className="text-center">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Shield className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Ready to Validate</h3>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-muted rounded-lg mb-4">
                    <Building2 className="w-4 h-4 text-primary" />
                    <span className="font-medium">{codes.find((c) => c.id === selectedCode)?.name}</span>
                  </div>
                  <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    This will check room sizes, dimensions, ceiling heights, door widths, fire safety, structural integrity, and accessibility compliance.
                  </p>
                  <Button onClick={handleValidate} disabled={isValidating} size="lg" className="gap-2">
                    {isValidating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                    Run Validation
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Results Tab */}
        {validationResult && (
          <TabsContent value="results">
            {/* Score Hero Section */}
            <div className={`rounded-xl p-6 mb-6 border ${getScoreColor(validationResult.score).bg} ${
              validationResult.score >= 80 ? 'border-green-200 dark:border-green-900' :
              validationResult.score >= 60 ? 'border-yellow-200 dark:border-yellow-900' : 'border-red-200 dark:border-red-900'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6">
                  {/* Circular score gauge */}
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="#E5E7EB" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none"
                        stroke={getScoreColor(validationResult.score).stroke}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${(validationResult.score / 100) * 264} 264`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${getScoreColor(validationResult.score).text}`}>
                        {validationResult.score}%
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold mb-1">
                      {getScoreColor(validationResult.score).label}
                    </h3>
                    <p className="text-muted-foreground mb-2">
                      {codes.find((c) => c.id === selectedCode)?.name}
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

                {/* Summary stats */}
                <div className="hidden md:grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold">{validationResult.totalChecks}</p>
                    <p className="text-xs text-muted-foreground">Total Checks</p>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold">{validationResult.summary?.roomsChecked || 0}</p>
                    <p className="text-xs text-muted-foreground">Rooms Checked</p>
                  </div>
                  <div className="text-center p-3 bg-white/60 dark:bg-white/5 rounded-lg">
                    <p className="text-2xl font-bold">{validationResult.codeUsed || selectedCode}</p>
                    <p className="text-xs text-muted-foreground">Code Used</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Category breakdown bar */}
            {validationResult.totalChecks > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Compliance Breakdown</span>
                </div>
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <div className="bg-green-500 transition-all" style={{ width: `${(validationResult.passed / validationResult.totalChecks) * 100}%` }} />
                  <div className="bg-red-500 transition-all" style={{ width: `${(validationResult.violations.filter(v => v.severity === 'error').length / validationResult.totalChecks) * 100}%` }} />
                  <div className="bg-yellow-400 transition-all" style={{ width: `${(validationResult.violations.filter(v => v.severity === 'warning').length / validationResult.totalChecks) * 100}%` }} />
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-green-500" /> Passed</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-red-500" /> Errors</span>
                  <span className="flex items-center gap-1"><div className="w-2.5 h-2.5 rounded-full bg-yellow-400" /> Warnings</span>
                </div>
              </div>
            )}

            {/* Violations grouped by category */}
            {Object.keys(violationsByCategory).length > 0 && (
              <div className="space-y-4 mb-6">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-destructive" /> Issues Found ({validationResult.violations.length})
                </h3>
                {Object.entries(violationsByCategory).map(([cat, items]) => {
                  const catMeta = RULE_CATEGORIES[cat] || RULE_CATEGORIES['GENERAL']
                  const isExpanded = expandedViolations[cat] !== false // default expanded
                  return (
                    <Card key={cat} className={`overflow-hidden border ${catMeta.borderColor}`}>
                      <button
                        className={`w-full flex items-center justify-between p-4 ${catMeta.bgColor} hover:opacity-90 transition-opacity`}
                        onClick={() => toggleCategory(cat)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${catMeta.bgColor} flex items-center justify-center`}>
                            <AlertTriangle className={`w-4 h-4 ${catMeta.color}`} />
                          </div>
                          <div className="text-left">
                            <p className={`text-sm font-semibold ${catMeta.color}`}>{catMeta.label}</p>
                            <p className="text-xs text-muted-foreground">{items.length} issue{items.length > 1 ? 's' : ''}</p>
                          </div>
                        </div>
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </button>
                      {isExpanded && (
                        <div className="divide-y">
                          {items.map((violation, i) => (
                            <div key={i} className="flex items-start gap-3 p-4">
                              {violation.severity === 'error' ? (
                                <XCircle className="w-5 h-5 text-destructive mt-0.5 shrink-0" />
                              ) : (
                                <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5 shrink-0" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-sm font-semibold">{violation.rule?.replace(/_/g, ' ')}</span>
                                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                    violation.severity === 'error' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                  }`}>
                                    {violation.severity}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{violation.message}</p>
                                {(violation.floor || violation.room || violation.actual || violation.required) && (
                                  <div className="flex items-center gap-3 mt-2 text-xs">
                                    {violation.floor && (
                                      <span className="px-2 py-1 bg-muted rounded font-mono">Floor: {violation.floor}</span>
                                    )}
                                    {violation.room && (
                                      <span className="px-2 py-1 bg-muted rounded font-mono">Room: {violation.room}</span>
                                    )}
                                    {violation.actual !== undefined && (
                                      <span className="px-2 py-1 bg-red-50 dark:bg-red-950/30 rounded font-mono text-red-700 dark:text-red-400">
                                        Actual: {violation.actual}
                                      </span>
                                    )}
                                    {violation.required !== undefined && (
                                      <span className="px-2 py-1 bg-green-50 dark:bg-green-950/30 rounded font-mono text-green-700 dark:text-green-400">
                                        Required: {violation.required}
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Passed checks grouped by category */}
            {Object.keys(passesByCategory).length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Passed Checks ({validationResult.passes.length})
                </h3>
                {Object.entries(passesByCategory).map(([cat, items]) => {
                  const catMeta = RULE_CATEGORIES[cat] || RULE_CATEGORIES['GENERAL']
                  return (
                    <Card key={cat} className="overflow-hidden">
                      <div className={`px-4 py-2 ${catMeta.bgColor} border-b`}>
                        <p className={`text-xs font-semibold ${catMeta.color} uppercase tracking-wider`}>{catMeta.label}</p>
                      </div>
                      <div className="divide-y">
                        {items.map((pass, i) => (
                          <div key={i} className="flex items-center gap-3 px-4 py-3">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            <p className="text-sm">{pass.message}</p>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )
                })}
              </div>
            )}

            {/* Recommendations */}
            {validationResult.violations.length > 0 && (
              <Card className="mt-6 border-blue-200 dark:border-blue-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Info className="w-4 h-4 text-blue-600" /> Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {validationResult.violations.some(v => v.severity === 'error') && (
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                        Address all errors before submission - these are code violations that must be resolved.
                      </li>
                    )}
                    {validationResult.violations.some(v => v.severity === 'warning' && v.rule?.includes('MISSING')) && (
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                        Missing room warnings indicate rooms that may be required by the building code for this building type.
                      </li>
                    )}
                    <li className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                      Re-run validation after making changes to verify compliance improvements.
                    </li>
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Re-validate button */}
            <div className="text-center mt-6">
              <Button variant="outline" onClick={() => { setValidationResult(null); setActiveTab('validate') }} className="gap-2">
                <Shield className="w-4 h-4" /> Run New Validation
              </Button>
            </div>
          </TabsContent>
        )}
      </Tabs>

      {error && (
        <div className="mt-6 text-center">
          <p className="text-destructive">{error}</p>
        </div>
      )}
    </main>
  )
}

export default function BuildingCodesPage() {
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
        <BuildingCodesContent />
      </Suspense>
    </div>
  )
}
