<script setup lang='ts'>
const props = defineProps({
    title: {
        type: String,
    },
    placeholder: {
        type: String
    },
    options: {
        type: Array<String | number>,
    }
});
const input = defineModel();
</script>
<template>
    <div class="flex items-center">
        <label :for="`select-${title}`" v-if="title"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ title }}</label>
        <select :id="`select-${title}`" v-model="input"
            class="block w-full p-2 text-sm text-gray-900 border border-gray-300 rounded-lg bg-gray-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
            :placeholder="placeholder">
            <!-- <option>{{ placeholder }}</option> -->
            <option v-for="option, i in options" :key="i" :value="option">{{ option }}</option>
        </select>
    </div>
</template>
<style scoped></style>