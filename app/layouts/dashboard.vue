<script setup lang='ts'>
import type { DropdownMenuItem } from '#ui/types';

/**
 * Authentication management
 */
const { status, data: user, signOut } = useAuth();


const config = useRuntimeConfig();

/**
 * Computed properties for authentication and color mode
 */
const isLoggedIn = computed(() => status.value === 'authenticated');
const isDarkMode = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: 'light',
});
const { links } = useDashboardNavigation();
const { $ts, $switchLocale, $getLocale } = useI18n();

/**
 * Generate dropdown items for logged-in users
 * @param user - The logged-in user
 * @returns An array of dropdown item groups
 */
const itemsIsLogged = computed<DropdownMenuItem[][]>(() => [
    [{
        label: user.value?.username || '',
        slot: 'account' as const,
        disabled: true
    }],
    [{
        label: $ts('profile'),
        icon: 'i-heroicons-user',
        to: '/profile'
    }],
    [{
        label: $ts('dashboard'),
        icon: 'i-heroicons-rectangle-group',
        to: '/dashboard'
    }, {
        label: $ts('agenda'),
        icon: 'i-heroicons-calendar',
        to: '/dashboard/agendas'
    }, {
        label: $ts('project'),
        icon: 'i-heroicons-code-bracket',
        to: '/dashboard/projects'
    },
    {
        label: $ts('aspiration'),
        icon: 'i-heroicons-clipboard-document-list',
        to: '/dashboard/aspirations'
    }],
    [{
        label: $ts('logout'),
        class: 'hover:bg-red-50 hover:dark:bg-red-500',
        onSelect: () => signOut({ callbackUrl: '/login' }),
        icon: 'i-heroicons-arrow-right-start-on-rectangle'
    }]
] satisfies DropdownMenuItem[][]);

// Dropdown items for non-logged-in users
const itemsNotLogged = computed<DropdownMenuItem[][]>(() => [
    [
        {
            label: $ts('login'),
            to: '/login'
        },
        {
            label: $ts('register'),
            to: '/register'
        }
    ]
])

const languages = computed<DropdownMenuItem[][]>(() => [
    [
        {
            label: 'English',
            icon: 'i-heroicons-globe',
            disabled: $getLocale() === 'en',
            onSelect: () => $switchLocale('en')
        },
        {
            label: 'Indonesia',
            icon: 'i-heroicons-globe',
            disabled: $getLocale() === 'id',
            onSelect: () => $switchLocale('id')
        }
    ]
])

// Computed property to determine which items to show based on login status
const items = computed(() => (isLoggedIn.value ? itemsIsLogged.value : itemsNotLogged.value) satisfies DropdownMenuItem[][]);

/**
 * Set up page head with dynamic title
 */
useHead({
    titleTemplate(title) {
        return title ? `${title} | ${config.public.appname} Dashboard` : `${config.public.appname} Dashboard`;
    },
});

/**
 * Slide-over state
 */
const openSlideOver = ref<boolean>(false);
</script>

<template>
    <div class="min-h-full">
        <ClientOnly>
            <!-- Navigation bar -->
            <nav class="absolute z-10 w-full border-gray-200 md:border-none">
                <div class="flex flex-wrap items-center justify-between p-4 mx-auto">

                    <USlideover v-model:open="openSlideOver" :overlay="false" :title="'HIMAPP'" side="left">
                        <UButton variant="link" color="neutral" :padded="false" icon="i-heroicons-bars-3-center-left" />
                        <template #content>
                            <div class="flex-1 p-4">
                                <div class="flex flex-row items-center justify-between">
                                    <NuxtLink to="/" class="items-center space-x-3 md:flex rtl:space-x-reverse">
                                        <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo"
                                            loading="lazy" />
                                    </NuxtLink>
                                    <UButton color="neutral" variant="ghost" size="sm"
                                        icon="i-heroicons-x-mark-20-solid" square padded
                                        @click="openSlideOver = false" />
                                </div>
                                <div class="mt-8">
                                    <NuxtLink to="/profile">
                                        <div class="flex items-center w-full gap-2">
                                            <NuxtImg provider="localProvider"
                                                :src="user?.member.avatar || '/img/profile-blank.png'"
                                                class="object-cover rounded-full max-w-12 max-h-12 aspect-square"
                                                loading="lazy" alt="Profile" />
                                            <div class="overflow-ellipsis">
                                                <h2 class="text-xl font-bold text-gray-800 dark:text-gray-100">{{
                                                    user?.username
                                                }}
                                                </h2>
                                                <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{
                                                    user?.member.NIM }}
                                                </h2>
                                            </div>
                                        </div>
                                    </NuxtLink>
                                    <UNavigationMenu :items="links" orientation="vertical" highlight />
                                </div>
                            </div>
                        </template>
                    </USlideover>
                    <!-- Mobile menu button -->
                    <!-- User actions -->
                    <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
                        <!-- Language dropdown -->
                        <UDropdownMenu :items="languages" :popper="{ placement: 'bottom-start' }">
                            <UButton icon="i-heroicons-language" variant="link" color="neutral" />
                        </UDropdownMenu>
                        <!-- Dark mode toggle -->
                        <button id="theme-toggle" type="button" @click="isDarkMode = !isDarkMode"
                            class="text-gray-500 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-100 focus:outline-none rounded-lg text-sm p-2.5">
                            <svg v-if="isDarkMode" id="theme-toggle-light-icon" class="w-5 h-5" fill="currentColor"
                                viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                                    fill-rule="evenodd" clip-rule="evenodd"></path>
                            </svg>
                            <svg v-else id="theme-toggle-dark-icon" class="w-5 h-5" fill="currentColor"
                                viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                            </svg>
                        </button>

                        <!-- User dropdown -->
                        <UDropdownMenu :items="items">
                            <NuxtImg v-if="isLoggedIn" provider="localProvider"
                                :src="user?.member.avatar || '/img/profile-blank.png'"
                                class="object-cover rounded-full max-w-8 aspect-square" loading="lazy" alt="Profile" />
                            <UAvatar v-else icon="i-heroicons-arrow-right-end-on-rectangle" />

                            <template #account="{ item }">
                                <div class="text-left">
                                    <p>
                                        {{ $ts('signed_as') }}
                                    </p>
                                    <p class="font-medium text-gray-900 truncate dark:text-white">
                                        {{ item.label }}
                                    </p>
                                </div>
                            </template>

                            <template #item="{ item }">
                                <NuxtLink :to="item.to">
                                    <UIcon :name="item.icon" v-if="item.icon"
                                        class="flex-shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500 ms-auto me-2" />
                                    <span class="truncate">{{ item.label }}</span>
                                </NuxtLink>
                            </template>
                        </UDropdownMenu>

                    </div>
                </div>
            </nav>
        </ClientOnly>

        <!-- Main content -->
        <main class="px-8 py-6 pt-12 mx-auto md:px-12 lg:px-28">
            <UContainer class="py-16">
                <slot />
            </UContainer>
            <Footer />
        </main>
    </div>
</template>

<style scoped></style>