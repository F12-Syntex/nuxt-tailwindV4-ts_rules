export type WizardStep = 'audio' | 'videos' | 'generation'

export interface VideoTriggerPoint {
	time: number
	intensity: number // 0-1 representing the strength of the scene change
}

export interface VideoFile {
	name: string
	path: string // Relative path from public/data
	size: number
}

export interface VideoMetadata {
	duration: number
	triggerPoints: VideoTriggerPoint[]
	isAnalyzing: boolean
	path: string
}

export const useVideoWizard = () => {
	const currentStep = ref<WizardStep>('audio')
	const selectedVideos = ref<VideoFile[]>([])
	const videoMetadata = ref<Map<string, VideoMetadata>>(new Map())

	const generationOptions = ref({
		includeClipAudio: true,
		clipAudioVolume: 0.3, // 30%
		videoFilter: 'none' as 'none' | 'grayscale' | 'sepia' | 'blur' | 'brightness',
		filterIntensity: 0.5
	})

	const isGenerating = ref(false)
	const generationProgress = ref(0)

	const nextStep = () => {
		if (currentStep.value === 'audio') {
			currentStep.value = 'videos'
		} else if (currentStep.value === 'videos') {
			currentStep.value = 'generation'
		}
	}

	const previousStep = () => {
		if (currentStep.value === 'generation') {
			currentStep.value = 'videos'
		} else if (currentStep.value === 'videos') {
			currentStep.value = 'audio'
		}
	}

	const goToStep = (step: WizardStep) => {
		currentStep.value = step
	}

	const addVideos = async (videos: VideoFile[]) => {
		for (const video of videos) {
			// Check if already added
			if (selectedVideos.value.some(v => v.path === video.path)) {
				continue
			}

			selectedVideos.value.push(video)

			// Initialize metadata
			videoMetadata.value.set(video.path, {
				duration: 0,
				triggerPoints: [],
				isAnalyzing: true,
				path: video.path
			})

			// Analyze video for trigger points
			analyzeVideoTriggerPoints(video)
		}
	}

	const analyzeVideoTriggerPoints = async (video: VideoFile) => {
		try {
			// Create video element using the public URL
			const videoElement = document.createElement('video')
			const url = `/data/${video.path}`
			videoElement.src = url
			videoElement.crossOrigin = 'anonymous'

			// Wait for metadata to load
			await new Promise<void>((resolve, reject) => {
				videoElement.onloadedmetadata = () => resolve()
				videoElement.onerror = () => reject(new Error('Failed to load video metadata'))
			})

			const duration = videoElement.duration
			const metadata = videoMetadata.value.get(video.path)
			if (metadata) {
				metadata.duration = duration
			}

			// Create audio context for analysis
			const audioContext = new AudioContext()

			// Decode the video's audio
			const response = await fetch(url)
			const arrayBuffer = await response.arrayBuffer()
			const audioBuffer = await audioContext.decodeAudioData(arrayBuffer)

			// Analyze audio energy
			const triggerPoints: VideoTriggerPoint[] = []
			const channelData = audioBuffer.getChannelData(0) // Use first channel
			const sampleRate = audioBuffer.sampleRate
			const windowSize = Math.floor(sampleRate * 0.1) // 100ms windows
			const hopSize = Math.floor(sampleRate * 0.05) // 50ms hop (overlap)

			const energyValues: Array<{ time: number; energy: number }> = []

			// Calculate energy for each window
			for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
				let energy = 0
				for (let j = 0; j < windowSize; j++) {
					const sample = channelData[i + j]!
					energy += sample * sample
				}
				energy = Math.sqrt(energy / windowSize) // RMS energy

				const time = i / sampleRate
				energyValues.push({ time, energy })
			}

			// Find peaks in energy (high energy points)
			if (energyValues.length > 0) {
				// Calculate mean and standard deviation
				const mean = energyValues.reduce((sum, v) => sum + v.energy, 0) / energyValues.length
				const variance = energyValues.reduce((sum, v) => sum + Math.pow(v.energy - mean, 2), 0) / energyValues.length
				const stdDev = Math.sqrt(variance)
				const threshold = mean + (stdDev * 1.5) // Points above 1.5 standard deviations

				// Find local maxima above threshold
				for (let i = 1; i < energyValues.length - 1; i++) {
					const prev = energyValues[i - 1]!
					const curr = energyValues[i]!
					const next = energyValues[i + 1]!

					// Check if it's a local maximum and above threshold
					if (curr.energy > threshold &&
							curr.energy > prev.energy &&
							curr.energy > next.energy) {

						// Avoid trigger points too close together (minimum 0.5s apart)
						const lastPoint = triggerPoints[triggerPoints.length - 1]
						if (!lastPoint || curr.time - lastPoint.time >= 0.5) {
							triggerPoints.push({
								time: curr.time,
								intensity: Math.min((curr.energy - mean) / (stdDev * 3), 1) // Normalize intensity
							})
						}
					}
				}
			}

			// Update metadata with trigger points
			const updatedMetadata = videoMetadata.value.get(video.path)
			if (updatedMetadata) {
				updatedMetadata.triggerPoints = triggerPoints
				updatedMetadata.isAnalyzing = false
			}

			// Close audio context
			await audioContext.close()

			console.log(`Analyzed ${video.name}: ${triggerPoints.length} audio trigger points found`)
		} catch (error) {
			console.error(`Error analyzing video ${video.name}:`, error)
			const metadata = videoMetadata.value.get(video.path)
			if (metadata) {
				metadata.isAnalyzing = false
			}
		}
	}

	const removeVideo = (index: number) => {
		const video = selectedVideos.value[index]
		if (video) {
			videoMetadata.value.delete(video.path)
		}
		selectedVideos.value.splice(index, 1)
	}

	const clearVideos = () => {
		selectedVideos.value = []
		videoMetadata.value.clear()
	}

	const reset = () => {
		currentStep.value = 'audio'
		clearVideos()
		isGenerating.value = false
		generationProgress.value = 0
	}

	// Check if all videos have been analyzed
	const allVideosAnalyzed = computed(() => {
		if (selectedVideos.value.length === 0) return false

		return selectedVideos.value.every(video => {
			const metadata = videoMetadata.value.get(video.path)
			return metadata && !metadata.isAnalyzing
		})
	})

	return {
		currentStep,
		selectedVideos,
		videoMetadata,
		generationOptions,
		isGenerating,
		generationProgress,
		allVideosAnalyzed,
		nextStep,
		previousStep,
		goToStep,
		addVideos,
		removeVideo,
		clearVideos,
		reset
	}
}
