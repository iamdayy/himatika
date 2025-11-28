<script setup lang='ts'>
import type { ICategory, IComment, IMember, INews } from '~~/types';
import type { INewsResponse, IResponse } from '~~/types/IResponse';

const { $api } = useNuxtApp();
definePageMeta({
    auth: false,
    layout: "client"
});
const route = useRoute();
const toast = useToast();
const { $ts } = useI18n();
const newComment = ref('');
const anonymous = ref(false);
const isSubmitting = ref(false);

const ip = await $fetch('/api/ip');
const { data, refresh } = useAsyncData(() => $api<INewsResponse>('/api/news', {
    query: {
        slug: route.params.slug
    }
}));
const news = computed(() => data.value?.data?.news as INews);
const comments = computed(() => news.value.comments as IComment[] || []);
watch(data, () => {
    useHead({
        title: (data.value?.data?.news as INews)?.title
    });
});
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('news'),
    icon: 'i-heroicons-clipboard-document-list',
    to: '/news'
}, {
    label: (data.value?.data?.news as INews)?.title,
    icon: 'i-heroicons-link',
}]);
const compareIpAddress = (ip: string | string[]) => {
    const ip1 = ip as string;
    const ip2 = route.params.ip as string;
    return ip1 === ip2;
}

const submitComment = async () => {
    try {
        isSubmitting.value = true;
        const response = await $api<IResponse>(`/api/news/${news.value._id}/comments`, {
            method: 'POST',
            query: {
                anonymous: anonymous.value
            },
            body: {
                body: newComment.value
            }
        });
        if (response.statusCode) {
            toast.add({ title: 'Success', description: response.statusMessage, color: 'success' });
            refresh();
            newComment.value = '';
            isSubmitting.value = false;
        }
        // if (isSubmitting.value) return;
    } catch (error: any) {
        toast.add({ title: 'Error', description: error.statusMessage, color: 'error' });
        isSubmitting.value = false;
    }
}
const submitLike = async () => {
    try {
        const response = await $api<IResponse>(`/api/news/${news.value._id}/likes`, {
            method: 'POST',
            query: {
                anonymous: anonymous.value
            },
        });
        if (response.statusCode) {
            toast.add({ title: 'Success', description: response.statusMessage, color: 'success' });
            refresh();
        }
        // if (isSubmitting.value) return;
    } catch (error: any) {
        toast.add({ title: 'Error', description: error.statusMessage, color: 'error' });
    }
}
const submitLikeComment = async (id?: string) => {
    try {
        const response = await $api<IResponse>(`/api/comment/${id}/likes`, {
            method: 'POST',
        });
        if (response.statusCode) {
            toast.add({ title: 'Success', description: response.statusMessage, color: 'success' });
            refresh();
        }
        // if (isSubmitting.value) return;
    } catch (error: any) {
        toast.add({ title: 'Error', description: error.statusMessage, color: 'error' });
    }
}

</script>
<template>
    <div class="items-center justify-center mb-2" v-if="data?.data?.news">
        <UBreadcrumb :links="links" />
        <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12">
            <template #header>
                <div class="flex flex-col gap-2">
                    <h1 class="inline-block text-3xl font-semibold text-gray-900 sm:text-5xl dark:text-gray-100">{{
                        news?.title }}</h1>
                    <span class="text-gray-600 dark:text-gray-300 ms-2">
                        {{ new Date(news?.publishedAt!).toLocaleDateString('id-ID', {
                            dateStyle: 'long'
                        }) }}

                    </span>
                    <div v-if="news?.category" class="ms-2">
                        <span class="text-gray-500 dark:text-gray-300">{{ $ts('category') }} : </span>
                        <UBadge variant="outline" size="sm" color="neutral">{{
                            (news?.category as ICategory)?.title }}</UBadge>
                    </div>
                </div>
            </template>
            <div class="mx-auto mb-6 space-y-2 max-w-screen-2xl">
                <NuxtImg provider="localProvider" :src="news?.mainImage as string" w="128"
                    class="object-cover w-full rounded" loading="lazy" />
            </div>
            <div class="text-gray-900 dark:text-gray-100">
                <CoreContent :content="news?.body!" />
            </div>
            <div class="flex flex-col gap-2 py-6 border-t border-dashed dark:border-gray-600">
                <label class="text-gray-600 dark:text-gray-300">{{ $ts('category') }} :</label>
                <div class="flex flex-wrap gap-2 ">
                    <UBadge v-for="tag, i in news?.tags" :key="i">{{ tag }}</UBadge>
                </div>
            </div>
            <div class="flex items-center gap-2">
                <span class="text-gray-600 dark:text-gray-300">
                    {{ $ts('author') }} :
                </span>
                <span class="text-gray-500 dark:text-gray-400">
                    <span v-for="(author, i) in news.authors" :key="i">
                        {{ (author as IMember).fullName }}<span v-if="i < news.authors?.length! - 2">, </span>
                        <span v-else-if="i === news.authors?.length! - 2"> & </span>
                    </span>
                </span>
            </div>
            <div class="flex items-center gap-2">
                <div class="flex items-center gap-2">
                    <span class="text-xl text-gray-600 dark:text-gray-300">{{ news.likes?.length }}</span>
                    <UButton
                        :icon="news.likes?.find(like => like.ip === ip) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                        variant="link" size="lg" :color="news.likes?.find(like => like.ip === ip) ? 'error' : 'neutral'"
                        @click="submitLike" />
                </div>
                <div class="flex items-center gap-2">
                    <span class="text-xl text-gray-600 dark:text-gray-300">{{ news.comments?.length }}</span>
                    <UIcon name="i-heroicons-chat-bubble-left-ellipsis" size="lg" />
                </div>
            </div>
            <template #footer>
                <div class="mt-6">
                    <div class="space-y-2">
                        <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">{{ $ts('news_interested') }}
                        </h4>
                        <ul
                            class="ml-4 space-y-1 text-gray-800 list-disc list-inside text-md md:text-lg dark:text-gray-400">
                            <li v-for="relate, i in news?.related" :key="i">
                                <NuxtLink rel="noopener noreferrer" :to="`/news/${relate.slug}`"
                                    class="text-gray-800 hover:underline hover:text-gray-600 dark:text-gray-400 dark:hover:text-gray-200">
                                    {{ relate.title }}
                                </NuxtLink>
                            </li>
                        </ul>
                    </div>
                </div>
            </template>
        </UCard>
        <UCard class="mt-8">
            <h3 class="mb-4 text-lg font-semibold">{{ $ts('your_comment') }}</h3>
            <TipTapEditor v-model="newComment" rows="6" :placeholder="$ts('write_comment')" />
            <div class="flex items-center justify-between space-x-4">
                <UButton class="mt-4" @click="submitComment" :loading="isSubmitting" :disabled="isSubmitting">
                    {{ $ts('post_your_comment') }}
                </UButton>
                <div class="flex items-center">
                    <UToggle v-model="anonymous" size="lg" variant="primary" />
                    <span class="ml-2">{{ $ts('anonymous') }}</span>
                </div>
            </div>
        </UCard>
        <div class="py-4 space-y-2 md:space-y-3">

            <UCard v-for="comment in comments" :key="comment._id" class="mb-4">
                <template #header>
                    <div class="flex items-center mt-4 text-sm text-gray-500">
                        <NuxtImg class="w-6 h-6 mr-2 rounded-full" provider="localProvider"
                            :src="comment.author ? (comment.author as IMember).avatar : '/img/profile-blank.png'"
                            :alt="comment.author ? (comment.author as IMember).fullName : $ts('anonymous')"
                            loading="lazy" />

                        <span>{{ comment.author ? (comment.author as IMember).fullName : $ts('anonymous') }}</span>
                        <span class="mx-2">•</span>
                        <span>
                            {{ new Date(comment.createdAt).toLocaleDateString('id-Id', { dateStyle: 'long' }) }}
                        </span>
                    </div>
                </template>
                <div class="flex items-start">
                    <div class="flex-grow">
                        <TiptapShow :content="(comment as IComment).body" />
                    </div>
                </div>
                <template #footer>
                    <div class="flex items-center gap-2">
                        <span class="text-xl text-gray-600 dark:text-gray-300">{{ comment.likes?.length }}</span>
                        <UButton
                            :icon="comment.likes?.find(like => like.ip === ip) ? 'i-heroicons-heart-solid' : 'i-heroicons-heart'"
                            variant="link" size="lg"
                            :color="comment.likes?.find(like => like.ip === ip) ? 'error' : 'neutral'"
                            @click="submitLikeComment(comment._id)" />
                    </div>
                </template>
            </UCard>
        </div>
    </div>
</template>
<style scoped></style>