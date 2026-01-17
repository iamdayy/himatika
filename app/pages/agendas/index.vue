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
const route = useRoute();

const categories = ref(route.query.categories as string);
const page = ref(1);
const perPage = ref(9); // Increased to 9 for grid view (3x3)
const sort = ref('date');
const order = ref('desc');
const upcomingOnly = ref(false);
const search = ref('');
const selectedCategory = ref<string>(categories.value);
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
    const baseOptions = [3, 6, 9, 12, 24, 48];
    if (agendas.value && (agendas.value.data.length || 0) <= 3) {
        // perPage.value = 3;
        return baseOptions.filter((option) => option <= 3);
    }
    const filteredOptions = baseOptions.filter((option) => option <= pageTotal.value);

    // if (isMobile.value && filteredOptions.length > 3) {
    //     return filteredOptions.slice(0, 3);
    // }

    return baseOptions;
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
        const month = new Date(agenda.date.start).toLocaleString('default', { month: 'long' });
        const year = new Date(agenda.date.start).toLocaleString('default', { year: 'numeric' });
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
    if (!agenda.configuration) return false;
    const participantStart = new Date(agenda.configuration.participant.canRegisterUntil.start)
    const participantEnd = new Date(agenda.configuration.participant.canRegisterUntil.end)
    const now = new Date()
    return now >= participantStart && now <= participantEnd && participantStart <= participantEnd
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
    <div class="min-h-screen space-y-2">
        <UBreadcrumb :items="links" />
        <UCard :ui="{ header: 'p-0 sm:p-0 px-0 md:px-0' }">
            <template #header>
                <!-- Modern Hero Section -->
                <div class="relative overflow-hidden">
                    <div class="absolute inset-0">
                        <NuxtImg provider="localProvider" src="/img/placeholder-banner-1.jpeg"
                            class="w-full h-full object-cover opacity-30" alt="Hero Background" />
                        <div class="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent">
                        </div>
                    </div>

                    <div class="relative container mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 text-center">
                        <h1 class="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight drop-shadow-lg">
                            Agenda & Kegiatan
                        </h1>
                        <p class="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-8 font-light">
                            Temukan dan ikuti berbagai kegiatan menarik, workshop, dan seminar yang diselenggarakan oleh
                            Himatika.
                        </p>

                        <!-- Search Box in Hero -->
                        <div class="max-w-xl mx-auto relative group">
                            <UInput v-model="search" :size="responsiveUISizes.input" icon="i-heroicons-magnifying-glass"
                                placeholder="Cari agenda menarik..." />
                        </div>
                    </div>
                </div>
                <div class="mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
                    <!-- Filter Bar -->
                    <UCard
                        class="mb-8 shadow-lg border-none ring-1 ring-gray-200 dark:ring-gray-800 backdrop-blur-xl bg-white/30 dark:bg-gray-900/40">
                        <div class="flex flex-col md:flex-row gap-4 justify-between items-center">
                            <!-- Filters Left -->
                            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
                                <USelectMenu v-model="selectedCategory" :size="responsiveUISizes.select"
                                    :items="categoryOptions" value-key="value" label-key="title"
                                    :placeholder="$ts('filter_by', { key: 'category' })" class="min-w-[150px]"
                                    icon="i-heroicons-tag" />
                                <USelectMenu v-model="selectedTags" :size="responsiveUISizes.select" :items="tags"
                                    multiple :placeholder="$ts('filter_by', { key: 'tags' })" class="min-w-[150px]"
                                    icon="i-heroicons-hashtag" />
                                <UPopover :popper="{ placement: 'bottom-start' }">
                                    <UButton icon="i-heroicons-adjustments-horizontal" color="neutral" variant="soft"
                                        :label="$ts('filter') || 'Filter'" />
                                    <template #content>
                                        <div class="p-4 space-y-3 min-w-[200px]">
                                            <h4 class="font-semibold text-sm mb-2 text-gray-900 dark:text-white">Status
                                            </h4>
                                            <div class="space-y-2">
                                                <UCheckbox v-model="upcomingOnly" :label="$ts('only_open_registration')"
                                                    color="primary" />
                                                <UCheckbox v-model="showPaidOnly" :label="$ts('only_paid')"
                                                    color="primary" />
                                                <UCheckbox v-model="showFreeOnly" :label="$ts('only_free')"
                                                    color="primary" />
                                            </div>
                                            <USeparator class="my-2" />
                                            <UButton block size="xs" color="neutral" variant="ghost"
                                                @click="refreshAgendas()">
                                                Apply
                                                Filter</UButton>
                                        </div>
                                    </template>
                                </UPopover>
                                <UButton
                                    v-if="selectedCategory || selectedTags.length || upcomingOnly || showPaidOnly || showFreeOnly"
                                    icon="i-heroicons-x-mark" size="sm" color="error" variant="ghost" @click="() => {
                                        selectedCategory = '';
                                        selectedTags = [];
                                        upcomingOnly = false;
                                        showPaidOnly = false;
                                        showFreeOnly = false;
                                        refreshAgendas();
                                    }">
                                    {{ $ts('reset_filter') }}
                                </UButton>
                            </div>

                            <!-- Actions Right -->
                            <div class="flex items-center gap-2 w-full md:w-auto justify-end">
                                <div class="flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                                    <UButton
                                        :icon="viewMode === 'grid' ? 'i-heroicons-squares-2x2-solid' : 'i-heroicons-squares-2x2'"
                                        :color="viewMode === 'grid' ? 'neutral' : 'secondary'"
                                        :variant="viewMode === 'grid' ? 'solid' : 'ghost'" size="sm"
                                        @click="viewMode = 'grid'" />
                                    <UButton
                                        :icon="viewMode === 'list' ? 'i-heroicons-list-bullet-solid' : 'i-heroicons-list-bullet'"
                                        :color="viewMode === 'list' ? 'neutral' : 'secondary'"
                                        :variant="viewMode === 'list' ? 'solid' : 'ghost'" size="sm"
                                        @click="viewMode = 'list'" />
                                </div>
                                <USelect v-model="sort" :items="sortOptions" :size="responsiveUISizes.select"
                                    icon="i-heroicons-arrows-up-down" class="w-32" />
                            </div>
                        </div>
                    </UCard>
                </div>
            </template>
            <!-- Agendas List -->
            <div class="space-y-12">
                <template v-if="agendas.count > 0">
                    <div v-for="(year, yearIndex) in Object.keys(groupedAgendas).sort((a, b) => order == 'asc' ? parseInt(a) - parseInt(b) : parseInt(b) - parseInt(a))"
                        :key="yearIndex">

                        <div class="flex items-center gap-4 mb-6">
                            <h2 class="text-3xl font-bold text-gray-300">{{ year }}</h2>
                            <div class="h-px bg-gray-200 dark:bg-gray-800 flex-1"></div>
                        </div>

                        <div v-for="(month, monthIndex) in Object.keys(groupedAgendas[year]!)" :key="monthIndex"
                            class="mb-8">
                            <h3 class="text-xl font-bold text-primary-500 mb-4 flex items-center gap-2">
                                <UIcon name="i-heroicons-calendar" class="w-5 h-5" />
                                {{ month }}
                            </h3>

                            <!-- Grid View -->
                            <div v-if="viewMode === 'grid'"
                                class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <NuxtLink v-for="agenda in groupedAgendas[year]![month]" :key="(agenda._id as string)"
                                    :to="`/agendas/${agenda._id}`" class="group h-full">
                                    <UCard
                                        :ui="{ body: 'p-0 sm:p-0 px-0 md:px-0', header: 'p-0 sm:p-0', footer: 'p-4 sm:p-4' }"
                                        class="h-full overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-1 ring-gray-200 dark:ring-gray-800 border-none">

                                        <!-- Card Image -->
                                        <div class="relative aspect-video overflow-hidden">
                                            <NuxtImg provider="localProvider" v-if="agenda.photos?.[0]?.image"
                                                :src="(agenda.photos[0].image as string)"
                                                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                loading="lazy" />
                                            <div v-else
                                                class="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                                <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-400" />
                                            </div>

                                            <!-- Badges -->
                                            <div class="absolute top-3 right-3 flex flex-col gap-2 items-end">
                                                <UBadge v-if="agenda.category" color="neutral" variant="solid" size="xs"
                                                    class="shadow-sm !text-gray-800">
                                                    {{ (agenda.category as ICategory).title }}
                                                </UBadge>
                                                <UBadge v-if="isRegistrationOpen(agenda)" color="primary"
                                                    variant="solid" size="xs" class="shadow-sm">
                                                    {{ $ts('open') }}
                                                </UBadge>
                                            </div>

                                            <!-- Price Tag (Float bottom left of image) -->
                                            <div class="absolute bottom-3 left-3">
                                                <div v-if="agenda.configuration.participant.pay"
                                                    class="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md border border-white/20 shadow-sm">
                                                    {{ formatCurrency(agenda.configuration.participant.amount) }}
                                                </div>
                                                <div v-else
                                                    class="bg-green-500/90 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md border border-white/20 shadow-sm">
                                                    {{ $ts('free') }}
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Card Content -->
                                        <div class="p-4 space-y-3">
                                            <h3
                                                class="text-lg font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight group-hover:text-primary-500 transition-colors">
                                                {{ agenda.title }}
                                            </h3>

                                            <div class="space-y-1.5">
                                                <div
                                                    class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <UIcon name="i-heroicons-calendar-days"
                                                        class="w-4 h-4 text-primary-500" />
                                                    <span>{{ formatDateRange(agenda.date) }}</span>
                                                </div>
                                                <div
                                                    class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <UIcon name="i-heroicons-map-pin" class="w-4 h-4 text-red-400" />
                                                    <span class="line-clamp-1 break-all">{{ agenda.at }}</span>
                                                </div>
                                            </div>

                                            <div class="flex flex-wrap gap-1 pt-1">
                                                <span v-for="tag in agenda.tags?.slice(0, 3)" :key="tag"
                                                    class="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                                    #{{ tag }}
                                                </span>
                                            </div>
                                        </div>

                                        <!-- Footer/Stats -->
                                        <template #footer>
                                            <div class="flex items-center justify-between text-xs text-gray-500">
                                                <div class="flex items-center gap-3">
                                                    <div class="flex items-center gap-1" :title="$ts('participant')"
                                                        v-if="agenda.participants">
                                                        <UIcon name="i-heroicons-user-group" class="w-3.5 h-3.5" />
                                                        {{ agenda.participants.length }}
                                                    </div>
                                                    <div class="flex items-center gap-1" :title="$ts('committee')"
                                                        v-if="agenda.committees">
                                                        <UIcon name="i-heroicons-users" class="w-3.5 h-3.5" />
                                                        {{ agenda.committees.length }}
                                                    </div>
                                                </div>
                                                <div class="text-primary-500 font-medium group-hover:underline">
                                                    {{ $ts('see_more') }} &rarr;
                                                </div>
                                            </div>
                                        </template>
                                    </UCard>
                                </NuxtLink>
                            </div>

                            <!-- List View -->
                            <div v-else class="space-y-4">
                                <NuxtLink v-for="agenda in groupedAgendas[year]![month]" :key="(agenda._id as string)"
                                    :to="`/agendas/${agenda._id}`" class="block group">
                                    <UCard :ui="{ body: 'p-0 sm:p-0 px-0 md:px-0' }"
                                        class="overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary-500/50 border border-transparent ring-1 ring-gray-200 dark:ring-gray-800">
                                        <div class="flex flex-col sm:flex-row h-full sm:h-48">
                                            <!-- Image -->
                                            <div
                                                class="relative w-full sm:w-64 h-48 sm:h-auto shrink-0 overflow-hidden">
                                                <NuxtImg provider="localProvider" v-if="agenda.photos?.[0]?.image"
                                                    :src="(agenda.photos[0].image as string)"
                                                    class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                                <div v-else
                                                    class="w-full h-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center">
                                                    <UIcon name="i-heroicons-photo" class="w-12 h-12 text-gray-400" />
                                                </div>
                                                <div class="absolute top-2 left-2">
                                                    <UBadge v-if="agenda.category" color="neutral" variant="solid"
                                                        size="xs" class="shadow-sm !text-gray-800">
                                                        {{ (agenda.category as ICategory).title }}
                                                    </UBadge>
                                                </div>
                                            </div>

                                            <!-- Content -->
                                            <div class="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                                                <div>
                                                    <div class="flex justify-between items-start mb-2">
                                                        <h3
                                                            class="text-lg font-bold text-gray-900 dark:text-white line-clamp-1 group-hover:text-primary-500 transition-colors">
                                                            {{ agenda.title }}
                                                        </h3>
                                                        <UBadge v-if="isRegistrationOpen(agenda)" color="primary"
                                                            variant="subtle" size="xs">
                                                            {{ $ts('open') }}
                                                        </UBadge>
                                                    </div>

                                                    <p
                                                        class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">
                                                        {{ agenda.description }}
                                                    </p>

                                                    <div
                                                        class="flex flex-col sm:flex-row sm:items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                        <div class="flex items-center gap-1.5">
                                                            <UIcon name="i-heroicons-calendar-days"
                                                                class="w-4 h-4 text-primary-500" />
                                                            {{ formatDateRange(agenda.date) }}
                                                        </div>
                                                        <div class="hidden sm:block text-gray-300">•</div>
                                                        <div class="flex items-center gap-1.5">
                                                            <UIcon name="i-heroicons-map-pin"
                                                                class="w-4 h-4 text-red-500" />
                                                            {{ agenda.at }}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="flex items-center justify-between mt-4">
                                                    <div class="flex items-center gap-2">
                                                        <span v-if="agenda.configuration.participant.pay"
                                                            class="font-bold text-primary-600 dark:text-primary-400">
                                                            {{
                                                                formatCurrency(agenda.configuration.participant.amount)
                                                            }}
                                                        </span>
                                                        <span v-else
                                                            class="font-bold text-green-600 dark:text-green-400">
                                                            {{ $ts('free') }}
                                                        </span>
                                                    </div>
                                                    <UButton variant="ghost" color="neutral"
                                                        icon="i-heroicons-arrow-right" trailing
                                                        class="group-hover:translate-x-1 transition-transform">
                                                        {{ $ts('details') }}
                                                    </UButton>
                                                </div>
                                            </div>
                                        </div>
                                    </UCard>
                                </NuxtLink>
                            </div>

                        </div>
                    </div>
                </template>

                <!-- Empty State -->
                <div v-else class="flex flex-col items-center justify-center py-16 text-center">
                    <div
                        class="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <UIcon name="i-heroicons-calendar" class="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Tidak ada agenda ditemukan</h3>
                    <p class="text-gray-500 max-w-sm mb-6">Coba ubah filter atau kata kunci pencarian Anda untuk
                        menemukan agenda yang
                        Anda cari.</p>
                    <UButton color="neutral" variant="solid" @click="() => {
                        search = '';
                        selectedCategory = '';
                        selectedTags = [];
                        upcomingOnly = false;
                        refreshAgendas();
                    }">Reset Filter</UButton>
                </div>
            </div>
            <template #footer>
                <div v-if="agendas.count > 0" class="flex justify-center mt-12 mb-8">
                    <UPagination v-model:page="page" :items-per-page="perPage" :total="agendas.count"
                        :ui="{ list: 'gap-1', first: 'rounded-l-lg', last: 'rounded-r-lg' }" :max="5" />
                </div>
            </template>
        </UCard>

    </div>
</template>

<style scoped>
/* Add any additional custom styles here */
</style>