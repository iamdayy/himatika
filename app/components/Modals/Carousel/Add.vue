<script setup lang='ts'>
import type { ICarousel } from '~/types';


// Define emits for parent component communication
const emit = defineEmits(["saveCarousel", "close"]);
// Get window size
const windowSize = useWindowSize();

/**
 * Initialize new carousel object with default values
 * @type {Ref<ICarousel>}
 */
const carousel = ref<ICarousel>({
    title: "",
    date: new Date(),
    description: ""
});


/**
 * Add a new carousel to the database
 * @async
 * @throws {Error} When the API call fails
 */
const addCarousel = () => {
    emit('saveCarousel', carousel.value);
};


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
    <UModal :fullscreen="windowSize.width.value < 640" :title="$ts('add_carousel')" @close="emit('close')">
        <template #body>
            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2">
                    <UFormGroup :label="$ts('title')">
                        <UInput v-model="carousel.title" :size="inputSize" placeholder="Title" class="w-full" />
                    </UFormGroup>
                    <UFormGroup :label="$ts('date')">
                        <div class="flex items-center w-full gap-2">
                            <VDatePicker id="date" v-model="carousel.date" mode="dateTime">
                                <template #default="{ togglePopover }">
                                    <UButton icon="i-heroicons-calendar" @click="togglePopover" :size="buttonSize"
                                        variant="outline" color="neutral" />
                                </template>
                            </VDatePicker>
                            <span class="text-gray-900 dark:text-gray-300">
                                {{ new Date(carousel.date).toLocaleString('id-ID',
                                    {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                        hour: 'numeric',
                                        minute: 'numeric',
                                        timeZoneName: 'short',
                                    }) }}
                            </span>
                        </div>
                    </UFormGroup>
                    <UFormGroup :label="$ts('description')">
                        <UTextarea v-model="carousel.description" :size="inputSize" placeholder="Description"
                            class="w-full">
                        </UTextarea>
                    </UFormGroup>
                </div>
            </div>
        </template>
        <!-- Carousel form content -->
        <template #footer>
            <div class="flex justify-between w-full">
                <UButton :size="buttonSize" variant="ghost" @click="emit('close')">
                    {{ $ts('cancel') }}
                </UButton>
                <UButton :size="buttonSize" @click="addCarousel">
                    {{ $ts('save') }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>