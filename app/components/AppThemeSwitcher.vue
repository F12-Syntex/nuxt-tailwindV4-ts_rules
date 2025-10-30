<template>
  <div class="drawer drawer-end z-50">
    <input id="theme-drawer" type="checkbox" class="drawer-toggle" v-model="isOpen" />
    <div class="drawer-side">
      <label for="theme-drawer" class="drawer-overlay"></label>
      <div class="bg-base-100 min-h-full w-96 p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold">Choose Theme</h3>
          <label for="theme-drawer" class="btn btn-sm btn-circle btn-ghost">✕</label>
        </div>
        
        <div class="mb-6">
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search themes..." 
            class="input input-bordered w-full"
          />
        </div>

        <div class="overflow-y-auto max-h-[calc(100vh-200px)]">
          <div class="grid grid-cols-2 gap-4">
            <button
              v-for="t in filteredThemes"
              :key="t"
              @click="selectTheme(t)"
              :data-theme="t"
              class="relative overflow-hidden rounded-lg transition-all duration-200 hover:scale-105"
              :class="themeStore.current === t ? 'ring-2 ring-primary' : ''"
            >
              <div class="bg-base-100 p-4 border border-base-300">
                <div class="flex gap-1 mb-3">
                  <div class="w-2 h-2 rounded-full bg-primary"></div>
                  <div class="w-2 h-2 rounded-full bg-secondary"></div>
                  <div class="w-2 h-2 rounded-full bg-accent"></div>
                </div>
                <div class="space-y-2">
                  <div class="h-2 bg-base-content/20 rounded w-3/4"></div>
                  <div class="h-2 bg-base-content/10 rounded w-1/2"></div>
                </div>
                <div class="mt-3 pt-3 border-t border-base-300">
                  <p class="text-sm font-semibold text-base-content capitalize">{{ t }}</p>
                </div>
                <div 
                  v-if="themeStore.current === t" 
                  class="absolute top-2 right-2 bg-primary text-primary-content rounded-full p-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'
import type { Theme } from '~/stores/theme'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const themeStore = useThemeStore()
const searchQuery = ref('')

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const filteredThemes = computed(() => {
  if (!searchQuery.value) return themeStore.themes
  return themeStore.themes.filter(t => t.toLowerCase().includes(searchQuery.value.toLowerCase()))
})

function selectTheme(theme: Theme) {
  themeStore.setTheme(theme)
  emit('update:modelValue', false)
}
</script>