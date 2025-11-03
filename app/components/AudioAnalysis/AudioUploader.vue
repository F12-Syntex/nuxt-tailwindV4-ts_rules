<!-- File: app/components/AudioAnalysis/AudioUploader.vue -->
<template>
  <div class="space-y-6">
    <div v-if="!audioBuffer" class="hero bg-base-100 rounded-box shadow-xl min-h-[500px]">
      <div class="hero-content text-center">
        <div class="max-w-2xl w-full">
          <h1 class="text-5xl font-bold mb-4">Drop Your Beat</h1>
          <p class="py-6 text-lg">
            Upload an MP3 file to analyze and visualize its tempo
          </p>

          <div
            @drop.prevent="handleDrop"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            :class="[
              'border-4 border-dashed rounded-2xl p-16 transition-all duration-200',
              isDragging ? 'border-primary bg-primary/10 scale-105' : 'border-base-300 hover:border-primary/50'
            ]"
          >
            <input
              ref="fileInput"
              type="file"
              accept="audio/mp3,audio/mpeg"
              @change="handleFileSelect"
              class="hidden"
            />
            <div class="flex flex-col items-center gap-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <p class="text-xl font-semibold">Drag & Drop MP3 File Here</p>
              <p class="text-sm text-base-content/60">or</p>
              <button @click="fileInput?.click()" class="btn btn-primary btn-lg">
                Browse Files
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="space-y-6">
      <div class="flex justify-between items-center">
        <h2 class="text-3xl font-bold">{{ fileName }}</h2>
        <button @click="$emit('reset')" class="btn btn-ghost btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
          Clear
        </button>
      </div>

      <slot name="analysis-content" />
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  audioBuffer: AudioBuffer | null
  fileName: string
  isDragging: boolean
}>()

const emit = defineEmits<{
  'load-audio': [file: File]
  'reset': []
}>()

const fileInput = ref<HTMLInputElement | null>(null)

const handleDrop = async (e: DragEvent) => {
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    emit('load-audio', files[0])
  }
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    emit('load-audio', files[0])
  }
}
</script>