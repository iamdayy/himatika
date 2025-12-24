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
    auth: false // No authentication required to access this page
});
/**
 *  Data fetching and reactive properties
 */
const { data: statsData } = useFetch<IStatsResponse>('/api/stats');
const { data: dataConfig } = useFetch<IConfigResponse>('/api/config');
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

    if (dataConfig.value) {
        const shuffled = [...(config.value?.carousels || [])].sort(() => 0.5 - Math.random());
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
        <section class="w-full mx-auto mt-8">
            <div class="text-center">
                <NuxtImg provider="localProvider" src="/img/logo.png" alt="Logo"
                    class="mx-auto my-2 w-36 md:w-full md:max-w-sm md:my-4 hero" format="webp" preload />

                <h1
                    class="text-3xl font-bold tracking-tight text-gray-900 uppercase sm:text-4xl md:text-6xl lg:text-8xl hero title dark:text-gray-200">
                    {{ config?.name }}</h1>
            </div>
        </section>
        <section class="py-8 md:py-12" id="about">
            <div class="grid grid-cols-1 gap-6 px-24 pt-2 md:grid-cols-3">
                <StatCard v-if="statsData?.data?.members" :title="$ts('member')" :value="statsData?.data?.members"
                    suffix="+" :description="$ts('and_many_more')" />
                <StatCard v-if="statsData?.data?.agenda" :title="$ts('agenda')" :value="statsData?.data?.agenda"
                    suffix="+" :description="$ts('and_many_more')" />
                <StatCard v-if="statsData?.data?.projects" :title="$ts('project')" :value="statsData?.data?.projects"
                    suffix="+" :description="$ts('and_many_more')" />

            </div>
        </section>
        <!-- carousel Section -->
        <section class="py-8 md:py-12 carousel" id="carousel">
            <UCarousel ref="carouselRef" v-slot="{ item, index }" :items="randomPhotos"
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
        <section class="py-8 md:py-12 about" id="about">
            <About />
        </section>
        <USeparator :label="$ts('news')" class="mt-8" />
        <!-- News Section -->
        <section class="pb-8 md:pb-12 about" id="news">
            <News />
        </section>

        <!-- Events Section -->
        <section class="py-8 md:py-12" id="events" data-aos="fade-right">
            <Agenda />
        </section>

        <!-- Projects Section -->
        <section class="py-8 md:py-12" id="projects" data-aos="zoom-in-up">
            <Projects />
        </section>
        <USeparator :label="$ts('contact')" class="my-8" />
        <!-- Contacts Sections -->
        <section class="py-8 md:py-12" id="contacts" data-aos="zoom-in-up">
            <Contacts />
        </section>
        <UButton
            class="fixed flex items-center justify-center text-4xl text-white duration-300 bg-blue-600 rounded-full w-14 h-14 z-90 bottom-10 right-8 drop-shadow-lg hover:bg-blue-700 hover:drop-shadow-2xl hover:animate-bounce"
            to="#contacts">
            <UIcon name="i-heroicons-envelope" class="w-8 h-8 text-white" />
        </UButton>
    </div>

</template>


<style scoped>
@import url('https://fonts.cdnfonts.com/css/tw-cen-mt');

/* Hero animation */
.hero {
    animation: zoom-in-fade 2s ease-out;
    /* font-family: 'Fira Code', monospace; */
}

.title {
    font-family: 'Tw Cen MT', sans-serif;
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