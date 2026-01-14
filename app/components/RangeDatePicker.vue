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
const sizes = useResponsiveUiSizes();

const props = defineProps<RangeDatePickerProps>();

const minDate = computed(() => props.min ? new CalendarDate(props.min.getFullYear(), props.min.getMonth() + 1, props.min.getDate()) : undefined);
const maxDate = computed(() => props.max ? new CalendarDate(props.max.getFullYear(), props.max.getMonth() + 1, props.max.getDate()) : undefined);

const model = defineModel<{ start: Date, end: Date }>({ required: true });
const modelValue = shallowRef({
    start: new CalendarDate(new Date(model.value.start).getFullYear(), new Date(model.value.start).getMonth() + 1, new Date(model.value.start).getDate()),
    end: new CalendarDate(new Date(model.value.end).getFullYear(), new Date(model.value.end).getMonth() + 1, new Date(model.value.end).getDate())
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
        <UButton color="neutral" variant="outline" icon="i-lucide-calendar" :size="sizes.button" class="w-full">
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
