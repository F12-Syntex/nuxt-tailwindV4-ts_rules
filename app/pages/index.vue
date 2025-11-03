<template>
  <div class="min-h-screen bg-base-200">
    <div class="navbar bg-base-100 shadow-lg sticky top-0 z-10">
      <div class="flex-1">
        <a class="btn btn-ghost text-xl">Audio Beat Visualiser</a>
      </div>
      <div class="flex-none gap-2">
        <button @click="isThemeDrawerOpen = true" class="btn btn-ghost btn-circle">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="w-5 h-5 stroke-current">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
          </svg>
        </button>
      </div>
    </div>

    <div class="container mx-auto p-8 max-w-6xl">
      <!-- Step Indicator (always show) -->
      <StepIndicator :current-step="wizard.currentStep.value" />

      <!-- STEP 1: Audio Upload (no audio yet) -->
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

      <!-- STEP 1: Audio Analysis (when loaded and on audio step) -->
      <div v-else-if="wizard.currentStep.value === 'audio'">
        <!-- Your existing audio analysis content goes here -->
        <div class="space-y-6">
          <div class="flex justify-between items-center">
            <h2 class="text-3xl font-bold">{{ fileName }}</h2>
            <button @click="resetAll" class="btn btn-ghost btn-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
              Clear
            </button>
          </div>

          <div v-if="isAnalyzing" class="card bg-base-100 shadow-xl">
            <div class="card-body items-center text-center">
              <span class="loading loading-spinner loading-lg text-primary"></span>
              <p class="text-lg">Analyzing beat...</p>
            </div>
          </div>

          <!-- BPM Statistics -->
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

          <!-- Audio Controls -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <h3 class="card-title">Audio Controls</h3>
              <div class="flex gap-4 items-center">
                <button @click="togglePlay" class="btn btn-primary">
                  <svg v-if="!isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                  {{ isPlaying ? 'Pause' : 'Play' }}
                </button>
                <button @click="stopAudio" class="btn btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 00-1 1v4a1 1 0 001 1h4a1 1 0 001-1V8a1 1 0 00-1-1H8z" clip-rule="evenodd" />
                  </svg>
                  Stop
                </button>
                <div class="flex-1">
                  <input
                    type="range"
                    min="0"
                    :max="duration"
                    v-model.number="currentTime"
                    @input="seekAudio"
                    class="range range-primary range-sm"
                  />
                  <div class="flex justify-between text-xs mt-1">
                    <span>{{ formatTime(currentTime) }}</span>
                    <span>{{ formatTime(duration) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Visualizer -->
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

          <!-- Beat Category Selector -->
          <BeatCategorySelector
            :selected-categories="selectedCategories"
            :category-stats="categoryStats"
            :last-detected-category="lastDetectedCategory"
            :audio-buffer="audioBuffer"
            :is-playing-preview="isPlayingPreview"
            @toggle-category="toggleCategory"
            @select-preset="selectPreset"
            @play-preview="playPreview"
          />

          <!-- Next button to proceed to video selection -->
          <div class="card bg-base-100 shadow-xl">
            <div class="card-body">
              <button @click="wizard.nextStep()" class="btn btn-primary btn-lg w-full">
                Next: Select Videos for Generation
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- STEP 2: Video Selection -->
      <VideoSelection
        v-else-if="wizard.currentStep.value === 'videos'"
        :selected-videos="wizard.selectedVideos.value"
        :video-preview-urls="wizard.videoPreviewUrls.value"
        :video-metadata="wizard.videoMetadata.value"
        :all-videos-analyzed="wizard.allVideosAnalyzed.value"
        @back="wizard.previousStep()"
        @next="wizard.nextStep()"
        @add-videos="wizard.addVideos"
        @remove-video="wizard.removeVideo"
      />

      <!-- STEP 3: Video Generation -->
      <GenerationOptions
        v-else-if="wizard.currentStep.value === 'generation'"
        :options="wizard.generationOptions.value"
        :audio-duration="duration"
        :video-count="wizard.selectedVideos.value.length"
        :selected-categories-count="selectedCategories.size"
        :is-generating="wizard.isGenerating.value"
        :generation-progress="wizard.generationProgress.value"
        :beat-data="beatData"
        :selected-categories="selectedCategories"
        :video-metadata="wizard.videoMetadata.value"
        @back="wizard.previousStep()"
        @generate="handleGenerate"
        @update:options="wizard.generationOptions.value = $event"
      />
    </div>

    <AppThemeSwitcher v-model="isThemeDrawerOpen" />
  </div>
</template>

<script setup lang="ts">
import { useThemeStore } from '~/stores/theme'
import { useVideoWizard } from '~/composables/useVideoWizard'
import { useBeatDetection, type BeatCategory } from '~/composables/useBeatDetection'
import StepIndicator from '~/components/VideoGeneration/StepIndicator.vue'
import VideoSelection from '~/components/VideoGeneration/VideoSelection.vue'
import GenerationOptions from '~/components/VideoGeneration/GenerationOptions.vue'
import BeatCategorySelector from '~/components/AudioAnalysis/BeatCategorySelector.vue'

const themeStore = useThemeStore()
const isThemeDrawerOpen = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const fileName = ref('')
const audioBuffer = ref<AudioBuffer | null>(null)
const isAnalyzing = ref(false)
const beatData = ref<{ bpm: number; offset: number; tempo: number } | null>(null)
const duration = ref(0)

// Audio context and playback
const audioContext = ref<AudioContext | null>(null)
const sourceNode = ref<AudioBufferSourceNode | null>(null)
const analyserNode = ref<AnalyserNode | null>(null)
const isPlaying = ref(false)
const currentTime = ref(0)
const startTime = ref(0)
const pauseTime = ref(0)
const canvas = ref<HTMLCanvasElement | null>(null)
const animationId = ref<number | null>(null)

// Preview sample playback
const previewSource = ref<AudioBufferSourceNode | null>(null)
const isPlayingPreview = ref<any>(null)

// Video wizard composable
const wizard = useVideoWizard()

// Beat detection composable
const beatDetection = useBeatDetection()
const {
  selectedCategories,
  categoryStats,
  isBeatDetected,
  lastDetectedCategory,
  calculateAllFluxValues,
  detectBeatsAllCategories,
  triggerBeatVisual,
  resetBeatDetection,
  toggleCategory,
  selectPreset,
  buildBeatTimeline,
  FREQUENCY_RANGES
} = beatDetection

// Store the beat timeline for video generation
const beatTimeline = ref<any[]>([])

const handleDrop = async (e: DragEvent) => {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

const handleFileSelect = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    await processFile(files[0])
  }
}

const processFile = async (file: File | undefined) => {
  if (!file) return

  fileName.value = file.name
  isAnalyzing.value = true

  try {
    const arrayBuffer = await file.arrayBuffer()
    if (!audioContext.value) {
      audioContext.value = new AudioContext()
    }
    audioBuffer.value = await audioContext.value.decodeAudioData(arrayBuffer)
    duration.value = audioBuffer.value.duration

    // Analyze BPM using web-audio-beat-detector
    const { guess } = await import('web-audio-beat-detector')
    const result = await guess(audioBuffer.value)
    beatData.value = {
      bpm: result.bpm,
      offset: result.offset,
      tempo: result.bpm // Tempo is same as BPM in this context
    }

    // Analyze entire audio for beat timeline
    await analyzeFullAudio()

    console.log('Audio loaded successfully:', {
      duration: duration.value,
      channels: audioBuffer.value.numberOfChannels,
      sampleRate: audioBuffer.value.sampleRate,
      bpm: result.bpm,
      beatsDetected: beatTimeline.value.length
    })
  } catch (error) {
    console.error('Error processing file:', error)
    alert('Error analyzing audio file')
  } finally {
    isAnalyzing.value = false
  }
}

// Analyze the entire audio offline to build beat timeline
const analyzeFullAudio = async () => {
  if (!audioContext.value || !audioBuffer.value) return

  // Create an offline audio context for analysis
  const offlineContext = new OfflineAudioContext(
    audioBuffer.value.numberOfChannels,
    audioBuffer.value.length,
    audioBuffer.value.sampleRate
  )

  const source = offlineContext.createBufferSource()
  source.buffer = audioBuffer.value

  const analyser = offlineContext.createAnalyser()
  analyser.fftSize = 512
  analyser.smoothingTimeConstant = 0.3

  source.connect(analyser)
  analyser.connect(offlineContext.destination)

  // Analyze in chunks
  const chunkSize = 2048 // Analyze every ~46ms at 44.1kHz
  const numChunks = Math.floor(audioBuffer.value.length / chunkSize)
  const floatFrequencyData = new Float32Array(analyser.frequencyBinCount)

  // Reset beat detection state
  resetBeatDetection()

  source.start(0)

  // Process each chunk
  for (let i = 0; i < numChunks; i++) {
    const currentTime = (i * chunkSize) / audioBuffer.value.sampleRate

    // Simulate the time for beat detection minimum interval checks
    const mockNow = currentTime * 1000 // Convert to milliseconds

    // Get frequency data at this time
    // Note: We can't actually get data from OfflineAudioContext in real-time
    // So we'll use the regular AudioContext approach with a scheduled playback

    // For offline analysis, we need to process the audio buffer manually
    // Extract frequency data from the raw audio buffer
    analyseAudioChunk(audioBuffer.value, i * chunkSize, chunkSize, mockNow)
  }

  // Build the beat timeline
  beatTimeline.value = buildBeatTimeline(duration.value)
}

// Analyze a chunk of audio data for beat detection
const analyseAudioChunk = (
  buffer: AudioBuffer,
  startSample: number,
  chunkSize: number,
  _currentTime: number
) => {
  // Create a simple FFT-like analysis
  const channelData = buffer.getChannelData(0)
  const endSample = Math.min(startSample + chunkSize, buffer.length)
  const chunk = channelData.slice(startSample, endSample)

  // Calculate pseudo-frequency bins (simplified spectral analysis)
  const numBins = 256
  const floatFrequencyData = new Float32Array(numBins)

  // Simple energy calculation per frequency band
  for (let bin = 0; bin < numBins; bin++) {
    let energy = 0
    for (let i = 0; i < chunk.length; i++) {
      energy += Math.abs(chunk[i]!)
    }
    floatFrequencyData[bin] = 20 * Math.log10(energy / chunk.length + 1e-10)
  }

  // Calculate flux for all categories
  const fluxValues = calculateAllFluxValues(floatFrequencyData)

  // Detect beats (this will update beatDetectionHistory)
  detectBeatsAllCategories(fluxValues)
}

const togglePlay = () => {
  if (isPlaying.value) {
    pauseAudio()
  } else {
    playAudio()
  }
}

const playAudio = () => {
  if (!audioContext.value || !audioBuffer.value) return

  if (sourceNode.value) {
    sourceNode.value.stop()
  }

  sourceNode.value = audioContext.value.createBufferSource()
  sourceNode.value.buffer = audioBuffer.value

  analyserNode.value = audioContext.value.createAnalyser()
  analyserNode.value.fftSize = 512
  analyserNode.value.smoothingTimeConstant = 0.3

  sourceNode.value.connect(analyserNode.value)
  analyserNode.value.connect(audioContext.value.destination)

  const offset = pauseTime.value
  sourceNode.value.start(0, offset)
  startTime.value = audioContext.value.currentTime - offset
  isPlaying.value = true

  // Reset beat detection state
  resetBeatDetection()

  visualize()
  updateTime()
}

const pauseAudio = () => {
  if (sourceNode.value && audioContext.value) {
    sourceNode.value.stop()
    pauseTime.value = audioContext.value.currentTime - startTime.value
    isPlaying.value = false
    if (animationId.value !== null) {
      cancelAnimationFrame(animationId.value)
    }
  }
}

const stopAudio = () => {
  if (sourceNode.value) {
    sourceNode.value.stop()
    isPlaying.value = false
    currentTime.value = 0
    pauseTime.value = 0
    if (animationId.value !== null) {
      cancelAnimationFrame(animationId.value)
    }
    resetBeatDetection()
  }
}

const seekAudio = () => {
  pauseTime.value = currentTime.value
  if (isPlaying.value) {
    pauseAudio()
    playAudio()
  }
}

const updateTime = () => {
  if (isPlaying.value && audioContext.value) {
    currentTime.value = audioContext.value.currentTime - startTime.value
    if (currentTime.value >= duration.value) {
      stopAudio()
    } else {
      requestAnimationFrame(updateTime)
    }
  }
}

const visualize = () => {
  if (!analyserNode.value || !canvas.value) return

  const canvasCtx = canvas.value.getContext('2d')
  if (!canvasCtx) return

  const bufferLength = analyserNode.value.frequencyBinCount
  const dataArray = new Uint8Array(bufferLength)

  const draw = () => {
    if (!isPlaying.value || !canvas.value) return

    animationId.value = requestAnimationFrame(draw)

    // Get frequency data for visualization
    analyserNode.value!.getByteFrequencyData(dataArray)

    // Get float frequency data for beat detection
    const floatFrequencyData = new Float32Array(analyserNode.value!.frequencyBinCount)
    analyserNode.value!.getFloatFrequencyData(floatFrequencyData)

    // Calculate flux for all categories and detect beats
    const fluxValues = calculateAllFluxValues(floatFrequencyData)
    const detectedCategory = detectBeatsAllCategories(fluxValues)

    if (detectedCategory) {
      lastDetectedCategory.value = detectedCategory
      triggerBeatVisual()
    }

    // Background color based on beat detection
    if (isBeatDetected.value) {
      canvasCtx.fillStyle = 'rgba(255, 0, 0, 0.3)'
    } else {
      canvasCtx.fillStyle = getComputedStyle(canvas.value).backgroundColor
    }
    canvasCtx.fillRect(0, 0, canvas.value.width, canvas.value.height)

    const barWidth = (canvas.value.width / bufferLength) * 2.5
    let barHeight
    let x = 0

    const beatMultiplier = isBeatDetected.value ? 1.8 : 1

    for (let i = 0; i < bufferLength; i++) {
      barHeight = ((dataArray[i] ?? 0) / 255) * canvas.value.height * beatMultiplier

      const hue = (i / bufferLength) * 360
      const saturation = isBeatDetected.value ? '100%' : '70%'
      const lightness = isBeatDetected.value ? '65%' : '50%'
      canvasCtx.fillStyle = `hsl(${hue}, ${saturation}, ${lightness})`
      canvasCtx.fillRect(x, canvas.value.height - barHeight, barWidth, barHeight)

      x += barWidth + 1
    }

    // Draw beat flash border
    if (isBeatDetected.value) {
      canvasCtx.strokeStyle = 'rgba(255, 255, 0, 0.9)'
      canvasCtx.lineWidth = 5
      canvasCtx.strokeRect(0, 0, canvas.value.width, canvas.value.height)

      // Draw category indicator in center
      const centerX = canvas.value.width / 2
      const centerY = canvas.value.height / 2
      const radius = 30

      canvasCtx.beginPath()
      canvasCtx.arc(centerX, centerY, radius, 0, Math.PI * 2)
      canvasCtx.fillStyle = 'rgba(255, 255, 0, 0.6)'
      canvasCtx.fill()
      canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      canvasCtx.lineWidth = 3
      canvasCtx.stroke()

      // Draw category label
      if (lastDetectedCategory.value) {
        canvasCtx.fillStyle = 'rgba(0, 0, 0, 0.9)'
        canvasCtx.font = 'bold 14px sans-serif'
        canvasCtx.textAlign = 'center'
        canvasCtx.textBaseline = 'middle'
        canvasCtx.fillText(lastDetectedCategory.value.toUpperCase(), centerX, centerY)
      }
    }
  }

  draw()
}

const playPreview = async (category: BeatCategory) => {
  if (!audioContext.value || !audioBuffer.value) return

  // Stop any existing preview
  if (previewSource.value) {
    previewSource.value.stop()
    previewSource.value = null
  }

  isPlayingPreview.value = category

  try {
    const range = FREQUENCY_RANGES[category]
    const sampleRate = audioBuffer.value.sampleRate

    // Convert bin indices to Hz
    const binSize = sampleRate / 512 // FFT size is 512
    const lowFreq = range.start * binSize
    const highFreq = range.end * binSize

    // Create bandpass filter
    const lowpass = audioContext.value.createBiquadFilter()
    lowpass.type = 'lowpass'
    lowpass.frequency.value = highFreq

    const highpass = audioContext.value.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = lowFreq

    // Create source
    previewSource.value = audioContext.value.createBufferSource()
    previewSource.value.buffer = audioBuffer.value

    // Connect: source -> highpass -> lowpass -> destination
    previewSource.value.connect(highpass)
    highpass.connect(lowpass)
    lowpass.connect(audioContext.value.destination)

    // Play 3 seconds from current position or start
    const startPos = currentTime.value || 0
    previewSource.value.start(0, startPos, 3)

    previewSource.value.onended = () => {
      isPlayingPreview.value = null
      previewSource.value = null
    }
  } catch (error) {
    console.error('Error playing preview:', error)
    isPlayingPreview.value = null
  }
}

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const handleGenerate = async () => {
  if (!audioBuffer.value || beatTimeline.value.length === 0 || wizard.selectedVideos.value.length === 0) {
    alert('Please ensure audio is analyzed and videos are selected')
    return
  }

  wizard.isGenerating.value = true
  wizard.generationProgress.value = 0

  try {
    console.log('=== VIDEO GENERATION STARTED (Server-side) ===')
    console.log('Beat segments:', beatTimeline.value.length)
    console.log('Videos selected:', wizard.selectedVideos.value.length)
    console.log('Options:', wizard.generationOptions.value)

    // Prepare data for server
    console.log('Step 1/5: Exporting audio buffer to WAV...')
    const audioBlob = await exportAudioBuffer(audioBuffer.value)
    console.log(`✓ Audio exported (${(audioBlob.size / 1024 / 1024).toFixed(2)} MB)`)
    wizard.generationProgress.value = 10

    // Create form data
    console.log('Step 2/5: Preparing form data...')
    const formData = new FormData()
    formData.append('audio', audioBlob, 'audio.wav')
    formData.append('timeline', JSON.stringify(beatTimeline.value))
    formData.append('options', JSON.stringify(wizard.generationOptions.value))

    // Add video files
    for (let i = 0; i < wizard.selectedVideos.value.length; i++) {
      const video = wizard.selectedVideos.value[i]!
      formData.append(`video_${i}`, video, video.name)
      console.log(`  Added video ${i + 1}/${wizard.selectedVideos.value.length}: ${video.name}`)
    }
    console.log('✓ Form data prepared')
    wizard.generationProgress.value = 20

    // Send to server
    console.log('Step 3/5: Uploading to server...')
    const response = await fetch('/api/generate-video', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Server error: ${response.statusText}`)
    }

    console.log('✓ Server processing complete')
    wizard.generationProgress.value = 90

    // Download the result
    console.log('Step 4/5: Downloading result...')
    const blob = await response.blob()
    console.log(`✓ Video received (${(blob.size / 1024 / 1024).toFixed(2)} MB)`)
    wizard.generationProgress.value = 95

    console.log('Step 5/5: Triggering download...')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `beat-synced-${Date.now()}.mp4`
    a.click()
    console.log('✓ Download triggered')

    URL.revokeObjectURL(url)

    wizard.generationProgress.value = 100
    console.log('=== VIDEO GENERATION COMPLETE ===')
    alert('Video generated successfully and downloaded!')
  } catch (error) {
    console.error('Generation error:', error)
    alert(`Error generating video: ${error}`)
  } finally {
    wizard.isGenerating.value = false
  }
}

// Export audio buffer to WAV blob
const exportAudioBuffer = async (buffer: AudioBuffer): Promise<Blob> => {
  const numberOfChannels = buffer.numberOfChannels
  const length = buffer.length * numberOfChannels * 2
  const arrayBuffer = new ArrayBuffer(44 + length)
  const view = new DataView(arrayBuffer)

  // Write WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i))
    }
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + length, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, numberOfChannels, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true)
  view.setUint16(32, numberOfChannels * 2, true)
  view.setUint16(34, 16, true)
  writeString(36, 'data')
  view.setUint32(40, length, true)

  // Write audio data
  const offset = 44
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, buffer.getChannelData(channel)[i]!))
      view.setInt16(offset + (i * numberOfChannels + channel) * 2, sample * 0x7FFF, true)
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}

// Generate beat-synced video from timeline
const generateBeatSyncedVideo = async (ffmpeg: any, fetchFile: any): Promise<void> => {
  const videos = wizard.selectedVideos.value
  const timeline = beatTimeline.value
  const options = wizard.generationOptions.value

  console.log(`  Processing ${videos.length} video files and ${timeline.length} beat segments`)

  // Write all video files to FFmpeg
  console.log('  - Writing video files to FFmpeg filesystem...')
  for (let i = 0; i < videos.length; i++) {
    const video = videos[i]!
    console.log(`    Writing video ${i + 1}/${videos.length}: ${video.name}`)
    await ffmpeg.writeFile(`input${i}.mp4`, await fetchFile(video))
  }
  console.log('  ✓ All video files written')

  // Create concat file for beat-synced segments
  console.log('  - Creating beat-synced segments...')
  let concatContent = ''
  let currentVideoIndex = 0

  for (let i = 0; i < timeline.length; i++) {
    const segment = timeline[i]!
    const duration = segment.endTime - segment.startTime

    // Pick a random video for this segment
    currentVideoIndex = Math.floor(Math.random() * videos.length)

    // Extract a random segment from the video
    const videoFile = `input${currentVideoIndex}.mp4`
    const segmentFile = `segment${i}.mp4`

    console.log(`    Segment ${i + 1}/${timeline.length}: ${duration.toFixed(3)}s from video ${currentVideoIndex + 1} (${segment.category})`)

    // Apply filters if specified
    let filterComplex = ''
    if (options.videoFilter !== 'none') {
      switch (options.videoFilter) {
        case 'grayscale':
          filterComplex = 'hue=s=0'
          break
        case 'sepia':
          filterComplex = 'colorchannelmixer=.393:.769:.189:0:.349:.686:.168:0:.272:.534:.131'
          break
        case 'blur':
          filterComplex = `boxblur=${options.filterIntensity * 2}:1`
          break
        case 'brightness':
          filterComplex = `eq=brightness=${(options.filterIntensity - 0.5) * 0.5}`
          break
      }
    }

    const filterArgs = filterComplex ? ['-vf', filterComplex] : []

    // Extract segment with duration matching beat
    await ffmpeg.exec([
      '-ss', '0',
      '-i', videoFile,
      '-t', duration.toString(),
      ...filterArgs,
      '-c:v', 'libx264',
      '-preset', 'ultrafast',
      '-an',
      segmentFile
    ])

    concatContent += `file '${segmentFile}'\n`
  }
  console.log('  ✓ All segments created')

  // Write concat list
  console.log('  - Writing concatenation list...')
  await ffmpeg.writeFile('concat.txt', new TextEncoder().encode(concatContent))
  console.log('  ✓ Concat list written')

  // Concatenate all segments
  console.log('  - Concatenating all segments...')
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-c:v', 'libx264',
    '-preset', 'ultrafast',
    'video_only.mp4'
  ])
  console.log('  ✓ Video segments concatenated')

  // Mix audio with video
  console.log('  - Mixing audio with video...')
  const audioArgs = options.includeClipAudio
    ? [
        '-i', 'audio.wav',
        '-filter_complex', `[0:a]volume=${options.clipAudioVolume}[a1];[1:a][a1]amix=inputs=2:duration=first`,
        '-c:a', 'aac'
      ]
    : [
        '-i', 'audio.wav',
        '-c:a', 'aac'
      ]

  await ffmpeg.exec([
    '-i', 'video_only.mp4',
    ...audioArgs,
    '-c:v', 'copy',
    '-shortest',
    'output.mp4'
  ])
  console.log('  ✓ Audio mixed with video')
}

const resetAll = () => {
  audioBuffer.value = null
  fileName.value = ''
  duration.value = 0
  wizard.reset()

  if (audioContext.value) {
    audioContext.value.close()
    audioContext.value = null
  }
}

onUnmounted(() => {
  wizard.clearVideos()
  if (audioContext.value) {
    audioContext.value.close()
  }
})
</script>
