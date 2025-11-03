import { readdir, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

interface FileInfo {
	name: string
	path: string
	type: 'audio' | 'video'
	size: number
}

const AUDIO_EXTENSIONS = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac']
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']

async function scanDirectory(dirPath: string, baseDir: string): Promise<FileInfo[]> {
	const files: FileInfo[] = []

	try {
		const entries = await readdir(dirPath, { withFileTypes: true })

		for (const entry of entries) {
			const fullPath = join(dirPath, entry.name)

			if (entry.isDirectory()) {
				// Recursively scan subdirectories
				const subFiles = await scanDirectory(fullPath, baseDir)
				files.push(...subFiles)
			} else if (entry.isFile()) {
				const ext = entry.name.substring(entry.name.lastIndexOf('.')).toLowerCase()
				let fileType: 'audio' | 'video' | null = null

				if (AUDIO_EXTENSIONS.includes(ext)) {
					fileType = 'audio'
				} else if (VIDEO_EXTENSIONS.includes(ext)) {
					fileType = 'video'
				}

				if (fileType) {
					const stats = await stat(fullPath)
					const relativePath = relative(baseDir, fullPath)

					files.push({
						name: entry.name,
						path: relativePath.replace(/\\/g, '/'), // Normalize path separators
						type: fileType,
						size: stats.size
					})
				}
			}
		}
	} catch (error) {
		console.error(`Error scanning directory ${dirPath}:`, error)
	}

	return files
}

export default defineEventHandler(async () => {
	try {
		// Get the public/data directory path
		const publicDir = join(process.cwd(), 'public', 'data')

		console.log('Scanning directory:', publicDir)

		const files = await scanDirectory(publicDir, publicDir)

		const audioFiles = files.filter(f => f.type === 'audio')
		const videoFiles = files.filter(f => f.type === 'video')

		console.log(`Found ${audioFiles.length} audio files and ${videoFiles.length} video files`)

		return {
			audio: audioFiles,
			video: videoFiles,
			total: files.length
		}
	} catch (error) {
		console.error('Error scanning files:', error)
		throw createError({
			statusCode: 500,
			message: `Failed to scan files: ${error}`
		})
	}
})
