<script setup lang='ts'>
import type { IEvent, IProfile } from '~/types';
const { data: Events, refresh } = await useAsyncData(() => $fetch<IEvent[]>("/api/event"));
const date = ref<number | undefined>(new Date(Date.now()).getDate());
const Event = ref<IEvent>(Events.value?.find(event => new Date(event.date).getDate() == date.value)! || Events.value![Events.value?.length! - 1]);
const attributes = computed(() => [
  ...<[]>Events.value?.map(event => ({
    dot: 'green',
    content: 'green',
    dates: event.date,
    popover: {
      label: event.title
    }
  }))
]);
const pickDay = (day: any) => {
  date.value = day.day;
}
const pickDetail = (id: string) => {
  if (Events.value) {
    const index = Events.value.findIndex((event) => event.title === id);
    Event.value = Events.value[index];
  }
}
</script>
<template>
  <CoreCard title="Events">

    <div class="flex flex-col w-full gap-3 px-8 py-12 md:flex-row">
      <VCalendar :attributes="attributes" class="mx-auto shadow-lg md:max-w-sm" @dayclick="pickDay">
        <template #footer>
          <div class="px-2 pb-3">
            <div class="mx-auto">
              <div class="pt-2 border-t border-gray-800 dark:border-gray-700">
                <div v-for="event, i in Events?.filter((event: IEvent) => new Date(event.date).getDate() == date)"
                  :key="i"
                  class="flex flex-col gap-2 px-4 py-2 cursor-pointer sm:gap-6 sm:flex-row sm:items-center hover:bg-gray-200 rounded-3xl"
                  @click="pickDetail(event.title)">
                  <p class="text-sm font-normal text-gray-500 sm:text-right dark:text-gray-400 shrink-0">
                    {{ `${new Date(event.date).getHours()}:${new Date(event.date).getMinutes()}` }}
                  </p>
                  <h3 class="text-lg font-semibold text-gray-600 dark:text-white">
                    {{ event.title }}
                  </h3>
                </div>
              </div>
            </div>
          </div>
        </template>
      </VCalendar>
      <div class="items-center justify-center w-full px-8 py-4 ml-2 border-gray-400">
        <h5 v-if="!Event" class="my-24 mb-4 text-3xl font-semibold text-center text-yellow-300 dark:text-yellow-200">No
          Agenda
          Selected</h5>
        <div v-else>
          <h5 class="mb-4 text-2xl font-medium text-gray-500 dark:text-gray-400">{{ Event?.title }}</h5>
          <ul role="list" class="space-y-5 my-7">
            <li class="flex items-center">
              <Icon name="solar:calendar-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
              <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                new Date(Event.date).toLocaleDateString() }}</span>
            </li>
            <li class="flex items-center">
              <Icon name="solar:clock-circle-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
              <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                new Date(Event?.date).toLocaleTimeString() }}</span>
            </li>
            <li class="flex">
              <Icon name="solar:map-point-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
              <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                Event?.at }}</span>
            </li>
            <li class="flex">
              <Icon name="solar:lock-keyhole-unlocked-outline"
                class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
              <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                Event?.canSee }}</span>
            </li>
            <li class="flex">
              <Icon name="solar:document-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
              <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                Event?.description }}</span>
            </li>
            <li v-if="Event.committee">
              <span class="flex">
                <Icon name="solar:users-group-two-rounded-outline"
                  class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                  Committee</span>
              </span>
              <div class="relative my-3 mt-6 overflow-auto sm:rounded-lg ms-8 max-h-48">
                <table
                  class="w-full text-sm text-left text-gray-500 bg-gray-100 rtl:text-right dark:text-gray-400">
                  <tbody>
                    <tr v-for="event, i in Event.committee">
                      <td class="px-6 py-4 border-gray-200 border-e">
                        {{ (event.user as IProfile).fullName }}
                      </td>
                      <td class="px-6 py-4 border-gray-200 border-e">
                        as
                      </td>
                      <td class="px-6 py-4">
                        {{ event.job }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </CoreCard>
</template>
