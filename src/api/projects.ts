import { apiFetch } from '../lib/apiClient'
import type { Project } from '../../shared/types'

export async function getProjects() {
  return apiFetch<Project[]>('/projects')
}

export async function createProject(payload: { name: string; description?: string; sector: string; projectType: string }) {
  return apiFetch<Project>('/projects', { method: 'POST', body: JSON.stringify(payload) })
}

export async function getProject(id: string) {
  return apiFetch<Project>(`/projects/${id}`)
}

export interface ProjectAiSettings {
  provider: string
  model: string
  costPreference: 'low' | 'balanced' | 'best_quality'
  latencyPreference: 'low' | 'balanced' | 'ok_with_slow'
}

export async function getProjectAiSettings(projectId: string) {
  return apiFetch<ProjectAiSettings>(`/projects/${projectId}/ai-settings`)
}

export async function updateProjectAiSettings(projectId: string, payload: ProjectAiSettings) {
  return apiFetch<ProjectAiSettings>(`/projects/${projectId}/ai-settings`, { method: 'PUT', body: JSON.stringify(payload) })
}

// Generic API call function
export async function apiCall<T = any>(endpoint: string, options?: RequestInit) {
  return apiFetch<T>(endpoint, options)
}