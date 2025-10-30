import { useThemeStore } from '~/stores/theme'

export default defineNuxtPlugin(() => {
  const themeStore = useThemeStore()

  if (process.client) {
    document.documentElement.setAttribute('data-theme', themeStore.current)
  }

  watch(
    () => themeStore.current,
    (newTheme) => {
      if (process.client && newTheme) {
        document.documentElement.setAttribute('data-theme', newTheme)
      }
    }
  )
})