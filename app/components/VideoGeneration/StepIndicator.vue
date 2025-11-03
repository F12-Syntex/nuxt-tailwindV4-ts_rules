<template>
  <div class="mb-8">
    <ul class="steps w-full">
      <li
        class="step"
        :class="{
          'step-primary': currentStep === 'audio' || currentStep === 'videos' || currentStep === 'generation'
        }"
      >
        Audio Selection
      </li>
      <li
        class="step"
        :class="{
          'step-primary': currentStep === 'videos' || currentStep === 'generation'
        }"
      >
        Video Selection
      </li>
      <li
        class="step"
        :class="{
          'step-primary': currentStep === 'generation'
        }"
      >
        Video Generation
      </li>
    </ul>
  </div>
</template>

<script setup lang="ts">
import type { WizardStep } from '~/composables/useVideoWizard'

defineProps<{
  currentStep: WizardStep
}>()
</script>
