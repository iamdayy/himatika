<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui';
import type { IAgenda, ICategory } from '~~/types';
import type { IAgendaResponse, ICategoriesResponse, ITagsResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'client',
    auth: false
});

type groupedAgendas = {
    [key: string]: {
        [key: string]: IAgenda[]
    }
}

const { width } = useWindowSize();
const { $api } = useNuxtApp();
const { $ts } = useI18n();
const router = useRouter();

const page = ref(1);
const perPage = ref(3);
const sort = ref('date');
const order = ref('desc');
const upcomingOnly = ref(false);
const search = ref('');
const selectedCategory = ref('');
const selectedTags = ref<string[]>([]);

// const { agendas, refreshAgendas, page, perPage, sort, order, upcomingOnly, agendasCount, search, selectedCategory, selectedTags } = useAgendas();

const { data: agendas, refresh: refreshAgendas } = useLazyAsyncData("agendas", () => $api<IAgendaResponse>('/api/agenda', {
    method: 'GET',
    query: {
        page: page.value,
        perPage: perPage.value,
        sort: sort.value,
        order: order.value,
        showMissed: !upcomingOnly.value,
        search: search.value,
        category: selectedCategory.value,
        tags: selectedTags.value
    }
}), {
    transform: (data) => {
        const agendas = data.data?.agendas || [];
        const agendasCount = data.data?.length || 0;
        return {
            data: agendas,
            count: agendasCount
        };
    },
    default: () => ({
        data: [],
        count: 0
    }),
    watch: [page, perPage, sort, order, upcomingOnly, search, selectedCategory, selectedTags]
});

const showPaidOnly = ref(false);
const showFreeOnly = ref(false);
const viewMode = ref<'list' | 'grid'>('grid');
const { data: tags } = useAsyncData('tags', () => $fetch<ITagsResponse>('/api/agenda/tags'), {
    transform: (data) => {
        const tags = data.data?.tags || [];
        return tags;
    },
    default: () => []
});
const { data: categoryOptions, refresh: refreshCategory } = useLazyAsyncData(() => $fetch<ICategoriesResponse>('/api/category', {
    method: 'GET',
}), {
    transform: (data) => {
        const categories = data.data?.categories || [];
        return categories.map((category) => ({
            title: category.title,
            description: category.description,
            value: category._id as string
        }))
    },
    default: () => []
});

const perPageOptions = computed(() => {
    const baseOptions = [3, 5, 10, 20, 50, 100];
    if (agendas.value && (agendas.value.data.length || 0) <= 3) {
        perPage.value = 3;
        return baseOptions.filter((option) => option <= 3);
    }
    const filteredOptions = baseOptions.filter((option) => option <= pageTotal.value);

    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }

    return filteredOptions;
});
const pageTotal = computed(() => agendas.value.count || 0) // This value should be dynamic coming from the API
const pageFrom = computed(() => (page.value! - 1) * perPage.value! + 1)
const pageTo = computed(() => Math.min(page.value! * perPage.value!, pageTotal.value || 0))

const sortOptions = [
    { label: $ts('date'), value: 'date' },
    { label: $ts('title'), value: 'title' },
];

const changeOrder = () => {
    order.value = order.value === 'asc' ? 'desc' : 'asc';
}

const isMobile = computed(() => width.value <= 768);
const responsiveUISizes = useResponsiveUiSizes();
const groupedAgendas = computed<groupedAgendas>(() => {
    const grouped: groupedAgendas = {};

    agendas.value?.data?.forEach((agenda) => {
        const month = new Date(agenda.date.start as string).toLocaleString('default', { month: 'long' });
        const year = new Date(agenda.date.start as string).toLocaleString('default', { year: 'numeric' });
        if (!grouped[year]) {
            grouped[year] = {};
        }
        if (!grouped[year][month]) {
            grouped[year][month] = [];
        }
        grouped[year][month].push(agenda);
    });

    return grouped;
});
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
const dropdownFilterOptions = computed(() => [
    {
        label: $ts('only_open_registration'),
        icon: 'i-heroicons-check',
        type: 'checkbox' as const,
        checked: upcomingOnly.value,
        onUpdateChecked(checked: boolean) {
            upcomingOnly.value = checked;
            refreshAgendas();
        }
    },
    {
        label: $ts('only_paid'),
        icon: 'i-heroicons-credit-card',
        type: 'checkbox' as const,
        checked: showPaidOnly.value,
        onUpdateChecked(checked: boolean) {
            showPaidOnly.value = checked;
            refreshAgendas();
        }
    },
    {
        label: $ts('only_free'),
        icon: 'i-heroicons-cash',
        type: 'checkbox' as const,
        checked: showFreeOnly.value,
        onUpdateChecked(checked: boolean) {
            showFreeOnly.value = checked;
            refreshAgendas();
        }
    },
    {
        label: $ts('reset_filter'),
        icon: 'i-heroicons-x-mark',
        type: 'link' as const,
        click: () => {
            selectedCategory.value = '';
            selectedTags.value = [];
            search.value = '';
            upcomingOnly.value = false;
            showPaidOnly.value = false;
            showFreeOnly.value = false;
            refreshAgendas();
        }
    },
    {
        label: $ts('refresh'),
        icon: 'i-heroicons-arrow-path',
        type: 'link' as const,
        click: () => refreshAgendas()
    }
] satisfies DropdownMenuItem[]);
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
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('agenda'),
    icon: 'i-heroicons-calendar',
}]);
</script>

<template>
    <div class="items-center justify-center mb-2">
        <UBreadcrumb :items="links" />
        <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12">
            <template #header>
                <h1 class="text-2xl font-bold text-gray-600 dark:text-white md:text-3xl">{{ $ts('agenda') }}</h1>
                <div class="my-4">
                    <div class="flex md:flex-row flex-col gap-2 mt-4 mb-8 md:items-center md:justify-between">
                        <UInput v-model="search" :size="responsiveUISizes.input" icon="i-heroicons-magnifying-glass"
                            :placeholder="$ts('search')" class="mt-2 mb-4 mb:mt-4 sm:mb-0 sm:w-64" />
                        <div class="flex items-center gap-2 w-full md:w-auto">
                            <UFieldGroup :size="responsiveUISizes.button" class="w-full md:w-auto">
                                <USelect :size="responsiveUISizes.button" v-model="sort" :items="sortOptions"
                                    placeholder="Sort by" value-key="value" class="w-full" />
                                <UButton :size="responsiveUISizes.button" variant="subtle" color="neutral"
                                    :icon="order == 'asc' ? 'i-heroicons-arrow-up' : order == 'desc' ? 'i-heroicons-arrow-down' : 'i-heroicons-arrows-up-down'"
                                    @click="changeOrder()" />
                            </UFieldGroup>
                        </div>
                    </div>
                    <div class="flex flex-col md:flex-row md:items-center gap-2 justify-between">
                        <div class="flex items-center gap-2 flex-wrap w-full">
                            <USelectMenu v-model="selectedCategory" :size="responsiveUISizes.select"
                                :items="categoryOptions" value-key="value" label-key="title"
                                :placeholder="$ts('filter_by', { key: 'category' })" class="w-full md:w-auto" />
                            <USelectMenu v-model="selectedTags" :size="responsiveUISizes.select" :items="tags" multiple
                                :placeholder="$ts('filter_by', { key: 'tags' })" class="w-full md:w-auto" />
                        </div>
                        <div class="flex flex-row items-center gap-2 w-full md:justify-end justify-between">
                            <UDropdownMenu :items="dropdownFilterOptions" :ui="{ content: 'w-48' }">
                                <UButton icon="i-lucide-funnel" color="neutral" variant="subtle" />
                            </UDropdownMenu>
                            <USwitch @change="() => viewMode = viewMode === 'grid' ? 'list' : 'grid'" color="primary"
                                size="xl" checked-icon="i-lucide-list" unchecked-icon="i-lucide-layout-grid"
                                :label="$ts('view')" />
                        </div>
                    </div>
                </div>
            </template>

            <div class="mt-4 space-y-2">
                <div v-for="(year, yearIndex) in Object.keys(groupedAgendas).sort((a, b) => order == 'asc' ? parseInt(a) - parseInt(b) : parseInt(b) - parseInt(a))"
                    :key="yearIndex" class="mb-4">
                    <h3 class="text-lg font-bold md:text-xl dark:text-gray-200">{{ year }}</h3>
                    <div v-for="(month, monthIndex) in Object.keys(groupedAgendas[year]!)" :key="monthIndex"
                        class="my-2">
                        <h3 class="font-semibold md:text-lg dark:text-gray-200 ms-3 mb-6">{{ month }}</h3>
                        <!-- Grid View -->
                        <div v-if="viewMode === 'grid'" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <NuxtLink v-for="agenda, i in groupedAgendas[year]![month]" :key="i"
                                :to="`/agendas/${agenda?._id}`">
                                <UCard class="hover:shadow-lg transition-shadow">
                                    <template #header>
                                        <div class="flex items-start justify-between">
                                            <div class="flex-1">
                                                <div class="flex items-center gap-2 mb-2">
                                                    <UBadge v-if="agenda?.category" color="secondary" variant="soft"
                                                        size="xs">
                                                        {{ (agenda.category as ICategory).title }}
                                                    </UBadge>
                                                    <UBadge v-if="isRegistrationOpen(agenda)" color="success"
                                                        variant="soft" size="xs">
                                                        {{ $ts('open') }}
                                                    </UBadge>
                                                </div>
                                                <h3
                                                    class="text-lg font-semibold text-gray-900 dark:text-gray-200 line-clamp-2">
                                                    {{
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

                                        <!-- Tags -->
                                        <div v-if="agenda.tags && agenda.tags.length" class="flex flex-wrap gap-1">
                                            <UBadge v-for="tag in agenda.tags.slice(0, 3)" :key="tag" color="neutral"
                                                variant="soft" size="xs">
                                                {{ tag }}
                                            </UBadge>
                                            <UBadge v-if="agenda.tags.length > 3" color="neutral" variant="soft"
                                                size="xs">
                                                +{{ agenda.tags.length - 3 }}
                                            </UBadge>
                                        </div>

                                        <!-- Stats -->
                                        <div
                                            class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-300">
                                            <div class="flex items-center gap-4">
                                                <span>{{ agenda.committees?.length || 0 }} {{ $ts('committee') }}</span>
                                                <span>{{ agenda.participants?.length || 0 }} {{ $ts('participant')
                                                    }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <UBadge v-if="agenda.configuration.participant.pay" color="error"
                                                    variant="soft" size="xs">
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
                                                <UButton icon="i-lucide-ellipsis-vertical" color="neutral"
                                                    variant="link" />
                                            </UDropdownMenu>
                                        </div>
                                    </template>
                                </UCard>
                            </NuxtLink>
                        </div>
                        <!-- List View -->
                        <div v-else class="space-y-4">
                            <NuxtLink v-for="agenda, i in groupedAgendas[year]![month]" :key="i"
                                :to="`/agendas/${agenda._id}`">
                                <UCard class="hover:shadow-md transition-shadow">
                                    <div class="flex flex-col lg:flex-row lg:items-center gap-4">
                                        <!-- Main Content -->
                                        <div class="flex-1">
                                            <div class="flex items-start justify-between mb-3">
                                                <div class="flex-1">
                                                    <div class="flex items-center justify-between">
                                                        <div class="flex-1">
                                                            <div class="flex items-center gap-2 mb-2">
                                                                <UBadge v-if="agenda.category" color="secondary"
                                                                    variant="soft" size="xs">
                                                                    {{ (agenda.category as ICategory).title }}
                                                                </UBadge>
                                                                <UBadge v-if="isRegistrationOpen(agenda)"
                                                                    color="success" variant="soft" size="xs">
                                                                    {{ $ts('open') }}
                                                                </UBadge>
                                                                <UBadge v-if="agenda.configuration.participant.pay"
                                                                    color="error" variant="soft" size="xs">
                                                                    {{
                                                                        formatCurrency(agenda.configuration.participant.amount)
                                                                    }}
                                                                </UBadge>
                                                                <UBadge v-else color="success" variant="soft" size="xs">
                                                                    {{ $ts('free') }}
                                                                </UBadge>
                                                            </div>
                                                            <h3
                                                                class="text-xl font-semibold text-gray-900 mb-2 dark:text-gray-200">
                                                                {{
                                                                    agenda.title }}
                                                            </h3>

                                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                                                <div
                                                                    class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                                                    <UIcon name="i-heroicons-calendar-days"
                                                                        class="w-4 h-4" />
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
                                                    <div v-if="agenda.tags && agenda.tags.length"
                                                        class="flex flex-wrap gap-1 mb-3">
                                                        <UBadge v-for="tag in agenda.tags.slice(0, 5)" :key="tag"
                                                            color="neutral" variant="soft" size="xs">
                                                            {{ tag }}
                                                        </UBadge>
                                                        <UBadge v-if="agenda.tags.length > 5" color="neutral"
                                                            variant="soft" size="xs">
                                                            +{{ agenda.tags.length - 5 }}
                                                        </UBadge>
                                                    </div>

                                                    <!-- Stats -->
                                                    <div
                                                        class="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-300">
                                                        <div class="flex items-center gap-1">
                                                            <UIcon name="i-heroicons-users" class="w-4 h-4" />
                                                            <span>{{ agenda.committees?.length || 0 }} {{
                                                                $ts('committee') }}</span>
                                                        </div>
                                                        <div class="flex items-center gap-1">
                                                            <UIcon name="i-heroicons-user-group" class="w-4 h-4" />
                                                            <span>{{ agenda.participants?.length || 0 }} {{
                                                                $ts('participant')
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
                </div>
            </div>
            <template #footer>
                <div class="flex flex-wrap items-center justify-between gap-1.5">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm leading-5">{{ $ts('rows_per_page') }}</span>
                        <USelect v-model="perPage" :items="perPageOptions" :size="responsiveUISizes.select"
                            class="w-20 me-2" />
                    </div>
                    <div>

                        <span class="text-sm leading-5">
                            {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                        </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <UPagination v-model:page="page" :items-per-page="perPage" :total="agendas.count"
                            :sibling-count="isMobile ? 2 : 6" />
                    </div>
                </div>
            </template>
        </UCard>
    </div>
</template>

<style scoped>
/* Add any additional custom styles here */
</style>