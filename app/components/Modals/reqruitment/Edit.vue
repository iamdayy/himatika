<script setup lang='ts'>
import type { IReqruitment } from '~/types';


// Define emits for parent component communication
const emit = defineEmits<{
    (e: "submit", value: IReqruitment): void;
    (e: "close"): void;
}>();


// Get window size
const windowSize = useWindowSize();

const props = defineProps({
    reqruitment: {
        type: Object as () => IReqruitment,
        required: true
    }
});
/**
 * Initialize new reqruitment object with default values
 * @type {IReqruitment}
 */
const stateReqruitment: IReqruitment = reactiveComputed<IReqruitment>(() => ({
    label: props.reqruitment.label || '',
    description: props.reqruitment.description || ''
}));

/**
 * Compute the layout based on window size
 * @returns {string} The CSS class for layout
 */
const layoutClass = computed(() => {
    return windowSize.width.value < 640 ? 'grid-cols-1' : 'sm:grid-cols-6';
});

/**
 * Compute the button size based on window size
 * @returns {string} The size prop for UButton
 */
const buttonSize = computed(() => {
    return windowSize.width.value < 640 ? 'sm' : 'md';
});

/**
 * Compute the input size based on window size
 * @returns {string} The size prop for UInput
 */
const inputSize = computed(() => {
    return windowSize.width.value < 640 ? 'sm' : 'md';
});
</script>
<template>
    <UModal :fullscreen="windowSize.width.value < 640" label="Edit Reqruitment">

        <template #body>
            <UForm :state="stateReqruitment" @submit="(value) => emit('submit', value.data)">
                <div class="space-y-6 text-start">
                    <div :class="['grid', 'gap-2', layoutClass]">
                        <UFormField class="col-span-full" :label="$ts('label')">
                            <UInput type="text" name="Label" id="Label" placeholder="Reqruitment 1"
                                v-model="stateReqruitment.label" required class="w-full" :size="inputSize" />
                        </UFormField>
                        <UFormField class="col-span-full" :label="$ts('description')">
                            <UTextarea name="Description" id="Description" placeholder="Description"
                                v-model="stateReqruitment.description" required class="w-full" :size="inputSize" />
                        </UFormField>
                    </div>
                </div>
            </UForm>
        </template>

        <template #footer>
            <div class="flex items-center justify-between w-full">
                <UButton @click="emit('close')" label="Close" icon="i-heroicons-x-mark" variant="ghost" color="error"
                    :size="buttonSize" />
                <UButton type="submit" @click="emit('submit', stateReqruitment)" label="Save"
                    icon="i-heroicons-clipboard" trailing :size="buttonSize" />
            </div>
        </template>
    </UModal>
</template>
<style scoped>
/* Responsive styles are now handled by the layoutClass, buttonSize, and inputSize computed properties */
</style>