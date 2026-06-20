<script setup lang='ts'>
import type { DropdownMenuItem } from '#ui/types';

/**
 * Authentication management
 */
const { status, data: user, signOut } = useAuth();
const route = useRoute();

const config = useRuntimeConfig();

/**
 * Computed properties for authentication and color mode
 */
const isLoggedIn = computed(() => status.value === 'authenticated' || (status.value === 'loading' && !!user.value));
const isDarkMode = useDark({
    selector: 'html',
    attribute: 'class',
    valueDark: 'dark',
    valueLight: 'light',
});
const { links } = useDashboardNavigation();
const { $ts, $switchLocale, $getLocale } = useI18n();
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);
/**
 * @returns An array of dropdown item groups
 */
const userData = computed(() => {
    const u = user.value as any;
    return {
        username: u?.username || u?.guest?.fullName || 'User',
        avatar: u?.member?.avatar || u?.guest?.avatar || '/img/profile-blank.png',
        identifier: u?.member?.NIM || u?.guest?.email || '',
        isGuest: !!u?.guest
    }
});

const itemsIsLogged = computed<DropdownMenuItem[][]>(() => [
    [{
        label: userData.value.username,
        slot: 'account' as const,
        disabled: true
    }],
    [
        ...(userData.value.isGuest ? [] : [{
            label: $ts('profile'),
            icon: 'i-heroicons-user',
            to: '/profile'
        }])
    ],
    [{
        label: $ts('dashboard'),
        icon: 'i-heroicons-rectangle-group',
        to: userData.value.isGuest ? '/guest/dashboard' : '/dashboard'
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
        <!-- Navigation bar -->
        <nav class="absolute z-10 w-full border-gray-200 md:border-none">
            <div class="flex flex-wrap items-center justify-between p-4 mx-auto">

                <USlideover v-model:open="openSlideOver" :overlay="false" :title="'HIMAPP'" side="left"
                    v-if="(!route.fullPath.includes('/guest') && route.fullPath !== '/dashboard') || isMobile">
                    <UButton variant="link" color="neutral" :padded="false" icon="i-heroicons-bars-3-center-left"
                        aria-label="Open menu" />
                    <template #content>
                        <div class="flex-1 p-4">
                            <div class="flex flex-row items-center justify-between">
                                <NuxtLink to="/" class="items-center space-x-3 md:flex rtl:space-x-reverse">
                                    <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo"
                                        loading="lazy" />
                                </NuxtLink>
                                <UButton color="neutral" variant="ghost" size="sm" icon="i-heroicons-x-mark-20-solid"
                                    square padded @click="openSlideOver = false" aria-label="Close menu" />
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
                <NuxtLink to="/" class="items-center hidden space-x-3 md:flex rtl:space-x-reverse" v-else>
                    <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo" loading="lazy" />
                </NuxtLink>
                <!-- Mobile menu button -->
                <!-- User actions -->
                <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
                    <!-- Language dropdown -->
                    <UDropdownMenu :items="languages" :popper="{ placement: 'bottom-start' }" :modal="false">
                        <UButton icon="i-heroicons-language" variant="link" color="neutral" />
                    </UDropdownMenu>
                    <!-- Dark mode toggle -->
                    <UButton id="theme-toggle" @click="isDarkMode = !isDarkMode"
                        :icon="isDarkMode ? 'i-heroicons-moon-20-solid' : 'i-heroicons-sun-20-solid'" color="neutral"
                        variant="ghost" aria-label="Toggle theme">
                    </UButton>

                    <!-- User dropdown -->
                    <UDropdownMenu :items="items" :modal="false">
                        <NuxtImg v-if="isLoggedIn" provider="localProvider" :src="userData.avatar"
                            class="object-cover rounded-full max-w-8 aspect-square" loading="lazy" alt="Profile" />
                        <UAvatar v-else icon="i-heroicons-arrow-right-end-on-rectangle" />

                        <template #account="{ item }">
                            <div class="text-left">
                                <p>
                                    {{ $ts('signed_as') }}
                                </p>
                                <p class="font-medium text-gray-900 truncate dark:text-white">
                                    {{ (item as any).label }}
                                </p>
                            </div>
                        </template>

                        <template #item="{ item }">
                            <NuxtLink :to="item.to">
                                <UIcon :name="item.icon" v-if="item.icon"
                                    class="shrink-0 w-4 h-4 text-gray-400 dark:text-gray-500 ms-auto me-2" />
                                <span class="truncate">{{ item.label }}</span>
                            </NuxtLink>
                        </template>
                    </UDropdownMenu>

                </div>
            </div>
        </nav>

        <!-- Main content -->
        <UContainer class="py-16">
            <slot />
        </UContainer>
        <Footer />
    </div>
</template>

<style scoped></style>