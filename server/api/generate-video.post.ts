import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const execAsync = promisify(exec)

export default defineEventHandler(async (event) => {
	try {
		const body = await readBody(event)

		if (!body) {
			throw new Error('No data received')
		}

		const tempDir = join(tmpdir(), `video-gen-${Date.now()}`)
		await mkdir(tempDir, { recursive: true })

		console.log('=== SERVER-SIDE VIDEO GENERATION ===')
		console.log('Temp directory:', tempDir)

		const { audioData, beatTimeline, options, audioMetadata, videoMetadata, videoPaths } = body

		if (!audioData || !beatTimeline || beatTimeline.length === 0 || !videoPaths || videoPaths.length === 0) {
			throw new Error('Missing required data')
		}

		console.log(`✓ Received ${videoPaths.length} video file paths`)

		// Print detailed information
		console.log('\n=== DETAILED DATA SUMMARY ===')

		// Audio Information
		console.log('\n📻 AUDIO INFORMATION:')
		if (audioMetadata) {
			console.log(`  - Duration: ${audioMetadata.duration}s`)
			console.log(`  - BPM: ${audioMetadata.bpm}`)
			console.log(`  - Tempo: ${audioMetadata.tempo}`)
			console.log(`  - First Beat Offset: ${audioMetadata.offset}s`)
			console.log(`  - Selected Categories: ${audioMetadata.selectedCategories?.join(', ') || 'None'}`)
		} else {
			console.log('  ⚠ No audio metadata provided')
		}

		// Beat Timeline
		console.log('\n🎵 BEAT TIMELINE:')
		console.log(`  - Total Beat Segments: ${beatTimeline.length}`)
		if (beatTimeline.length > 0) {
			console.log(`  - First segment: ${beatTimeline[0].startTime}s - ${beatTimeline[0].endTime}s (${beatTimeline[0].category})`)
			console.log(`  - Last segment: ${beatTimeline[beatTimeline.length - 1].startTime}s - ${beatTimeline[beatTimeline.length - 1].endTime}s (${beatTimeline[beatTimeline.length - 1].category})`)

			// Group by category
			const categoryCounts: Record<string, number> = {}
			beatTimeline.forEach(segment => {
				categoryCounts[segment.category] = (categoryCounts[segment.category] || 0) + 1
			})
			console.log('  - Segments per category:')
			Object.entries(categoryCounts).forEach(([category, count]) => {
				console.log(`    • ${category}: ${count} segments`)
			})
		}

		// Video Information
		console.log('\n🎬 VIDEO INFORMATION:')
		console.log(`  - Total Videos: ${videoPaths.length}`)

		if (videoMetadata && videoMetadata.length > 0) {
			console.log('\n  Video Details:')
			videoMetadata.forEach((meta: any, index: number) => {
				console.log(`\n  Video ${index + 1}: ${meta.path}`)
				console.log(`    - Duration: ${meta.duration.toFixed(2)}s`)
				console.log(`    - Trigger Points: ${meta.triggerPoints.length}`)

				if (meta.triggerPoints.length > 0) {
					console.log(`    - First trigger: ${meta.triggerPoints[0].time.toFixed(2)}s (intensity: ${(meta.triggerPoints[0].intensity * 100).toFixed(0)}%)`)
					console.log(`    - Last trigger: ${meta.triggerPoints[meta.triggerPoints.length - 1].time.toFixed(2)}s (intensity: ${(meta.triggerPoints[meta.triggerPoints.length - 1].intensity * 100).toFixed(0)}%)`)

					// Calculate average intensity
					const avgIntensity = meta.triggerPoints.reduce((sum: number, tp: any) => sum + tp.intensity, 0) / meta.triggerPoints.length
					console.log(`    - Average intensity: ${(avgIntensity * 100).toFixed(0)}%`)

					// Show all trigger points
					console.log('    - All trigger points:')
					meta.triggerPoints.forEach((tp: any, tpIndex: number) => {
						console.log(`      ${tpIndex + 1}. ${tp.time.toFixed(2)}s - ${(tp.intensity * 100).toFixed(0)}% energy`)
					})
				} else {
					console.log('    ⚠ No trigger points found in this video')
				}
			})

			// Summary statistics
			const totalTriggerPoints = videoMetadata.reduce((sum: number, meta: any) => sum + meta.triggerPoints.length, 0)
			const avgTriggersPerVideo = totalTriggerPoints / videoMetadata.length
			console.log(`\n  📊 Summary Statistics:`)
			console.log(`    - Total trigger points across all videos: ${totalTriggerPoints}`)
			console.log(`    - Average trigger points per video: ${avgTriggersPerVideo.toFixed(1)}`)
		} else {
			console.log('  ⚠ No video metadata provided')
		}

		// Generation Options
		console.log('\n⚙️  GENERATION OPTIONS:')
		console.log(`  - Include clip audio: ${options.includeClipAudio}`)
		if (options.includeClipAudio) {
			console.log(`  - Clip audio volume: ${(options.clipAudioVolume * 100).toFixed(0)}%`)
		}
		console.log(`  - Video filter: ${options.videoFilter}`)
		if (options.videoFilter !== 'none') {
			console.log(`  - Filter intensity: ${(options.filterIntensity * 100).toFixed(0)}%`)
		}

		console.log('\n=== END DETAILED SUMMARY ===\n')

		// Write audio file
		const audioPath = join(tempDir, 'audio.wav')
		const audioBuffer = Buffer.from(audioData, 'base64')
		await writeFile(audioPath, audioBuffer)
		console.log('✓ Audio file written')

		// Get the public/data directory path
		const publicDataDir = join(process.cwd(), 'public', 'data')

		console.log('\n=== STARTING VIDEO GENERATION ===')
		console.log('Algorithm: Switch video clips at audio beat points using energy trigger points')

		// Build clips based on beat timeline and video trigger points
		const clips: Array<{
			videoIndex: number
			startTime: number
			duration: number
			beatTime: number
		}> = []

		// Track which videos and trigger points we've used
		const videoTriggerIndexes = videoMetadata.map(() => 0)
		let currentVideoIndex = Math.floor(Math.random() * videoPaths.length)
		let currentTriggerIndex = 0

		console.log(`\nStarting with video ${currentVideoIndex + 1}`)

		for (let i = 0; i < beatTimeline.length; i++) {
			const beat = beatTimeline[i]!
			const beatTime = beat.startTime
			const nextBeatTime = beatTimeline[i + 1]?.startTime || audioMetadata.duration

			// Get the current video's metadata
			const currentVideoMeta = videoMetadata[currentVideoIndex]
			if (!currentVideoMeta || !currentVideoMeta.triggerPoints || currentVideoMeta.triggerPoints.length === 0) {
				console.warn(`⚠ Video ${currentVideoIndex + 1} has no trigger points, skipping...`)
				// Try next video
				currentVideoIndex = (currentVideoIndex + 1) % videoPaths.length
				continue
			}

			// Get the current trigger point
			currentTriggerIndex = videoTriggerIndexes[currentVideoIndex]!
			if (currentTriggerIndex >= currentVideoMeta.triggerPoints.length) {
				// Wrap around to beginning of this video's trigger points
				currentTriggerIndex = 0
				videoTriggerIndexes[currentVideoIndex] = 0
			}

			const triggerPoint = currentVideoMeta.triggerPoints[currentTriggerIndex]!
			const clipStartTime = triggerPoint.time
			const clipDuration = nextBeatTime - beatTime

			// Make sure we don't exceed the video duration
			const maxDuration = currentVideoMeta.duration - clipStartTime
			const actualDuration = Math.min(clipDuration, maxDuration)

			if (actualDuration <= 0) {
				console.warn(`⚠ Skipping beat ${i + 1}: invalid duration`)
				continue
			}

			clips.push({
				videoIndex: currentVideoIndex,
				startTime: clipStartTime,
				duration: actualDuration,
				beatTime: beatTime
			})

			console.log(`  Beat ${i + 1}/${beatTimeline.length} at ${beatTime.toFixed(2)}s:`)
			console.log(`    - Using video ${currentVideoIndex + 1} (${currentVideoMeta.path})`)
			console.log(`    - Trigger point ${currentTriggerIndex + 1}/${currentVideoMeta.triggerPoints.length} at ${clipStartTime.toFixed(2)}s`)
			console.log(`    - Clip duration: ${actualDuration.toFixed(2)}s (until next beat at ${nextBeatTime.toFixed(2)}s)`)
			console.log(`    - Category: ${beat.category}`)

			// Move to next trigger point
			videoTriggerIndexes[currentVideoIndex] = currentTriggerIndex + 1

			// Switch to a different video for the next beat
			const nextVideoIndex = Math.floor(Math.random() * videoPaths.length)
			currentVideoIndex = nextVideoIndex
		}

		console.log(`\n✓ Generated ${clips.length} clip segments`)

		// Now create the actual video clips using FFmpeg
		console.log('\nCreating video segments with FFmpeg...')
		let concatContent = ''

		for (let i = 0; i < clips.length; i++) {
			const clip = clips[i]!
			const videoPath = join(publicDataDir, videoPaths[clip.videoIndex])
			const segmentPath = join(tempDir, `segment${i}.mp4`)

			console.log(`  Processing segment ${i + 1}/${clips.length}...`)

			let filterArgs = []
			if (options.videoFilter !== 'none') {
				let filterComplex = ''
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
				if (filterComplex) {
					filterArgs = ['-vf', filterComplex]
				}
			}

			const cmd = [
				'ffmpeg',
				'-ss', clip.startTime.toString(),
				'-i', `"${videoPath}"`,
				'-t', clip.duration.toString(),
				...filterArgs,
				'-c:v', 'libx264',
				'-preset', 'ultrafast',
				'-an',
				`"${segmentPath}"`
			].join(' ')

			await execAsync(cmd)
			concatContent += `file '${segmentPath}'\n`
		}

		console.log('✓ All video segments created')

		const concatPath = join(tempDir, 'concat.txt')
		await writeFile(concatPath, concatContent)

		console.log('Concatenating segments...')
		const videoOnlyPath = join(tempDir, 'video_only.mp4')
		await execAsync(`ffmpeg -f concat -safe 0 -i "${concatPath}" -c:v libx264 -preset ultrafast "${videoOnlyPath}"`)
		console.log('✓ Video concatenated')

		console.log('Mixing audio...')
		const outputPath = join(tempDir, 'output.mp4')
		
		if (options.includeClipAudio) {
			await execAsync(`ffmpeg -i "${videoOnlyPath}" -i "${audioPath}" -filter_complex "[1:a]volume=${options.clipAudioVolume}[a1]" -map 0:v -map "[a1]" -c:v copy -c:a aac -shortest "${outputPath}"`)
		} else {
			await execAsync(`ffmpeg -i "${videoOnlyPath}" -i "${audioPath}" -map 0:v -map 1:a -c:v copy -c:a aac -shortest "${outputPath}"`)
		}
		
		console.log('✓ Audio mixed')

		const outputData = await readFile(outputPath)
		console.log(`✓ Output file read (${(outputData.length / 1024 / 1024).toFixed(2)} MB)`)

		await rm(tempDir, { recursive: true, force: true })
		console.log('✓ Temp files cleaned up')
		console.log('=== VIDEO GENERATION COMPLETE ===')

		return new Response(outputData, {
			headers: {
				'Content-Type': 'video/mp4',
				'Content-Disposition': `attachment; filename="beat-synced-${Date.now()}.mp4"`,
				'Content-Length': outputData.length.toString()
			}
		})
	} catch (error) {
		console.error('Server error:', error)
		throw createError({
			statusCode: 500,
			message: `Video generation failed: ${error}`
		})
	}
})