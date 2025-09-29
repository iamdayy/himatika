<script setup lang='ts'>
import { useWindowSize } from '@vueuse/core';
import { computed } from 'vue';

/**
 * Props definition for the TiptapShow component
 */
const props = defineProps({
    content: {
        type: String,
        required: true,
        description: 'The HTML content to be displayed'
    },
    size: {
        type: String,
        default: 'lg',
        enum: ["xs", "sm", "base", "lg", "xl"],

    }
});

/**
 * Responsive design setup
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);

/**
 * Computed classes for responsive design
 */
const articleClasses = computed(() => [
    'min-w-full',
    'prose',
    'dark:prose-invert',
    'prose-img:rounded-xl',
    'prose-p:indent-8',
    'prose-a:text-blue-600',
    isMobile.value ? 'p-1 py-0' : 'p-2 py-0',
    `prose-${props.size}`
]);
</script>

<template>
    <article :class="articleClasses" v-html="content"></article>
</template>

<style scoped>
/* Additional scoped styles can be added here if needed */
</style>