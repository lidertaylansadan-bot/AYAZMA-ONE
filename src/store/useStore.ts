import { create } from 'zustand'
import { User } from '@supabase/supabase-js'
import { Profile, Project } from '../../shared/types'

interface AppState {
  user: User | null
  profile: Profile | null
  projects: Project[]
  currentProject: Project | null
  setUser: (user: User | null) => void
  setProfile: (profile: Profile | null) => void
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  addProject: (project: Project) => void
  updateProject: (projectId: string, updates: Partial<Project>) => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  profile: null,
  projects: [],
  currentProject: null,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  addProject: (project) => set((state) => ({ 
    projects: [project, ...state.projects] 
  })),
  updateProject: (projectId, updates) => set((state) => ({
    projects: state.projects.map(project =>
      project.id === projectId ? { ...project, ...updates } : project
    ),
    currentProject: state.currentProject?.id === projectId 
      ? { ...state.currentProject, ...updates } 
      : state.currentProject
  })),
}))