export { apiClient } from './client';
export type { ApiResponse } from './client';

export { authApi } from './auth';
export type { User, AuthResponse, SignupData, LoginData } from './auth';

export { plannerApi } from './planner';
export type {
  PlannerMeta,
  GeneratePlanRequest,
  Room,
  Floor,
  GeneratedPlan,
  PlannerResponse,
} from './planner';

export { cadApi } from './cad';
export type {
  CADGenerateRequest,
  CADGenerateResponse,
  CADFile,
  CADStatsResponse,
} from './cad';
