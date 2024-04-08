<script setup lang='ts'>
import type { ILink, IEvent, IProject, IUser } from '~/types'
definePageMeta({
  layout: false,
  middleware: ["auth"]
})
useHead({
  title: "Dashboard | Himatika"
});
import { initCarousels, initDropdowns } from 'flowbite';

const { data: user, signOut } = useAuth();

const navigation: ILink[] = [
  { name: 'Dashboard', href: '/', current: true },
  { name: 'Events', href: '/dashboard/events', current: false },
  { name: 'Projects', href: '/dashboard/projects', current: false },
  { name: 'Profile', href: '/dashboard/profile', current: false },
] as ILink[];

const { data: Events } = await useAsyncData(() => $fetch<IEvent[]>("/api/event"));

const Projects = ref<IProject[]>([
  {
    id: 1,
    title: "Himatika Webapp",
    deadline: new Date("20 May 2024"),
    description: "lorem ipsum",
    hidden: true,
    contributors: [
      {
        name: "Andreas",
        job: "Project Manager"
      }
    ]
  },
  {
    id: 2,
    title: "Simitnu Redesign",
    deadline: new Date("20 May 2025"),
    description: "lorem ipsum",
    hidden: true,
    contributors: [
      {
        name: "Jean",
        job: "Project Manager"
      }
    ]
  },
]);
const Project = ref<IProject | undefined>(Projects.value.find((project) => project.deadline > new Date(Date.now())))
onMounted(async () => {
  initCarousels();
  initDropdowns();
})
</script>
<template>
  <nav class="bg-white border-gray-200 dark:bg-gray-900">
    <div class="flex flex-wrap items-center justify-between p-4 mx-auto">
      <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
        <NuxtImg src="/img/himatika-logo.png" class="h-8" alt="Himatika Logo" />
        <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Himatika</span>
      </NuxtLink>
      <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
        <button type="button"
          class="flex text-sm bg-gray-800 rounded-full md:user?-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
          id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown"
          data-dropdown-placement="bottom">
          <span class="sr-only">Open user? menu</span>
          <NuxtImg :src="user?.profile.avatar || '/img/profile-blank.png'" sizes="40px" class="rounded-full" />
        </button>
        <!-- Dropdown menu -->
        <div
          class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
          id="user-dropdown">
          <div class="px-4 py-3">
            <span class="block text-sm text-gray-900 dark:text-white">{{ user?.username }}</span>
            <span class="block text-sm text-gray-500 truncate dark:text-gray-400">{{ user?.profile.email }}</span>
          </div>
          <ul class="py-2" aria-labelledby="user?-menu-button">
            <li>
              <NuxtLink to="/dashboard"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Dashboard</NuxtLink>
            </li>
            <li>
              <a href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Settings</a>
            </li>
            <li>
              <a href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Earnings</a>
            </li>
            <li>
              <button @click="signOut({ callbackUrl: '/login' })"
                class="block w-full px-4 py-2 text-sm text-gray-700 text-start hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Sign
                Out</button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </nav>

  <div class="flex flex-col w-full gap-3 p-4 md:flex-row">
    <div class="relative w-full p-3 shadow-md bg-slate-200 md:w-1/4 rounded-xl">
      <dl class="max-w-md text-gray-900 divide-y divide-gray-200 dark:text-white dark:divide-gray-700">
        <div class="max-w-sm py-1">
          <NuxtImg :src="user?.profile.avatar || '/img/profile-blank.png'" sizes="80px" class="rounded-full" />
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
          <dt class="mb-1 text-gray-400 md:text-md dark:text-gray-400">Nik</dt>
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
        </ul>
      </div>
    </div>
    <div class="w-full md:w-3/4">
      <!-- Events section -->
      <div class="p-6 bg-gray-100 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
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
        <div v-if="Events?.length !== 0" id="events-carousel" class="relative w-full" data-carousel="static">
          <div class="relative overflow-hidden h-80 md:h-72">
            <div v-for="event, i in Events" :key="i" class="hidden duration-700 ease-in-out" data-carousel-item>
              <div class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                <div class="px-8">
                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Name</span>
                  <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ event.title }}</h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Date</span>
                  <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{
          new Date(event.date).toLocaleDateString() }}
                  </h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">At</span>
                  <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ event.at }}</h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Accessbility</span>
                  <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ event.accessbility
                    }}
                  </h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Urgently</span>
                  <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">
                    <Icon name="solar:check-circle-bold" class="w-6 h-6 text-green-400" />
                    <Icon name="solar:close-circle-bold" class="w-6 h-6 text-red-600" />
                  </h3>
                </div>
              </div>
            </div>
          </div>
          <!-- Slider indicators -->
          <div class="absolute z-30 flex space-x-3 -translate-x-1/2 bottom-5 left-1/2 rtl:space-x-reverse">
            <button v-for="event, i in Events" :key="i" type="button" class="w-3 h-3 rounded-full" aria-current="true"
              :aria-label="`Slide ${i + 1}`" :data-carousel-slide-to="i"></button>
          </div>
          <!-- Slider controls -->
          <button type="button"
            class="absolute top-0 z-30 flex items-end justify-center h-full cursor-pointer start-0 group focus:outline-none"
            data-carousel-prev>
            <span
              class="inline-flex items-center justify-center w-8 h-8 rounded-full bg-white/40 dark:bg-gray-800/30 group-hover:bg-white/60 dark:group-hover:bg-gray-800/60 group-focus:ring-4 group-focus:ring-white dark:group-focus:ring-gray-800/70 group-focus:outline-none">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-800 rtl:rotate-180" aria-hidden="true"
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
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-800 rtl:rotate-180" aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="m1 9 4-4-4-4" />
              </svg>
              <span class="sr-only">Next</span>
            </span>
          </button>
        </div>
      </div>
      <!-- Projects Section -->
      <div class="p-6 mt-4 bg-gray-100 rounded-lg shadow-md dark:bg-gray-800 dark:border-gray-700">
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
        <div class="px-8 my-4">
          <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Name</span>
          <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{ Project?.title }}</h3>

          <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Deadline</span>
          <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">{{
          Project?.deadline.toDateString() }}
          </h3>

          <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Contributors</span>
          <div class="flex items-center">
            <div v-for="i in 4" :key="i" class="-mx-1">
              <img :data-tooltip-target="`tooltip-${i}`"
                class="object-cover w-6 h-6 border rounded-full shadow-md border-white/30"
                src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=facearea&facepad=4&w=880&h=880&q=100"
                alt="">
              <div :id="`tooltip-${i}`" role="tooltip"
                class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                Tooltip {{ i }}
                <div class="tooltip-arrow" data-popper-arrow></div>
              </div>
            </div>
          </div>

          <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Public</span>
          <h3 class="self-center text-gray-500 text-md whitespace-nowrap dark:text-white">
            <Icon name="solar:check-circle-bold" class="w-6 h-6 text-green-400" v-if="!Project?.hidden" />
            <Icon name="solar:close-circle-bold" class="w-6 h-6 text-red-600" v-else />
          </h3>
          <div>
            <div class="flex justify-between mb-1">
              <span class="text-base font-medium text-blue-700 dark:text-white">Flowbite</span>
              <span class="text-sm font-medium text-blue-700 dark:text-white">45%</span>
            </div>
            <div class="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div class="bg-blue-600 h-2.5 rounded-full" style="width: 45%"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <CoreFooter :links="navigation" />
</template>
<style scoped></style>