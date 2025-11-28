<script setup lang="ts">
import type { PropType } from 'vue'
import { ref } from 'vue'
import type { IPhoto } from '~~/types'

const props = defineProps({
    photo: {
        type: Object as PropType<IPhoto>,
        required: true
    },
    canRemove: {
        type: Boolean,
        required: false,
        default: false,
    }
})

const emit = defineEmits(['remove', 'download', 'close'])

// Zoom functionality
const zoomLevel = ref(1)
const minZoom = 0.5
const maxZoom = 3
const zoomStep = 0.25


// Image panning
const isDragging = ref(false)
const startX = ref(0)
const startY = ref(0)
const translateX = ref(0)
const translateY = ref(0)
const initialTranslateX = ref(0)
const initialTranslateY = ref(0)

const zoomIn = () => {
    if (zoomLevel.value < maxZoom) {
        zoomLevel.value = Math.min(zoomLevel.value + zoomStep, maxZoom)
    }
}

const zoomOut = () => {
    if (zoomLevel.value > minZoom) {
        zoomLevel.value = Math.max(zoomLevel.value - zoomStep, minZoom)
    }
}

const resetZoom = () => {
    zoomLevel.value = 1
    translateX.value = 0
    translateY.value = 0
}
const startDrag = (e: MouseEvent | TouchEvent) => {
    if (zoomLevel.value <= 1) return

    isDragging.value = true

    if (e instanceof MouseEvent) {
        startX.value = e.clientX
        startY.value = e.clientY
    } else {
        startX.value = e.touches[0]!.clientX
        startY.value = e.touches[0]!.clientY
    }

    initialTranslateX.value = translateX.value
    initialTranslateY.value = translateY.value
}

const onDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging.value) return

    let clientX, clientY

    if (e instanceof MouseEvent) {
        clientX = e.clientX
        clientY = e.clientY
    } else {
        clientX = e.touches[0]!.clientX
        clientY = e.touches[0]!.clientY
    }

    const dx = clientX - startX.value
    const dy = clientY - startY.value

    translateX.value = initialTranslateX.value + dx
    translateY.value = initialTranslateY.value + dy
}

const stopDrag = () => {
    isDragging.value = false
}

// Reset zoom and position when modal closes
const handleClose = () => {
    resetZoom()
    translateX.value = 0
    translateY.value = 0
    emit('close')
}
</script>

<template>
    <UModal @close="handleClose" :ui="{
        content: 'overflow-y-auto max-w-2xl md:max-w-2xl dark:bg-transparent bg-transparent',
        wrapper: ''
    }">
        <template #content>
            <div class="relative mx-auto size-full" @mousedown="startDrag" @mousemove="onDrag" @mouseup="stopDrag"
                @mouseleave="stopDrag" @touchstart="startDrag" @touchmove="onDrag" @touchend="stopDrag">


                <!-- Close button overlay -->
                <UButton icon="i-heroicons-x-mark" variant="soft" color="neutral" size="md"
                    class="absolute z-10 top-2 right-2" @click="handleClose" aria-label="Close modal" />

                <!-- Zoom level indicator -->
                <div
                    class="absolute z-10 px-2 py-1 text-sm text-white -translate-x-1/2 rounded-md bg-black/50 top-2 left-1/2">
                    {{ Math.round(zoomLevel * 100) }}%
                </div>

                <!-- Image container with zoom and pan -->
                <div class="relative overflow-hidden rounded-lg size-full">
                    <NuxtImg provider="localProvider" :src="photo.image as string"
                        :alt="photo.tags?.join('-') || 'Photo'"
                        class="transition-transform duration-200 rounded-lg shadow-xl cursor-move size-full" :style="{
                            transform: `scale(${zoomLevel}) translate(${translateX / zoomLevel}px, ${translateY / zoomLevel}px)`,
                            transformOrigin: 'center',
                            objectFit: 'contain'
                        }" loading="lazy" />
                </div>

                <!-- Bottom controls -->
                <div
                    class="absolute bottom-0 flex flex-row justify-between w-full gap-2 p-2 -translate-x-1/2 left-1/2 bg-black/50">
                    <!-- Tags -->
                    <div class="flex flex-wrap gap-2 py-2">
                        <UBadge size="sm" v-for="(tag, i) in photo.tags" :key="i">
                            {{ tag }}
                        </UBadge>
                    </div>
                    <!-- Zoom controls -->
                    <div class="flex w-full gap-2">
                        <UButton icon="i-heroicons-plus" variant="link" color="neutral" size="sm" @click="zoomIn"
                            :disabled="zoomLevel >= maxZoom" aria-label="Zoom in" />
                        <UButton icon="i-heroicons-minus" variant="link" color="neutral" size="sm" @click="zoomOut"
                            :disabled="zoomLevel <= minZoom" aria-label="Zoom out" />
                        <UButton v-if="zoomLevel !== 1" icon="i-heroicons-arrows-pointing-in" variant="link"
                            color="neutral" size="sm" @click="resetZoom" aria-label="Reset zoom" />
                    </div>
                    <!-- Action buttons -->
                    <div class="flex flex-row gap-2">
                        <UButton icon="i-heroicons-trash" :disabled="!canRemove" size="sm" variant="ghost" color="error"
                            @click="() => emit('remove')" aria-label="Remove photo" />
                        <UButton icon="i-heroicons-arrow-down-tray" size="sm" variant="ghost"
                            @click="() => emit('download')" aria-label="Download photo" />
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>