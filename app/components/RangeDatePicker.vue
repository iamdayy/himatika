<script setup lang="ts">
import { CalendarDate, DateFormatter, getLocalTimeZone } from '@internationalized/date';

const df = new DateFormatter('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
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

// Initialize time strings from model
const startTime = ref(model.value.start ? formatTime(model.value.start) : '00:00');
const endTime = ref(model.value.end ? formatTime(model.value.end) : '23:59');

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

const modelValue = shallowRef({
    start: new CalendarDate(new Date(model.value.start).getFullYear(), new Date(model.value.start).getMonth() + 1, new Date(model.value.start).getDate()),
    end: new CalendarDate(new Date(model.value.end).getFullYear(), new Date(model.value.end).getMonth() + 1, new Date(model.value.end).getDate())
});

const updateModel = () => {
    if (!modelValue.value.start || !modelValue.value.end) return;

    const startDate = modelValue.value.start.toDate(getLocalTimeZone());
    const startParts = startTime.value.split(':').map(Number);
    startDate.setHours(startParts[0] ?? 0, startParts[1] ?? 0);

    const endDate = modelValue.value.end.toDate(getLocalTimeZone());
    const endParts = endTime.value.split(':').map(Number);
    endDate.setHours(endParts[0] ?? 0, endParts[1] ?? 0);

    model.value = {
        start: startDate,
        end: endDate
    };
};

watch(modelValue, updateModel);
watch([startTime, endTime], updateModel);

// watch props model change to update local state if needed (optional, mostly for initial load or external changes)
watch(() => model.value, (newVal) => {
    if (!newVal.start || !newVal.end) return;

    // Sync time
    const newStartTime = formatTime(newVal.start);
    const newEndTime = formatTime(newVal.end);

    if (startTime.value !== newStartTime) {
        startTime.value = newStartTime;
    }
    if (endTime.value !== newEndTime) {
        endTime.value = newEndTime;
    }

    // Sync Calendar
    // Check if date part is different to avoid loop/unnecessary update
    const currentStart = modelValue.value.start ? modelValue.value.start.toDate(getLocalTimeZone()) : null;
    const currentEnd = modelValue.value.end ? modelValue.value.end.toDate(getLocalTimeZone()) : null;

    const isStartSame = currentStart &&
        currentStart.getFullYear() === newVal.start.getFullYear() &&
        currentStart.getMonth() === newVal.start.getMonth() &&
        currentStart.getDate() === newVal.start.getDate();

    const isEndSame = currentEnd &&
        currentEnd.getFullYear() === newVal.end.getFullYear() &&
        currentEnd.getMonth() === newVal.end.getMonth() &&
        currentEnd.getDate() === newVal.end.getDate();

    if (!isStartSame || !isEndSame) {
        modelValue.value = {
            start: new CalendarDate(newVal.start.getFullYear(), newVal.start.getMonth() + 1, newVal.start.getDate()),
            end: new CalendarDate(newVal.end.getFullYear(), newVal.end.getMonth() + 1, newVal.end.getDate())
        };
    }
});

</script>

<template>
    <UPopover :popper="{ placement: 'bottom-start' }">
        <UButton color="neutral" variant="outline" icon="i-lucide-calendar" :size="sizes.button" class="w-full">
            <template v-if="model.start">
                <template v-if="model.end">
                    {{ df.format(model.start) }} - {{ df.format(model.end) }}
                </template>

                <template v-else>
                    {{ df.format(model.start) }}
                </template>
            </template>
            <template v-else>
                Pick a date
            </template>
        </UButton>

        <template #content>
            <div class="p-2 space-y-2">
                <UCalendar v-model="modelValue" :number-of-months="2" range :min-value="minDate" :max-value="maxDate"
                    :disabled="props.disabled" />

                <div class="flex items-center gap-2 border-t pt-2 mt-2">
                    <div class="flex-1">
                        <label class="text-xs font-medium text-gray-500 mb-1 block">Start Time</label>
                        <UInput type="time" v-model="startTime" :size="sizes.input" />
                    </div>
                    <div class="flex-1">
                        <label class="text-xs font-medium text-gray-500 mb-1 block">End Time</label>
                        <UInput type="time" v-model="endTime" :size="sizes.input" />
                    </div>
                </div>
            </div>
        </template>
    </UPopover>
</template>
