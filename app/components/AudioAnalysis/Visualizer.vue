<!-- File: app/components/AudioAnalysis/Visualizer.vue -->
<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h3 class="card-title">Visualizer with Beat Detection</h3>
      <canvas ref="canvas" class="w-full h-64 bg-base-300 rounded-lg"></canvas>
      <div v-if="beatData" class="alert alert-info">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Real-time multi-category beat detection analyzes frequency ranges. Estimated {{ beatData.bpm }} BPM.</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  canvas: HTMLCanvasElement | null
  beatData: { bpm: number; offset: number; tempo: number } | null
  isBeatDetected: boolean
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

watch(() => props.canvas, (newCanvas) => {
  if (newCanvas) {
    canvas.value = newCanvas
  }
})
</script>