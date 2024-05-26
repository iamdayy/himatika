<template>
  <div class="min-h-full">
    <ClientOnly>
      <nav
        class="absolute z-10 w-full bg-white border-gray-200 md:bg-transparent bg-opacity-35 backdrop-blur-md md:border-none dark:bg-gray-900">
        <div class="flex flex-wrap items-center justify-between p-4 mx-auto">
          <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
            <NuxtImg src="/img/himatika-logo.png" class="h-8" alt="Himatika Logo" />
          </NuxtLink>
          <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse" v-if="user">
            <CoreDropdown name="user">
              <template v-slot:trigger>
                <span class="sr-only">Open user menu</span>
                <NuxtImg class="w-8 h-8 rounded-full" :src="user.profile.avatar || '/img/profile-blank.png'"
                  alt="user photo" />
              </template>
              <template v-slot:body>
                <div class="px-4 py-3">
                  <span class="block text-sm text-gray-900 dark:text-white">{{ user.username }}</span>
                  <span class="block text-sm text-gray-500 truncate dark:text-gray-400">{{ user.profile.email }}</span>
                </div>
                <ul class="py-2" aria-labelledby="user-menu-button">
                  <li v-for="nav, i in userNavigation" :key="i">
                    <NuxtLink :to="nav.href"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                      {{ nav.name }}</NuxtLink>
                  </li>
                  <li>
                    <button @click="logout('/login')"
                      class="block w-full px-4 py-2 text-sm text-gray-700 text-start hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Sign
                      Out</button>
                  </li>
                </ul>
              </template>
            </CoreDropdown>
          </div>
          <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse" v-else>
            <CoreDropdown name="auth">
              <template v-slot:trigger>
                <span class="sr-only">Open user menu</span>
                <Icon class="w-6 h-6" name="uil:signin" />
              </template>
              <template v-slot:body>
                <ul class="py-2 min-w-36" aria-labelledby="login-menu-button">
                  <li>
                    <NuxtLink to="/login"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                      Login</NuxtLink>
                  </li>
                  <li>
                    <NuxtLink to="/register"
                      class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">
                      Register</NuxtLink>
                  </li>
                </ul>
              </template>
            </CoreDropdown>
          </div>
          <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-user">
            <ul
              class="flex flex-col p-4 mt-4 font-medium border border-gray-300 rounded-lg shadow-md md:p-0 md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-transparent md:shadow-none">
              <li v-for="nav, i in navigation" :key="i">
                <a :href="nav.href"
                  class="block px-3 py-2 font-sans font-semibold text-gray-700 bg-transparent rounded md:p-0 dark:text-gray-400">{{
                    nav.name }}</a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </ClientOnly>

    <main>
      <div class="px-3 py-6 mx-auto sm:px-6 lg:px-8">
        <slot />
      </div>
    </main>
    <CoreFooter />
  </div>
</template>

<script setup lang="ts">
import type { ILink } from "~/types";

const { user, logout } = useAuth();
const navigation: ILink[] = [
  { name: 'Home', href: '/', current: true },
  { name: 'About', href: '#about', current: false },
  { name: 'Events', href: '#events', current: false },
  { name: 'Projects', href: '#projects', current: false },
] as ILink[]
const userNavigation: ILink[] = [
  { name: 'Your Profile', href: '/dashboard/profile' },
  { name: 'Dashboard', href: '/dashboard' },
  // { name: 'Settings', href: '/tools/setting' },
] as ILink[]
</script>