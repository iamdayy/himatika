<script setup lang='ts'>
import type { ICategory, ILeaderboard, IMember } from "~~/types";

import { ModalsAchievementClaim, ModalsActions, NuxtLink, UAvatar, UIcon } from '#components';
import type { TableColumn } from "#ui/types";
import { useStatsStore } from "~/stores/useStatsStore";
import type { IProjectsResponse } from "~~/types/IResponse";
const NuxtImg = resolveComponent('NuxtImg');
const UTooltip = resolveComponent('UTooltip');
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
    title: () => 'Home | Himatika ' + $ts('dashboard')
})

/**
 * Get authentication data
 */
const { status, data: user } = useAuth();
// Redirect guest to dashboard
if ((user.value as any)?.guest) {
    navigateTo('/guest/dashboard');
}
const { $pageGuide, $api } = useNuxtApp();

const config = useRuntimeConfig();

/**
 * Get user stats
 */
const statsStore = useStatsStore();
const { pending: pendingStats } = useLazyAsyncData('dashboard-stats', async () => {
    await statsStore.init();
    return true; // Return sesuatu agar useAsyncData tahu proses selesai
});
const { agendasMe, projectsMe, agendasCanMeRegistered, points, aspirations, memberProfile } = storeToRefs(statsStore);
const { data: projectsData, pending: pendingProjects } = useLazyAsyncData('dashboard-projects-list', () => $api<IProjectsResponse>('/api/project'), {
    transform: (data) => ({
        data: data.data?.projects || [],
        count: data.data?.length || 0
    })
})
const toast = useToast();
const overlay = useOverlay();
const { width } = useWindowSize();
const { links } = useDashboardNavigation();
const { data: configData, pending: pendingConfig } = useLazyAsyncData('config', () => $api('/api/config'));



const isMobile = computed(() => width.value < 768);

const recentAgendas = computed(() => {
    return [(agendasMe.value?.committees || []), (agendasMe.value?.members || [])].flat().slice(0, 3);
});

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
    // Autoplay is already handled by UCarousel prop :autoplay="{ delay: 30000 }"
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
});
</script>
<template>
    <div>
        <UBreadcrumb :items="[{ label: 'Dashboard', icon: 'i-heroicons-home' }]" class="ms-4" />
        
        <div v-if="pendingStats || pendingProjects || pendingConfig" class="flex flex-col w-full mt-2 md:flex-row md:space-y-0 md:space-x-6 items-start">
            <!-- Sidebar Skeleton -->
            <div class="flex-col hidden w-full md:flex md:w-1/3 lg:w-1/4 sticky top-24 self-start h-fit z-10">
                <UCard class="w-full">
                    <template #header>
                        <div class="flex items-center w-full gap-6">
                            <USkeleton class="w-16 h-16 rounded-full lg:w-24 lg:h-24" />
                            <div class="space-y-2">
                                <USkeleton class="h-6 w-32" />
                                <USkeleton class="h-4 w-24" />
                            </div>
                        </div>
                    </template>
                    <div class="space-y-4">
                        <USkeleton class="h-10 w-full" v-for="i in 6" :key="i" />
                    </div>
                </UCard>
            </div>
            
            <!-- Main Content Skeleton -->
            <div class="w-full space-y-6 md:w-2/3 lg:w-3/4">
                <!-- Stats Grid -->
                <div class="flex flex-col w-full gap-4 lg:flex-row">
                    <UCard class="w-full lg:w-1/3" v-for="i in 3" :key="i">
                        <template #header>
                            <USkeleton class="h-6 w-24" />
                        </template>
                        <div class="flex items-center justify-between w-full mb-2">
                            <USkeleton class="h-10 w-16" />
                            <USkeleton class="h-12 w-12 rounded-full" />
                        </div>
                        <USkeleton class="h-2 w-full mt-4" />
                    </UCard>
                </div>
                
                <!-- Point Card -->
                <UCard class="w-full">
                    <template #header>
                        <div class="flex justify-between w-full">
                            <USkeleton class="h-6 w-24" />
                            <USkeleton class="h-8 w-24" />
                        </div>
                    </template>
                    <div class="flex items-center justify-between w-full mb-2">
                        <USkeleton class="h-10 w-16" />
                        <USkeleton class="h-12 w-12 rounded-full" />
                    </div>
                    <USkeleton class="h-2 w-full mt-4" />
                    <template #footer>
                        <div class="space-y-4">
                            <USkeleton class="h-10 w-full" v-for="i in 3" :key="i" />
                        </div>
                    </template>
                </UCard>
                
                <!-- Bottom Skeleton -->
                <UCard class="w-full mt-8">
                    <template #header>
                        <div class="flex justify-between w-full">
                            <USkeleton class="h-6 w-24" />
                            <USkeleton class="h-6 w-16" />
                        </div>
                    </template>
                    <USkeleton class="h-32 w-full" />
                </UCard>
                
                <UCard class="w-full mt-8">
                    <template #header>
                        <div class="flex justify-between w-full">
                            <USkeleton class="h-6 w-24" />
                            <USkeleton class="h-6 w-16" />
                        </div>
                    </template>
                    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <USkeleton class="h-64 w-full" v-for="i in 4" :key="i" />
                    </div>
                </UCard>
            </div>
        </div>

        <div v-else>
            <div class="flex flex-col w-full mt-2 md:flex-row md:space-y-0 md:space-x-6 items-start">
            <div class="flex-col hidden w-full md:flex md:w-1/3 lg:w-1/4 sticky top-24 self-start h-fit z-10">
                <UCard class="flex-1 w-full overflow-auto text-wrap">
                    <template #header>
                        <NuxtLink to="/profile">
                            <div class="flex items-center w-full gap-6">
                                <NuxtImg provider="localProvider" :src="user?.member?.avatar || '/img/profile-blank.png'"
                                    class="object-cover rounded-full max-w-16 lg:max-w-24 aspect-square" loading="lazy"
                                    :alt="user?.member?.fullName || 'Profile Image'" />
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
                                            user?.member?.NIM }}
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
                <div class="flex flex-col w-full gap-4 lg:flex-row">
                    <UCard class="w-full lg:w-1/3" id="card-stat-agendas">
                        <template #header>
                            <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('agenda') }}</h2>
                        </template>
                        <div class="flex items-center justify-between w-full mb-2">
                            <h2 class="text-3xl text-gray-700 text-bold dark:text-gray-400">{{
                                (agendasMe?.committees?.length || 0) + (agendasMe?.members?.length || 0)
                                }}</h2>
                            <UIcon name="i-heroicons-calendar" class="text-6xl" />
                        </div>
                        <UProgress :model-value="(agendasMe?.committees?.length || 0) + (agendasMe?.members?.length || 0)"
                            :max="agendasCanMeRegistered?.length || 100" indicator />
                    </UCard>
                    <UCard class="w-full lg:w-1/3" id="card-stat-projects">
                        <template #header>
                            <h2 class="text-xl font-semibold dark:text-gray-200">{{ $ts('project') }}</h2>
                        </template>
                        <div class="flex items-center justify-between w-full mb-2">
                            <h2 class="text-3xl text-gray-700 text-bold dark:text-gray-400">{{
                                projectsMe.length
                                }}</h2>
                            <UIcon name="i-heroicons-code-bracket" class="text-6xl" />
                        </div>
                        <UProgress :model-value="projectsMe?.length || 0" color="primary" :max="projectsData?.count || 100"
                            indicator />
                    </UCard>
                    <UCard class="w-full lg:w-1/3" id="card-stat-aspirations">
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
                            (memberProfile?.point || [])?.find((p) => p.semester === memberProfile?.semester)?.point || 0}}
                        </h2>
                        <UIcon name="i-heroicons-arrow-trending-up" class="text-6xl" />
                    </div>
                    <UProgress
                        :model-value="((memberProfile?.point || [])?.find((p) => p.semester === memberProfile?.semester)?.point || 0)"
                        :max="configData?.data.minPoint || 100" indicator />
                    <template #footer>
                        <div class="flex flex-col gap-2 w-full pt-4">
                            <div v-for="(userPoint, index) in points" :key="userPoint.nim" 
                                class="flex items-center justify-between p-3 sm:p-4 rounded-2xl transition-all duration-300 border border-transparent"
                                :class="[
                                    user?.member?.NIM === userPoint.nim 
                                        ? 'bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-200 dark:ring-primary-800 shadow-sm border-primary-100 dark:border-primary-800/50 relative overflow-hidden' 
                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:border-gray-200 dark:hover:border-gray-700 bg-white dark:bg-gray-900 shadow-sm ring-1 ring-gray-100 dark:ring-gray-800'
                                ]"
                            >
                                <!-- Glow effect for "Me" -->
                                <div v-if="user?.member?.NIM === userPoint.nim" class="absolute -left-1 top-0 bottom-0 w-2 bg-primary-500 dark:bg-primary-400 rounded-r-md"></div>

                                <div class="flex items-center gap-3 sm:gap-4 pl-2">
                                    <!-- Rank Badge -->
                                    <div class="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full font-bold text-sm shadow-inner"
                                        :class="{
                                            'bg-gradient-to-br from-yellow-300 to-yellow-500 text-white ring-2 ring-yellow-200 dark:ring-yellow-700 shadow-yellow-200/50': userPoint.number === 1,
                                            'bg-gradient-to-br from-gray-200 to-gray-400 text-gray-800 ring-2 ring-gray-100 dark:ring-gray-600': userPoint.number === 2,
                                            'bg-gradient-to-br from-orange-300 to-orange-500 text-white ring-2 ring-orange-200 dark:ring-orange-800': userPoint.number === 3,
                                            'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400': userPoint.number > 3
                                        }"
                                    >
                                        <UIcon v-if="userPoint.number === 1" name="i-heroicons-trophy-20-solid" class="w-5 h-5" />
                                        <span v-else class="text-base">{{ userPoint.number }}</span>
                                    </div>
                                    
                                    <!-- User Info -->
                                    <NuxtLink :to="`/profile/${userPoint.nim}`" class="flex items-center gap-3 group">
                                        <NuxtImg :src="userPoint.avatar || '/img/profile-blank.png'" :alt="userPoint.fullName" class="w-10 h-10 sm:w-12 sm:h-12 object-cover rounded-full ring-2 ring-white dark:ring-gray-800 shadow-sm group-hover:ring-primary-200 transition-all duration-300" provider="localProvider" loading="lazy" />
                                        <div class="flex flex-col">
                                            <span class="font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors text-sm sm:text-base truncate max-w-[120px] sm:max-w-[180px]">{{ userPoint.fullName }}</span>
                                            <span class="text-xs font-medium text-gray-500 dark:text-gray-400">{{ userPoint.nim }}</span>
                                        </div>
                                    </NuxtLink>
                                </div>
                                
                                <div class="flex items-center gap-4 sm:gap-6">
                                    <!-- Badges -->
                                    <div class="hidden sm:flex items-center -space-x-2" v-if="userPoint.badges?.length">
                                        <UTooltip v-for="badge in userPoint.badges.slice(0, 3)" :key="badge._id" :text="badge.name">
                                            <div class="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center ring-2 ring-gray-100 dark:ring-gray-700 shadow-sm z-10 hover:z-20 hover:scale-110 transition-transform">
                                                <UIcon :name="badge.icon || 'i-heroicons-star-20-solid'" class="w-4 h-4 text-primary-500" />
                                            </div>
                                        </UTooltip>
                                        <div v-if="userPoint.badges.length > 3" class="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center ring-2 ring-white dark:ring-gray-900 shadow-sm z-0">
                                            <span class="text-[10px] font-bold text-gray-600 dark:text-gray-300">+{{ userPoint.badges.length - 3 }}</span>
                                        </div>
                                    </div>
                                    
                                    <!-- Points -->
                                    <div class="text-right flex flex-col justify-center">
                                        <span class="font-mono text-xl sm:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-primary-400 dark:from-primary-400 dark:to-primary-200">{{ userPoint.points || 0 }}</span>
                                        <span class="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider -mt-1">Points</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </UCard>
                
                <UCard class="w-full mt-8" id="card-list-agendas">
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
                            :items="recentAgendas"
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
                <UCard class="w-full mt-8" id="card-list-projects">
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
                                        <UBadge :label="(project.category as ICategory)?.title || 'Uncategorized'" color="info" variant="solid" />
                                        <UBadge v-if="project.progress === 100" color="success" variant="subtle" size="xs">
                                            Completed
                                        </UBadge>
                                        <UBadge v-else-if="project.progress === 0" color="neutral" variant="subtle" size="xs">Not
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
            </div>
        </div>
        </div>
        <div class="fixed z-90 bottom-6 right-6">
            <UTooltip text="Scan to Presence!" placement="left"
                :popper="{ strategy: 'absolute', scroll: true, arrow: true }">
                <UButton
                    class="flex items-center justify-center w-20 h-20 text-4xl text-white duration-300 bg-blue-600 rounded-full drop-shadow-lg hover:bg-blue-700 hover:drop-shadow-lg hover:animate-bounce"
                    to="/agendas/scan" id="maido">
                    <UIcon name="i-heroicons-qr-code" class="w-16 h-16 text-white" />
                </UButton>
            </UTooltip>
        </div>
    </div>
</template>
<style scoped></style>