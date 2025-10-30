<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">Audio Visualiser</a>
      </div>
      <div class="flex-none gap-2">
        <button @click="isThemeDrawerOpen = true" class="btn btn-ghost btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="container mx-auto p-8">
      <div class="hero bg-base-100 rounded-box shadow-xl min-h-[400px]">
        <div class="hero-content text-center">
          <div class="max-w-md">
            <h1 class="text-5xl font-bold mb-4">Welcome</h1>
            <p class="py-6 text-lg">
              Current theme: <span class="badge badge-primary badge-lg">{{ themeStore.current }}</span>
            </p>
            <div class="flex gap-4 justify-center">
              <button @click="isThemeDrawerOpen = true" class="btn btn-primary">Change Theme</button>
              <button @click="themeStore.toggleTheme()" class="btn btn-secondary">Next Theme</button>
            </div>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Primary</h2>
            <p>This is a primary colored card</p>
            <div class="card-actions justify-end">
              <button class="btn btn-primary">Action</button>
            </div>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Secondary</h2>
            <p>This is a secondary colored card</p>
            <div class="card-actions justify-end">
              <button class="btn btn-secondary">Action</button>
            </div>
          </div>
        </div>
        
        <div class="card bg-base-100 shadow-xl">
          <div class="card-body">
            <h2 class="card-title">Accent</h2>
            <p>This is an accent colored card</p>
            <div class="card-actions justify-end">
              <button class="btn btn-accent">Action</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <AppThemeSwitcher v-model="isThemeDrawerOpen" />
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'

const themeStore = useThemeStore()
const isThemeDrawerOpen = ref(false)
</script>