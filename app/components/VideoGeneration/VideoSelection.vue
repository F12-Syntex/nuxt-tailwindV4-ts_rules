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

    <!-- Loading State -->
    <div v-if="isLoadingFiles" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <div class="flex items-center justify-center gap-4">
          <span class="loading loading-spinner loading-lg"></span>
          <span class="text-lg">Scanning for video files in public/data...</span>
        </div>
      </div>
    </div>

    <!-- Available Videos -->
    <div v-else class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title mb-4">Available Videos (from public/data)</h3>

        <div v-if="availableVideos.length === 0" class="alert alert-info">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <div>
            <p class="font-semibold">No videos found</p>
            <p class="text-sm">Place your video files in the <code class="bg-base-300 px-1 rounded">public/data/</code> directory</p>
          </div>
        </div>

        <div v-else class="space-y-2">
          <div v-for="video in availableVideos" :key="video.path" class="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
            <input
              type="checkbox"
              :checked="isVideoSelected(video.path)"
              @change="toggleVideo(video)"
              class="checkbox checkbox-primary"
            />
            <div class="flex-1">
              <div class="font-medium">{{ video.name }}</div>
              <div class="text-xs text-base-content/60">
                {{ video.path }} • {{ formatFileSize(video.size) }}
              </div>
            </div>
          </div>
        </div>

        <button
          @click="refreshFiles"
          class="btn btn-outline btn-sm mt-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          Refresh Files
        </button>
      </div>
    </div>

    <!-- Selected Videos Preview -->
    <div v-if="selectedVideos.length > 0" class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title mb-4">
          Selected Videos ({{ selectedVideos.length }})
        </h3>
        <div class="space-y-4">
          <div
            v-for="(video, index) in selectedVideos"
            :key="video.path"
            class="card bg-base-200 p-4"
          >
            <div class="flex gap-4">
              <!-- Video Preview -->
              <div class="relative group flex-shrink-0">
                <div class="w-48 aspect-video bg-base-300 rounded-lg overflow-hidden">
                  <video
                    :ref="(el) => setVideoRef(video.path, el as HTMLVideoElement)"
                    :src="`/data/${video.path}`"
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

                <div v-if="videoMetadata.get(video.path)?.isAnalyzing" class="flex items-center gap-2 text-sm">
                  <span class="loading loading-spinner loading-xs"></span>
                  <span class="text-base-content/60">Analyzing audio energy...</span>
                </div>

                <div v-else-if="videoMetadata.get(video.path)" class="space-y-2">
                  <div class="text-sm text-base-content/70">
                    Duration: {{ formatDuration(videoMetadata.get(video.path)!.duration) }} |
                    Trigger Points: {{ videoMetadata.get(video.path)!.triggerPoints.length }}
                  </div>

                  <!-- Trigger Points Timeline -->
                  <div v-if="videoMetadata.get(video.path)!.triggerPoints.length > 0">
                    <div class="text-xs font-semibold mb-1 text-base-content/80">High Energy Points:</div>
                    <div class="relative h-8 bg-base-300 rounded-lg overflow-hidden">
                      <!-- Timeline markers -->
                      <div
                        v-for="(point, pointIndex) in videoMetadata.get(video.path)!.triggerPoints"
                        :key="pointIndex"
                        :style="{
                          left: `${(point.time / videoMetadata.get(video.path)!.duration) * 100}%`,
                          height: `${Math.max(20, point.intensity * 100)}%`
                        }"
                        :title="`Click to preview at ${formatDuration(point.time)} - Energy: ${(point.intensity * 100).toFixed(0)}%`"
                        @click="seekToTriggerPoint(video.path, point.time)"
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
import type { VideoFile, VideoMetadata } from '~/composables/useVideoWizard'

const props = defineProps<{
  selectedVideos: VideoFile[]
  videoMetadata: Map<string, VideoMetadata>
  allVideosAnalyzed: boolean
}>()

const emit = defineEmits<{
  back: []
  next: []
  'add-videos': [videos: VideoFile[]]
  'remove-video': [index: number]
}>()

const isLoadingFiles = ref(true)
const availableVideos = ref<VideoFile[]>([])
const videoRefs = ref<Map<string, HTMLVideoElement>>(new Map())

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes: number): string => {
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`
  }
  const kb = bytes / 1024
  return `${kb.toFixed(2)} KB`
}

const setVideoRef = (videoPath: string, el: HTMLVideoElement | null) => {
  if (el) {
    videoRefs.value.set(videoPath, el)
  } else {
    videoRefs.value.delete(videoPath)
  }
}

const seekToTriggerPoint = (videoPath: string, time: number) => {
  const videoElement = videoRefs.value.get(videoPath)
  if (videoElement) {
    videoElement.currentTime = time
    videoElement.play()
  }
}

const isVideoSelected = (path: string): boolean => {
  return props.selectedVideos.some(v => v.path === path)
}

const toggleVideo = (video: VideoFile) => {
  if (isVideoSelected(video.path)) {
    const index = props.selectedVideos.findIndex(v => v.path === video.path)
    if (index !== -1) {
      emit('remove-video', index)
    }
  } else {
    emit('add-videos', [video])
  }
}

const fetchAvailableVideos = async () => {
  isLoadingFiles.value = true
  try {
    const response = await fetch('/api/scan-files')
    const data = await response.json()
    availableVideos.value = data.video || []
    console.log(`Found ${availableVideos.value.length} videos in public/data`)
  } catch (error) {
    console.error('Error fetching video files:', error)
  } finally {
    isLoadingFiles.value = false
  }
}

const refreshFiles = () => {
  fetchAvailableVideos()
}

// Load files on component mount
onMounted(() => {
  fetchAvailableVideos()
})
</script>
