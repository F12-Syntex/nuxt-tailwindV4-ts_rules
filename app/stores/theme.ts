import { defineStore } from 'pinia'

const THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'forest', 'aqua',
  'lofi', 'pastel', 'fantasy', 'wireframe', 'black', 'luxury',
  'dracula', 'cmyk', 'autumn', 'business', 'acid', 'lemonade',
  'night', 'coffee', 'winter'
] as const

export type Theme = typeof THEMES[number]

export const useThemeStore = defineStore(
  'themeStore',
  () => {
    const current = ref<Theme>('dark')

    const setTheme = (theme: Theme) => {
      current.value = theme
      if (process.client) {
        document.documentElement.setAttribute('data-theme', theme)
      }
    }

    const toggleTheme = () => {
      const currentIndex = THEMES.indexOf(current.value)
      const nextIndex = (currentIndex + 1) % THEMES.length
      const nextTheme = THEMES[nextIndex]
      if (nextTheme) {
        setTheme(nextTheme)
      }
    }

    const isdark = computed(() => ['dark', 'dracula', 'synthwave', 'forest', 'black', 'luxury', 'night', 'coffee', 'business'].includes(current.value))

    return {
      current,
      setTheme,
      toggleTheme,
      isdark,
      themes: THEMES as unknown as Theme[]
    }
  },
  {
    persist: true
  }
)