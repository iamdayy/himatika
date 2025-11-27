<script setup lang="ts">
import type { ICategory, IMember, INews } from '~/types';
import type { INewsResponse, IResponse } from '~/types/IResponse';

const { $tc, $ts } = useI18n();
const { data, refresh } = useFetch<INewsResponse>('/api/news', {
    query: {
        perPage: 5,
        page: 1,
    }
});
const ip = await $fetch('/api/ip');
const latestNews = computed(() => data.value?.data?.news as INews[]);
const featuredNews = computed(() => latestNews.value[0] || null);
const { $api, $domParser } = useNuxtApp();
const responsiveUISizes = useResponsiveUiSizes();
const toast = useToast();
const timeAgo = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);

    if (minutes < 60) {
        return $tc('minute', minutes);
    } else if (hours < 24) {
        return $tc('hours', hours);
    } else if (hours < 24 && hours > 168) {
        return $tc('day', Math.floor(hours / 24));
    } else if (hours > 168 && hours < 720) {
        return $tc('week', Math.floor(hours / 168));
    } else if (hours > 720) {
        return $tc('month', Math.floor(hours / 720));
    } else if (hours > 8760) {
        return $tc('year', Math.floor(hours / 8760));
    }
}
// Fungsi untuk menghapus tag html
const stripHtml = (html: string): string => {
    if (!$domParser) return html;
    const doc = $domParser.parseFromString(html, 'text/html');
    return doc.body.textContent || '';
};
// Fungsi untuk menghitung waktu baca
const calculateReadingTime = (content: string): number => {
    const wordsPerMinute = 200;
    const text = stripHtml(content);
    const wordCount = text.trim().split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
};
const submitLike = async (id: string) => {
    try {
        const response = await $api<IResponse>(`/api/news/${id}/likes`, {
            method: 'POST',
        });
        if (response.statusCode) {
            toast.add({ title: 'Success', description: response.statusMessage });
            refresh();
        }
        // if (isSubmitting.value) return;
    } catch (error: any) {
        toast.add({ title: 'Error', description: error.statusMessage, color: 'error' });
    }
}
</script>
<template>
    <div class="p-4 mx-auto space-y-4 max-w-10xl md:space-y-6" v-if="data?.data">
        <UCard :ui="{ root: 'overflow-hidden', body: 'p-0 sm:p-0 px-0 md:px-0' }" v-if="featuredNews">
            <div class="flex flex-col lg:items-end gap-3 lg:flex-row">
                <div class="relative h-full lg:max-w-2xl w-full shrink-0">
                    <UBadge v-if="featuredNews.category" class="absolute top-2 left-2 z-10" variant="subtle"
                        color="neutral" :size="responsiveUISizes.badge">
                        {{ (featuredNews.category as
                            ICategory).title }} • {{
                            timeAgo(new
                                Date(featuredNews.publishedAt!)) }}
                    </UBadge>
                    <NuxtImg provider="localProvider" :src="(featuredNews.mainImage as string)"
                        :alt="featuredNews.title" class="object-cover size-full" loading="lazy" />
                </div>
                <div class="px-2 py-4 pr-8 my-auto">
                    <ULink :to="`/news/${featuredNews.slug}`">
                        <h3 class="mb-2 text-sm font-semibold text-ellipsis md:font-bold md:text-2xl">{{
                            featuredNews.title }}</h3>
                        <div class="flex flex-wrap items-center gap-2 px-2 md:px-4">
                            <span class="font-semibold text-gray-700 dark:text-gray-300">{{ $ts('by') }}</span>
                            <UAvatarGroup size="3xs" :max="3">
                                <UAvatar v-for="member in featuredNews.authors" :key="(member as IMember).NIM"
                                    :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                            </UAvatarGroup>
                        </div>
                    </ULink>
                    <div class="mb-2 overflow-hidden text-gray-600 dark:text-gray-300 line-clamp-3">
                        <CoreContent size="xs" class="hidden md:block" :content="featuredNews.body" />
                    </div>
                    <div class="flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-300">
                        <div class="flex items-center flex-1 gap-2">
                            <UBadge v-for="tag, i in featuredNews.tags?.slice(0, 5)" :key="i"
                                :size="responsiveUISizes.badge">{{ tag }}</UBadge>
                        </div>
                        <div class="flex items-center gap-2">
                            <p>{{ featuredNews.likes?.length }}</p>
                            <UButton
                                :icon="featuredNews.likes?.find(like => like.ip === ip) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                                variant="link" :size="responsiveUISizes.button"
                                :color="featuredNews.likes?.find(like => like.ip === ip) ? 'error' : 'neutral'"
                                @click="submitLike(featuredNews._id as string)" />
                        </div>
                        <div class="flex items-center gap-2">
                            <p>{{ featuredNews.comments?.length }}</p>
                            <UIcon name="i-heroicons-chat-bubble-left-ellipsis" :size="responsiveUISizes.icon" />
                        </div>
                        <span class="mx-2">•</span>
                        <span>{{ calculateReadingTime(featuredNews.body) }} {{ $ts('min_read') }}</span>
                    </div>

                </div>
            </div>
        </UCard>

        <div class="mb-6">
            <div class="flex items-center justify-between mb-4">
                <h3 class="text-xl font-bold">{{ $ts('new') }}</h3>
                <NuxtLink to="/news" class="flex items-center text-gray-700 dark:text-gray-300">
                    <span>{{ $ts('see_more') }}

                    </span>
                    <UIcon name="i-heroicons-chevron-right" />
                </NuxtLink>
            </div>
            <div class="grid grid-cols-1 xl:grid-cols-4 gap-4 px-2 py-2 lg:grid-cols-3 md:grid-cols-2 md:px-4 md:py-3">
                <UCard v-for="(item, index) in latestNews" :key="index" class="space-y-2"
                    :ui="{ header: 'overflow-hidden p-0 sm:p-0', root: 'overflow-hidden' }">
                    <template #header>
                        <UBadge v-if="item.category" class="absolute top-2 left-2 z-10" variant="subtle" color="neutral"
                            :size="responsiveUISizes.badge">
                            {{ (item.category as ICategory).title }} • {{
                                timeAgo(new Date(item.publishedAt!)) }}
                        </UBadge>
                        <NuxtImg provider="localProvider" :src="item.mainImage as string" :alt="item.title"
                            class="object-cover w-full h-full" loading="lazy" />
                    </template>
                    <div class="space-y-2 md:space-y-3">
                        <ULink :to="`/news/${item.slug}`" class="text-sm font-bold md:text-xl">{{ item.title }}</ULink>
                        <div class="flex items-center gap-2 px-2 md:px-4">
                            <span class="text-xs text-gray-700 dark:text-gray-300">By</span>
                            <UAvatarGroup size="3xs" :max="3">
                                <UAvatar v-for="member in featuredNews.authors" :key="(member as IMember).NIM"
                                    :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                            </UAvatarGroup>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-300">{{ new
                            Date(item.publishedAt!).toLocaleDateString('id-ID', {
                                dateStyle: 'long'
                            }) }}</p>
                    </div>
                    <template #footer>
                        <div class="flex items-center gap-2">
                            <div class="flex flex-wrap w-full gap-2">
                                <UBadge v-for="tag in item.tags?.slice(0, 5)" :key="tag" :label="tag" color="neutral"
                                    variant="soft" size="xs" />
                            </div>
                            <div class="flex items-center gap-2">
                                <p>{{ item.likes?.length }}</p>
                                <UButton
                                    :icon="item.likes?.find(like => like.ip === ip) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                                    variant="link" size="lg"
                                    :color="item.likes?.find(like => like.ip === ip) ? 'error' : 'neutral'"
                                    @click="submitLike(item._id as string)" />
                            </div>
                            <div class="flex items-center gap-2">
                                <p>{{ item.comments?.length }}</p>
                                <UIcon name="i-heroicons-chat-bubble-left-ellipsis" />
                            </div>
                        </div>
                    </template>
                </UCard>
            </div>
        </div>
    </div>
</template>

<style scoped>
/* Add any additional custom styles here */
</style>