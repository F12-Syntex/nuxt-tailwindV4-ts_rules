<!-- File: app/components/VideoGeneration/GenerationOptions.vue (Updated) -->
<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h2 class="text-3xl font-bold">Generate Beat-Synced Video</h2>
      <button @click="$emit('back')" class="btn btn-ghost btn-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M7.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
        Back to Videos
      </button>
    </div>

    <!-- Generation Options -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title mb-4">Generation Options</h3>

        <!-- Audio Mixing -->
        <div class="form-control mb-4">
          <label class="label cursor-pointer justify-start gap-4">
            <input
              type="checkbox"
              :checked="options.includeClipAudio"
              @change="$emit('update:options', { ...options, includeClipAudio: !options.includeClipAudio })"
              class="checkbox checkbox-primary"
            />
            <div>
              <span class="label-text font-semibold">Include Video Clip Audio</span>
              <p class="text-xs text-base-content/60">
                Mix original video audio with your music track
              </p>
            </div>
          </label>

          <div v-if="options.includeClipAudio" class="ml-8 mt-2">
            <label class="label">
              <span class="label-text">Clip Audio Volume: {{ (options.clipAudioVolume * 100).toFixed(0) }}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              :value="options.clipAudioVolume"
              @input="$emit('update:options', { ...options, clipAudioVolume: parseFloat(($event.target as HTMLInputElement).value) })"
              class="range range-primary range-sm"
            />
          </div>
        </div>

        <!-- Video Filters -->
        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text font-semibold">Video Filter</span>
          </label>
          <select
            :value="options.videoFilter"
            @change="$emit('update:options', { ...options, videoFilter: ($event.target as HTMLSelectElement).value })"
            class="select select-bordered"
          >
            <option value="none">None</option>
            <option value="grayscale">Grayscale</option>
            <option value="sepia">Sepia</option>
            <option value="blur">Blur</option>
            <option value="brightness">Brightness</option>
          </select>

          <div v-if="options.videoFilter !== 'none'" class="mt-2">
            <label class="label">
              <span class="label-text">Filter Intensity: {{ (options.filterIntensity * 100).toFixed(0) }}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              :value="options.filterIntensity"
              @input="$emit('update:options', { ...options, filterIntensity: parseFloat(($event.target as HTMLInputElement).value) })"
              class="range range-primary range-sm"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Generation Summary -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <h3 class="card-title mb-4">Review Before Generation</h3>

        <!-- Audio Summary -->
        <div class="mb-6">
          <h4 class="font-semibold text-lg mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd" />
            </svg>
            Audio Track
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">Duration</div>
              <div class="stat-value text-lg">{{ formatTime(audioDuration) }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">BPM</div>
              <div class="stat-value text-lg">{{ beatData?.bpm || 'N/A' }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">Beats Detected</div>
              <div class="stat-value text-lg text-primary">{{ beatCount }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">Beat Categories</div>
              <div class="stat-value text-lg">{{ selectedCategories.size }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">First Beat</div>
              <div class="stat-value text-lg">{{ beatData?.offset.toFixed(2) }}s</div>
            </div>
          </div>
          <div v-if="selectedCategories.size > 0" class="mt-3">
            <p class="text-xs font-semibold mb-2 text-base-content/70">Selected Categories:</p>
            <div class="flex flex-wrap gap-2">
              <div v-for="category in Array.from(selectedCategories)" :key="category" class="badge badge-primary">
                {{ category.toUpperCase() }}
              </div>
            </div>
          </div>
        </div>

        <!-- Video Summary -->
        <div>
          <h4 class="font-semibold text-lg mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
            </svg>
            Video Clips
          </h4>
          <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">Total Videos</div>
              <div class="stat-value text-lg">{{ videoCount }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">Total Trigger Points</div>
              <div class="stat-value text-lg">{{ totalTriggerPoints }}</div>
            </div>
            <div class="stat bg-base-200 rounded-lg p-4">
              <div class="stat-title text-xs">Avg per Video</div>
              <div class="stat-value text-lg">{{ videoCount > 0 ? Math.round(totalTriggerPoints / videoCount) : 0 }}</div>
            </div>
          </div>

          <!-- Video Details -->
          <div class="space-y-2">
            <div v-for="[videoName, metadata] in videoMetadata" :key="videoName" class="p-3 bg-base-200 rounded-lg">
              <div class="flex justify-between items-center">
                <span class="text-sm font-medium truncate max-w-xs">{{ videoName }}</span>
                <div class="flex gap-4 text-xs">
                  <span class="text-base-content/70">{{ formatTime(metadata.duration) }}</span>
                  <span class="badge badge-sm badge-primary">{{ metadata.triggerPoints.length }} points</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="alert alert-success mt-6">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span class="text-sm">
            All data analyzed! The system will use video trigger points to create seamless beat-synced clips.
          </span>
        </div>
      </div>
    </div>

    <!-- Generate Button -->
    <div class="card bg-base-100 shadow-xl">
      <div class="card-body">
        <button
          @click="$emit('generate')"
          :disabled="isGenerating"
          class="btn btn-primary btn-lg w-full"
        >
          <span v-if="!isGenerating">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Generate Beat-Synced Video
          </span>
          <span v-else class="loading loading-spinner loading-lg"></span>
        </button>

        <div v-if="isGenerating" class="mt-4">
          <div class="flex justify-between mb-2">
            <span class="text-sm">Generating...</span>
            <span class="text-sm">{{ generationProgress }}%</span>
          </div>
          <progress class="progress progress-primary w-full" :value="generationProgress" max="100"></progress>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VideoMetadata } from '~/composables/useVideoWizard'
import type { BeatCategory } from '~/composables/useBeatDetection'

const props = defineProps<{
  options: {
    includeClipAudio: boolean
    clipAudioVolume: number
    videoFilter: string
    filterIntensity: number
  }
  audioDuration: number
  videoCount: number
  selectedCategoriesCount: number
  isGenerating: boolean
  generationProgress: number
  beatData: { bpm: number; offset: number; tempo: number } | null
  selectedCategories: Set<BeatCategory>
  videoMetadata: Map<string, VideoMetadata>
  beatCount: number
}>()

defineEmits<{
  back: []
  generate: []
  'update:options': [options: any]
}>()

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const totalTriggerPoints = computed(() => {
  let total = 0
  props.videoMetadata.forEach(metadata => {
    total += metadata.triggerPoints.length
  })
  return total
})
</script>