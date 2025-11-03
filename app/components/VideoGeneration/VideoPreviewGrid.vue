<!-- File: app/components/VideoGeneration/VideoPreviewGrid.vue -->
<template>
  <div v-if="videos.length > 0" class="mt-6">
    <h4 class="font-semibold mb-3">
      Selected Videos ({{ videos.length }})
    </h4>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div
        v-for="(video, index) in videos"
        :key="index"
        class="relative group"
      >
        <div class="aspect-video bg-base-300 rounded-lg overflow-hidden">
          <video
            :src="previewUrls.get(video.name)"
            class="w-full h-full object-cover"
            muted
            @mouseenter="(e) => (e.target as HTMLVideoElement).play()"
            @mouseleave="(e) => (e.target as HTMLVideoElement).pause()"
          ></video>
        </div>
        <div class="mt-1 text-xs truncate">{{ video.name }}</div>
        <button
          @click="$emit('remove', index)"
          class="absolute top-1 right-1 btn btn-circle btn-xs btn-error opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  videos: File[]
  previewUrls: Map<string, string>
}>()

defineEmits<{
  remove: [index: number]
}>()
</script>