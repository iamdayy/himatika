<template>
  <div class="min-h-full">
    <nav class="absolute z-10 w-full bg-white border-gray-200 md:bg-transparent bg-opacity-35 backdrop-blur-md md:border-none dark:bg-gray-900">
      <div class="flex flex-wrap items-center justify-between max-w-screen-xl p-4 mx-auto">
        <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
          <img :src="HimatikaLogo" class="h-8" alt="Himatika Logo" />
        </a>
        <div
        class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse" 
        v-if="user"
        >
          <button type="button"
            class="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
            id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown"
            data-dropdown-placement="bottom">
            <span class="sr-only">Open user menu</span>
            <img class="w-8 h-8 rounded-full" :src="user.profile.avatar" v-if="user.profile.avatar" alt="user photo">
            <Icon class="w-8 h-8 rounded-full" name="uil:user-circle" v-else />
          </button>
          <!-- Dropdown menu -->
          <div
            class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow md:bg-transparent dark:bg-gray-700 dark:divide-gray-600"
            id="user-dropdown"
            >
            <div class="px-4 py-3">
              <span class="block text-sm text-gray-900 dark:text-white">{{ user.username }}</span>
              <span class="block text-sm text-gray-500 truncate dark:text-gray-400">{{ user.profile.email }}</span>
            </div>
            <ul class="py-2" aria-labelledby="user-menu-button">
              <li v-for="nav, i in userNavigation" :key="i">
                <NuxtLink :to="nav.href"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">{{ nav.name }}</NuxtLink>
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
        <div
        class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse" 
        v-else
        >
          <button type="button"
            class="flex text-sm rounded-full md:me-0"
            id="login-menu-button" aria-expanded="false" data-dropdown-toggle="login-dropdown"
            data-dropdown-placement="bottom">
            <span class="sr-only">Open user menu</span>
            <Icon class="w-6 h-6" name="uil:signin" />
          </button>
          <!-- Dropdown menu -->
          <div
            class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow md:bg-transparent dark:bg-gray-700 dark:divide-gray-600"
            id="login-dropdown"
            >
            <ul class="py-2" aria-labelledby="login-menu-button">
              <li>
                <NuxtLink to="/login"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Login</NuxtLink>
              </li>
              <li>
                <NuxtLink to="/register"
                  class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Register</NuxtLink>
              </li>
            </ul>
          </div>
          <button data-collapse-toggle="navbar-login" type="button"
            class="inline-flex items-center justify-center w-10 h-10 p-2 text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
            aria-controls="navbar-login" aria-expanded="false">
            <span class="sr-only">Open main menu</span>
            <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M1 1h15M1 7h15M1 13h15" />
            </svg>
          </button>
        </div>
        <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-user">
          <ul
            class="flex flex-col p-4 mt-4 font-medium border border-gray-300 rounded-lg shadow-md md:p-0 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent md:shadow-none">
            <li v-for="nav,i in navigation" :key="i">
              <a :href="nav.href"
                class="block px-3 py-2 bg-transparent rounded text-slate-700 md:p-0 dark:text-slate-800"
              >{{ nav.name  }}</a>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <main>
      <div class="px-3 py-6 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
    <CoreFooter />
  </div>
</template>
  
<script setup lang="ts">
import type { ILink, IUser } from "~/types"
import HimatikaLogo from '~/assets/image/himatika-logo.png';

const { data: user } = useAuth();
const navigation: ILink[] = [
  { name: 'Home', href: '/', current: true },
  { name: 'About', href: '#about', current: false },
  { name: 'Events', href: '#events', current: false },
  { name: 'Projects', href: '#projects', current: false },
] as ILink[]
const userNavigation: ILink[] = [
  { name: 'Your Profile', href: '/dashboard/profile' },
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'Settings', href: '/' },
  { name: 'Sign out', href: '/' },
] as ILink[]
</script>