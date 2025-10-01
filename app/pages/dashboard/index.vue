<script setup lang='ts'>
import type { ICategory, IMember } from "~~/types";

import { ModalsActions, ModalsQrReader, NuxtImg, NuxtLink, UAvatar } from '#components';
import type { TableColumn } from "#ui/types";
import type { DropdownMenuItem, NavigationMenuItem } from "@nuxt/ui";
import type { DriveStep } from "driver.js";
import type { IAgendaResponse, IProjectsResponse, IResponse } from "~~/types/IResponse";
interface IPoint {
    avatar?: string;
    fullName: string;
    NIM: number;
    semester?: number;
    point?: { point: number }[]; // Ensure point is an array of objects with a 'point' property
    no: number;
}
const config = useRuntimeConfig();
const { $ts, $switchLocale, $getLocale } = useI18n();
/**
 * Set page metadata
 */
definePageMeta({
    layout: false,
    middleware: 'sidebase-auth'
});

/**
 * Set page title
 */
useHead({
    title: 'Home | Himatika ' + $ts('dashboard')
})

const { $pageGuide, $api } = useNuxtApp();

const pointLeaderBoardColumn: TableColumn<IPoint>[] = [
    {
        accessorKey: 'rank',
        header: $ts('rank'),
        cell: ({ row }) => {
            return row.index + 1
        },
    },
    {
        accessorKey: 'fullName',
        header: $ts('fullName'),
        cell: ({ row }) => {
            return h(NuxtLink, { class: 'flex items-center gap-2', to: `/profile/${row.original.NIM}` }, [
                h(NuxtImg, { src: row.original.avatar || '/img/profile-blank.png', size: 'sm', provider: 'localProvider', class: "object-cover rounded-full max-w-8 aspect-square" }),
                h('div', undefined, [
                    h('p', { class: 'font-medium text-(--ui-text-highlighted)' }, row.original.fullName),
                    h('p', { class: '' }, `${row.original.NIM}`)
                ])
            ])
        },
    },
    {
        accessorKey: 'semester',
        header: $ts('semester'),
    },
    {
        accessorKey: 'point',
        header: $ts('point'),
        cell: ({ row }) => {
            if (!row.original.point || row.original.point.length === 0) {
                return h('span', {
                    class: 'text-sm font-semibold text-gray-600 dark:text-gray-200'
                }, '0');
            }
            return h('span', {
                class: 'text-sm font-semibold text-gray-600 dark:text-gray-200'
            }, row.original.point?.[0]?.point || '0');
        }
    }
]

/**
 * Get user stats
 */
const { agendasMe, projectsMe, agendasCanMeRegistered, points, aspirations, pointsRefresh } = useStats()
const { data } = useAsyncData('projects', () => $api<IProjectsResponse>('/api/projects'), {
    transform: (data) => ({
        data: data.data?.projects || [],
        count: data.data?.length || 0
    })
})
const toast = useToast();
const overlay = useOverlay();
const { width } = useWindowSize();
const { isOrganizer } = useOrganizer();
const { data: configData } = useAsyncData(() => $api('/api/config'));



/**
 * Get authentication data
 */
const { status, data: user, signOut } = useAuth();


/**
 * Check if user is logged in
 */
const isLoggedIn = computed(() => status.value === 'authenticated');

/**
 * Check if dark mode is enabled
 */
// Set up color mode
const colorMode = useColorMode();
const isDarkMode = computed({
    get: () => colorMode.value === 'dark',
    set: () => colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark',
});
const isMobile = computed(() => width.value < 768);

/**
 * Slide-over state
 */
const openSlideOver = ref<boolean>(false)

const QrReaderModal = overlay.create(ModalsQrReader);
const ActionsModal = overlay.create(ModalsActions);

/**
 * Open the actions modal
 */
const openModelActions = () => {
    ActionsModal.open({
        title: 'Add Point',
        body: 'Add your point here',
        actions: [
            {
                label: 'Scan Agenda Code',
                color: 'success',
                onClick: openQrReader,
                variant: 'solid'
            },
            {
                label: 'Register Agenda',
                color: 'success',
                to: '/agendas',
                variant: 'solid'
            }
        ]
    })
};

const openQrReader = () => {
    QrReaderModal.open({
        async getDataMethod(data: string) {
            try {
                const response = await $api<IAgendaResponse>(`/api/agenda`, {
                    query: {
                        id: data
                    }
                });
                return response.data?.agenda?.title;
            } catch (error: any) {
                toast.add({ title: $ts('error') });
            }
        },
        async onConfirm(data?: string) {
            if (!data) return;
            try {
                const response = await $api<IResponse>(`/api/agenda/${data}/visited`);
                toast.add({ title: response.statusMessage });
                pointsRefresh();
            } catch (error) {
                toast.add({ title: $ts('error') });
            } finally {
                QrReaderModal.close();
            }
        }
    })
};



/**
 * Generate dropdown items for logged-in users
 * @param user - The logged-in user
 * @returns An array of dropdown item groups
 */
const itemsIsLogged = computed<DropdownMenuItem[][]>(() => [
    [{
        label: user.value?.username || '',
        slot: 'account',
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
])

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
            onselect: () => $switchLocale('en')
        },
        {
            label: 'Indonesia',
            icon: 'i-heroicons-globe',
            disabled: $getLocale() === 'id',
            onselect: () => $switchLocale('id')
        }
    ]
])

// Computed property to determine which items to show based on login status
const items = computed(() => isLoggedIn.value ? itemsIsLogged.value : itemsNotLogged.value);

/**
 * Vertical navigation links
 */
const links = computed<NavigationMenuItem[][]>(() => {
    const links = [
        [
            {
                label: $ts('dashboard'),
                icon: 'i-heroicons-rectangle-group',
                to: '/dashboard'
            },
            {
                label: $ts('agenda'),
                icon: 'i-heroicons-calendar',
                to: '/dashboard/agendas'
            },
            {
                label: $ts('project'),
                icon: 'i-heroicons-code-bracket',
                to: '/dashboard/projects'
            },
            {
                label: $ts('aspiration'),
                icon: 'i-heroicons-clipboard-document-list',
                to: '/dashboard/aspirations'
            },
        ],
    ]
    if (isOrganizer.value) {
        links.push([
            {
                label: $ts('member'),
                icon: 'i-heroicons-users',
                to: '/administrator/members'
            },
            {
                label: $ts('organizer'),
                icon: 'i-heroicons-user-group',
                to: '/administrator/organizer'
            },
            {
                label: $ts('news'),
                icon: 'i-heroicons-clipboard-document-list',
                to: '/administrator/news'
            },
            {
                label: $ts('gallery'),
                icon: 'i-heroicons-photo',
                to: '/administrator/photos'
            },
            {
                label: $ts('signature'),
                icon: 'i-heroicons-finger-print',
                to: '/signatures'
            },
            {
                label: $ts('message'),
                icon: 'i-heroicons-archive-box',
                to: '/administrator/messages'
            },
            {
                label: $ts('config'),
                icon: 'i-heroicons-cog',
                to: '/administrator/config'
            },

        ])
    }
    return links;
})

/**
 * Reference to the carousel component
 */
const carouselRef = ref()

/**
 * Set up carousel auto-rotation
 */
onMounted(() => {
    setInterval(() => {
        if (!carouselRef.value) return

        if (carouselRef.value.page === carouselRef.value.pages) {
            return carouselRef.value.select(0)
        }

        carouselRef.value.next()
    }, 30000);
});

/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'sm' | 'xs' }>(() => ({
    button: isMobile.value ? 'xs' : 'sm',
    input: isMobile.value ? 'xs' : 'sm',
}));
const color = computed(() => {
    switch (true) {
        case aspirations.value.length < 10: return 'secondary'
        case aspirations.value.length < 20: return 'warning'
        case aspirations.value.length < 30: return 'info'
        default: return 'error'
    }
})
onMounted(() => {
    const steps: DriveStep[] = [
        {
            element: '#card-registered',
            popover: {
                title: 'Your total contributions',
                description: 'This card shows the total number of events participed in / project you have registered.',
                side: 'right'
            }
        },
        {
            element: '#card-agendas',
            popover: {
                title: 'Your total participed agendas',
                description: 'This card shows the total number of events you participated in.',
                side: 'right'
            }
        },
        {
            element: '#card-projects',
            popover: {
                title: 'Your total projects',
                description: 'This card shows the total number of projects you have',
                side: 'right'
            }
        },
        {
            element: '#maido',
            popover: {
                title: "Let's give us a Paidoan!🔥",
                description: 'Click this button to add your aspirationism to us',
                side: 'left'
            }
        }
    ]
    $pageGuide('dashboard', steps, {
        showProgress: true,
        showButtons: ['next', 'previous'],
    });
})
</script>
<template>
    <div>
        <ClientOnly>
            <nav
                class="absolute z-10 w-full border-gray-200 bg-white/15 md:bg-transparent backdrop-blur-md md:border-none">
                <div class="flex flex-wrap items-center justify-between p-4 mx-auto">
                    <NuxtLink to="/" class="items-center hidden space-x-3 md:flex rtl:space-x-reverse">
                        <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo" />
                    </NuxtLink>

                    <USlideover v-if="isMobile" v-model:open="openSlideOver" :overlay="false" :title="'HIMAPP'"
                        side="left">
                        <UButton variant="link" color="neutral" :padded="false" icon="i-heroicons-bars-3-center-left"
                            class="md:hidden" />
                        <template #content>
                            <div class="flex-1 p-4">
                                <div class="flex flex-row items-center justify-between">
                                    <NuxtLink to="/" class="items-center space-x-3 md:flex rtl:space-x-reverse">
                                        <NuxtImg provider="localProvider" src="/img/logo.png" class="h-8" alt="Logo" />
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
                                                class="object-cover rounded-full max-w-12 max-h-12 aspect-square" />
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
                    <div class="flex items-center gap-2 md:order-2 md:space-x-0 rtl:space-x-reverse">
                        <!-- Language Dropdown -->
                        <UDropdownMenu :items="languages" :popper="{ placement: 'bottom-start' }">
                            <UButton icon="i-heroicons-language" variant="ghost" class="rounded-full" color="neutral" />
                        </UDropdownMenu>
                        <UButton :icon="isDarkMode ? 'i-lucide-moon' : 'i-lucide-sun'"
                            :color="isDarkMode ? 'neutral' : 'primary'" variant="ghost" class="rounded-full"
                            @click="isDarkMode = !isDarkMode" />
                        <UDropdownMenu :items="items" :popper="{ placement: 'bottom-start' }">
                            <NuxtImg provider="localProvider" v-if="isLoggedIn"
                                :src="user?.member.avatar || '/img/profile-blank.png'"
                                class="object-cover rounded-full max-w-8 aspect-square" />
                            <UAvatar v-else icon="i-heroicons-arrow-right-end-on-rectangle" />

                            <template #item="{ item }">
                                <NuxtLink :to="item.to" class="">
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
        <main class="px-8 py-6 pt-12 mx-auto md:px-12 lg:px-28">
            <UContainer class="py-16">
                <UBreadcrumb :items="[{ label: 'Dashboard', icon: 'i-heroicons-home' }]" class="ms-4" />
                <div class="flex flex-col w-full mt-2 md:flex-row md:space-y-0 md:space-x-6">
                    <div class="flex-col hidden w-full md:flex md:w-1/3 lg:w-1/4">
                        <UCard class="flex-1 w-full overflow-auto text-wrap">
                            <template #header>
                                <NuxtLink to="/profile">
                                    <div class="flex items-center w-full gap-6">
                                        <NuxtImg provider="localProvider"
                                            :src="user?.member.avatar || '/img/profile-blank.png'"
                                            class="object-cover rounded-full max-w-16 lg:max-w-24 aspect-square" />
                                        <div>
                                            <h2
                                                class="text-lg font-semibold text-gray-800 lg:text-2xl lg:font-bold dark:text-gray-100">
                                                {{
                                                    user?.username
                                                }}
                                            </h2>
                                            <h2
                                                class="font-medium text-gray-800 text-md lg:text-lg lg:font-semibold dark:text-gray-200">
                                                {{
                                                    user?.member.NIM }}
                                            </h2>
                                        </div>
                                    </div>
                                </NuxtLink>
                            </template>
                            <UNavigationMenu :items="links" orientation="vertical" highlight>
                            </UNavigationMenu>
                        </UCard>
                    </div>
                    <div class="w-full space-y-6 md:w-2/3 lg:w-3/4">
                        <div class="flex flex-col w-full gap-2 lg:flex-row">
                            <UCard class="w-full lg:w-1/3" id="card-agendas">
                                <template #header>
                                    <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('agenda') }}</h2>
                                </template>
                                <div class="flex items-center justify-between w-full mb-2">
                                    <h2 class="text-3xl text-gray-700 text-bold dark:text-gray-400">{{
                                        (agendasMe?.committees?.length! + agendasMe?.members?.length!)
                                        }}</h2>
                                    <UIcon name="i-heroicons-calendar" class="text-6xl" />
                                </div>
                                <ClientOnly>
                                    <UProgress
                                        :model-value="(agendasMe?.committees?.length! + agendasMe?.members?.length!)"
                                        :max="agendasCanMeRegistered?.length" indicator />
                                </ClientOnly>
                            </UCard>
                            <UCard class="w-full lg:w-1/3" id="card-projects">
                                <template #header>
                                    <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('project') }}</h2>
                                </template>
                                <div class="flex items-center justify-between w-full mb-2">
                                    <h2 class="text-3xl text-gray-700 text-bold dark:text-gray-400">{{
                                        projectsMe.length
                                        }}</h2>
                                    <UIcon name="i-heroicons-code-bracket" class="text-6xl" />
                                </div>
                                <ClientOnly>
                                    <UProgress :model-value="projectsMe.length" :max="data?.count" indicator />
                                </ClientOnly>
                            </UCard>
                            <UCard class="w-full lg:w-1/3" id="card-projects">
                                <template #header>
                                    <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('aspiration') }}</h2>
                                </template>
                                <div class="flex items-center justify-between w-full mb-2">
                                    <h2 class="text-3xl text-gray-700 text-bold dark:text-gray-400">{{
                                        aspirations.length
                                        }}</h2>
                                    <UIcon name="i-heroicons-code-bracket" class="text-6xl" />
                                </div>
                                <ClientOnly>
                                    <UProgress :model-value="Math.ceil(aspirations.length / 5)"
                                        :max="['Pasif!', 'Baik', 'Kritis!', 'Menyala 🔥']" :color="color" />
                                </ClientOnly>
                            </UCard>
                        </div>
                        <UCard class="w-full" id="card-point">
                            <template #header>
                                <div class="flex justify-between w-full">
                                    <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('point') }}</h2>
                                    <UButton variant="solid" :size="responsiveUISizes.button" color="secondary"
                                        @click="openModelActions">
                                        Add Point
                                    </UButton>
                                </div>
                            </template>
                            <div class="flex items-center justify-between w-full mb-2">
                                <h2 class="text-3xl text-gray-700 text-bold dark:text-gray-400">{{
                                    user?.member.point[0]!.point || 0 }}
                                </h2>
                                <UIcon name="i-heroicons-arrow-trending-up" class="text-6xl" />
                            </div>
                            <ClientOnly>
                                <UProgress :model-value="(user?.member.point[0]!.point || 0)"
                                    :max="configData?.data.minPoint" />
                            </ClientOnly>
                            <template #footer>
                                <div class="flex items-center justify-between w-full">
                                    <UTable :columns="pointLeaderBoardColumn" :data="points" class="w-full" responsive>
                                    </UTable>
                                </div>
                            </template>
                        </UCard>
                    </div>
                </div>
                <UCard class="w-full mt-8" id="card-agendas">
                    <template #header>
                        <div class="flex justify-between w-full">
                            <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('agenda') }}</h2>
                            <NuxtLink to="/dashboard/agendas">
                                {{ $ts('see_more') }}...
                            </NuxtLink>
                        </div>
                    </template>
                    <div>
                        <UCarousel ref="carouselRef"
                            :items="[(agendasMe?.committees || []), (agendasMe?.members || [])].flat().slice(0, 3)"
                            v-slot="{ item }" arrows dots loop :autoplay="{ delay: 30000 }"
                            next-icon="i-lucide-chevron-right" prev-icon="i-lucide-chevron-left" :next="{
                                variant: 'ghost',
                                color: 'neutral',
                                size: 'md'
                            }" :prev="{
                                variant: 'ghost',
                                color: 'neutral',
                                size: 'md'
                            }" :ui="{
                                container: 'transition-[height]',
                                controls: 'absolute bottom-0 h-full inset-x-12',
                                dots: 'bottom-2',
                                arrows: 'w-full top-1/2 transform -translate-y-1/2 absolute',
                                dot: 'w-6 h-1'
                            }">
                            <div class="px-12">
                                <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Title</span>
                                <h3
                                    class="self-center font-semibold text-gray-500 ms-2 text-md whitespace-nowrap dark:text-white/60">
                                    {{
                                        item.title
                                    }}
                                </h3>

                                <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Date</span>
                                <h3
                                    class="self-center font-semibold text-gray-500 ms-2 text-md whitespace-nowrap dark:text-white/60">
                                    {{
                                        new Date(item.date.start as Date).toLocaleDateString() }}
                                </h3>

                                <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">At</span>
                                <h3
                                    class="self-center font-semibold text-gray-500 ms-2 text-md whitespace-nowrap dark:text-white/60">
                                    {{
                                        item.at
                                    }}
                                </h3>

                                <span
                                    class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Accessbility</span>
                                <h3
                                    class="self-center font-semibold text-gray-500 ms-2 text-md whitespace-nowrap dark:text-white/60">
                                    {{
                                        item.configuration.canSee
                                    }}
                                </h3>
                            </div>
                        </UCarousel>
                    </div>
                </UCard>
                <UCard class="w-full mt-8" id="card-projects">
                    <template #header>
                        <div class="flex justify-between w-full">
                            <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('project') }}</h2>
                            <NuxtLink to="/dashboard/projects">
                                {{ $ts('see_more') }}...
                            </NuxtLink>
                        </div>
                    </template>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <UCard v-for="project in projectsMe.slice(0, 4)" :key="project._id" class="">
                            <template #header>
                                <div class="flex items-center justify-between mb-2">
                                    <div class="flex items-center gap-2">
                                        <UBadge :label="(project.category as ICategory).title" color="info"
                                            variant="solid" />
                                        <UBadge v-if="project.progress === 100" color="success" variant="subtle"
                                            size="xs">
                                            Completed
                                        </UBadge>
                                        <UBadge v-else-if="project.progress === 0" color="error" variant="subtle"
                                            size="xs">Not
                                            Started
                                        </UBadge>
                                        <UBadge v-else color="info" variant="subtle" size="xs">Onprogress
                                        </UBadge>
                                    </div>
                                    <UButton variant="link" :size="responsiveUISizes.button" color="neutral"
                                        :to="project.url" icon="i-heroicons-arrow-top-right-on-square" />
                                </div>
                                <div class="max-w-md mx-auto overflow-hidden rounded-lg">
                                    <NuxtImg provider="localProvider" :src="(project.image as string)"
                                        :alt="project.title" class="object-cover w-full h-full" />
                                </div>
                            </template>
                            <div class="space-y-2">
                                <NuxtLink :to="`/projects/${project._id}`" class="text-lg font-semibold">{{
                                    project.title }}
                                </NuxtLink>
                                <div class="flex w-full gap-2">
                                    <UBadge v-for="tag in project.tags" :key="tag" :label="tag" color="neutral"
                                        variant="soft" size="xs" />
                                </div>
                                <div class="flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">
                                    <UIcon name="i-heroicons-calendar" />
                                    <h1>{{ new Date(project.date).toLocaleDateString('id-ID', {
                                        dateStyle:
                                            'long'
                                    }) }}
                                    </h1>
                                </div>
                                <UProgress :model-value="Math.ceil(project.progress / 20)"
                                    :color="project.progress === 100 ? 'success' : project.progress === 0 ? 'error' : 'secondary'"
                                    status
                                    :max="['Not Started', 'Starting', 'On Progress', 'On Progress', 'On Progress', 'Complete']" />
                            </div>
                            <template #footer>
                                <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-200">
                                    <div class="space-y-2 ">
                                        <h1 class="text-sm font-medium text-gray-600 dark:text-gray-300">
                                            published at: {{
                                                project.published ?
                                                    new Date(project.publishedAt!).toLocaleDateString('id-ID', {
                                                        dateStyle: 'long'
                                                    }) :
                                                    'not published'
                                            }}</h1>
                                        <UAvatarGroup size="xs" :max="3">
                                            <UAvatar v-for="member in project.members" :key="(member as IMember).NIM"
                                                :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                                        </UAvatarGroup>
                                    </div>
                                </div>
                            </template>
                        </UCard>
                    </div>
                </UCard>
                <div class="fixed z-90 bottom-6 left-4">
                    <UTooltip text="Scan to Presence!" placement="left"
                        :popper="{ strategy: 'absolute', scroll: true, arrow: true }">
                        <UButton
                            class="flex items-center justify-center w-20 h-20 text-4xl text-white duration-300 bg-blue-600 rounded-full drop-shadow-lg hover:bg-blue-700 hover:drop-shadow-2xl hover:animate-bounce"
                            @click="openQrReader" id="maido">
                            <UIcon name="i-heroicons-qr-code" class="w-16 h-16 text-white" />
                        </UButton>
                    </UTooltip>
                </div>
                <Footer />
            </UContainer>
        </main>
    </div>
</template>
<style scoped></style>