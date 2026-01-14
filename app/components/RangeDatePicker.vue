<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';

const df = new DateFormatter('en-US', {
    dateStyle: 'medium'
})

interface RangeDatePickerProps {
    min?: Date;
    max?: Date;
    disabled?: boolean;
}

const props = defineProps<RangeDatePickerProps>();

const minDate = computed(() => props.min ? new CalendarDate(props.min.getFullYear(), props.min.getMonth() + 1, props.min.getDate()) : undefined);
const maxDate = computed(() => props.max ? new CalendarDate(props.max.getFullYear(), props.max.getMonth() + 1, props.max.getDate()) : undefined);

const model = defineModel<{ start: Date, end: Date }>({ required: true });
const modelValue = shallowRef({
    start: new CalendarDate(model.value.start.getFullYear(), model.value.start.getMonth() + 1, model.value.start.getDate()),
    end: new CalendarDate(model.value.end.getFullYear(), model.value.end.getMonth() + 1, model.value.end.getDate())
});

watch(modelValue, () => {
    model.value = {
        start: modelValue.value.start?.toDate(getLocalTimeZone()),
        end: modelValue.value.end?.toDate(getLocalTimeZone())
    };
}, { immediate: true });
</script>

<template>
    <UPopover>
        <UButton color="neutral" variant="subtle" icon="i-lucide-calendar">
            <template v-if="modelValue.start">
                <template v-if="modelValue.end">
                    {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }} - {{
                        df.format(modelValue.end.toDate(getLocalTimeZone())) }}
                </template>

                <template v-else>
                    {{ df.format(modelValue.start.toDate(getLocalTimeZone())) }}
                </template>
            </template>
            <template v-else>
                Pick a date
            </template>
        </UButton>

        <template #content>
            <UCalendar v-model="modelValue" class="p-2" :number-of-months="2" range :min-value="minDate"
                :max-value="maxDate" :disabled="props.disabled" />
        </template>
    </UPopover>
</template>
