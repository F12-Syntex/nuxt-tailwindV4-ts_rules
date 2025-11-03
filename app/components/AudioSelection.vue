<template>
  <div class="hero bg-base-100 rounded-box shadow-xl min-h-[500px]">
    <div class="hero-content text-center">
      <div class="max-w-4xl w-full">
        <h1 class="text-5xl font-bold mb-4">Select Your Audio</h1>
        <p class="py-6 text-lg">
          Choose an audio file from your public/data directory
        </p>

        <!-- Loading State -->
        <div v-if="isLoadingFiles" class="flex items-center justify-center gap-4 py-8">
          <span class="loading loading-spinner loading-lg"></span>
          <span class="text-lg">Scanning for audio files...</span>
        </div>

        <!-- No Files Found -->
        <div v-else-if="availableAudioFiles.length === 0" class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div class="text-left">
            <p class="font-semibold">No audio files found</p>
            <p class="text-sm">Place your audio files (.mp3, .wav, etc.) in the <code class="bg-base-300 px-2 py-1 rounded">public/data/</code> directory</p>
          </div>
        </div>

        <!-- Audio File List -->
        <div v-else class="space-y-4">
          <div class="grid gap-3 max-h-[400px] overflow-y-auto">
            <div
              v-for="audio in availableAudioFiles"
              :key="audio.path"
              @click="selectAudio(audio)"
              class="card bg-base-200 hover:bg-base-300 cursor-pointer transition-all hover:shadow-lg"
            >
              <div class="card-body p-4">
                <div class="flex items-center gap-4">
                  <div class="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  </div>
                  <div class="flex-1 text-left">
                    <h3 class="font-semibold text-lg">{{ audio.name }}</h3>
                    <p class="text-sm text-base-content/60">{{ audio.path }} • {{ formatFileSize(audio.size) }}</p>
                  </div>
                  <div class="flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <button
            @click="refreshFiles"
            class="btn btn-outline btn-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
            </svg>
            Refresh Files
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface AudioFile {
  name: string
  path: string
  size: number
}

const emit = defineEmits<{
  'audio-selected': [path: string]
}>()

const isLoadingFiles = ref(true)
const availableAudioFiles = ref<AudioFile[]>([])

const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`
  }
  const kb = bytes / 1024
  return `${kb.toFixed(2)} KB`
}

const fetchAvailableAudioFiles = async () => {
  isLoadingFiles.value = true
  try {
    const response = await fetch('/api/scan-files')
    const data = await response.json()
    availableAudioFiles.value = data.audio || []
    console.log(`Found ${availableAudioFiles.value.length} audio files in public/data`)
  } catch (error) {
    console.error('Error fetching audio files:', error)
  } finally {
    isLoadingFiles.value = false
  }
}

const refreshFiles = () => {
  fetchAvailableAudioFiles()
}

const selectAudio = (audio: AudioFile) => {
  emit('audio-selected', audio.path)
}

// Load files on component mount
onMounted(() => {
  fetchAvailableAudioFiles()
})
</script>
