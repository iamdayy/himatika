<script setup lang='ts'>
import { capitalCase } from "change-case";
import { Modal, type ModalOptions } from "flowbite";
let modal: Modal;
const props = defineProps({
    name: String,
    class: String,
    headTitle: String
});
onMounted(() => {
    const $modalEl = document.getElementById('#modal-' + props.name);
    const options: ModalOptions = {};
    if ($modalEl) {
        modal = new Modal($modalEl, options);
    }
})
</script>
<template>
    <!-- Modal toggle -->
    <button :id="`trigger-${name}`"
        :class="props.class || `inline-flex items-center px-4 py-2 text-lg font-medium text-gray-100 bg-green-500 rounded-full hover:bg-green-400`"
        type="button" @click="modal.show()">
        {{ capitalCase(props.name!) }}
    </button>
    <!-- Main modal -->
    <div :id="`modal-${props.name}`" tabindex="-1" aria-hidden="true"
        class="hidden overflow-y-auto overflow-x-hidden fixed top-0 right-0 left-0 z-50 justify-center items-center w-full md:inset-0 h-[calc(100%-1rem)] max-h-full">
        <div class="relative w-full max-w-6xl max-h-full p-4">
            <!-- Modal content -->
            <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
                <!-- Modal header -->
                <div class="flex items-center justify-between p-4 rounded-t md:p-5">
                    <h3 class="text-2xl font-bold text-gray-600 dark:text-gray-400">
                        {{ props.headTitle ? capitalCase(props.headTitle!) : capitalCase(props.name!) }}
                    </h3>
                    <button type="button"
                        class="end-2.5 text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                        @click="modal.destroy()">
                        <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 14 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                        </svg>
                        <span class="sr-only">Close modal</span>
                    </button>
                </div>
                <!-- Modal body -->
                <slot />
            </div>
        </div>
    </div>
</template>
<style scoped></style>