<script setup lang='ts'>
import { ModalsProjectAdd } from '#components';
import { useWindowSize } from '@vueuse/core';
import { computed } from 'vue';
import type { ICategory, IMember } from '~~/types';
import type { IProjectsResponse } from '~~/types/IResponse';
const page = ref(1);
const perPage = ref(6);
const sortBy = ref('Published');
const order = ref('desc');
const { $api } = useNuxtApp();
const { data: projects, refresh: refreshProjects } = await useLazyAsyncData('projects', async () => $api<IProjectsResponse>('/api/project', {
    method: 'get',
    query: {
        page: page.value,
        perPage: perPage.value,
        sortBy: sortBy.value,
        order: order.value
    }
}), {
    watch: [page, perPage, sortBy, order],
    immediate: true,
    transform: (data) => {
        return data.data?.projects;
    }
});
// Importing necessary functions and components from the useProjects composable
// const { page, perPage, projects, totalProjects, refreshProjects, sortBy, order } = useProjects();
const { status } = useAuth();
const overlay = useOverlay();
// Responsive design: track window width using VueUse
const { width: windowWidth } = useWindowSize();
const { $ts } = useI18n();
// Compute if the screen is mobile
const isMobile = computed(() => windowWidth.value < 768);
page.value = 1;
perPage.value = isMobile.value ? 3 : 6;
sortBy.value = 'Published';
order.value = 'desc';
const closeAlert = ref(false);


/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = useResponsiveUiSizes();

const modalAdd = overlay.create(ModalsProjectAdd)

const AddModal = () => {
    modalAdd.open({
        // close() {
        //     refreshProjects();
        // }
    })
}

</script>

<template>
    <UCard>
        <!-- Card header with responsive title -->
        <template #header>
            <h2 class="text-2xl font-extrabold text-center md:text-4xl dark:text-white md:text-start">{{ $ts('showcase')
                }}</h2>
        </template>
        <UAlert v-if="!closeAlert && status == 'authenticated'" variant="outline" class="mb-4">
            <template #title>
                <div class="flex justify-end gap-2">
                    <UButton icon="i-heroicons-x-mark" :size="responsiveUISizes.button" :padded="false" variant="link"
                        color="neutral" @click="closeAlert = true" />
                </div>
                <div class="flex justify-center w-full">
                    <h3 class="font-semibold text-md md:text-lg">{{ $ts('register_project') }}</h3>
                </div>
            </template>
            <template #description>
                <div class="flex flex-col items-center w-full space-y-2">
                    <div class="flex flex-row items-center space-x-2 md:space-y-4 md:flex-col">

                        <p class="text-xs text-neutral-800 dark:text-neutral-400 md:text-center md:text-md">
                            {{ $ts('register_project_message') }}
                        </p>
                    </div>
                    <UButton color="primary" @click="AddModal" :disabled="status != 'authenticated'" class="mx-auto">
                        {{ $ts('register_project_button') }}
                    </UButton>
                </div>
            </template>

            <template #actions>
            </template>
        </UAlert>
        <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <UCard v-for="project in projects" :key="project._id"
                :ui="{ header: 'overflow-hidden p-0 sm:p-0', root: 'overflow-hidden' }">
                <template #header>
                    <div class="relative h-full lg:max-w-2xl w-full shrink-0">
                        <div class="flex items-center justify-between mb-2 absolute top-2 z-10 w-full px-2">
                            <div class="flex items-center gap-2">
                                <UBadge :label="(project.category as ICategory).title" color="secondary"
                                    variant="solid" />
                                <UBadge v-if="project.progress === 100" color="success" variant="subtle" size="xs">
                                    {{ $ts('complete') }}
                                </UBadge>
                                <UBadge v-else-if="project.progress === 0" color="warning" variant="subtle" size="xs">
                                    {{ $ts('not_started') }}
                                </UBadge>
                                <UBadge v-else color="secondary" variant="subtle" size="xs">{{ $ts('on_progress') }}
                                </UBadge>
                            </div>
                            <UButton variant="link" :size="responsiveUISizes.button" color="neutral" :to="project.url"
                                icon="i-heroicons-arrow-top-right-on-square" />
                        </div>
                        <NuxtImg provider="localProvider" :src="(project.image as string)" :alt="project.title"
                            class="object-cover size-full" loading="lazy" />
                    </div>
                </template>
                <div class="space-y-2">
                    <NuxtLink :to="`/projects/${project._id}`" class="text-lg font-semibold">{{ project.title }}
                    </NuxtLink>
                    <div class="flex w-full gap-2">
                        <UBadge v-for="tag in project.tags" :key="tag" :label="tag" color="neutral" variant="soft"
                            size="xs" />
                    </div>
                    <div class="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-200">
                        <UIcon name="i-heroicons-calendar" />
                        <h1>{{ new Date(project.date).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}</h1>
                    </div>
                    <UProgress :model-value="Math.ceil(project.progress / 20)"
                        :color="project.progress === 100 ? 'success' : 'secondary'" status
                        :max="['Not Started', 'Starting', 'On Progress', 'On Progress', 'On Progress', 'Complete']" />
                </div>
                <template #footer>
                    <div class="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-200">
                        <div class="space-y-2 ">
                            <h1 class="text-sm font-medium text-neutral-600 dark:text-neutral-300">
                                {{ $ts('published_at') }}: {{
                                    new Date(project.publishedAt!).toLocaleDateString('id-ID', { dateStyle: 'long' })
                                }}</h1>
                            <UAvatarGroup size="sm" :max="3">
                                <UAvatar v-for="member in project.members" :key="(member as IMember).NIM"
                                    :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                            </UAvatarGroup>
                        </div>
                    </div>
                </template>
            </UCard>
        </div>
        <template #footer>
            <UButton to="/projects" variant="ghost" color="neutral" :size="responsiveUISizes.button"
                icon="i-heroicons-arrow-long-right" :label="$ts('see_more')" block></UButton>
        </template>

    </UCard>
</template>

<style scoped>
@media (max-width: 768px) {
    .UPagination {
        font-size: 0.875rem;
    }
}
</style>