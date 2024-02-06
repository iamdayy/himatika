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
        <h3 class="self-center text-lg font-semibold text-gray-500 whitespace-nowrap dark:text-white">{{ user.email }}</h3>
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
    <div class="grid w-full h-screen grid-cols-2 grid-rows-4 gap-4 p-4 md:grid-cols-4 md:w-3/4">
      <!-- component -->
      <div v-for="i in 8" :key="i" class="h-24 transition-all duration-200 ease-out bg-white rounded-lg shadow-lg cursor-pointer hover:bg-gray-300 hover:scale-105 hover:shadow-xl">
        <div class="p-4 px-8">
          <Icon name="solar:home-2-bold" class="w-8 h-8" />
          <div class="flex items-center justify-center">
            <h1 class="text-4xl font-bold text-gray-800">InVision</h1>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped></style>