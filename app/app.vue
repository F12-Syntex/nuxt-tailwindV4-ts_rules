<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'

const themeStore = useThemeStore()

onMounted(() => {
  if (process.client) {
    document.documentElement.setAttribute('data-theme', themeStore.current)
  }
})
</script>