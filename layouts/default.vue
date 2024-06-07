<script setup lang='ts'>
const { user, logout } = useAuth();
const router = useRouter();
</script>
<template>
    <div class="min-h-screen">
        <nav class="bg-white border-gray-200 shadow-md dark:bg-gray-700">
            <div class="flex flex-wrap items-center justify-between p-4 mx-auto">
                <div class="flex items-center space-x-3 rtl:space-x-reverse">
                    <button class="text-gray-700 dark:text-gray-600" @click="router.back()">
                        <Icon name="solar:alt-arrow-left-outline" class="w-8 h-8"></Icon>
                    </button>
                    <NuxtLink to="/" class="flex items-center space-x-3 rtl:space-x-reverse">
                        <NuxtImg src="/img/himatika-logo.png" class="h-8" alt="Himatika Logo" />
                        <span
                            class="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">Himatika</span>
                    </NuxtLink>
                </div>
                <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
                    <CoreColorModeToggle />
                    <CoreDropdown name="user">
                        <template v-slot:trigger>
                            <span class="sr-only">Open user menu</span>
                            <div class="relative w-8 h-8 overflow-hidden rounded-full">
                                <img :src="user?.profile.avatar || '/img/profile-blank.png'"
                                    class="absolute object-cover h-full shadow-md" />
                            </div>
                        </template>
                        <template v-slot:body>
                            <div class="px-4 py-3">
                                <span class="block text-sm text-gray-900 dark:text-white">{{ user?.username }}</span>
                                <span class="block text-sm text-gray-500 truncate dark:text-gray-400">{{
                                    user?.profile.email
                                    }}</span>
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
                                        class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-gray-200 dark:hover:text-white">Settings</NuxtLink>
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
            <div class="min-h-screen px-3 py-6 mx-auto sm:px-6 lg:px-8 dark:bg-gray-900">
                <slot />
                <div
                    class="fixed z-30 w-full h-16 max-w-lg -translate-x-1/2 bg-white rounded-full shadow-lg bottom-4 left-1/2 dark:bg-gray-700">
                    <div class="grid h-full max-w-lg grid-cols-5 mx-auto">
                        <NuxtLink to="/dashboard" data-tooltip-target="tooltip-home"
                            class="inline-flex flex-col items-center justify-center px-5 rounded-s-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
                            <Icon name="solar:home-2-bold"
                                class="w-6 h-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                            <span class="sr-only">Home</span>
                        </NuxtLink>
                        <div id="tooltip-home" role="tooltip"
                            class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                            Home
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <NuxtLink to="/dashboard/events" data-tooltip-target="tooltip-events"
                            class="inline-flex flex-col items-center justify-center px-5 hover:bg-gray-50 dark:hover:bg-gray-800 group">
                            <Icon name="solar:calendar-bold"
                                class="w-6 h-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                            <span class="sr-only">Events</span>
                        </NuxtLink>
                        <div id="tooltip-events" role="tooltip"
                            class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                            Events
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <div class="relative">
                            <button data-dropdown-toggle="dropdown-tools" data-tooltip-target="tooltip-tool"
                                type="button"
                                class="absolute inline-flex items-center justify-center w-20 h-20 font-medium transition-transform duration-200 ease-in-out bg-gray-700 rounded-full shadow-md bottom-2 hover:bg-gray-700 hover:scale-125 group focus:ring-4 focus:ring-gray-300 focus:outline-none dark:focus:ring-gray-800 dark:hover:bg-gray-500 hover:bottom-4 hover:shadow-lg">
                                <Icon name="solar:command-bold" class="w-6 h-6 text-gray-100" />
                                <span class="sr-only">Tools</span>
                            </button>
                            <!-- Dropdown menu -->
                            <div id="dropdown-tools"
                                class="z-50 hidden bg-white border border-gray-200 divide-y divide-gray-100 rounded-lg shadow-lg w-44 dark:bg-gray-700">
                                <ul class="py-4 text-gray-700 text-md dark:text-gray-200"
                                    aria-labelledby="dropdownDefaultButton">
                                    <li>
                                        <NuxtLink to="/tools/activity-letter"
                                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            Activity Letter</NuxtLink>
                                    </li>
                                    <li>
                                        <NuxtLink to="/tools/collegers"
                                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            Collegers Data</NuxtLink>
                                    </li>
                                    <li>
                                        <NuxtLink to="/tools/administrator"
                                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            Administrators</NuxtLink>
                                    </li>
                                    <li>
                                        <NuxtLink to="/tools/departement"
                                            class="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white">
                                            Departement</NuxtLink>
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
                            <Icon name="solar:programming-bold"
                                class="w-6 h-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                            <span class="sr-only">Projects</span>
                        </NuxtLink>
                        <div id="tooltip-projects" role="tooltip"
                            class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                            Projects
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                        <NuxtLink to="/dashboard/profile" data-tooltip-target="tooltip-profile"
                            class="inline-flex flex-col items-center justify-center px-5 rounded-e-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
                            <Icon name="solar:user-bold"
                                class="w-6 h-6 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200" />
                            <span class="sr-only">Profile</span>
                        </NuxtLink>
                        <div id="tooltip-profile" role="tooltip"
                            class="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 bg-gray-900 rounded-lg shadow-sm opacity-0 tooltip dark:bg-gray-700">
                            Profile
                            <div class="tooltip-arrow" data-popper-arrow></div>
                        </div>
                    </div>
                </div>
                <CoreFooter />
            </div>
        </main>
    </div>
</template>
<style scoped></style>