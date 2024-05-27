<script setup lang='ts'>
import type { DropdownOptions } from 'flowbite';
import { Dropdown } from 'flowbite';
const props = defineProps({
    name: String
})
onMounted(() => {
    const $targetEl = document.getElementById('dropdownMenu-' + props.name);
    // set the element that trigger the dropdown menu on click
    const $triggerEl = document.getElementById('dropdownButton-' + props.name);
    // options with default values
    const options: DropdownOptions = {
        placement: 'bottom',
        offsetSkidding: 0,
        offsetDistance: 10,
    };
    if ($targetEl) {
        /*
        * targetEl: required
        * triggerEl: required
        * options: optional
        */
        const dropdown = new Dropdown($targetEl, $triggerEl, options);
    }
});
</script>
<template>
    <button :id="`dropdownButton-${name}`"
        class="flex text-sm text-indigo-800 rounded-full md:me-0 hover:text-orange-200 " type="button">
        <slot name="trigger" />
    </button>
    <!-- Dropdown menu -->
    <div :id="`dropdownMenu-${name}`"
        class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600">
        <slot name="body" />
    </div>
</template>
<style scoped></style>