/**
 * Drawings API Service
 * Handles elevations, sections, schedules, RCP generation
 */

import { apiClient, type ApiResponse } from './client';
import type { GeneratedPlan } from './planner';

// Types
export interface DrawingsOptions {
  includeElevations?: boolean;
  includeSections?: boolean;
  includeSchedules?: boolean;
  includeRCP?: boolean;
  includeTitleBlock?: boolean;
  scale?: number;
}

export interface ElevationElement {
  type: string;
  points?: { x: number; y: number }[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  layer: string;
  text?: string;
  position?: { x: number; y: number };
}

export interface Elevation {
  direction: 'north' | 'south' | 'east' | 'west';
  title: string;
  scale: number;
  width: number;
  height: number;
  mirrored: boolean;
  elements: ElevationElement[];
  dimensions: {
    overall: { width: string; height: string };
    floorHeights: { level: string; height: string }[];
  };
  groundLine: { y: number; width: number };
  roofLine: { type: string; height: number; pitch?: string };
  annotations: { type: string; text: string; position: string }[];
}

export interface SectionElement {
  type: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: boolean;
  layer: string;
  text?: string;
  position?: { x: number; y: number };
  align?: string;
  pattern?: string;
  bounds?: { x: number; y: number; width: number; height: number };
  points?: { x: number; y: number }[];
}

export interface Section {
  id: string;
  title: string;
  direction: 'longitudinal' | 'transverse';
  cutPosition: number;
  scale: number;
  width: number;
  height: number;
  elements: SectionElement[];
  dimensions: {
    overall: { height: string };
    floorToFloor: { level: string; height: string }[];
  };
  annotations: unknown[];
}

export interface ScheduleRow {
  [key: string]: string | number;
}

export interface Schedule {
  title: string;
  headers: string[];
  rows: ScheduleRow[];
  totals?: Record<string, unknown>;
}

export interface RCPRoom {
  id: string;
  name: string;
  bounds: { x: number; y: number; width: number; height: number };
  ceilingHeight: number;
  ceilingType: string;
}

export interface RCPFixture {
  type: string;
  position: { x: number; y: number };
  size: number;
  layer: string;
  room?: string;
}

export interface RCP {
  level: string;
  title: string;
  scale: number;
  width: number;
  height: number;
  rooms: RCPRoom[];
  lightingFixtures: RCPFixture[];
  ceilingGrid: { type: string; start: { x: number; y: number }; end: { x: number; y: number }; layer: string }[];
  hvacDiffusers: RCPFixture[];
  sprinklers: RCPFixture[];
  annotations: { type: string; text: string; position: { x: number; y: number }; layer: string; height: number }[];
}

export interface TitleBlock {
  projectName: string;
  projectNumber: string;
  clientName: string;
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  buildingType: string;
  totalArea: string;
  floors: number;
  architect: string;
  drawnBy: string;
  checkedBy: string;
  date: string;
  revisions: unknown[];
  scale: string;
  sheetSize: string;
  disclaimer: string;
}

export interface AllDrawingsResponse {
  floorPlans: unknown[];
  elevations: Elevation[];
  sections: Section[];
  schedules: {
    doors: Schedule;
    windows: Schedule;
    rooms: Schedule;
    finishes: Schedule;
  };
  rcp: RCP[];
  titleBlock: TitleBlock | null;
}

// API Functions
export const drawingsApi = {
  /**
   * Generate all drawings from a plan
   */
  generateAllDrawings: async (
    plan: GeneratedPlan,
    options?: DrawingsOptions
  ): Promise<ApiResponse<AllDrawingsResponse>> => {
    return apiClient.post('/api/drawings/all', { plan, options });
  },

  /**
   * Generate elevations only
   */
  generateElevations: async (
    plan: GeneratedPlan,
    scale?: number
  ): Promise<ApiResponse<{ elevations: Elevation[] }>> => {
    return apiClient.post('/api/drawings/elevations', { plan, scale });
  },

  /**
   * Generate sections only
   */
  generateSections: async (
    plan: GeneratedPlan,
    scale?: number
  ): Promise<ApiResponse<{ sections: Section[] }>> => {
    return apiClient.post('/api/drawings/sections', { plan, scale });
  },

  /**
   * Generate RCP (Reflected Ceiling Plan)
   */
  generateRCP: async (
    plan: GeneratedPlan,
    floorIndex?: number,
    scale?: number
  ): Promise<ApiResponse<{ rcp: RCP[] }>> => {
    return apiClient.post('/api/drawings/rcp', { plan, floorIndex, scale });
  },

  /**
   * Generate title block
   */
  generateTitleBlock: async (
    plan: GeneratedPlan,
    projectInfo?: Partial<TitleBlock>
  ): Promise<ApiResponse<{ titleBlock: TitleBlock }>> => {
    return apiClient.post('/api/drawings/title-block', { plan, projectInfo });
  },

  /**
   * Generate all schedules
   */
  generateAllSchedules: async (
    plan: GeneratedPlan
  ): Promise<ApiResponse<{ schedules: AllDrawingsResponse['schedules'] }>> => {
    return apiClient.post('/api/drawings/schedules', { plan });
  },

  /**
   * Generate door schedule
   */
  generateDoorSchedule: async (plan: GeneratedPlan): Promise<ApiResponse<{ schedule: Schedule }>> => {
    return apiClient.post('/api/drawings/schedules/doors', { plan });
  },

  /**
   * Generate window schedule
   */
  generateWindowSchedule: async (plan: GeneratedPlan): Promise<ApiResponse<{ schedule: Schedule }>> => {
    return apiClient.post('/api/drawings/schedules/windows', { plan });
  },

  /**
   * Generate room schedule
   */
  generateRoomSchedule: async (plan: GeneratedPlan): Promise<ApiResponse<{ schedule: Schedule }>> => {
    return apiClient.post('/api/drawings/schedules/rooms', { plan });
  },

  /**
   * Generate finish schedule
   */
  generateFinishSchedule: async (plan: GeneratedPlan): Promise<ApiResponse<{ schedule: Schedule }>> => {
    return apiClient.post('/api/drawings/schedules/finishes', { plan });
  },
};
