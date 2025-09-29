<script setup lang='ts'>
import { useWindowSize } from '@vueuse/core';

type Action = {
    label: string;
    color: "primary" | "secondary" | "error" | "success" | "warning" | "info";
    variant: "solid" | "outline" | "ghost" | "subtle" | "link";
    onClick?: () => void;
    to?: string;
};

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
    body: String,
    /**
     * The actions to be displayed in the modal
     */
    actions: {
        type: Array<Action>,
        required: false
    }
});

/**
 * slots definition for the component
 */
defineSlots<{
    actions: any,
    default: any
}>()

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
    <UModal :title="title">
        <template #body>
            <div :class="responsiveClasses.container">
                <slot name="default" v-if="$slots.default" />
                <p class="mb-4" v-else>{{ body }}</p>
            </div>

        </template>
        <template #footer>
            <div :class="['w-full flex gap-3 justify-between', responsiveClasses.buttonContainer]">
                <UButton v-for="btn, i in actions" :key="i" :label="btn.label" :color="btn.color" :variant="btn.variant"
                    @click="btn.onClick" :to="btn.to"></UButton>
                <slot name="actions">
                </slot>
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>