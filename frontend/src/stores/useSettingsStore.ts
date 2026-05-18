import { create } from 'zustand'

interface SettingsStoreState {
  theme: 'light' | 'dark'
  autoSaveDelayMs: number
  fontSize: number
  tabSize: number
  fontFamily: string
  shareServerUrl: string
  sidebarWidth: number
}

interface SettingsStoreActions {
  setTheme: (theme: 'light' | 'dark') => void
  setFontSize: (size: number) => void
  setTabSize: (size: number) => void
  setFontFamily: (family: string) => void
  setShareServerUrl: (url: string) => void
  setSidebarWidth: (width: number) => void
}

const STORAGE_KEY = 'devsnippet-settings'

function loadSettings(): Partial<SettingsStoreState> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveSettings(state: SettingsStoreState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      theme: state.theme,
      autoSaveDelayMs: state.autoSaveDelayMs,
      fontSize: state.fontSize,
      tabSize: state.tabSize,
      fontFamily: state.fontFamily,
      shareServerUrl: state.shareServerUrl,
      sidebarWidth: state.sidebarWidth,
    }))
  } catch { /* localStorage may be unavailable */ }
}

const defaults: SettingsStoreState = {
  theme: 'light',
  autoSaveDelayMs: 1000,
  fontSize: 14,
  tabSize: 4,
  fontFamily: "'Cascadia Code', 'Fira Code', 'JetBrains Mono', 'Consolas', monospace",
  shareServerUrl: 'http://localhost:8000',
  sidebarWidth: 256,
}

const saved = loadSettings()

export const useSettingsStore = create<SettingsStoreState & SettingsStoreActions>((set) => ({
  ...defaults,
  ...saved,

  setTheme: (theme) => {
    set({ theme })
    const root = document.documentElement
    root.classList.toggle('dark', theme === 'dark')
    root.classList.toggle('light', theme === 'light')
    saveSettings({ ...useSettingsStore.getState() })
  },

  setFontSize: (fontSize) => {
    set({ fontSize })
    saveSettings({ ...useSettingsStore.getState() })
  },

  setTabSize: (tabSize) => {
    set({ tabSize })
    saveSettings({ ...useSettingsStore.getState() })
  },

  setFontFamily: (fontFamily) => {
    set({ fontFamily })
    saveSettings({ ...useSettingsStore.getState() })
  },

  setShareServerUrl: (shareServerUrl) => {
    set({ shareServerUrl })
    saveSettings({ ...useSettingsStore.getState() })
  },

  setSidebarWidth: (sidebarWidth) => {
    set({ sidebarWidth })
    saveSettings({ ...useSettingsStore.getState() })
  },
}))
