<script setup lang='ts'>
import { initCarousels, initTooltips } from 'flowbite';
import type { ILink, IProfile, IProject } from '~/types';
definePageMeta({
  layout: false,
  middleware: ["auth"],
})
useHead({
  title: "Dashboard | Himatika"
});

const { user, logout } = useAuth();
const { eventsMe, EventPercentage, projectsMe, ProjectPercentage, all, allPercentage } = useStats();

const navigation: ILink[] = [
  { name: 'Dashboard', href: '/', current: true },
  { name: 'Events', href: '/dashboard/events', current: false },
  { name: 'Projects', href: '/dashboard/projects', current: false },
  { name: 'Profile', href: '/dashboard/profile', current: false },
] as ILink[];

const { events } = useEvents();

const { projects } = useProjects()
const Project = computed<IProject | undefined>(() => {
  return projects.value?.find((project) => new Date(project.deadline) > new Date(Date.now()))
});
onMounted(async () => {
  initCarousels();
  initTooltips();

})
</script>
<template>
  <nav class="bg-white border-gray-200 shadow-xl dark:bg-gray-700">
    <div class="flex flex-wrap items-center justify-between p-4 mx-auto">
      <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
        <NuxtImg src="/img/himatika-logo.png" class="h-8" alt="Himatika Logo" />
        <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Himatika</span>
      </NuxtLink>
      <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
        <CoreColorModeToggle />
        <CoreDropdown name="user">
          <template v-slot:trigger>
            <span class="sr-only">Open user? menu</span>
            <img :src="user?.profile.avatar || '/img/profile-blank.png'" class="w-8 h-8 rounded-full" />
          </template>
          <template v-slot:body>
            <div class="px-4 py-3">
              <span class="block text-sm text-gray-900 dark:text-white">{{ user?.username }}</span>
              <span class="block text-sm text-gray-500 truncate dark:text-gray-400">{{ user?.profile.email }}</span>
            </div>
            <ul class="py-2" aria-labelledby="user-menu-button">
              <li>
                <NuxtLink to="/dashboard"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                  Dashboard</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/dashboard/profile"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                  Profile</NuxtLink>
              </li>
              <!-- <li>
                <NuxtLink to="/tools/setting"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                  Settings</NuxtLink>
              </li> -->
              <li>
                <button @click="logout('/login')"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Sign
                  out</button>
              </li>
            </ul>
          </template>
        </CoreDropdown>
      </div>
    </div>
  </nav>
  <main>
    <div class="px-3 py-6 mx-auto sm:px-6 lg:px-8 dark:bg-gray-900">
      <div class="flex flex-col w-full gap-3 p-4 md:flex-row">
        <div class="relative w-full px-6 py-3 border shadow-xl border-gray-50 md:w-1/4 rounded-xl">
          <dl class="max-w-md text-gray-900 dark:text-white">
            <div class="max-w-sm py-1">
              <div class="relative w-24 h-24 overflow-hidden rounded-full">
                <img :src="user?.profile.avatar || '/img/profile-blank.png'"
                  class="absolute object-cover h-full shadow-md" />
              </div>
            </div>
            <div class="flex flex-col py-1">
              <dd class="text-lg font-semibold text-gray-600">{{ user?.username }}</dd>
            </div>
            <div class="flex flex-col py-1">
              <dt class="mb-1 text-gray-400 md:text-md dark:text-gray-400">Full Name</dt>
              <dd class="text-lg font-semibold text-gray-500">{{ user?.profile.fullName }}</dd>
            </div>
            <div class="flex flex-col py-1">
              <dt class="mb-1 text-gray-400 md:text-md dark:text-gray-400">Email address</dt>
              <dd class="text-lg font-semibold text-gray-500">{{ user?.profile.email }}</dd>
            </div>
            <div class="flex flex-col py-1">
              <dt class="mb-1 text-gray-400 md:text-md dark:text-gray-400">Phone</dt>
              <dd class="text-lg font-semibold text-gray-500">{{ user?.profile.phone }}</dd>
            </div>
            <div class="flex flex-col py-1">
              <dt class="mb-1 text-gray-400 md:text-md dark:text-gray-400">NIM</dt>
              <dd class="text-lg font-semibold text-gray-500">{{ user?.profile.NIM }}</dd>
            </div>
            <div class="flex flex-col py-1">
              <dt class="mb-1 text-gray-400 md:text-md dark:text-gray-400">Class</dt>
              <dd class="text-lg font-semibold text-gray-500">{{ user?.profile.class }}</dd>
            </div>
            <div class="flex flex-col py-1">
              <dt class="mb-1 text-gray-400 md:text-md dark:text-gray-400">Semester</dt>
              <dd class="text-lg font-semibold text-gray-500">{{ user?.profile.semester }}</dd>
            </div>
          </dl>
          <div class="mt-10">
            <h2 class="mb-2 text-lg font-semibold text-gray-400">Tools</h2>
            <ul class="space-y-2 font-medium">
              <li>
                <NuxtLink to="/tools/activity-letter"
                  class="flex items-center p-2 text-gray-400 rounded-lg hover:text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <Icon name="solar:file-text-outline" class="w-5 h-5 text-gray-400 hover:text-gray-800" />
                  <span class="ms-3">Activity Letter</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/collegers"
                  class="flex items-center p-2 text-gray-400 rounded-lg hover:text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <Icon name="solar:file-text-outline" class="w-5 h-5 text-gray-400 hover:text-gray-800" />
                  <span class="ms-3">Collegers Data</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/administrator"
                  class="flex items-center p-2 text-gray-400 rounded-lg hover:text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <Icon name="solar:file-text-outline" class="w-5 h-5 text-gray-400 hover:text-gray-800" />
                  <span class="ms-3">Administrator</span>
                </NuxtLink>
              </li>
              <li>
                <NuxtLink to="/tools/departement"
                  class="flex items-center p-2 text-gray-400 rounded-lg hover:text-gray-800 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                  <Icon name="solar:file-text-outline" class="w-5 h-5 text-gray-400 hover:text-gray-800" />
                  <span class="ms-3">Departement</span>
                </NuxtLink>
              </li>
            </ul>
          </div>
        </div>
        <div class="w-full md:w-3/4">
          <!-- Stats Section -->
          <div class="grid w-full grid-cols-1 gap-4 px-2 py-4 md:grid-cols-3 md:gap-6 xl:grid-cols-3 2xl:gap-8">

            <div
              class="px-6 py-6 border border-blue-300 rounded-lg shadow-md bg-blue-50 dark:bg-gray-800 dark:border-gray-300">
              <div class="flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-400">
                <Icon name="solar:folder-with-files-bold" class="mb-3 text-gray-500 w-7 h-7 dark:text-gray-400" />
              </div>
              <div class="flex items-end justify-between mt-4">
                <div>
                  <span class="text-xl font-medium dark:text-gray-100">Registered</span>
                  <h4 class="text-2xl font-bold text-black dark:text-white">
                    {{ all }}
                  </h4>
                </div>
                <span class="text-sm font-medium text-blue-700 dark:text-white">{{ allPercentage }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-blue-600 h-2.5 rounded-full" :style="`width: ${allPercentage}%`"></div>
              </div>
            </div>
            <div
              class="px-6 py-6 border border-blue-300 rounded-lg shadow-md bg-blue-50 dark:bg-gray-800 dark:border-gray-300">
              <div class="flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-400">
                <Icon name="solar:programming-bold" class="mb-3 text-gray-500 w-7 h-7 dark:text-gray-400" />
              </div>
              <div class="flex items-end justify-between mt-4">
                <div>
                  <span class="text-xl font-medium dark:text-gray-100">Projects registered</span>
                  <h4 class="text-2xl font-bold text-black dark:text-white">
                    {{ projectsMe?.length }}
                  </h4>
                </div>
                <span class="text-sm font-medium text-blue-700 dark:text-white">{{ ProjectPercentage }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-blue-600 h-2.5 rounded-full" :style="`width: ${ProjectPercentage}%`"></div>
              </div>
            </div>
            <div
              class="px-6 py-6 border border-blue-300 rounded-lg shadow-md bg-blue-50 dark:bg-gray-800 dark:border-gray-300">
              <div class="flex items-center justify-center w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-400">
                <Icon name="solar:calendar-bold" class="mb-3 text-gray-500 w-7 h-7 dark:text-gray-400" />
              </div>
              <div class="flex items-end justify-between mt-4">
                <div>
                  <span class="text-xl font-medium dark:text-gray-100">events registered</span>
                  <h4 class="text-2xl font-bold text-black dark:text-white">
                    {{ eventsMe?.length }}
                  </h4>
                </div>
                <span class="text-sm font-medium text-blue-700 dark:text-white">{{ EventPercentage }}%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-blue-600 h-2.5 rounded-full" :style="`width: ${EventPercentage}%`"></div>
              </div>
            </div>
          </div>
          <!-- events section -->
          <div class="p-6 rounded-lg shadow-md bg-blue-50 dark:bg-gray-800 dark:border-gray-700">
            <div class="flex justify-between">
              <div class="flex gap-2">
                <Icon name="solar:calendar-bold" class="mb-3 text-gray-500 w-7 h-7 dark:text-gray-400" />
                <h5 class="mb-2 text-2xl font-semibold tracking-tight text-gray-600 dark:text-gray-500">Events</h5>
              </div>
              <NuxtLink to="/dashboard/events" class="inline-flex items-center text-blue-600 hover:underline">
                See more
                <svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778" />
                </svg>
              </NuxtLink>
            </div>
            <div v-if="events" id="events-carousel" class="relative w-full overflow-hidden" data-carousel="static">
              <div class="relative overflow-hidden h-80 md:h-72">
                <div v-for="event, i in events.slice(0, 5)" :key="i" class="hidden duration-700 ease-in-out"
                  data-carousel-item>
                  <div class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                    <div class="px-8">
                      <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Name</span>
                      <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ event.title
                        }}
                      </h3>

                      <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Date</span>
                      <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{
                        new Date(event.date).toLocaleDateString() }}
                      </h3>

                      <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">At</span>
                      <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ event.at }}
                      </h3>

                      <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Accessbility</span>
                      <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ event.canSee
                        }}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Slider indicators -->
              <div class="absolute z-30 flex space-x-3 -translate-x-1/2 bottom-5 left-1/2 rtl:space-x-reverse">
                <button v-for="event, i in events.slice(0, 5)" :key="i" type="button" class="w-3 h-3 rounded-full"
                  :aria-label="`Slide ${i + 1}`" :data-carousel-slide-to="i"></button>
              </div>
              <!-- Slider controls -->
              <button type="button"
                class="absolute top-0 z-30 flex items-end justify-center h-full cursor-pointer start-0 group focus:outline-none"
                data-carousel-prev>
                <span
                  class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/40 dark:bg-gray-800/30 group-hover:bg-white/60 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                  <svg class="w-4 h-4 text-gray-500 dark:text-gray-600 rtl:rotate-180" aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M5 1 1 5l4 4" />
                  </svg>
                  <span class="sr-only">Previous</span>
                </span>
              </button>
              <button type="button"
                class="absolute top-0 z-30 flex items-end justify-center h-full cursor-pointer end-0 group focus:outline-none"
                data-carousel-next>
                <span
                  class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/40 dark:bg-gray-800/30 group-hover:bg-white/60 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
                  <svg class="w-4 h-4 text-gray-500 dark:text-gray-600 rtl:rotate-180" aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="m1 9 4-4-4-4" />
                  </svg>
                  <span class="sr-only">Next</span>
                </span>
              </button>
            </div>
            <CoreSkeleton v-else />
          </div>
          <!-- Projects Section -->
          <div class="p-6 mt-4 rounded-lg shadow-md bg-blue-50 dark:bg-gray-800 dark:border-gray-700">
            <div class="flex justify-between">
              <div class="flex gap-2">
                <Icon name="solar:programming-bold" class="mb-3 text-gray-500 w-7 h-7 dark:text-gray-400" />
                <h5 class="mb-2 text-2xl font-semibold tracking-tight text-gray-600 dark:text-gray-500">Projects</h5>
              </div>
              <NuxtLink to="/dashboard/projects" class="inline-flex items-center text-blue-600 hover:underline">
                See more
                <svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                  fill="none" viewBox="0 0 18 18">
                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778" />
                </svg>
              </NuxtLink>
            </div>
            <div v-if="Project" class="px-8 my-4">
              <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Name</span>
              <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ Project?.title }}</h3>

              <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Deadline</span>
              <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{
                new Date(Project?.deadline!).toDateString() }}
              </h3>

              <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Contributors</span>
              <div class="flex items-center">
                <div v-for="contributor, i in Project?.contributors" v-if="Project?.contributors" :key="i"
                  class="-mx-1">
                  <img :data-tooltip-target="`tooltip-${i}`"
                    class="object-cover w-6 h-6 border rounded-full shadow-md border-white/30"
                    :src="(contributor.profile as IProfile).avatar || '/img/profile-blank.png'" alt="">
                  <div :id="`tooltip-${i}`" role="tooltip"
                    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    {{ `${(contributor.profile as IProfile).fullName}` }}
                    <div class="tooltip-arrow" data-popper-arrow></div>
                  </div>
                </div>
              </div>

              <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Public</span>
              <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">
                {{ Project?.canSee }}
                <!-- <Icon name="solar:check-circle-bold" class="w-6 h-6 text-green-400" v-if="!Project" />
              <Icon name="solar:close-circle-bold" class="w-6 h-6 text-red-600" v-else /> -->
              </h3>
              <!-- <div>
              <div class="flex justify-between mb-1">
                <span class="text-base font-medium text-blue-700 dark:text-white">Flowbite</span>
                <span class="text-sm font-medium text-blue-700 dark:text-white">45%</span>
              </div>
              <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                <div class="bg-blue-600 h-2.5 rounded-full" style="width: 45%"></div>
              </div>
            </div> -->
            </div>
            <CoreSkeleton v-else />
          </div>
        </div>
      </div>
      <CoreFooter :links="navigation" />
    </div>
  </main>
</template>
<style scoped></style>