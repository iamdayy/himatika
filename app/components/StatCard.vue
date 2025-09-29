<template>
    <UCard
        :ui="{ background: 'bg-transparent dark:bg-transparent', ring: 'ring-1 ring-accent-2 dark:ring-accent-1', divide: 'divide-accent-2 dark:divide-accent-1' }">
        <template #header>
            <h3 class="text-2xl font-semibold leading-6 text-center text-gray-900 md:text-3xl dark:text-white">
                {{ title }}
            </h3>
        </template>
        <div ref="cardRef" class="flex items-baseline justify-center mt-2">
            <div class="flex items-baseline text-3xl font-bold md:text-4xl">
                {{ prefix }}
                <vue3-autocounter ref="counter" :startAmount="0" :endAmount="value" :duration="2" :autoinit="false"
                    :separator="','" />
                {{ suffix }}
            </div>
            <div v-if="change" :class="[
                change > 0 ? 'text-green-600' : 'text-red-600',
                'inline-flex items-baseline px-2.5 py-0.5 rounded-full text-sm font-medium bg-green-100 dark:bg-green-800'
            ]">
                <UIcon :name="change > 0 ? 'i-heroicons-arrow-up-20-solid' : 'i-heroicons-arrow-down-20-solid'"
                    class="self-center flex-shrink-0 w-5 h-5 mr-1" />
                {{ Math.abs(change) }}%
            </div>
        </div>
        <p v-if="description" class="mt-2 text-sm text-center text-gray-500 dark:text-gray-400">
            {{ description }}
        </p>
    </UCard>
</template>

<script setup lang="ts">
import vue3Autocounter from 'vue3-autocounter';

const props = defineProps({
    title: { type: String, required: true },
    value: { type: Number, required: true },
    prefix: { type: String, default: '' },
    suffix: { type: String, default: '' },
    description: { type: String, default: '' },
    change: { type: Number, default: null }
})

const cardRef = ref(null)
const counter = ref<any>(null)
const isInView = ref(false)

onMounted(() => {
    const observer = new IntersectionObserver(
        ([entry]) => {
            if (entry.isIntersecting && !isInView.value) {
                isInView.value = true
                counter.value?.start()
            }
        },
        { threshold: 0.1 }
    )

    if (cardRef.value) {
        observer.observe(cardRef.value)
    }
})

watch(() => props.value, (newValue) => {
    if (isInView.value) {
        counter.value?.changeValue(newValue)
    }
})
</script>