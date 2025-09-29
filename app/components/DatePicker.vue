<script setup lang="ts">
import { DatePicker as VCalendarDatePicker } from 'v-calendar';
import 'v-calendar/dist/style.css';
import type { DatePickerDate, DatePickerRangeObject } from 'v-calendar/dist/types/src/use/datePicker.d.ts';
const { width } = useWindowSize();
const isMobile = computed(() => {
    return width.value < 768
})
const props = defineProps({
    modelValue: {
        type: [Date, Object] as PropType<DatePickerDate | DatePickerRangeObject | null>,
        default: null
    },
    min: {
        type: [Date, String] as PropType<Date | string>,
        default: new Date()
    },
    max: {
        type: [Date, String] as PropType<Date | string>,
        default: null
    },
});
const maxDate = computed(() => {
    if (props.max) {
        return new Date(props.max)
    }
    return null
})
const minDate = computed(() => {
    if (props.min) {
        return new Date(props.min)
    }
    return null
})
const attrs = useAttrs()
const emit = defineEmits(['update:model-value', 'close'])

const date = computed({
    get: () => props.modelValue,
    set: (value) => {
        emit('update:model-value', value)
        emit('close')
    }
})

const attrsDefault = {
    transparent: true,
    borderless: true,
    color: 'primary',
    'is-dark': { selector: 'html', darkClass: 'dark' },
    'first-day-of-week': 2,
}
</script>

<template>
    <VCalendarDatePicker v-if="date && (typeof date === 'object')" v-model.range="date" :columns="isMobile ? 1 : 2"
        :multiple="false" :min-date="minDate" :max-date="maxDate" v-bind="{ ...attrsDefault, ...attrs }" />
    <VCalendarDatePicker v-else v-model="date" v-bind="{ ...attrs, ...$attrs }" />
</template>

<style>
:root {
    --vc-gray-50: rgb(var(--color-gray-50));
    --vc-gray-100: rgb(var(--color-gray-100));
    --vc-gray-200: rgb(var(--color-gray-200));
    --vc-gray-300: rgb(var(--color-gray-300));
    --vc-gray-400: rgb(var(--color-gray-400));
    --vc-gray-500: rgb(var(--color-gray-500));
    --vc-gray-600: rgb(var(--color-gray-600));
    --vc-gray-700: rgb(var(--color-gray-700));
    --vc-gray-800: rgb(var(--color-gray-800));
    --vc-gray-900: rgb(var(--color-gray-900));
}

.vc-primary {
    --vc-accent-50: rgb(var(--color-primary-50));
    --vc-accent-100: rgb(var(--color-primary-100));
    --vc-accent-200: rgb(var(--color-primary-200));
    --vc-accent-300: rgb(var(--color-primary-300));
    --vc-accent-400: rgb(var(--color-primary-400));
    --vc-accent-500: rgb(var(--color-primary-500));
    --vc-accent-600: rgb(var(--color-primary-600));
    --vc-accent-700: rgb(var(--color-primary-700));
    --vc-accent-800: rgb(var(--color-primary-800));
    --vc-accent-900: rgb(var(--color-primary-900));
}
</style>
