// Core
export { apiClient } from './client';
export type { ApiResponse } from './client';

// Authentication
export { authApi } from './auth';
export type { User, AuthResponse, SignupData, LoginData } from './auth';

// Planner
export { plannerApi } from './planner';
export type {
  PlannerMeta,
  GeneratePlanRequest,
  Room,
  Floor,
  GeneratedPlan,
  PlannerResponse,
} from './planner';

// CAD Export
export { cadApi } from './cad';
export type {
  CADGenerateRequest,
  CADGenerateResponse,
  CADFile,
  CADStatsResponse,
} from './cad';

// Drawings (Elevations, Sections, Schedules, RCP)
export { drawingsApi } from './drawings';
export type {
  DrawingsOptions,
  Elevation,
  ElevationElement,
  Section,
  SectionElement,
  Schedule,
  ScheduleRow,
  RCP,
  RCPRoom,
  RCPFixture,
  TitleBlock,
  AllDrawingsResponse,
} from './drawings';

// Templates
export { templatesApi } from './templates';
export type {
  TemplateInfo,
  TemplateRoomSummary,
  FullTemplate,
  TemplateCategory,
  ApplyTemplateResult,
  TemplateCustomizations,
  TemplateSearchFilters,
  CustomTemplate,
  FullCustomTemplate,
} from './templates';

// Projects
export { projectsApi } from './projects';
export type {
  Project,
  ProjectAddress,
  ProjectVersion,
  Collaborator,
  ProjectFilters,
  CreateProjectData,
  UpdateProjectData,
  VersionDiff,
  ProjectWithDetails,
} from './projects';

// Rules & Building Codes
export { rulesApi } from './rules';
export type {
  BuildingCodeInfo,
  BuildingCode,
  BuildingCodeRules,
  RoomSizeRule,
  DoorRule,
  RoomRules,
  BuildingTypeRules,
  ValidationError,
  ValidationResult,
  CompanyStandard,
} from './rules';

// Autodesk Platform Services (Revit)
export { apsApi } from './aps';
export type {
  APSStatus,
  WorkItemStatus,
  RevitGenerationResult,
  TranslationResult,
  UploadedTemplate,
} from './aps';

// Brand Manual
export { brandManualApi } from './brand-manual';
export type {
  BrandManual,
  BrandManualSummary,
  BrandManualPreset,
  BrandValidationResult,
  CreateBrandManualData,
  DesignTokens,
  LayoutRule,
  TierTemplate,
  FurnitureSpec,
  MaterialSpec,
} from './brand-manual';
