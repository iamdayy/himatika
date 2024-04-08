<script setup lang='ts'>
import type { IEvent } from '~/types';
const { data: Events, refresh } = await useAsyncData(() => $fetch<IEvent[]>("/api/event"));
const date = ref<number|undefined>();
const attributes = ref([
  {
    dot: true,
    dates: Events.value?.map<Date>((event) => event.date),
  },
]);
const pickDay = (day: any) => {
  date.value = day.day;
}
</script>
<template>
  <CoreCard title="Events">
    <div class="px-3 py-8">
      <VCalendar expanded borderless @dayclick="pickDay">
        <template #footer>
                    <div class="px-2 pb-3">
                        <div class="mx-auto">
                            <div class="pt-2 border-t border-gray-800 dark:border-gray-700">
                                <div v-for="event, i in Events?.filter((event: IEvent) => new Date(event.date).getDate() == date)"
                                    :key="i"
                                    class="flex flex-col gap-2 px-4 py-2 cursor-pointer sm:gap-6 sm:flex-row sm:items-center hover:bg-gray-200 rounded-3xl">
                                    <p
                                        class="text-sm font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                                        {{ `${new Date(event.date).getHours()}:${new Date(event.date).getMinutes()}` }}
                                    </p>
                                    <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                                        {{ event.title }}
                                    </h3>
                                </div>
                                <div v-if="!date || !Events?.filter((event: IEvent) => new Date(event.date).getDate() == date).length"
                                    class="px-4 py-2">
                                    <h3 class="text-lg font-semibold text-yellow-400 dark:text-white">
                                    No data 
                                    </h3>
                                    <p
                                        class="text-sm font-normal text-gray-500 dark:text-gray-400 shrink-0">
                                        Please select date to show data
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
      </VCalendar>
    </div>
  </CoreCard>
</template>
