import { create } from 'zustand'

export type Tab = 'text' | 'shapes' | 'uploads' | 'backgrounds'

export type Sel = {
  kind: 'text' | 'shape' | 'image' | 'multi'
  fontFamily: string
  fontSize: number
  fill: string
  textAlign: string
  bold: boolean
  italic: boolean
  opacity: number
  brightness: number
  blur: number
  grayscale: boolean
}

export type Upload = { id: string; src: string; name: string }

type State = {
  tab: Tab
  sel: Sel | null
  zoom: number
  pageW: number
  pageH: number
  canUndo: boolean
  canRedo: boolean
  uploads: Upload[]
  set: (p: Partial<State>) => void
  addUpload: (u: Upload) => void
}

export const useStore = create<State>((set) => ({
  tab: 'text',
  sel: null,
  zoom: 0.5,
  pageW: 1080,
  pageH: 1080,
  canUndo: false,
  canRedo: false,
  uploads: [],
  set: (p) => set(p),
  addUpload: (u) => set((s) => ({ uploads: [u, ...s.uploads] }))
}))