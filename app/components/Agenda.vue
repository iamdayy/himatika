<script setup lang='ts'>
import { useWindowSize } from '@vueuse/core';
import type { IAgenda, ICategory } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';
/**
 * Access the color mode of the application
 */

/**
 * Access the API instance from the Nuxt app
 */
const router = useRouter();
const { $api } = useNuxtApp();

/**
 * Computed property to determine if dark mode is active
 */
const isDarkMode = useDark();

/**
 * Fetch agendas data from the API
 */

const page = ref<number>(1);
const perPage = ref<number>(100);
const upcomingOnly = ref<boolean>(false);
const sort = ref<string>("");
const order = ref<string>("");
const {
    data: agendas,
    refresh: refreshAgendas,
    pending: pendingAgendas,
} = useLazyAsyncData(
    "agendas",
    () =>
        $api<IAgendaResponse>("/api/agenda", {
            query: {
                page: page.value,
                perPage: perPage.value,
                showMissed: !upcomingOnly.value,
                sort: sort.value,
                order: order.value,
            },
        }),
    {
        watch: [
            page,
            perPage,
            upcomingOnly,
            sort,
            order,
        ],
        transform: (data) => {
            if (data.statusCode !== 200) {
                return {
                    data: [],
                    length: 0,
                };
            }
            return {
                data: data.data?.agendas || [],
                length: data.data?.length,
            };
        },
        default: () => ({
            data: [],
            length: 0,
        }),
    }
);
// const { agendas, pendingAgendas, refreshAgendas, page, perPage, upcomingOnly, sort, order } = useAgendas();

const { $ts } = useI18n();



/**
 * Use VueUse's useWindowSize composable for responsive design
 */
const { width } = useWindowSize();

/**
 * Computed property to determine if the screen is mobile
 */
const isMobile = computed(() => width.value < 768);

/**
 * Computed property for responsive class names
 */
const responsiveClasses = computed(() => ({
    cardHeader: isMobile.value ? 'text-2xl text-center' : 'text-4xl',
    calendarWrapper: isMobile.value ? 'w-full' : 'w-1/3',
    eventDetailsWrapper: isMobile.value ? 'mt-4' : 'ml-4',
    eventTitle: isMobile.value ? 'text-xl' : 'text-2xl',
    listItem: isMobile.value ? 'text-sm' : 'text-base',
    icon: isMobile.value ? 'w-3 h-3' : 'w-4 h-4',
}));
const dropdownOptions = (agenda: IAgenda) => {
    const options = [
        [
            {
                label: $ts('view'),
                icon: 'i-heroicons-eye',
                click: () => router.push(`/agendas/${agenda?._id}`)
            },
            {
                label: $ts('copy_link'),
                icon: 'i-heroicons-clipboard',
                click: () => navigator.clipboard.writeText(`${window.location.origin}/agendas/${agenda?._id}`),
            },
            {
                label: $ts('share'),
                icon: 'i-heroicons-share',
                click: () => navigator.share({
                    title: agenda?.title,
                    text: agenda?.description,
                    url: `${window.location.origin}/agendas/${agenda?._id}`
                })
            },
        ]]
    return options;
};
const viewMode = ref<'grid' | 'list'>('grid');
function isRegistrationOpen(agenda: any): boolean {
    const now = new Date()
    const participantEnd = new Date(agenda.configuration.participant.canRegisterUntil.end)
    return now <= participantEnd
};

function formatDateRange(date: any): string {
    if (!date) return 'Date not set'

    const start = new Date(date.start)
    const end = new Date(date.end)

    const options: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric'
    }

    if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString('id-ID', { ...options, year: 'numeric' })
    }

    return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', { ...options, year: 'numeric' })}`
};

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount)
};
/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = useResponsiveUiSizes();
</script>

<template>
    <UCard>
        <template #header>
            <div class="flex items-center justify-between">
                <h2 :class="['font-extrabold dark:text-white', responsiveClasses.cardHeader]">{{ $ts('agenda') }}</h2>

                <USwitch @change="() => viewMode = viewMode === 'grid' ? 'list' : 'grid'" color="primary" size="xl"
                    checked-icon="i-lucide-list" unchecked-icon="i-lucide-layout-grid" :label="$ts('view')" />
            </div>
        </template>
        <div v-if="pendingAgendas || !agendas" class="flex items-center justify-center">
            <UProgress animate="carousel" v-if="pendingAgendas" />
            <UButton label="Refresh" v-else @click="refreshAgendas()" color="secondary" variant="ghost" size="lg">
                <template #trailing>
                    <UIcon name="i-heroicons-arrow-path" class="w-8 h-8" />
                </template>
            </UButton>
        </div>
        <div v-else>
            <!-- Grid View -->
            <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <NuxtLink v-for="agenda, i in agendas.data" :key="i" :to="`/agendas/${agenda._id}`">
                    <UCard class="hover:shadow-lg transition-shadow">
                        <template #header>
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <UBadge v-if="agenda?.category" color="secondary" variant="soft" size="xs">
                                            {{ (agenda.category as ICategory).title }}
                                        </UBadge>
                                        <UBadge v-if="isRegistrationOpen(agenda)" color="success" variant="soft"
                                            size="xs">
                                            {{ $ts('open') }}
                                        </UBadge>
                                    </div>
                                    <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-200 line-clamp-2">{{
                                        agenda.title }}</h3>
                                </div>
                            </div>
                        </template>

                        <div class="space-y-4">
                            <!-- Image -->
                            <div class="relative h-48 rounded-lg overflow-hidden">
                                <NuxtImg provider="localProvider"
                                    v-if="agenda.photos !== undefined && agenda.photos.length > 0"
                                    :src="(agenda.photos[0]!.image as string)" alt="Agenda Image"
                                    class="w-full h-full object-cover" />
                                <div v-else
                                    class="bg-gray-200 dark:bg-gray-700 w-full h-full flex items-center justify-center">
                                    <UIcon name="i-heroicons-photo"
                                        class="w-12 h-12 text-gray-400 dark:text-gray-500" />
                                </div>
                            </div>
                            <!-- Date and Location -->
                            <div class="space-y-2">
                                <div class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
                                    <span>{{ formatDateRange(agenda.date) }}</span>
                                </div>
                                <UButton :to="agenda.atLink" variant="link" size="sm"
                                    class="text-sm text-gray-600 dark:text-gray-300">
                                    <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                                    <span class="line-clamp-1">{{ agenda.at }}</span>
                                </UButton>
                            </div>

                            <!-- Tags -->
                            <div v-if="agenda.tags && agenda.tags.length" class="flex flex-wrap gap-1">
                                <UBadge v-for="tag in agenda.tags.slice(0, 3)" :key="tag" color="neutral" variant="soft"
                                    size="xs">
                                    {{ tag }}
                                </UBadge>
                                <UBadge v-if="agenda.tags.length > 3" color="neutral" variant="soft" size="xs">
                                    +{{ agenda.tags.length - 3 }}
                                </UBadge>
                            </div>

                            <!-- Stats -->
                            <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
                                <div class="flex items-center gap-4">
                                    <span>{{ agenda.committees?.length || 0 }} {{ $ts('committee') }}</span>
                                    <span>{{ agenda.participants?.length || 0 }} {{ $ts('participant') }}</span>
                                </div>
                                <div class="flex items-center gap-2">
                                    <UBadge v-if="agenda.configuration.participant.pay" color="error" variant="soft"
                                        size="xs">
                                        {{ formatCurrency(agenda.configuration.participant.amount) }}
                                    </UBadge>
                                    <UBadge v-else color="success" variant="soft" size="xs">
                                        {{ $ts('free') }}
                                    </UBadge>
                                </div>
                            </div>
                        </div>

                        <template #footer>
                            <div class="flex items-center justify-between">
                                <UButton :to="`/agendas/${agenda._id}`" variant="link" size="sm">
                                    {{ $ts('see_more') }}
                                </UButton>
                                <UDropdownMenu :items="dropdownOptions(agenda)" :ui="{
                                    content: 'w-48'
                                }">
                                    <UButton icon="i-lucide-ellipsis-vertical" color="neutral" variant="link" />
                                </UDropdownMenu>
                            </div>
                        </template>
                    </UCard>
                </NuxtLink>
            </div>

            <!-- List View -->
            <div v-else class="space-y-4">
                <NuxtLink v-for="agenda, i in agendas.data" :key="i" :to="`/agendas/${agenda._id}`">
                    <UCard class="hover:shadow-md transition-shadow">
                        <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                            <!-- Main Content -->
                            <div class="flex-1">
                                <div class="flex items-start justify-between mb-3">
                                    <div class="flex-1">
                                        <div class="flex items-center justify-between">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <UBadge v-if="agenda.category" color="secondary" variant="soft"
                                                        size="xs">
                                                        {{ (agenda.category as ICategory).title }}
                                                    </UBadge>
                                                    <UBadge v-if="isRegistrationOpen(agenda)" color="success"
                                                        variant="soft" size="xs">
                                                        {{ $ts('open') }}
                                                    </UBadge>
                                                    <UBadge v-if="agenda.configuration.participant.pay" color="error"
                                                        variant="soft" size="xs">
                                                        {{ formatCurrency(agenda.configuration.participant.amount) }}
                                                    </UBadge>
                                                    <UBadge v-else color="success" variant="soft" size="xs">
                                                        {{ $ts('free') }}
                                                    </UBadge>
                                                </div>
                                                <h3 class="text-xl font-semibold text-gray-900 mb-2 dark:text-gray-200">
                                                    {{
                                                        agenda.title }}
                                                </h3>

                                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                    <div
                                                        class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                        <UIcon name="i-heroicons-calendar-days" class="w-4 h-4" />
                                                        <span>{{ formatDateRange(agenda.date) }}</span>
                                                    </div>
                                                    <UButton :to="agenda.atLink" variant="link" size="sm"
                                                        class="text-sm text-gray-600 dark:text-gray-300">
                                                        <UIcon name="i-heroicons-map-pin" class="w-4 h-4" />
                                                        <span class="line-clamp-1">{{ agenda.at }}</span>
                                                    </UButton>
                                                </div>
                                            </div>
                                            <UDropdownMenu :items="dropdownOptions(agenda)" :ui="{
                                                content: 'w-48'
                                            }">
                                                <UButton icon="i-lucide-ellipsis-vertical" color="neutral"
                                                    variant="link" size="sm" />
                                            </UDropdownMenu>
                                        </div>

                                        <!-- Tags -->
                                        <div v-if="agenda.tags && agenda.tags.length" class="flex flex-wrap gap-1 mb-3">
                                            <UBadge v-for="tag in agenda.tags.slice(0, 5)" :key="tag" color="neutral"
                                                variant="soft" size="xs">
                                                {{ tag }}
                                            </UBadge>
                                            <UBadge v-if="agenda.tags.length > 5" color="neutral" variant="soft"
                                                size="xs">
                                                +{{ agenda.tags.length - 5 }}
                                            </UBadge>
                                        </div>

                                        <!-- Stats -->
                                        <div class="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-300">
                                            <div class="flex items-center gap-1">
                                                <UIcon name="i-heroicons-users" class="w-4 h-4" />
                                                <span>{{ agenda.committees?.length || 0 }} {{ $ts('committee') }}</span>
                                            </div>
                                            <div class="flex items-center gap-1">
                                                <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                                                <span>{{ agenda.participants?.length || 0 }} {{ $ts('participant')
                                                }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </UCard>
                </NuxtLink>
            </div>
        </div>
        <template #footer>
            <div class="flex justify-center mt-6">
                <UButton to="/agendas" color="neutral" variant="link" size="sm">
                    <UIcon name="i-heroicons-arrow-right" class="w-5 h-5" />
                    {{ $ts('see_more') }}
                </UButton>
            </div>
        </template>
    </UCard>
</template>
