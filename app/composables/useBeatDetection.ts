export type BeatCategory = 'kick' | 'snare' | 'hihat' | 'bass' | 'mid' | 'vocal' | 'all'

export interface BeatSegment {
  startTime: number
  endTime: number
  category: BeatCategory
}

export const useBeatDetection = () => {
  // Beat category detection
  const selectedCategories = ref<Set<BeatCategory>>(new Set(['kick', 'snare']))
  const categoryStats = ref<Record<BeatCategory, { count: number; lastDetected: number }>>({
    kick: { count: 0, lastDetected: 0 },
    snare: { count: 0, lastDetected: 0 },
    hihat: { count: 0, lastDetected: 0 },
    bass: { count: 0, lastDetected: 0 },
    mid: { count: 0, lastDetected: 0 },
    vocal: { count: 0, lastDetected: 0 },
    all: { count: 0, lastDetected: 0 }
  })

  // Real-time beat detection state (multi-category)
  const beatDetectionHistory = ref<Record<BeatCategory, number[]>>({
    kick: [],
    snare: [],
    hihat: [],
    bass: [],
    mid: [],
    vocal: [],
    all: []
  })

  const prevSpectrum = ref<Float32Array | null>(null)
  const fluxHistory = ref<Record<BeatCategory, number[]>>({
    kick: [],
    snare: [],
    hihat: [],
    bass: [],
    mid: [],
    vocal: [],
    all: []
  })

  const isBeatDetected = ref(false)
  const lastDetectedCategory = ref<BeatCategory | null>(null)
  const beatFlashTimer = ref<number | null>(null)

  const FLUX_HISTORY_SIZE = 43
  const CATEGORY_MIN_INTERVALS: Record<BeatCategory, number> = {
    kick: 250,
    snare: 250,
    hihat: 100,
    bass: 300,
    mid: 200,
    vocal: 400,
    all: 150
  }

  // Frequency ranges for different beat categories (in bins for 512 FFT @ 44.1kHz)
  const FREQUENCY_RANGES: Record<BeatCategory, { start: number; end: number; weight: number }> = {
    kick: { start: 1, end: 5, weight: 1.5 },
    snare: { start: 4, end: 15, weight: 1.3 },
    hihat: { start: 30, end: 80, weight: 1.0 },
    bass: { start: 1, end: 8, weight: 1.2 },
    mid: { start: 15, end: 40, weight: 1.1 },
    vocal: { start: 10, end: 35, weight: 1.0 },
    all: { start: 1, end: 50, weight: 1.0 }
  }

  const calculateCategoryFlux = (currentSpectrum: Float32Array, category: BeatCategory): number => {
    if (!prevSpectrum.value) {
      prevSpectrum.value = new Float32Array(currentSpectrum)
      return 0
    }

    const range = FREQUENCY_RANGES[category]
    let flux = 0
    const endIndex = Math.min(currentSpectrum.length, range.end)

    for (let i = range.start; i < endIndex; i++) {
      const diff = currentSpectrum[i]! - prevSpectrum.value[i]!
      if (diff > 0) {
        flux += diff * range.weight
      }
    }

    return flux
  }

  const calculateAllFluxValues = (currentSpectrum: Float32Array): Record<BeatCategory, number> => {
    const fluxValues: Record<BeatCategory, number> = {
      kick: calculateCategoryFlux(currentSpectrum, 'kick'),
      snare: calculateCategoryFlux(currentSpectrum, 'snare'),
      hihat: calculateCategoryFlux(currentSpectrum, 'hihat'),
      bass: calculateCategoryFlux(currentSpectrum, 'bass'),
      mid: calculateCategoryFlux(currentSpectrum, 'mid'),
      vocal: calculateCategoryFlux(currentSpectrum, 'vocal'),
      all: calculateCategoryFlux(currentSpectrum, 'all')
    }

    prevSpectrum.value = new Float32Array(currentSpectrum)
    return fluxValues
  }

  const detectCategoryBeat = (flux: number, category: BeatCategory): boolean => {
    const history = fluxHistory.value[category]
    history.push(flux)

    if (history.length > FLUX_HISTORY_SIZE) {
      history.shift()
    }

    if (history.length < 30) {
      return false
    }

    const sortedFlux = [...history].sort((a, b) => a - b)
    const medianFlux = sortedFlux[Math.floor(sortedFlux.length / 2)]!
    const avgFlux = history.reduce((a, b) => a + b, 0) / history.length

    const variance = history.reduce((sum, val) => {
      return sum + Math.pow(val - avgFlux, 2)
    }, 0) / history.length
    const stdDev = Math.sqrt(variance)

    const sensitivityMultiplier = category === 'hihat' ? 1.8 : category === 'kick' ? 2.2 : 2.0
    const threshold = Math.max(medianFlux, avgFlux) + (stdDev * sensitivityMultiplier)

    const now = Date.now()
    const beatHistory = beatDetectionHistory.value[category]
    const lastBeatTime = beatHistory[beatHistory.length - 1] ?? 0
    const timeSinceLastBeat = now - lastBeatTime

    const recentHistory = history.slice(-5, -1)
    const isLocalMax = recentHistory.length > 0 && recentHistory.every(val => flux > val)

    const minFluxValue = medianFlux * 1.3
    const minInterval = CATEGORY_MIN_INTERVALS[category]

    if (flux > threshold && isLocalMax && flux > minFluxValue && timeSinceLastBeat > minInterval) {
      beatHistory.push(now)
      if (beatHistory.length > 10) {
        beatHistory.shift()
      }

      categoryStats.value[category].count++
      categoryStats.value[category].lastDetected = now

      return true
    }

    return false
  }

  const detectBeatsAllCategories = (fluxValues: Record<BeatCategory, number>): BeatCategory | null => {
    let detectedCategory: BeatCategory | null = null

    for (const category of selectedCategories.value) {
      const flux = fluxValues[category]
      if (detectCategoryBeat(flux, category)) {
        if (!detectedCategory || getCategoryPriority(category) > getCategoryPriority(detectedCategory)) {
          detectedCategory = category
        }
      }
    }

    return detectedCategory
  }

  const getCategoryPriority = (category: BeatCategory): number => {
    const priorities: Record<BeatCategory, number> = {
      kick: 100,
      bass: 90,
      snare: 80,
      mid: 60,
      vocal: 50,
      hihat: 40,
      all: 30
    }
    return priorities[category]
  }

  const triggerBeatVisual = () => {
    isBeatDetected.value = true

    if (beatFlashTimer.value !== null) {
      clearTimeout(beatFlashTimer.value)
    }

    beatFlashTimer.value = window.setTimeout(() => {
      isBeatDetected.value = false
    }, 100)
  }

  const resetBeatDetection = () => {
    Object.keys(fluxHistory.value).forEach(key => {
      fluxHistory.value[key as BeatCategory] = []
      beatDetectionHistory.value[key as BeatCategory] = []
    })
    prevSpectrum.value = null
    isBeatDetected.value = false
    lastDetectedCategory.value = null

    Object.keys(categoryStats.value).forEach(key => {
      categoryStats.value[key as BeatCategory] = { count: 0, lastDetected: 0 }
    })
  }

  const toggleCategory = (category: BeatCategory) => {
    if (selectedCategories.value.has(category)) {
      selectedCategories.value.delete(category)
    } else {
      selectedCategories.value.add(category)
    }
    selectedCategories.value = new Set(selectedCategories.value)
  }

  const selectPreset = (preset: 'drums' | 'low' | 'melody' | 'all' | 'none') => {
    selectedCategories.value.clear()

    switch (preset) {
      case 'drums':
        selectedCategories.value.add('kick')
        selectedCategories.value.add('snare')
        selectedCategories.value.add('hihat')
        break
      case 'low':
        selectedCategories.value.add('kick')
        selectedCategories.value.add('bass')
        break
      case 'melody':
        selectedCategories.value.add('mid')
        selectedCategories.value.add('vocal')
        break
      case 'all':
        selectedCategories.value.add('kick')
        selectedCategories.value.add('snare')
        selectedCategories.value.add('hihat')
        selectedCategories.value.add('bass')
        selectedCategories.value.add('mid')
        selectedCategories.value.add('vocal')
        break
      case 'none':
        break
    }

    selectedCategories.value = new Set(selectedCategories.value)
  }

  const buildBeatTimeline = (duration: number): BeatSegment[] => {
    const timeline: BeatSegment[] = []
    const allBeats: Array<{ time: number; category: BeatCategory }> = []

    for (const category of selectedCategories.value) {
      const times = beatDetectionHistory.value[category]
      times.forEach(time => {
        allBeats.push({ time: time / 1000, category })
      })
    }

    allBeats.sort((a, b) => a.time - b.time)

    for (let i = 0; i < allBeats.length - 1; i++) {
      const current = allBeats[i]!
      const next = allBeats[i + 1]!

      timeline.push({
        startTime: current.time,
        endTime: next.time,
        category: current.category
      })
    }

    if (allBeats.length > 0) {
      const last = allBeats[allBeats.length - 1]!
      timeline.push({
        startTime: last.time,
        endTime: duration,
        category: last.category
      })
    }

    return timeline
  }

  return {
    // State
    selectedCategories,
    categoryStats,
    beatDetectionHistory,
    isBeatDetected,
    lastDetectedCategory,
    beatFlashTimer,

    // Methods
    calculateAllFluxValues,
    detectBeatsAllCategories,
    triggerBeatVisual,
    resetBeatDetection,
    toggleCategory,
    selectPreset,
    buildBeatTimeline,
    getCategoryPriority,
    FREQUENCY_RANGES
  }
}
