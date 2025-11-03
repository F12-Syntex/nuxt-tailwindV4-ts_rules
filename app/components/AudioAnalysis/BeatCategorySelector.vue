<template>
  <div class="card bg-base-100 shadow-xl">
    <div class="card-body">
      <h3 class="card-title mb-4">Beat Category Selection</h3>
      <p class="text-sm text-base-content/70 mb-3">
        Choose which types of beats to detect. Each category listens to specific frequencies to identify different instruments and sounds.
      </p>
      <div class="alert alert-info mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="stroke-current shrink-0 w-6 h-6">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-xs">Click "Listen to Example" to hear a 3-second filtered sample from YOUR audio showing what that frequency range sounds like!</span>
      </div>

      <div class="space-y-4">
        <div
          v-for="category in categories"
          :key="category"
          class="form-control border border-base-300 rounded-lg p-4 hover:bg-base-200 transition-colors"
        >
          <label class="cursor-pointer">
            <div class="flex items-start gap-3">
              <input
                type="checkbox"
                :checked="selectedCategories.has(category)"
                @change="$emit('toggle-category', category)"
                class="checkbox checkbox-primary mt-1"
              />
              <div class="flex-1">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-semibold text-lg">{{ getCategoryLabel(category) }}</span>
                  <span class="badge badge-sm badge-outline">{{ getCategoryDescription(category) }}</span>
                </div>
                <p class="text-sm text-base-content/70 mb-2">
                  {{ getCategoryExamples(category) }}
                </p>
                <div class="flex items-center gap-2 mt-2">
                  <button
                    v-if="audioBuffer"
                    @click.stop="$emit('play-preview', category)"
                    :disabled="isPlayingPreview === category"
                    class="btn btn-xs btn-primary"
                  >
                    <svg v-if="isPlayingPreview !== category" xmlns="http://www.w3.org/2000/svg" class="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                    </svg>
                    <span class="loading loading-spinner loading-xs" v-else></span>
                    {{ isPlayingPreview === category ? 'Playing...' : 'Listen to Example' }}
                  </button>
                  <span v-if="categoryStats[category].count > 0" class="badge badge-success badge-sm">
                    {{ categoryStats[category].count }} beats detected
                  </span>
                </div>
              </div>
            </div>
          </label>
        </div>
      </div>

      <div class="divider">Quick Presets</div>

      <div class="flex flex-wrap gap-2">
        <button @click="$emit('select-preset', 'drums')" class="btn btn-sm btn-outline">
          Drums Only (Kick + Snare + Hi-Hat)
        </button>
        <button @click="$emit('select-preset', 'low')" class="btn btn-sm btn-outline">
          Low End (Kick + Bass)
        </button>
        <button @click="$emit('select-preset', 'melody')" class="btn btn-sm btn-outline">
          Melody (Mid + Vocal)
        </button>
        <button @click="$emit('select-preset', 'all')" class="btn btn-sm btn-outline">
          Everything
        </button>
        <button @click="$emit('select-preset', 'none')" class="btn btn-sm btn-outline">
          Clear All
        </button>
      </div>

      <div v-if="lastDetectedCategory" class="alert alert-success mt-4">
        <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>Last detected: <strong>{{ getCategoryLabel(lastDetectedCategory) }}</strong></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { BeatCategory } from '~/composables/useBeatDetection'

const props = defineProps<{
  selectedCategories: Set<BeatCategory>
  categoryStats: Record<BeatCategory, { count: number; lastDetected: number }>
  lastDetectedCategory: BeatCategory | null
  audioBuffer: AudioBuffer | null
  isPlayingPreview: BeatCategory | null
}>()

defineEmits<{
  'toggle-category': [category: BeatCategory]
  'select-preset': [preset: 'drums' | 'low' | 'melody' | 'all' | 'none']
  'play-preview': [category: BeatCategory]
}>()

const categories: BeatCategory[] = ['kick', 'snare', 'hihat', 'bass', 'mid', 'vocal']

const getCategoryLabel = (category: BeatCategory): string => {
  const labels: Record<BeatCategory, string> = {
    kick: 'Kick Drum',
    snare: 'Snare',
    hihat: 'Hi-Hat',
    bass: 'Bass',
    mid: 'Mid-Range',
    vocal: 'Vocals',
    all: 'All'
  }
  return labels[category]
}

const getCategoryDescription = (category: BeatCategory): string => {
  const descriptions: Record<BeatCategory, string> = {
    kick: '86-430Hz',
    snare: '344-1290Hz',
    hihat: '2580-6880Hz',
    bass: '86-688Hz',
    mid: '1290-3440Hz',
    vocal: '860-3010Hz',
    all: 'Full spectrum'
  }
  return descriptions[category]
}

const getCategoryExamples = (category: BeatCategory): string => {
  const examples: Record<BeatCategory, string> = {
    kick: '"BOOM" - The deep thump that makes your chest vibrate. Like a heartbeat or bass drum in rock/EDM.',
    snare: '"CRACK/TAP" - Sharp, crispy hits. Sounds like clapping or hitting a drum rim. Common on beats 2 and 4.',
    hihat: '"TSS-TSS" - Fast metallic/shimmering sounds. Like cymbals or shakers, creates the rhythm\'s pulse.',
    bass: '"WOOM" - Deep sustained notes. Electric bass guitar, 808 bass, sub-bass rumbles.',
    mid: '"STRUM/CHORD" - Guitar strums, piano chords, brass hits, synth melodies in the middle frequencies.',
    vocal: '"AH/OH" - Singing, rapping, spoken words. Any voice or vocal sample onset.',
    all: 'Detects any sudden sound increase across all frequencies.'
  }
  return examples[category]
}
</script>
