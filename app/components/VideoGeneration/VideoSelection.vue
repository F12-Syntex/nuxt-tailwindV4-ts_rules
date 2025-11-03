<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-3xl font-bold">Select Video Clips</h2>
      <button @click="$emit('back')" class="btn btn-ghost btn-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-5 w-5"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z"
            clip-rule="evenodd"
          />
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
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="h-16 w-16 text-primary"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            <p class="text-xl font-semibold">Drag & Drop Video Files Here</p>
            <p class="text-sm text-base-content/60">or</p>
            <button @click="fileInput?.click()" class="btn btn-primary">
              Browse Videos
            </button>
          </div>
        </div>

        <!-- Video Previews -->
        <div v-if="selectedVideos.length > 0" class="mt-6">
          <h4 class="font-semibold mb-3">
            Selected Videos ({{ selectedVideos.length }})
          </h4>
          <div class="space-y-4">
            <div
              v-for="(video, index) in selectedVideos"
              :key="index"
              class="card bg-base-200 p-4"
            >
              <div class="flex gap-4">
                <!-- Video Preview -->
                <div class="relative group flex-shrink-0">
                  <div class="w-48 aspect-video bg-base-300 rounded-lg overflow-hidden">
                    <video
                      :ref="(el) => setVideoRef(video.name, el as HTMLVideoElement)"
                      :src="videoPreviewUrls.get(video.name)"
                      class="w-full h-full object-cover"
                      muted
                      controls
                    ></video>
                  </div>
                  <button
                    @click="$emit('remove-video', index)"
                    class="absolute top-1 right-1 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      class="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fill-rule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                        clip-rule="evenodd"
                      />
                    </svg>
                  </button>
                </div>

                <!-- Video Info and Trigger Points -->
                <div class="flex-1 min-w-0">
                  <div class="font-semibold text-sm truncate mb-2">{{ video.name }}</div>

                  <div v-if="videoMetadata.get(video.name)?.isAnalyzing" class="flex items-center gap-2 text-sm">
                    <span class="loading loading-spinner loading-xs"></span>
                    <span class="text-base-content/60">Analyzing audio energy...</span>
                  </div>

                  <div v-else-if="videoMetadata.get(video.name)" class="space-y-2">
                    <div class="text-sm text-base-content/70">
                      Duration: {{ formatDuration(videoMetadata.get(video.name)!.duration) }} |
                      Trigger Points: {{ videoMetadata.get(video.name)!.triggerPoints.length }}
                    </div>

                    <!-- Trigger Points Timeline -->
                    <div v-if="videoMetadata.get(video.name)!.triggerPoints.length > 0">
                      <div class="text-xs font-semibold mb-1 text-base-content/80">High Energy Points:</div>
                      <div class="relative h-8 bg-base-300 rounded-lg overflow-hidden">
                        <!-- Timeline markers -->
                        <div
                          v-for="(point, pointIndex) in videoMetadata.get(video.name)!.triggerPoints"
                          :key="pointIndex"
                          :style="{
                            left: `${(point.time / videoMetadata.get(video.name)!.duration) * 100}%`,
                            height: `${Math.max(20, point.intensity * 100)}%`
                          }"
                          :title="`Click to preview at ${formatDuration(point.time)} - Energy: ${(point.intensity * 100).toFixed(0)}%`"
                          @click="seekToTriggerPoint(video.name, point.time)"
                          class="absolute bottom-0 w-1 bg-primary hover:bg-primary-focus hover:w-2 cursor-pointer transition-all"
                        ></div>
                      </div>
                      <div class="text-xs text-base-content/60 mt-1">
                        Markers show high audio energy points - ideal starting points for video clips
                      </div>
                    </div>

                    <div v-else class="text-sm text-warning">
                      No high energy points detected. Video may have low or silent audio.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Next Step Button -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div v-if="!allVideosAnalyzed && selectedVideos.length > 0" class="alert alert-info mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span>Analyzing video audio energy... Please wait.</span>
        </div>
        <button
          @click="$emit('next')"
          :disabled="selectedVideos.length === 0 || !allVideosAnalyzed"
          class="btn btn-primary btn-lg w-full"
        >
          Next: Review & Generate
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 7l5 5m0 0l-5 5m5-5H6"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VideoMetadata } from '~/composables/useVideoWizard'

const props = defineProps<{
  selectedVideos: File[]
  videoPreviewUrls: Map<string, string>
  videoMetadata: Map<string, VideoMetadata>
  allVideosAnalyzed: boolean
}>()

const emit = defineEmits<{
  back: []
  next: []
  'add-videos': [files: File[]]
  'remove-video': [index: number]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const isDragging = ref(false)
const videoRefs = ref<Map<string, HTMLVideoElement>>(new Map())

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const setVideoRef = (videoName: string, el: HTMLVideoElement | null) => {
  if (el) {
    videoRefs.value.set(videoName, el)
  } else {
    videoRefs.value.delete(videoName)
  }
}

const seekToTriggerPoint = (videoName: string, time: number) => {
  const videoElement = videoRefs.value.get(videoName)
  if (videoElement) {
    videoElement.currentTime = time
    videoElement.play()
  }
}

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

    // Process all dropped items (files or folders)
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
    // Fallback for browsers that don't support DataTransferItem
    const files = e.dataTransfer?.files
    if (files) {
      emit('add-videos', Array.from(files))
    }
  }
}

// Recursively process file system entries (files and folders)
const processEntry = async (entry: FileSystemEntry, videoFiles: File[]): Promise<void> => {
  if (entry.isFile) {
    const fileEntry = entry as FileSystemFileEntry
    const file = await new Promise<File>((resolve, reject) => {
      fileEntry.file(resolve, reject)
    })

    // Check if it's a video file
    if (file.type.startsWith('video/')) {
      videoFiles.push(file)
    }
  } else if (entry.isDirectory) {
    const dirEntry = entry as FileSystemDirectoryEntry
    const reader = dirEntry.createReader()

    // Read all entries in the directory
    const entries = await new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject)
    })

    // Recursively process each entry
    for (const childEntry of entries) {
      await processEntry(childEntry, videoFiles)
    }
  }
}
</script>
