'use client';

import { useState } from 'react';
import { Download, FileBox, Loader2, AlertCircle, CheckCircle2, FileCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cadApi, type CADGenerateResponse, type GeneratedPlan } from '@/lib/api';

interface CADExportPanelProps {
  planData: GeneratedPlan | null;
  floorIndex?: number;
  className?: string;
}

export function CADExportPanel({
  planData,
  floorIndex = 0,
  className = '',
}: CADExportPanelProps) {
  const [exportDXF, setExportDXF] = useState(true);
  const [exportDWG, setExportDWG] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<CADGenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!planData) {
      setError('No floor plan data available');
      return;
    }

    if (!exportDXF && !exportDWG) {
      setError('Please select at least one format');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await cadApi.generate({
        planData,
        outputFormats: {
          dxf: exportDXF,
          dwg: exportDWG,
        },
        floorIndex,
        scale: 1,
      });

      setResult(response);

      if (!response.success) {
        setError('CAD generation failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate CAD files');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (format: 'dxf' | 'dwg') => {
    if (result?.files[format]) {
      cadApi.downloadFile(result.files[format]!);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileBox className="h-5 w-5" />
          Export to CAD Software
        </CardTitle>
        <CardDescription>
          Generate professional AutoCAD-compatible files from your floor plan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Format Selection */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Output Formats</Label>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-dxf"
                checked={exportDXF}
                onCheckedChange={(checked) => setExportDXF(checked as boolean)}
                disabled={isGenerating}
              />
              <Label
                htmlFor="export-dxf"
                className="text-sm font-normal cursor-pointer"
              >
                DXF (AutoCAD Drawing Exchange)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="export-dwg"
                checked={exportDWG}
                onCheckedChange={(checked) => setExportDWG(checked as boolean)}
                disabled={isGenerating}
              />
              <Label
                htmlFor="export-dwg"
                className="text-sm font-normal cursor-pointer"
              >
                DWG (AutoCAD Native)
              </Label>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !planData || (!exportDXF && !exportDWG)}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating CAD Files...
            </>
          ) : (
            <>
              <FileCode className="mr-2 h-4 w-4" />
              Generate CAD Files
            </>
          )}
        </Button>

        {/* Error Message */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Warnings */}
        {result?.warnings && result.warnings.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Notice</AlertTitle>
            <AlertDescription>
              {result.warnings.map((warning, i) => (
                <p key={i} className="text-sm">{warning}</p>
              ))}
            </AlertDescription>
          </Alert>
        )}

        {/* Success & Download Section */}
        {result?.success && (
          <div className="space-y-3">
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
              <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              <AlertTitle className="text-green-800 dark:text-green-200">
                CAD Files Ready
              </AlertTitle>
              <AlertDescription className="text-green-700 dark:text-green-300">
                Generated in {result.metadata.generationTimeMs}ms
              </AlertDescription>
            </Alert>

            {/* File Downloads */}
            <div className="grid gap-2">
              {result.files.dxf && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileCode className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm font-medium">{result.files.dxf.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        DXF File - {formatFileSize(result.files.dxf.size)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('dxf')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}

              {result.files.dwg && (
                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/50">
                  <div className="flex items-center gap-3">
                    <FileBox className="h-8 w-8 text-orange-500" />
                    <div>
                      <p className="text-sm font-medium">{result.files.dwg.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {result.files.dwg.note ? 'DXF' : 'DWG'} File - {formatFileSize(result.files.dwg.size)}
                      </p>
                      {result.files.dwg.note && (
                        <p className="text-xs text-amber-600">{result.files.dwg.note}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDownload('dwg')}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              )}
            </div>

            {/* Metadata */}
            <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
              <p>Building: {result.metadata.buildingType}</p>
              <p>Floor: {result.metadata.floorLevel} ({result.metadata.roomCount} rooms)</p>
              <p>Total Area: {result.metadata.totalArea} SF</p>
            </div>
          </div>
        )}

        {/* Help Text */}
        {!result && !error && (
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>DXF:</strong> Universal format, opens in AutoCAD, LibreCAD, and most CAD software.
            </p>
            <p>
              <strong>DWG:</strong> Native AutoCAD format for full compatibility.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default CADExportPanel;
