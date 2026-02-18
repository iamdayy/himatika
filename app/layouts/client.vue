<script setup lang='ts'>
// Import necessary types
import type { DropdownMenuItem, NavigationMenuItem } from "#ui/types";
import type { IConfigResponse } from "~~/types/IResponse";
// Set up authentication
const { status, data: user, signOut } = useAuth();
const { $switchLocale, $getLocale, $ts } = useI18n();
const { data: dataConfig } = useFetch<IConfigResponse>('/api/config', {
    key: 'config-state',
    lazy: false,
    server: true,
});
const configs = computed(() => dataConfig.value?.data);
const isLoggedIn = computed(() => status.value === 'authenticated' || (status.value === 'loading' && !!user.value));
const config = useRuntimeConfig();
// Set up color mode
const colorMode = useColorMode();
const isDarkMode = computed({
    get: () => colorMode.value === 'dark',
    set: () => colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark',
});

// UI state
const isOpen = ref<boolean>(false);


// Navigation links
const navigation = computed<NavigationMenuItem[]>(() => [
    { label: $ts('home'), to: '/' },
    { label: $ts('agenda'), to: '/agendas' },
    { label: $ts('project'), to: '/projects' },
    { label: $ts('news'), to: '/news' },
    { label: $ts('gallery'), to: '/gallery' },
    {
        label: $ts('signature'), children: [
            { label: $ts('scan'), to: '/signatures/scan' },
            { label: $ts('signature'), to: '/signatures' },
        ]
    }
])

/**
 * @returns An array of dropdown item groups
 */
const userData = computed(() => {
    const u = user.value as any;
    return {
        username: u?.username || u?.guest?.fullName || 'User',
        avatar: u?.member?.avatar || u?.guest?.avatar || '/img/profile-blank.png',
    }
});

const itemsIsLogged = computed<DropdownMenuItem[][]>(() => [
    [{
        label: userData.value.username,
        slot: 'account' as const,
        disabled: true
    }],
    [
        ...((user.value as any)?.guest ? [] : [{
            label: $ts('profile'),
            icon: 'i-heroicons-user',
            to: '/profile'
        }])
    ],
    [{
        label: $ts('dashboard'),
        icon: 'i-heroicons-rectangle-group',
        to: (user.value as any)?.guest ? '/guest/dashboard' : '/dashboard'
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
        color: 'error',
        onSelect: () => signOut({ callbackUrl: '/login' }),
        icon: 'i-heroicons-arrow-right-start-on-rectangle'
    }]
]) satisfies ComputedRef<DropdownMenuItem[][]>;

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
]) satisfies ComputedRef<DropdownMenuItem[][]>;

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
const items = computed(() => isLoggedIn.value ? itemsIsLogged.value : itemsNotLogged.value) satisfies ComputedRef<DropdownMenuItem[][]>;
// Set up the head with a dynamic title template
useHead({
    titleTemplate(title) {
        return title ? `${title} | ${config.public.appname}` : configs.value?.name || config.public.appname;
    },
});
</script>
<template>
    <div class="min-h-full">
        <nav
            class="fixed z-30 w-full border-gray-200 md:border-none bg-secondary-light/60 dark:bg-secondary-dark/20 backdrop-blur-sm">
            <div class="flex flex-wrap items-center justify-between p-4 mx-auto">
                <!-- Logo or back button -->
                <NuxtLink to="/" class="items-center hidden space-x-3 md:flex rtl:space-x-reverse">
                    <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo" format="webp"
                        preload />
                </NuxtLink>


                <!-- Mobile slideover menu -->
                <USlideover v-model="isOpen" side="left" close-icon="i-heroicons-chevron-left">
                    <!-- Mobile menu button -->
                    <UButton @click="isOpen = !isOpen" icon="i-heroicons-bars-3-center-left" class="block md:hidden"
                        variant="link" color="neutral" />
                    <template #title>
                        <NuxtLink to="/" class="items-center space-x-3 md:flex rtl:space-x-reverse">
                            <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo" format="webp"
                                preload />
                        </NuxtLink>
                    </template>
                    <template #body>
                        <UNavigationMenu orientation="vertical" :items="navigation"
                            class="data-[orientation=vertical]:w-48" />
                    </template>
                </USlideover>

                <!-- User menu and theme toggle -->
                <div class="flex items-center space-x-3 md:order-2 md:space-x-0 rtl:space-x-reverse">
                    <!-- Language Dropdown -->
                    <UDropdownMenu :items="languages" :popper="{ placement: 'bottom-start' }">
                        <UButton icon="i-heroicons-language" variant="ghost" class="rounded-full" color="neutral" />
                    </UDropdownMenu>
                    <!-- Theme toggle -->
                    <UButton :icon="isDarkMode ? 'i-lucide-moon' : 'i-lucide-sun'"
                        :color="isDarkMode ? 'neutral' : 'primary'" variant="ghost" class="rounded-full"
                        @click="isDarkMode = !isDarkMode" />
                    <UDropdownMenu :items="items" :content="{ side: 'bottom' }">
                        <NuxtImg v-if="isLoggedIn" provider="localProvider" :src="userData.avatar"
                            class="object-cover rounded-full max-w-8 aspect-square" format="webp" preload
                            alt="Profile" />
                        <UButton v-else icon="i-heroicons-arrow-right-end-on-rectangle" variant="ghost"
                            class="rounded-full" color="neutral" />

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

                <!-- Desktop navigation menu -->
                <div class="items-center justify-between hidden w-full md:flex md:w-auto md:order-1" id="navbar-user">
                    <UNavigationMenu :items="navigation" highlight />
                </div>
            </div>
        </nav>
        <main>
            <div class="px-2 py-6 pt-24 mx-auto md:px-8">
                <UContainer class="py-16">
                    <slot />
                </UContainer>
                <Footer />
            </div>
        </main>
    </div>
</template>
<style scoped>
.switch {
    --width-of-switch: 3.5em;
    --height-of-switch: 2em;
    --size-of-icon: 1.4em;
    --slider-offset: 0.3em;
    position: relative;
    width: var(--width-of-switch);
    height: var(--height-of-switch);
}

.switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #f4f4f5;
    transition: .4s;
    border-radius: 30px;
}

.slider:before {
    position: absolute;
    content: "";
    height: var(--size-of-icon, 1.4em);
    width: var(--size-of-icon, 1.4em);
    border-radius: 20px;
    left: var(--slider-offset, 0.3em);
    top: 50%;
    transform: translateY(-50%);
    background: linear-gradient(40deg, #ff0080, #ff8c00 70%);
    transition: .4s;
}

input:checked+.slider {
    background-color: #303136;
}

input:checked+.slider::before {
    left: calc(100% - (var(--size-of-icon, 1.4em) + var(--slider-offset, 0.3em)));
    background: #303136;
    box-shadow: inset -3px -2px 5px -2px #8983f7, inset -10px -4px 0 0 #a3dafb;
}
</style>