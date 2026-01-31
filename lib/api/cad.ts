/**
 * CAD API Client
 * Handles communication with the CAD generation backend
 */

import { apiClient } from './client';
import type { GeneratedPlan } from './planner';

// CAD Generation Types
export interface CADGenerateRequest {
  planData: GeneratedPlan;
  outputFormats: {
    dxf: boolean;
    dwg: boolean;
  };
  floorIndex?: number;
  scale?: number;
}

export interface CADFile {
  filename: string;
  mimeType: string;
  size: number;
  content: string; // Base64 encoded
  note?: string;
}

export interface CADGenerateResponse {
  success: boolean;
  files: {
    dxf?: CADFile;
    dwg?: CADFile;
  };
  metadata: {
    buildingType: string;
    floorLevel: string;
    totalArea: number;
    roomCount: number;
    generatedAt: string;
    scale: number;
    generationTimeMs?: number;
  };
  warnings: string[];
}

export interface CADStatsResponse {
  cache: {
    size: number;
    maxSize: number;
    ttlMs: number;
  };
  supportedFormats: string[];
  dwgConversionAvailable: boolean;
}

/**
 * CAD API functions
 */
export const cadApi = {
  /**
   * Generate CAD files from floor plan
   */
  async generate(request: CADGenerateRequest): Promise<CADGenerateResponse> {
    const response = await apiClient.post<{ data: CADGenerateResponse }>(
      '/cad/generate',
      request
    );
    return response.data;
  },

  /**
   * Generate DXF only (returns file directly)
   */
  async generateDXF(
    planData: GeneratedPlan,
    floorIndex: number = 0,
    scale: number = 1
  ): Promise<Blob> {
    const response = await apiClient.post<Blob>(
      '/cad/dxf',
      { planData, floorIndex, scale },
      { responseType: 'blob' }
    );
    return response;
  },

  /**
   * Get CAD service stats
   */
  async getStats(): Promise<CADStatsResponse> {
    const response = await apiClient.get<{ data: CADStatsResponse }>('/cad/stats');
    return response.data;
  },

  /**
   * Download CAD file from base64 content
   */
  downloadFile(file: CADFile): void {
    // Decode base64 content
    const binaryString = atob(file.content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob and download
    const blob = new Blob([bytes], { type: file.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  /**
   * Helper to generate and download in one step
   */
  async generateAndDownload(
    planData: GeneratedPlan,
    format: 'dxf' | 'dwg' = 'dxf',
    floorIndex: number = 0,
    scale: number = 1
  ): Promise<{ success: boolean; warnings: string[] }> {
    const response = await this.generate({
      planData,
      outputFormats: {
        dxf: format === 'dxf',
        dwg: format === 'dwg',
      },
      floorIndex,
      scale,
    });

    if (response.success && response.files[format]) {
      this.downloadFile(response.files[format]!);
    }

    return {
      success: response.success,
      warnings: response.warnings,
    };
  },
};

export default cadApi;
