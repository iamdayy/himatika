<script setup lang='ts'>
import StatCard from '~/components/StatCard.vue';
import { useResponsiveUiSizes } from '~/composables/useResponsiveUiSizes';
import type { ICarousel } from '~~/types';
import type { IConfigResponse, IStatsResponse } from '~~/types/IResponse';
/**
 * Home page for the client layout
 */
definePageMeta({
    layout: 'client', // Use the 'client' layout for this page
    auth: false, // No authentication required to access this page
    fluid: true // Make the page full-width
});
/**
 *  Data fetching and reactive properties
 */
const { data: statsData, pending: pendingStats } = useFetch<IStatsResponse>('/api/stats');
const { data: dataConfig, pending: pendingConfig } = useFetch<IConfigResponse>('/api/config', {
    key: 'config-state',
    lazy: false,
    server: true,
});
const { data: carouselData, pending: pendingCarousel } = useFetch<IResponse & {data: ICarousel[]}>('/api/carousel');
const config = computed(() => dataConfig.value?.data);

/**
 *  Composables and utilities
 */
const { public: publicConfig } = useRuntimeConfig();
const { $ts } = useI18n();
const responsiveUISizes = useResponsiveUiSizes();

/**
 * Carousel component reference
 * @type {Ref<InstanceType<typeof UCarousel>>}
 * 
 */
const randomPhotos = computed<ICarousel[]>(() => {
    if (carouselData.value?.data) {
        const shuffled = [...carouselData.value.data].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 12) as ICarousel[];
    }
    return [];
});

/**
 * SEO Meta tags for the home page
 */

useSeoMeta({
    ogTitle: () => config.value?.name,
    ogDescription: () => config.value?.description,
    ogImage: `${publicConfig.public_uri}/img/logo.png`,
    ogUrl: () => `${publicConfig.public_uri}/`,
});
</script>



<template>
    <div>
        <!-- Hero Section -->
        <section
            class="relative w-full min-h-[70vh] flex flex-col justify-center overflow-hidden bg-radial from-cyan-500/5 via-fuchsia-500/5 to-transparent dark:from-cyan-500/10 dark:via-fuchsia-500/10 dark:to-transparent">
            <!-- Glow background effect -->
            <div
                class="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 dark:bg-cyan-400/10 rounded-full blur-3xl -z-10 animate-pulse">
            </div>
            <div
                class="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/20 dark:bg-orange-400/10 rounded-full blur-3xl -z-10 animate-pulse delay-1000">
            </div>

            <div class="text-center px-4 z-10">
                <NuxtImg provider="localProvider" src="/img/logo.png" alt="Logo"
                    class="mx-auto my-4 w-32 sm:w-40 md:w-48 lg:w-56 hero transition-transform duration-700 hover:scale-105"
                    format="webp" preload />

                <USkeleton v-if="pendingConfig"
                    class="h-10 sm:h-12 md:h-16 lg:h-20 w-3/4 md:w-1/2 mx-auto mt-6 rounded-xl bg-gray-200 dark:bg-gray-800" />
                <h1 v-else
                    class="mt-6 text-3xl font-extrabold leading-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-fuchsia-500 to-orange-500 dark:from-cyan-400 dark:via-fuchsia-400 dark:to-orange-400 uppercase sm:text-4xl md:text-5xl lg:text-6xl hero title drop-shadow-sm">
                    {{ config?.name }}</h1>
            </div>
        </section>

        <section class="py-16 md:py-24 mx-12 md:mx-28" id="about">
            <div class="grid grid-cols-1 gap-6 px-4 md:px-12 lg:px-24 pt-2 md:grid-cols-3">
                <template v-if="pendingStats">
                    <UCard v-for="i in 3" :key="i" class="text-center">
                        <USkeleton class="h-8 w-24 mx-auto mb-4" />
                        <USkeleton class="h-10 w-16 mx-auto mb-2" />
                        <USkeleton class="h-4 w-32 mx-auto" />
                    </UCard>
                </template>
                <template v-else>
                    <StatCard v-if="statsData?.data?.members" :title="$ts('member')" :value="statsData?.data?.members"
                        suffix="+" :description="$ts('and_many_more')" />
                    <StatCard v-if="statsData?.data?.agenda" :title="$ts('agenda')" :value="statsData?.data?.agenda"
                        suffix="+" :description="$ts('and_many_more')" />
                    <StatCard v-if="statsData?.data?.projects" :title="$ts('project')"
                        :value="statsData?.data?.projects" suffix="+" :description="$ts('and_many_more')" />
                </template>
            </div>
        </section>
        <!-- carousel Section -->
        <section class="py-8 md:py-12 carousel mx-12 md:mx-28" id="carousel">
            <div v-if="pendingCarousel" class="px-4 md:px-12 lg:px-24">
                <USkeleton class="w-full h-[400px] rounded-xl" />
            </div>
            <UCarousel v-else ref="carouselRef" v-slot="{ item, index }" :items="randomPhotos"
                next-icon="i-lucide-chevron-right" prev-icon="i-lucide-chevron-left"
                :prev="{ variant: 'ghost', size: responsiveUISizes.button, }"
                :next="{ variant: 'ghost', size: responsiveUISizes.button, }" :ui="{
                    container: 'transition-[height]',
                    controls: 'absolute bottom-0 h-full inset-x-16',
                    dots: 'bottom-2',
                    arrows: 'w-full top-1/2 transform -translate-y-1/2 absolute px-2',
                    dot: 'w-6 h-1'
                }" class="overflow-hidden rounded-lg" loop dots arrows autoplay>
                <div class="relative w-full">
                    <NuxtImg provider="localProvider" :src="(item.image?.image as string)" class="w-full"
                        draggable="false" format="webp" :preload="index === 0" :alt="item.title" />
                    <div class="absolute bottom-0 left-0 right-0 flex-col hidden p-4 text-white bg-black/50 md:flex">
                        <div class="flex justify-between flex-1 w-full gap-2">
                            <h3 class="md:text-xl text-sm font-bold line-clamp-1">{{ item.title }}</h3>
                            <h3 class="text-xl font-semibold">{{ new Date(item.date).toLocaleDateString('id-ID', {
                                dateStyle:
                                    'long'
                            }) }}
                            </h3>
                        </div>
                        <p class="text-sm line-clamp-3">{{ item.description }}</p>
                    </div>
                </div>
            </UCarousel>
        </section>

        <!-- About Section -->
        <section class="py-16 md:py-24 about mx-12 md:mx-28" id="about">
            <About />
        </section>
        <!-- News Section -->
        <section class="pb-16 md:pb-24 mx-12 md:mx-28" id="news">
            <USeparator :label="$ts('news')" class="my-4" />
            <News />
        </section>

        <!-- Events Section -->
        <section class="py-16 md:py-24 mx-12 md:mx-28" id="events" data-aos="fade-right">
            <Agenda />
        </section>

        <!-- Projects Section -->
        <section class="py-16 md:py-24 mx-12 md:mx-28" id="projects" data-aos="zoom-in-up">
            <Projects />
        </section>
        <USeparator :label="$ts('contact')" class="my-12" />
        <!-- Contacts Sections -->
        <section class="py-16 md:py-24 mx-12 md:mx-28" id="contacts" data-aos="zoom-in-up">
            <Contacts />
        </section>
        <UButton
            class="fixed flex items-center justify-center text-4xl text-white duration-300 bg-blue-600 rounded-full w-14 h-14 z-90 bottom-10 right-8 drop-shadow-lg hover:bg-blue-700 hover:drop-shadow-lg hover:animate-bounce"
            to="#contacts" aria-label="Go to contacts section">
            <UIcon name="i-heroicons-envelope" class="w-8 h-8 text-white" />
        </UButton>
    </div>
</template>


<style scoped>
/* Hero animation */
.hero {
    animation: zoom-in-fade 2s ease-out;
}

.subtitle {
    animation-duration: 2.5s;
}

@keyframes zoom-in-fade {
    0% {
        opacity: 0%;
        transform: scale(1.5, 1.5);
    }

    100% {
        opacity: 100%;
        transform: scale(1, 1);
    }
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .hero.title {
        font-size: 2.5rem;
        /* Smaller font size for mobile */
    }

    .hero.subtitle {
        font-size: 1rem;
        line-height: 1.5;
    }
}
</style>