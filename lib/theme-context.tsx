"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type ColorPreset = {
  name: string
  primary: string
  primaryForeground: string
  accent: string
}

const colorPresets: ColorPreset[] = [
  { name: "Azul", primary: "217 91% 60%", primaryForeground: "0 0% 100%", accent: "199 89% 48%" },
  { name: "Verde", primary: "142 76% 36%", primaryForeground: "0 0% 100%", accent: "142 71% 45%" },
  { name: "Roxo", primary: "262 83% 58%", primaryForeground: "0 0% 100%", accent: "258 90% 66%" },
  { name: "Vermelho", primary: "0 84% 60%", primaryForeground: "0 0% 100%", accent: "0 72% 51%" },
  { name: "Laranja", primary: "25 95% 53%", primaryForeground: "0 0% 100%", accent: "21 90% 48%" },
  { name: "Ciano", primary: "189 94% 43%", primaryForeground: "0 0% 100%", accent: "186 94% 82%" },
]

type ThemeContextType = {
  colorPresets: ColorPreset[]
  currentColorIndex: number
  setColorPreset: (index: number) => void
  customColor: string
  setCustomColor: (color: string) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeColorsProvider({ children }: { children: ReactNode }) {
  const [currentColorIndex, setCurrentColorIndex] = useState(0)
  const [customColor, setCustomColor] = useState("#2563eb")

  useEffect(() => {
    // Load saved preferences
    const saved = localStorage.getItem("theme-color-index")
    if (saved) {
      const index = Number.parseInt(saved)
      if (index >= 0 && index < colorPresets.length) {
        setCurrentColorIndex(index)
        applyColorPreset(index)
      }
    }
  }, [])

  const applyColorPreset = (index: number) => {
    const preset = colorPresets[index]
    document.documentElement.style.setProperty("--primary", preset.primary)
    document.documentElement.style.setProperty("--primary-foreground", preset.primaryForeground)
    document.documentElement.style.setProperty("--accent", preset.accent)
  }

  const setColorPreset = (index: number) => {
    setCurrentColorIndex(index)
    applyColorPreset(index)
    localStorage.setItem("theme-color-index", String(index))
  }

  return (
    <ThemeContext.Provider
      value={{
        colorPresets,
        currentColorIndex,
        setColorPreset,
        customColor,
        setCustomColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useThemeColors() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error("useThemeColors must be used within ThemeColorsProvider")
  }
  return context
}
