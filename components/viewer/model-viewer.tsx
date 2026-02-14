'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  Maximize2,
  Box,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { apsApi, type TranslationResult } from '@/lib/api'

interface ModelViewerProps {
  urn: string
  title?: string
  className?: string
}

type ViewerPhase = 'idle' | 'translating' | 'polling' | 'ready' | 'error'

/**
 * 3D Model Viewer Component
 * Translates a Revit model URN via Autodesk Model Derivative API
 * and displays the result using the Autodesk Viewer (via CDN embed)
 */
export function ModelViewer({ urn, title = 'Model Viewer', className = '' }: ModelViewerProps) {
  const [phase, setPhase] = useState<ViewerPhase>('idle')
  const [translation, setTranslation] = useState<TranslationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const viewerContainerRef = useRef<HTMLDivElement>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [])

  const pollTranslation = useCallback(async (modelUrn: string, attempts = 0) => {
    if (attempts > 60) {
      setPhase('error')
      setError('Translation timed out. The model may be too large.')
      return
    }

    try {
      const response = await apsApi.getTranslationStatus(modelUrn)
      if (response.success && response.data) {
        setTranslation(response.data)

        if (response.data.status === 'success') {
          setPhase('ready')
          toast.success('Model ready for viewing')
          return
        }

        if (response.data.status === 'failed') {
          setPhase('error')
          setError('Translation failed. The model may be incompatible.')
          return
        }

        // Continue polling
        pollingRef.current = setTimeout(() => pollTranslation(modelUrn, attempts + 1), 5000)
      }
    } catch {
      setPhase('error')
      setError('Failed to check translation status')
    }
  }, [])

  const startTranslation = async () => {
    setPhase('translating')
    setError(null)

    try {
      const response = await apsApi.translateForViewing(urn)
      if (response.success && response.data) {
        setTranslation(response.data)

        if (response.data.status === 'success') {
          setPhase('ready')
        } else {
          setPhase('polling')
          pollingRef.current = setTimeout(() => pollTranslation(urn), 3000)
        }
      } else {
        throw new Error(response.message || 'Failed to start translation')
      }
    } catch (err: unknown) {
      setPhase('error')
      setError(err instanceof Error ? err.message : 'Failed to translate model')
    }
  }

  const getViewerUrl = () => {
    if (!translation?.urn) return null
    const encodedUrn = btoa(translation.urn).replace(/=/g, '')
    return `https://viewer.autodesk.com/designviews?urn=${encodedUrn}`
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="w-5 h-5" />
          {title}
        </CardTitle>
        <CardDescription>
          View the 3D Revit model in the browser using Autodesk Model Derivative
        </CardDescription>
      </CardHeader>
      <CardContent>
        {phase === 'idle' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Box className="w-16 h-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Translate the model to view it in 3D</p>
            <Button onClick={startTranslation} className="gap-2">
              <Box className="w-4 h-4" />
              Prepare 3D Viewer
            </Button>
          </div>
        )}

        {(phase === 'translating' || phase === 'polling') && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="font-medium mb-1">
              {phase === 'translating' ? 'Starting translation...' : 'Processing model...'}
            </p>
            <p className="text-sm text-muted-foreground">
              {translation?.progress || 'This may take a few minutes for large models'}
            </p>
          </div>
        )}

        {phase === 'error' && (
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button variant="outline" onClick={startTranslation} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
          </div>
        )}

        {phase === 'ready' && (
          <div className="space-y-4">
            {/* Embedded viewer */}
            <div
              ref={viewerContainerRef}
              className="relative w-full bg-gray-900 rounded-lg overflow-hidden"
              style={{ height: '500px' }}
            >
              {getViewerUrl() ? (
                <iframe
                  src={getViewerUrl()!}
                  className="w-full h-full border-0"
                  title="Autodesk 3D Viewer"
                  allow="fullscreen"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-white">
                  <p>Viewer could not load. Open in external viewer below.</p>
                </div>
              )}
            </div>

            {/* Viewer actions */}
            <div className="flex gap-3">
              {getViewerUrl() && (
                <a href={getViewerUrl()!} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1">
                    <ExternalLink className="w-3 h-3" /> Open in New Tab
                  </Button>
                </a>
              )}
              <Button
                variant="outline"
                size="sm"
                className="gap-1"
                onClick={() => {
                  if (viewerContainerRef.current?.requestFullscreen) {
                    viewerContainerRef.current.requestFullscreen()
                  }
                }}
              >
                <Maximize2 className="w-3 h-3" /> Fullscreen
              </Button>
            </div>

            {/* Derivatives info */}
            {translation?.derivatives && translation.derivatives.length > 0 && (
              <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
                <p className="font-medium">Available derivatives:</p>
                {translation.derivatives.map((d, i) => (
                  <p key={i}>{d.name} ({d.outputType}) - {d.status}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
