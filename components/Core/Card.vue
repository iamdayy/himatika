<template>
    <div class="w-full p-6 bg-white border border-gray-200 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <a href="#">
            <h5 class="mb-2 text-4xl font-bold tracking-tight text-gray-900 dark:text-white">{{ props.title }}</h5>
        </a>
        <slot />
    </div>
</template>
<script lang="ts" setup>
const props = defineProps({
    title: String,
});
</script>