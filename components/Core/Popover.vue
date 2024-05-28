<script setup lang='ts'>
import { Popover } from "flowbite";
const props = defineProps({
    name: String
});
let popover: Popover;
onMounted(() => {
    const $targetEl = document.getElementById(`content-${props.name}`);
    const $triggerEl = document.getElementById(`button-${props.name}`);
    if ($targetEl && $triggerEl) {
        popover = new Popover($targetEl, $triggerEl, {
            placement: "top",
            triggerType: "click",
            offset: 10
        });
    }
})
</script>
<template>
    <button :id="`button-${name}`" @click="popover.show()"
        class="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
        {{ name }}
    </button>
    <div :id="`content-${name}`"
        class="absolute z-10 invisible inline-block w-64 text-sm text-gray-500 transition-opacity duration-300 bg-white border border-gray-200 rounded-lg shadow-sm opacity-0 dark:text-gray-400 dark:border-gray-600 dark:bg-gray-800">
        <div class="px-3 py-2 bg-gray-300 border-b border-gray-200 rounded-t-lg dark:border-gray-600 dark:bg-gray-700">
            <h3 class="font-semibold text-gray-800 dark:text-white">{{ name }}</h3>
        </div>
        <div class="px-3 py-2">
            <slot />
        </div>
        <div data-popper-arrow></div>
    </div>
</template>
<style scoped></style>