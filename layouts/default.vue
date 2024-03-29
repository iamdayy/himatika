<script setup lang='ts'>
import Logo from '~/assets/image/himatika-logo.png';
import type { IUser } from '~/types';
const { data: user } = useAuth();
</script>
<template>
    <div class="min-h-screen">
        <nav class="bg-white border-gray-200 dark:bg-gray-900">
            <div class="flex flex-wrap items-center justify-between max-w-screen-xl p-4 mx-auto">
                <a href="/" class="flex items-center space-x-3 rtl:space-x-reverse">
                    <img :src="Logo" class="h-8" alt="Himatika Logo" />
                    <span class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Himatika</span>
                </a>
                <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
                    <button type="button"
                        class="flex text-sm bg-gray-800 rounded-full md:me-0 focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                        id="user-menu-button" aria-expanded="false" data-dropdown-toggle="user-dropdown"
                        data-dropdown-placement="bottom">
                        <span class="sr-only">Open user menu</span>
                        <NuxtImg :src="user?.profile.avatar || '/profile-blank.png'" sizes="40px"
                            class="rounded-full" />
                    </button>
                    <!-- Dropdown menu -->
                    <div class="z-50 hidden my-4 text-base list-none bg-white divide-y divide-gray-100 rounded-lg shadow dark:bg-gray-700 dark:divide-gray-600"
                        id="user-dropdown">
                        <div class="px-4 py-3">
                            <span class="block text-sm text-gray-900 dark:text-white">{{ user?.username }}</span>
                            <span class="block text-sm text-gray-500 truncate dark:text-gray-400">{{ user?.profile.email
                                }}</span>
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
                        <svg class="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none"
                            viewBox="0 0 17 14">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                d="M1 1h15M1 7h15M1 13h15" />
                        </svg>
                    </button>
                </div>
            </div>
        </nav>
        <slot />
        <div
            class="fixed z-30 w-full h-16 max-w-lg -translate-x-1/2 bg-white border border-gray-200 rounded-full shadow-lg bottom-4 left-1/2 dark:bg-gray-700 dark:border-gray-600">
            <div class="grid h-full max-w-lg grid-cols-5 mx-auto">
                <NuxtLink to="/dashboard" data-tooltip-target="tooltip-home"
                    class="inline-flex flex-col items-center justify-center px-5 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <Icon name="solar:home-2-bold" class="w-6 h-6 text-gray-500 hover:text-gray-800" />
                    <span class="sr-only">Home</span>
                </NuxtLink>
                <div id="tooltip-home" role="tooltip"
                    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    Home
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
                <NuxtLink to="/dashboard/events" data-tooltip-target="tooltip-events"
                    class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <Icon name="solar:calendar-bold" class="w-6 h-6 text-gray-500 hover:text-gray-800" />
                    <span class="sr-only">Events</span>
                </NuxtLink>
                <div id="tooltip-events" role="tooltip"
                    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    Events
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
                <div class="flex items-center justify-center">
                    <button data-dropdown-toggle="dropdown-tools" data-tooltip-target="tooltip-tool" type="button"
                        class="inline-flex items-center justify-center w-10 h-10 font-medium transition-transform duration-200 ease-out bg-gray-600 rounded-full shadow-md hover:bg-gray-700 hover:scale-125 group focus:ring-4 focus:ring-gray-300 focus:outline-none dark:focus:ring-gray-800">
                        <Icon name="solar:command-bold" class="w-6 h-6 text-gray-100" />
                        <span class="sr-only">Tools</span>
                    </button>
                    <!-- Dropdown menu -->
                    <div id="dropdown-tools"
                        class="z-50 hidden bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg w-44 dark:bg-gray-700">
                        <ul class="py-4 text-gray-700 text-md dark:text-gray-200"
                            aria-labelledby="dropdownDefaultButton">
                            <li>
                                <NuxtLink to="/dashboard/tools/activity-letter"
                                    class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                    Activity Letter</NuxtLink>
                            </li>
                            <li>
                                <NuxtLink to="/dashboard/tools/collegers-data"
                                    class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                    Collegers Data</NuxtLink>
                            </li>
                        </ul>
                    </div>
                </div>
                <div id="tooltip-tool" role="tooltip"
                    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    Tools
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
                <NuxtLink to="/dashboard/projects" data-tooltip-target="tooltip-projects"
                    class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <Icon name="solar:programming-bold" class="w-6 h-6 text-gray-500 hover:text-gray-800" />
                    <span class="sr-only">Projects</span>
                </NuxtLink>
                <div id="tooltip-projects" role="tooltip"
                    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    Projects
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
                <NuxtLink to="/dashboard/profile" data-tooltip-target="tooltip-profile"
                    class="inline-flex flex-col items-center justify-center px-5 rounded-e-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
                    <Icon name="solar:user-bold" class="w-6 h-6 text-gray-500 hover:text-gray-800" />
                    <span class="sr-only">Profile</span>
                </NuxtLink>
                <div id="tooltip-profile" role="tooltip"
                    class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                    Profile
                    <div class="tooltip-arrow" data-popper-arrow></div>
                </div>
            </div>
        </div>

    </div>
</template>
<style scoped></style>