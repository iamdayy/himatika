<script setup lang='ts'>
definePageMeta({
  layout: false
})
useHead({
  title: "Dashboard | Himatika"
});
import HimatikaLogo from '~/assets/image/himatika-logo.png';
const user = {
  name: 'Tom Cook',
  email: 'tom@example.com',
  imageUrl:
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
}
</script>
<template>
  <nav class="bg-white border-gray-200 dark:bg-gray-900">
    <div class="flex flex-wrap items-center justify-between max-w-screen-xl p-4 mx-auto">
      <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
        <img :src="HimatikaLogo" class="h-8" alt="Himatika Logo" />
        <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Himatika</span>
      </a>
      <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
        <button type="button"
          class="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
          id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown"
          data-dropdown-placement="bottom">
          <span class="sr-only">Open user menu</span>
          <img class="w-8 h-8 rounded-full" :src="user.imageUrl" alt="user photo">
        </button>
        <!-- Dropdown menu -->
        <div
          class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
          id="user-dropdown">
          <div class="px-4 py-3">
            <span class="block text-sm text-gray-900 dark:text-white">{{ user.name }}</span>
            <span class="block text-sm text-gray-500 truncate dark:text-gray-400">{{ user.email }}</span>
          </div>
          <ul class="py-2" aria-labelledby="user-menu-button">
            <li>
              <a href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Dashboard</a>
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
              <a href="#"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Sign
                out</a>
            </li>
          </ul>
        </div>
        <button data-collapse-toggle="navbar-user" type="button"
          class="inline-flex items-center justify-center w-10 h-10 p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="navbar-user" aria-expanded="false">
          <span class="sr-only">Open main menu</span>
          <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M1 1h15M1 7h15M1 13h15" />
          </svg>
        </button>
      </div>
    </div>
  </nav>
  <div class="flex flex-col w-full gap-3 p-4 md:flex-row">
    <div class="w-full p-3 bg-gray-200 shadow-md md:w-1/4 rounded-xl">
      <NuxtImg :src="user.imageUrl" sizes="250px" class="rounded-full" />
      <div>
        <h2 class="self-center mt-4 text-3xl font-bold whitespace-nowrap dark:text-white">{{ user.name }}</h2>
      </div>
      <div>
        <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Email Address</span>
        <h3 class="self-center text-lg font-semibold text-gray-500 whitespace-nowrap dark:text-white">{{ user.email }}
        </h3>
      </div>
      <div>
        <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Nik</span>
        <h3 class="self-center text-xl font-semibold text-gray-500 whitespace-nowrap dark:text-white">{{ 'Nik' }}</h3>
      </div>
      <div>
        <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">CLass</span>
        <h3 class="self-center text-xl font-semibold text-gray-500 whitespace-nowrap dark:text-white">{{ 'Class' }}</h3>
      </div>
    </div>
    <div class="w-full md:w-3/4">
      <!-- Events section -->
      <div class="p-6 bg-gray-100 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div class="flex justify-between">
          <div class="flex gap-2">
            <Icon name="solar:calendar-bold" class="w-7 h-7 text-gray-500 dark:text-gray-400 mb-3" />
            <h5 class="mb-2 text-2xl font-semibold tracking-tight text-gray-600 dark:text-gray-500">Events</h5>
          </div>
          <a href="#" class="inline-flex items-center text-blue-600 hover:underline">
            See more
            <svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 18 18">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778" />
            </svg>
          </a>
        </div>
        <div id="events-carousel" class="relative w-full" data-carousel="static">
          <div class="relative h-80 overflow-hidden md:h-72">
            <div v-for="i in 4" :key="i" class="hidden duration-700 ease-in-out" data-carousel-item>
              <div class="absolute block w-full -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
                <div class="px-8">
                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Name</span>
                  <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">Mubes</h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Date</span>
                  <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">12 - February - 2024
                  </h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">At</span>
                  <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">Selopajang</h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Accessbility</span>
                  <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">Organization</h3>

                  <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Urgently</span>
                  <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">
                    <Icon name="solar:check-circle-bold" class="w-6 h-6 text-green-400" />
                    <Icon name="solar:close-circle-bold" class="w-6 h-6 text-red-600" />
                  </h3>
                </div>
              </div>
            </div>
          </div>
          <!-- Slider indicators -->
          <div class="absolute z-30 flex -translate-x-1/2 bottom-5 left-1/2 space-x-3 rtl:space-x-reverse">
            <button v-for="i in 4" :key="i" type="button" class="w-3 h-3 rounded-full" aria-current="true"
              :aria-label="`Slide ${i + 1}`" :data-carousel-slide-to="i"></button>
          </div>
          <!-- Slider controls -->
          <button type="button"
            class="absolute top-0 start-0 z-30 flex items-end justify-center h-full cursor-pointer group focus:outline-none"
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
            class="absolute top-0 end-0 z-30 flex items-end justify-center h-full cursor-pointer group focus:outline-none"
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
      <div class="mt-4 p-6 bg-gray-100 rounded-lg shadow dark:bg-gray-800 dark:border-gray-700">
        <div class="flex justify-between">
          <div class="flex gap-2">
            <Icon name="solar:programming-bold" class="w-7 h-7 text-gray-500 dark:text-gray-400 mb-3" />
            <h5 class="mb-2 text-2xl font-semibold tracking-tight text-gray-600 dark:text-gray-500">Projects</h5>
          </div>
          <a href="#" class="inline-flex items-center text-blue-600 hover:underline">
            See more
            <svg class="w-3 h-3 ms-2.5 rtl:rotate-[270deg]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
              fill="none" viewBox="0 0 18 18">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 11v4.833A1.166 1.166 0 0 1 13.833 17H2.167A1.167 1.167 0 0 1 1 15.833V4.167A1.166 1.166 0 0 1 2.167 3h4.618m4.447-2H17v5.768M9.111 8.889l7.778-7.778" />
            </svg>
          </a>
        </div>
        <div class="px-8 my-4">
          <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Name</span>
          <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">Mubes</h3>

          <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Periode</span>
          <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">12 - February - 2024
          </h3>

          <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Worker</span>
          <div class="flex items-center">
            <div v-for="i in 4" :key="i" class="-mx-1">
              <img :data-tooltip-target="`tooltip-${i}`" class="object-cover w-6 h-6 rounded-full shadow-md border border-white/30"
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
          <h3 class="self-center text-md text-gray-500 whitespace-nowrap dark:text-white">
            <Icon name="solar:check-circle-bold" class="w-6 h-6 text-green-400" />
            <Icon name="solar:close-circle-bold" class="w-6 h-6 text-red-600" />
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
</template>
<style scoped></style>