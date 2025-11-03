<!-- File: app/components/VideoGeneration/VideoFolderSelector.vue -->
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-3xl font-bold">Select Video Clips</h2>
      <button @click="$emit('back')" class="btn btn-ghost btn-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Audio
      </button>
    </div>

    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title mb-4">Upload Video Files</h3>
        <p class="text-sm text-base-content/70 mb-4">
          Select multiple video files or drag a folder. The system will recursively find all videos and sync clips to your audio beats.
        </p>

        <div
          @drop.prevent="handleDrop"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          :class="[
            'border-4 border-dashed rounded-2xl p-12 transition-all duration-200',
            isDragging
              ? 'border-primary bg-primary/10 scale-105'
              : 'border-base-300 hover:border-primary/50'
          ]"
        >
          <input
            ref="fileInput"
            type="file"
            accept="video/*"
            multiple
            @change="handleFileSelect"
            class="hidden"
          />
          <div class="flex flex-col items-center gap-4">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <p class="text-xl font-semibold">Drag & Drop Video Files Here</p>
            <p class="text-sm text-base-content/60">or</p>
            <button @click="fileInput?.click()" class="btn btn-primary">
              Browse Videos
            </button>
          </div>
        </div>

        <!-- Video Previews -->
        <VideoPreviewGrid
          :videos="selectedVideos"
          :preview-urls="videoPreviewUrls"
          @remove="$emit('remove-video', $event)"
        />
      </div>
    </div>

    <!-- Next Step Button -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <button
          @click="$emit('next')"
          :disabled="selectedVideos.length === 0"
          class="btn btn-primary btn-lg w-full"
        >
          Next: Generate Video
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  selectedVideos: File[]
  videoPreviewUrls: Map<string, string>
}>()

const emit = defineEmits<{
  back: []
  next: []
  'add-videos': [files: File[]]
  'remove-video': [index: number]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files) {
    emit('add-videos', Array.from(files))
  }
}

const handleDrop = async (e: DragEvent) => {
  isDragging.value = false
  const items = e.dataTransfer?.items

  if (items) {
    const videoFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item?.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry) {
          await processEntry(entry, videoFiles)
        }
      }
    }

    if (videoFiles.length > 0) {
      emit('add-videos', videoFiles)
    }
  } else {
    const files = e.dataTransfer?.files
    if (files) {
      emit('add-videos', Array.from(files))
    }
  }
}

const processEntry = async (entry: FileSystemEntry, videoFiles: File[]): Promise<void> => {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject)
    })

    if (file.type.startsWith('video/')) {
      videoFiles.push(file)
    }
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const reader = dirEntry.createReader()

    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject)
    })

    for (const childEntry of entries) {
      await processEntry(childEntry, videoFiles)
    }
  }
}
</script>