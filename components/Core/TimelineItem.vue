<script setup lang='ts'>
const props = defineProps({
    date: String,
    title: String,
    description: String || undefined,
    index: Number
});
</script>
<template>
    <li class="mb-10 ms-4">
        <h2 :id="`accordion-detail-${index}`">
            <button type="submit" :data-accordion-target="`#detail-${index}`" :aria-controls="`detail-${index}`">
                <div
                    class="absolute w-3 h-3 bg-blue-400 rounded-full mt-1.5 -start-1.5 dark:bg-blue-700 dot">
                </div>
                <time class="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500">{{ props.date
                    }}</time>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ props.title }}</h3>
                <p v-if="$props.description" class="mb-4 text-base font-normal text-gray-500 dark:text-gray-400">
                    {{ props.description }}
                </p>
            </button>
        </h2>
        <div :id="`detail-${index}`" class="hidden" :aria-labelledby="`accordion-detail-${index}`">
            <div class="py-5 border-b border-gray-200 dark:border-gray-700">
                <slot />
            </div>
        </div>
    </li>
</template>
<style scoped></style>