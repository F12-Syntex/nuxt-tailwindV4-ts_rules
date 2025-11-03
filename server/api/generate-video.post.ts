import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, readFile, mkdir, rm } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const execAsync = promisify(exec)

export default defineEventHandler(async (event) => {
	try {
		const body = await readMultipartFormData(event)
		if (!body) {
			throw new Error('No data received')
		}

		const tempDir = join(tmpdir(), `video-gen-${Date.now()}`)
		await mkdir(tempDir, { recursive: true })

		console.log('=== SERVER-SIDE VIDEO GENERATION ===')
		console.log('Temp directory:', tempDir)

		let audioData: Buffer | null = null
		let beatTimeline: any[] = []
		let options: any = {}
		let audioMetadata: any = null
		let videoMetadata: any[] = []
		const videoFiles: Array<{ filename: string; data: Buffer }> = []

		for (const part of body) {
			if (part.name === 'audio') {
				audioData = Buffer.from(part.data)
				console.log(`✓ Audio received (${(audioData.length / 1024 / 1024).toFixed(2)} MB)`)
			} else if (part.name === 'timeline') {
				beatTimeline = JSON.parse(Buffer.from(part.data).toString())
				console.log(`✓ Beat timeline received (${beatTimeline.length} segments)`)
			} else if (part.name === 'options') {
				options = JSON.parse(Buffer.from(part.data).toString())
				console.log('✓ Options received:', options)
			} else if (part.name === 'audioMetadata') {
				audioMetadata = JSON.parse(Buffer.from(part.data).toString())
				console.log('✓ Audio metadata received')
			} else if (part.name === 'videoMetadata') {
				videoMetadata = JSON.parse(Buffer.from(part.data).toString())
				console.log('✓ Video metadata received')
			} else if (part.name?.startsWith('video_')) {
				videoFiles.push({
					filename: part.filename || `video${videoFiles.length}.mp4`,
					data: Buffer.from(part.data)
				})
			}
		}

		if (!audioData || beatTimeline.length === 0 || videoFiles.length === 0) {
			throw new Error('Missing required data')
		}

		console.log(`✓ Received ${videoFiles.length} video files`)

		const audioPath = join(tempDir, 'audio.wav')
		await writeFile(audioPath, audioData)
		console.log('✓ Audio file written')

		for (let i = 0; i < videoFiles.length; i++) {
			const videoPath = join(tempDir, `input${i}.mp4`)
			await writeFile(videoPath, videoFiles[i]!.data)
			console.log(`✓ Video ${i + 1}/${videoFiles.length} written: ${videoFiles[i]!.filename}`)
		}

		console.log('Creating beat-synced segments...')
		let concatContent = ''

		for (let i = 0; i < beatTimeline.length; i++) {
			const segment = beatTimeline[i]!
			const duration = segment.endTime - segment.startTime

			if (duration <= 0) {
				console.warn(`⚠ Skipping segment ${i + 1} with invalid duration: ${duration.toFixed(3)}s (start: ${segment.startTime}, end: ${segment.endTime})`)
				continue
			}

			const videoIndex = Math.floor(Math.random() * videoFiles.length)
			const videoPath = join(tempDir, `input${videoIndex}.mp4`)
			const segmentPath = join(tempDir, `segment${i}.mp4`)

			console.log(`  Segment ${i + 1}/${beatTimeline.length}: ${duration.toFixed(3)}s from video ${videoIndex + 1} (${segment.category})`)

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
				'-ss', '0',
				'-i', `"${videoPath}"`,
				'-t', duration.toString(),
				...filterArgs,
				'-c:v', 'libx264',
				'-preset', 'ultrafast',
				'-an',
				`"${segmentPath}"`
			].join(' ')

			await execAsync(cmd)
			concatContent += `file '${segmentPath}'\n`
		}

		console.log('✓ All segments created')

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