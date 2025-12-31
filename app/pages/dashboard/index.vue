<script setup lang='ts'>
import type { ICategory, IMember } from "~~/types";

import { ModalsAchievementClaim, ModalsActions, NuxtImg, NuxtLink, UAvatar } from '#components';
import type { TableColumn } from "#ui/types";
import type { DriveStep } from "driver.js";
import { useStatsStore } from "~/stores/useStatsStore";
import type { IProjectsResponse } from "~~/types/IResponse";
interface IPoint {
    avatar?: string;
    fullName: string;
    NIM: number;
    semester?: number;
    point?: { point: number }[]; // Ensure point is an array of objects with a 'point' property
    no: number;
}
const { $ts, $switchLocale, $getLocale } = useI18n();
const router = useRouter();
/**
 * Set page metadata
 */
definePageMeta({
    layout: 'dashboard',
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
                h(NuxtImg, { src: row.original.avatar || '/img/profile-blank.png', size: 'sm', provider: 'localProvider', class: "object-cover rounded-full max-w-8 aspect-square", loading: 'lazy', alt: row.original.fullName }),
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
const statsStore = useStatsStore();
await useAsyncData('dashboard-stats', async () => {
    await statsStore.init();
    return true; // Return sesuatu agar useAsyncData tahu proses selesai
});
const { agendasMe, projectsMe, agendasCanMeRegistered, points, aspirations } = storeToRefs(statsStore);
const { data } = useAsyncData('projects', () => $api<IProjectsResponse>('/api/project'), {
    transform: (data) => ({
        data: data.data?.projects || [],
        count: data.data?.length || 0
    })
})
const toast = useToast();
const overlay = useOverlay();
const { width } = useWindowSize();
const { links } = useDashboardNavigation();
const { data: configData } = useAsyncData(() => $api('/api/config'));



/**
 * Get authentication data
 */
const { status, data: user } = useAuth();
const isMobile = computed(() => width.value < 768);


const ClaimAchievementModal = overlay.create(ModalsAchievementClaim);
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
                label: 'Register Agenda',
                color: 'success',
                to: '/agendas',
                variant: 'solid'
            },
            {
                label: 'Claim Achievement',
                color: 'primary',
                variant: 'solid',
                onClick: () => {
                    ClaimAchievementModal.open({
                        onSuccess: () => {
                            // Refresh stats after successful claim
                            statsStore.init();
                        }
                    });
                }
            }
        ]
    });
};

/**
 * Reference to the carousel component
 */
const carouselRef = ref()

/**
 * Set up carousel auto-rotation
 */
onMounted(() => {
    setInterval(() => {
        if (!carouselRef.value) return;

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
        <UBreadcrumb :items="[{ label: 'Dashboard', icon: 'i-heroicons-home' }]" class="ms-4" />
        <div class="flex flex-col w-full mt-2 md:flex-row md:space-y-0 md:space-x-6">
            <div class="flex-col hidden w-full md:flex md:w-1/3 lg:w-1/4">
                <UCard class="flex-1 w-full overflow-auto text-wrap">
                    <template #header>
                        <NuxtLink to="/profile">
                            <div class="flex items-center w-full gap-6">
                                <NuxtImg provider="localProvider" :src="user?.member.avatar || '/img/profile-blank.png'"
                                    class="object-cover rounded-full max-w-16 lg:max-w-24 aspect-square" loading="lazy"
                                    :alt="user?.member.fullName || 'Profile Image'" />
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
                        <UProgress :model-value="(agendasMe?.committees?.length! + agendasMe?.members?.length!) || 0"
                            :max="agendasCanMeRegistered?.length || 100" indicator />
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
                        <UProgress :model-value="projectsMe.length || 0" :color="color" :max="data?.count || 100"
                            indicator />
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
                        <UProgress :model-value="Math.ceil(aspirations.length / 5) || 0"
                            :max="['Pasif!', 'Baik', 'Kritis!', 'Menyala 🔥']" :color="color" />
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
                    <UProgress :model-value="(user?.member.point[0]!.point || 0)"
                        :max="configData?.data.minPoint || 100" indicator />
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
                    v-slot="{ item }" arrows dots loop :autoplay="{ delay: 30000 }" next-icon="i-lucide-chevron-right"
                    prev-icon="i-lucide-chevron-left" :next="{
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

                        <span class="mt-4 text-sm text-gray-400 whitespace-nowrap dark:text-white">Accessbility</span>
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
                <UCard v-for="project, i in projectsMe.slice(0, 4)" :key="i" class="">
                    <template #header>
                        <div class="flex items-center justify-between mb-2">
                            <div class="flex items-center gap-2">
                                <UBadge :label="(project.category as ICategory).title" color="info" variant="solid" />
                                <UBadge v-if="project.progress === 100" color="success" variant="subtle" size="xs">
                                    Completed
                                </UBadge>
                                <UBadge v-else-if="project.progress === 0" color="error" variant="subtle" size="xs">Not
                                    Started
                                </UBadge>
                                <UBadge v-else color="info" variant="subtle" size="xs">Onprogress
                                </UBadge>
                            </div>
                            <UButton variant="link" :size="responsiveUISizes.button" color="neutral" :to="project.url"
                                icon="i-heroicons-arrow-top-right-on-square" />
                        </div>
                        <div class="max-w-md mx-auto overflow-hidden rounded-lg">
                            <NuxtImg provider="localProvider" :src="(project.image as string)" :alt="project.title"
                                class="object-cover w-full h-full" loading="lazy" />
                        </div>
                    </template>
                    <div class="space-y-2">
                        <NuxtLink :to="`/projects/${project._id}`" class="text-lg font-semibold">{{
                            project.title }}
                        </NuxtLink>
                        <div class="flex w-full gap-2">
                            <UBadge v-for="tag in project.tags" :key="tag" :label="tag" color="neutral" variant="soft"
                                size="xs" />
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
                    to="/agendas/scan" id="maido">
                    <UIcon name="i-heroicons-qr-code" class="w-16 h-16 text-white" />
                </UButton>
            </UTooltip>
        </div>
    </div>
</template>
<style scoped></style>