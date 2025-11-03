# Audio Visualiser Architecture

## 🏗️ Project Structure

### Modular Components

#### Composables (`app/composables/`)
- **`useBeatDetection.ts`** - Beat detection logic and category management
- **`useVideoWizard.ts`** - Multi-step wizard state management

#### Components (`app/components/`)

**VideoGeneration/**
- **`StepIndicator.vue`** - Progress indicator for 3-step wizard
- **`VideoSelection.vue`** - Video file upload and preview grid
- **`GenerationOptions.vue`** - Video generation settings and controls

**AudioAnalysis/**
- **`BeatCategorySelector.vue`** - Beat category selection UI (ready for integration)

### Main Page (`app/pages/index.vue`)

Clean, orchestrated view that:
- Uses composables for state management
- Delegates UI to modular components
- Handles audio file processing
- Coordinates wizard steps

## 🎯 Three-Step Wizard Flow

### Step 1: Audio Selection
- Upload MP3 file
- Process and analyze audio
- **(Placeholder)** Beat detection and category selection
- Click "Next" to proceed

### Step 2: Video Selection
- **Component:** `VideoSelection.vue`
- Drag & drop or browse for videos
- Preview grid with hover-to-play
- Remove individual videos
- Must select at least one video to proceed

### Step 3: Video Generation
- **Component:** `GenerationOptions.vue`
- Configure audio mixing (include clip audio, volume control)
- Apply video filters (grayscale, sepia, blur, brightness)
- Adjust filter intensity
- View generation summary (duration, clip count, categories)
- Click "Generate" (placeholder implementation)

## 📦 State Management

### Video Wizard State (`useVideoWizard`)
```typescript
{
  currentStep: 'audio' | 'videos' | 'generation'
  selectedVideos: File[]
  videoPreviewUrls: Map<string, string>
  generationOptions: {
    includeClipAudio: boolean
    clipAudioVolume: number // 0-1
    videoFilter: 'none' | 'grayscale' | 'sepia' | 'blur' | 'brightness'
    filterIntensity: number // 0-1
  }
  isGenerating: boolean
  generationProgress: number // 0-100
}
```

### Beat Detection State (`useBeatDetection`)
```typescript
{
  selectedCategories: Set<BeatCategory>
  categoryStats: Record<BeatCategory, { count, lastDetected }>
  beatDetectionHistory: Record<BeatCategory, number[]>
  // + detection methods
}
```

## 🔌 Integration Points

### To Add Beat Detection UI:
1. Import `BeatCategorySelector.vue`
2. Place in Step 1 (audio step) section
3. Connect events to composable methods
4. Audio analysis logic already exists in backup file

### To Implement Video Generation:
1. Update `handleGenerate()` in `index.vue`
2. Use beat timeline data structure
3. Process videos with FFmpeg.wasm or backend service
4. Apply filters based on `generationOptions`
5. Mix audio tracks
6. Download final video

## 📝 Notes

- Old implementation backed up in `app/pages/index-old.vue`
- All video preview URLs are properly cleaned up on unmount
- Step navigation validates requirements (e.g., videos selected)
- Modular design allows easy replacement of components

## 🚀 Next Steps

1. Integrate beat detection UI from `BeatCategorySelector.vue`
2. Implement actual video generation logic
3. Add beat timeline building
4. Connect to FFmpeg for video processing
