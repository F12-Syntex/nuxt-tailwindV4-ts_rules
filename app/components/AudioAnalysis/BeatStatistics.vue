<!-- File: app/components/AudioAnalysis/BeatStatistics.vue -->
<template>
  <div v-if="beatData" class="grid grid-cols-1 md:grid-cols-3 gap-6">
    <div class="stat bg-base-100 shadow-xl rounded-box">
      <div class="stat-figure text-primary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div class="stat-title">BPM</div>
      <div class="stat-value text-primary">{{ beatData.bpm }}</div>
      <div class="stat-desc">Beats per minute</div>
    </div>

    <div class="stat bg-base-100 shadow-xl rounded-box">
      <div class="stat-figure text-secondary">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="stat-title">Tempo</div>
      <div class="stat-value text-secondary">{{ beatData.tempo.toFixed(2) }}</div>
      <div class="stat-desc">Precise measurement</div>
    </div>

    <div class="stat bg-base-100 shadow-xl rounded-box">
      <div class="stat-figure text-accent">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </div>
      <div class="stat-title">First Beat</div>
      <div class="stat-value text-accent">{{ beatData.offset.toFixed(3) }}s</div>
      <div class="stat-desc">Offset in seconds</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  beatData: { bpm: number; offset: number; tempo: number } | null
}>()
</script>