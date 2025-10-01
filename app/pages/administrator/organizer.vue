<script lang="ts" setup>
import { ModalsOrganizerAdd, ModalsOrganizerEdit } from "#components";
import type { TabsItem } from "@nuxt/ui";
import type { IMember } from "~~/types";
import type { IOrganizerResponse } from "~~/types/IResponse";

// Define page metadata for layout and authentication middleware
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth',
});

useHead({
    title: 'Organizers',
});
const {
    data: organizers,
    refresh: refreshOrganizers,
    pending: pendingOrganizers,
} = useLazyAsyncData("organizers", () =>
    $fetch<IOrganizerResponse>("/api/organizer"),
    {
        transform: (data) => {
            return data.data?.organizers;
        }
    }
);
// Retrieve organizer status and list of organizers
const { isOrganizer } = useOrganizer();
const overlay = useOverlay();
const { $ts } = useI18n();

const AddOrganizerModal = overlay.create(ModalsOrganizerAdd);
const EditOrganizerModal = overlay.create(ModalsOrganizerEdit);
/**
 * Compute the periods for the organizers based on their start and end dates.
 * @returns {Array<string>} An array of strings representing the periods.
 */
const periods = computed(() => {
    if (organizers.value) {
        return organizers.value.map((organizer) =>
            `${new Date(organizer.period.start).getFullYear()} - ${new Date(organizer.period.end).getFullYear()}`
        );
    }
    return [];
});
const Period = ref<string>('');
// Reference to the selected period, initialized to the first available period
const selectedPeriod = computed({
    get: () => {
        if (Period.value) {
            return Period.value;
        } else if (periods.value.length > 0) {
            return periods.value[0];
        }
        return '';
    },
    /**
     * Set the selected period to the provided value.
     * @param {string} value - The new selected period value.
     */
    set: (value: string) => {
        if (periods.value.includes(value)) {
            Period.value = value;
        } else {
            Period.value = '';
        }
        // Refresh the organizers based on the selected period
    }
});

/**
 * Compute the current organizer based on the selected period.
 * @returns {IMember | null} The current organizer member or null if not found.
 */
const organizer = computed(() => {
    if (organizers.value) {
        return organizers.value.find((organizer) =>
            new Date(organizer.period.start).getFullYear() === Number(selectedPeriod.value?.split(" - ")[0]) &&
            new Date(organizer.period.end).getFullYear() === Number(selectedPeriod.value?.split(" - ")[1])
        );
    }
    return null;
});

/**
 * Responsive design: Determine if the device is mobile or tablet based on window size.
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

/**
 * Open the modal for adding a new organizer.
 */
const addModal = () => {
    AddOrganizerModal.open({
        onRefreshTrigger: () => {
            refreshOrganizers();
            AddOrganizerModal.close();
        }
    });
}

/**
 * Open the modal for adding a new organizer.
 */
const editModal = () => {
    EditOrganizerModal.open({
        org: organizer.value!,
        onRefreshTrigger: () => {
            refreshOrganizers();
            EditOrganizerModal.close();
        }
    });
}

// Define the items for the tabs in the UI
const items = [
    {
        label: $ts('daily_manager'),
        icon: "i-heroicons-user-group",
        slot: "dailyManager" as const,
    },
    {
        label: $ts('department'),
        icon: "i-heroicons-user-group",
        slot: "departments" as const,
    }
] satisfies TabsItem[];

/**
 * Compute the department tabs based on the current organizer.
 * @returns {Array<Object>} An array of department tab items.
 */
const departementsTabs = computed<TabsItem[]>(() => {
    if (organizer.value) {
        return organizer.value?.department.map((department) => {
            return {
                slot: 'department' as const,
                label: department.name,
            }
        }) satisfies TabsItem[];
    }
    return [];
});

/**
 * Responsive UI sizes based on screen width.
 * @returns {Object} An object containing responsive sizes for input, button, and select elements.
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));
const responsiveClasses = computed(() => ({
    title: isMobile.value ? 'text-xl' : 'text-2xl md:text-4xl',
    subtitle: isMobile.value ? 'text-lg' : 'text-xl md:text-2xl',
}));

// Compute responsive dimensions
const wrapperDimensions = computed(() => ({
    width: isMobile.value ? '180px' : '240px',
    height: isMobile.value ? '340px' : '440px'
}));

const cardDimensions = computed(() => ({
    height: isMobile.value ? '320px' : '420px'
}));

const imageDimensions = computed(() => ({
    width: isMobile.value ? '120px' : '180px',
    height: isMobile.value ? '120px' : '180px'
}));

const links = computed(() => [{
    label: $ts('dashboard'),
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: $ts('organizer'),
    icon: 'i-heroicons-user-group',
}]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                    <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                        {{ $ts('organizer') }}
                    </h1>
                    <div class="min-w-24">
                        <UButton label="New" :size="responsiveUISizes.button" v-if="isOrganizer" @click="addModal" />
                    </div>
                </div>
                <div class="flex flex-row items-center justify-end gap-2 px-2 my-2 md:px-4">
                    <USelectMenu v-model="selectedPeriod" :items="periods" class="w-full" />
                    <UButton :size="responsiveUISizes.button" color="primary" variant="ghost"
                        icon="i-heroicons-arrow-path" @click="refreshOrganizers()" />
                </div>
            </template>
            <div>
                <div class="flex items-center justify-between w-full gap-2">
                    <h1
                        class="my-4 text-2xl font-bold leading-tight tracking-tight text-center text-gray-600 md:text-4xl dark:text-white">
                        {{ selectedPeriod }}
                    </h1>
                    <UButton v-if="isOrganizer" icon="i-heroicons-pencil-square" color="neutral" variant="ghost"
                        @click="editModal" :size="responsiveUISizes.button" />
                </div>
                <h1
                    class="my-4 text-xl font-bold leading-tight tracking-tight text-center text-gray-600 md:text-2xl dark:text-white">
                    Council
                </h1>
                <div class="grid grid-cols-1 gap-8 md:grid-cols-2">
                    <div class="mx-auto wrapper" :style="wrapperDimensions" v-for="council in organizer?.council">
                        <div class="card" :style="{ height: cardDimensions.height }">
                            <div class="front" :style="{ height: cardDimensions.height }">
                                <h2
                                    :class="['font-semibold text-gray-800 dark:text-gray-200', responsiveClasses.subtitle]">
                                    {{
                                        council.position }}</h2>
                                <NuxtImg :src="(council.image as string)" :alt="council.name" :style="imageDimensions"
                                    class="object-cover mx-auto my-4 rounded-full max-w-48 aspect-square"
                                    provider="localProvider" />
                                <div class="absolute bottom-16">
                                    <h1
                                        :class="['mb-2 font-semibold text-gray-800 dark:text-gray-200 -translate-x-14', responsiveClasses.title]">
                                        {{ council.name }}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div>
                <h1
                    class="mt-2 mb-2 text-xl font-bold leading-tight tracking-tight text-center text-gray-600 md:-mt-12 md:mb-4 md:text-3xl dark:text-white">
                    {{ $ts('advisor') }}
                </h1>
                <div class="mx-auto wrapper" :style="wrapperDimensions">
                    <div class="card" :style="{ height: cardDimensions.height }">
                        <div class="front" :style="{ height: cardDimensions.height }">
                            <h2 :class="['font-semibold text-gray-800 dark:text-gray-200', responsiveClasses.subtitle]">
                                {{
                                    organizer?.advisor.position }}</h2>
                            <NuxtImg :src="(organizer?.advisor.image as string)" :alt="organizer?.advisor.name"
                                :style="imageDimensions"
                                class="object-cover mx-auto my-4 rounded-full max-w-48 aspect-square"
                                provider="localProvider" />
                            <div class="absolute bottom-16">
                                <h1
                                    :class="['mb-2 font-semibold text-gray-800 dark:text-gray-200 -translate-x-14', responsiveClasses.title]">
                                    {{ organizer?.advisor.name }}
                                </h1>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <h1
                        class="my-4 text-xl font-bold leading-tight tracking-tight text-center text-gray-600 md:text-3xl dark:text-white">
                        {{ $ts('considers') }}
                    </h1>
                    <div
                        :class="`grid w-full grid-cols-1 gap-4 py-3 md:grid-cols-${organizer?.considerationBoard.length}`">
                        <ProfileCard v-for="considerationBoard in organizer?.considerationBoard"
                            :member="(considerationBoard as IMember)" subtitle="Consideration Board" />
                    </div>
                </div>
            </div>
            <UTabs :items="items">
                <template #dailyManager="{ item, index }">
                    <div class="grid w-full grid-cols-1 gap-4 py-3 md:grid-cols-3">
                        <ProfileCard v-for="dailyManager in organizer?.dailyManagement"
                            :member="(dailyManager.member as IMember)" :subtitle="dailyManager.position" />
                    </div>
                </template>
                <template #departments="{ item }">
                    <UTabs :items="departementsTabs">
                        <template #department="{ item, index }">
                            <ProfileCard v-if="organizer?.department[index]!.coordinator"
                                :member="(organizer?.department[index].coordinator as IMember)" subtitle="Coordinator"
                                class="mt-8" />
                            <div class="grid w-full grid-cols-1 gap-4 py-3 mt-8 md:grid-cols-3">
                                <ProfileCard v-for="member in organizer?.department[index]!.members"
                                    :member="(member as IMember)" subtitle="Member" />
                            </div>
                        </template>
                    </UTabs>
                </template>
            </UTabs>
        </UCard>
    </div>
</template>
<style scoped>
/* Wrapper for the entire component */
.wrapper {
    perspective: 800px;
    position: relative;
}

/* Main card container */
.card {
    width: 100%;
    position: relative;
    transform-style: preserve-3d;
    transform: translateZ(-140px);
    transition: transform 350ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
    cursor: pointer;
}

/* Common styles for front and back of the card */
.card>div {
    position: absolute;
    width: 100%;
    padding: 34px 21px;
    transition: all 350ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
}

/* Front face of the card */
.front {
    background-image: linear-gradient(180deg, #FF6600 0%, rgba(92, 91, 94, 0) 95%);
    transform: rotateY(0deg) translateZ(160px);
    border-radius: 34px 8px 0;
}

/* Responsive styles */
@media (max-width: 768px) {
    .card>div {
        padding: 20px 15px;
    }

    .front,
    .right {
        border-radius: 20px 5px 0;
    }

}
</style>
