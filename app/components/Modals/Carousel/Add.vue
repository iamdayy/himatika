<script setup lang='ts'>
import type { ICarousel } from '~~/types';


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
                    <UFormField :label="$ts('title')">
                        <UInput v-model="carousel.title" :size="inputSize" placeholder="Title" class="w-full" />
                    </UFormField>
                    <UFormField :label="$ts('date')">
                        <div class="flex items-center w-full gap-2">
                            <UPopover>
                                <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
                                    {{ carousel.date ? carousel.date.toLocaleDateString('id-ID') : 'Select a date'
                                    }}
                                </UButton>

                                <template #content>
                                    <DatePicker v-model="carousel.date" class="p-2" />
                                </template>
                            </UPopover>
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
                    </UFormField>
                    <UFormField :label="$ts('description')">
                        <UTextarea v-model="carousel.description" :size="inputSize" placeholder="Description"
                            class="w-full">
                        </UTextarea>
                    </UFormField>
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