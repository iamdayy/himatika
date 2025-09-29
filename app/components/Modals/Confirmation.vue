<script setup lang='ts'>
import { useWindowSize } from '@vueuse/core';

/**
 * Modal instance for controlling the modal visibility
 */
const emit = defineEmits<{ close: []; confirm: [] }>();

/**
 * Props definition for the component
 */
defineProps({
    /**
     * The title of the confirmation modal
     */
    title: String,
    /**
     * The body text of the confirmation modal
     */
    body: String
});

/**
 * Window size composable for responsive design
 */
const { width } = useWindowSize();

/**
 * Computed property to determine if the screen is mobile size
 */
const isMobile = computed(() => width.value < 640);

/**
 * Computed property for responsive class names
 */
const responsiveClasses = computed(() => ({
    container: isMobile.value ? 'p-2' : 'p-3',
    title: isMobile.value ? 'text-lg' : 'text-xl',
    buttonContainer: isMobile.value ? 'flex-col' : 'flex-row',
    button: isMobile.value ? 'w-full mb-2' : 'w-auto',
}));
</script>
<template>
    <UModal :close="{ onClick: () => emit('close') }" :title="title" :size="isMobile ? 'full' : 'lg'">
        <template #body>
            <div :class="responsiveClasses.container">
                <p class="mb-4">{{ body }}</p>
            </div>
        </template>
        <template #footer>
            <div :class="['w-full flex gap-3 justify-between', responsiveClasses.buttonContainer]">
                <UButton :class="responsiveClasses.button" label="Cancel" variant="outline" color="error"
                    @click="emit('close')" />
                <UButton :class="responsiveClasses.button" label="Confirm" variant="solid" @click="emit('confirm')" />
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>