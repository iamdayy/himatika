<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';

const df = new DateFormatter('id-ID', {
    dateStyle: 'medium'
});

interface DatePickerProps {
    min?: Date;
    max?: Date;
    disabled?: boolean;
}

const props = defineProps<DatePickerProps>();

const minDate = computed(() => props.min ? new CalendarDate(props.min.getFullYear(), props.min.getMonth() + 1, props.min.getDate()) : undefined);
const maxDate = computed(() => props.max ? new CalendarDate(props.max.getFullYear(), props.max.getMonth() + 1, props.max.getDate()) : undefined);

const model = defineModel<Date>({ required: true });
const modelValue = shallowRef(new CalendarDate(model.value.getFullYear(), model.value.getMonth() + 1, model.value.getDate()))

watch(modelValue, () => {
    model.value = modelValue.value.toDate(getLocalTimeZone());
}, { immediate: true });
</script>

<template>
    <UPopover>
        <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
            {{ modelValue ? df.format(modelValue.toDate(getLocalTimeZone())) : 'Select a date' }}
        </UButton>

        <template #content>
            <UCalendar v-model="modelValue" class="p-2" :min-value="minDate" :max-value="maxDate"
                :disabled="props.disabled" />
        </template>
    </UPopover>
</template>
