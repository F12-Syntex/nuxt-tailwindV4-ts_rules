<template>
  <div class="drawer drawer-end z-50">
    <input :id="drawerId" type="checkbox" class="drawer-toggle" :checked="modelValue" @change="handleToggle" />
    <div class="drawer-side">
      <label :for="drawerId" class="drawer-overlay" @click="handleClose"></label>
      <div class="menu bg-base-100 min-h-full w-80 sm:w-96 p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-2xl font-bold">{{ title }}</h3>
          <button @click="handleClose" class="btn btn-sm btn-circle btn-ghost">✕</button>
        </div>
        <slot name="header"></slot>
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const drawerId = `drawer-${Math.random().toString(36).substr(2, 9)}`

const handleToggle = () => {
  emit('update:modelValue', !props.modelValue)
}

const handleClose = () => {
  emit('update:modelValue', false)
}
</script>