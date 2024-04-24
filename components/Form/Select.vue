<script setup lang='ts'>
const props = defineProps({
    title: {
        type: String,
    },
    placeholder: {
        type: String
    },
    options: {
        type: Array<String>,
    }
});
const input = defineModel();
</script>
<template>
    <div>
        <label :for="`select-${title}`" v-if="title"
            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">{{ title }}</label>
        <select :id="`select-${title}`" v-model="input"
            class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" :placeholder="placeholder">
            <!-- <option>{{ placeholder }}</option> -->
            <option v-for="option, i in options" :key="i" :value="option">{{ option }}</option>
        </select>
    </div>
</template>
<style scoped></style>