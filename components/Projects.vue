<script setup lang='ts'>
import { initAccordions } from 'flowbite';
import type { IProfile } from '~/types';
const { page, perPage, projects, totalProjects, refreshProjects } = useProjects();
perPage.value = 10;
page.value = 1;
const clickpage = (v: number) => {
  page.value = v;
  refreshProjects();
}
onMounted(() => {
  initAccordions();
})
</script>
<template>
  <CoreCard title="Projects">
    <div id="accordion-flush" data-accordion="collapse"
      data-active-classes="text-gray-900 dark:text-white [&>.dot]:bg-orange-600"
      data-inactive-classes="text-gray-500 dark:text-gray-400">
      <div>
        <div class="px-3 py-8 overflow-auto max-h-[70vh]">
          <ol class="relative border-gray-300 border-s dark:border-orange-700">
            <CoreTimelineItem v-for="project, i in projects" :key="i" :index="i" :description="project.description"
              :title="project.title" :date="new Date(project.deadline).toDateString()">
              <ul role="list" class="px-4 space-y-5 my-7">
                <li class="flex items-center">
                  <Icon name="solar:calendar-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                    new Date(project?.deadline).toDateString() }}</span>
                </li>
                <li class="flex">
                  <Icon name="solar:eye-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                    project?.canSee }}</span>
                </li>
                <li class="flex">
                  <Icon name="solar:user-plus-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                    project?.canRegister }}</span>
                </li>
                <li class="flex">
                  <Icon name="solar:pen-new-square-outline"
                    class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <div class="flex flex-wrap gap-2 ms-3">
                    <span v-for="task, i in project.tasks" :key="i" id="badge-dismiss-default"
                      class="inline-flex items-center px-2 py-1 text-sm font-medium text-blue-800 bg-blue-100 rounded me-2 dark:bg-blue-900 dark:text-blue-300">
                      {{ task }}
                    </span>
                  </div>
                </li>
                <li class="flex">
                  <Icon name="solar:document-outline" class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                  <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">{{
                    project?.description }}</span>
                </li>
                <li v-if="project.contributors">
                  <span class="flex">
                    <Icon name="solar:users-group-two-rounded-outline"
                      class="flex-shrink-0 w-4 h-4 text-blue-600 dark:text-blue-500" />
                    <span class="text-base font-normal leading-tight text-gray-500 dark:text-gray-400 ms-3">
                      Contributors</span>
                  </span>
                  <div class="relative my-3 mt-6 overflow-auto sm:rounded-lg ms-8 max-h-48 no-scrollbar">
                    <table class="w-full text-sm text-left text-gray-500 bg-gray-100 rtl:text-right dark:text-gray-400">
                      <tbody>
                        <tr v-for="event, i in project.contributors">
                          <td class="px-6 py-4 border-gray-200 border-e">
                            {{ (event.profile as IProfile).fullName }}
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
            </CoreTimelineItem>
          </ol>
        </div>
      </div>
    </div>
    <CorePagination v-if="page" :total="totalProjects!" v-model="perPage" :current-page="page" @pagechanged="clickpage" />
  </CoreCard>
</template>
<style scoped></style>