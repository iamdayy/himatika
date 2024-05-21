<template>
    <div class="w-full p-6 bg-blue-400 border border-orange-400 rounded-lg shadow bg-opacity-5 dark:bg-gray-800 dark:border-gray-700">
        <h5 class="mb-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{{ props.title }}</h5>
        <slot />
    </div>
</template>
<script lang="ts" setup>
const props = defineProps({
    title: String,
});
</script>