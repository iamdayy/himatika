<script setup lang='ts'>
import type { IPost } from '~/types';

definePageMeta({
    auth: false,
    layout: "client"
});


const query = groq`*[_type == "post" && slug.current == $slug][0] {
    title,
    "mainImage": mainImage.asset._ref,
    "slug": slug.current,
    categories[]-> {
        title,
        },
        author-> {
            name
            },
            publishedAt,
            body,
            "related": *[_type == "post" && count(categories[@._ref in ^.^.categories[]._ref]) > 0] | order(publishedAt desc, _createdAt desc) [0..5] {
                title,
                slug
                }
                }`;

const route = useRoute();
const { data: details } = await useSanityQuery<IPost>(query, {
    slug: route.params.slug
});
useHead({
    title: details.value?.title + " | Himatika"
});
</script>
<template>
    <div class="p-5 mx-auto text-gray-100 bg-gray-100 sm:p-10 md:p-16 dark:bg-gray-800 dark:text-gray-800">
        <div class="flex flex-col w-full mx-auto overflow-hidden rounded">
            <SanityImage :asset-id="details?.mainImage" w="128" auto="format"
                class="object-cover w-full bg-gray-500 h-96 dark:bg-gray-500" />
            <div
                class="p-6 pb-12 m-4 mx-auto -mt-16 space-y-6 bg-gray-50 sm:px-10 sm:mx-12 lg:rounded-md dark:bg-gray-900">
                <div class="space-y-2">
                    <h1 rel="noopener noreferrer" href="#"
                        class="inline-block text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-gray-100">{{
                            details?.title }}</h1>
                    <p class="text-xs text-gray-400 dark:text-gray-600">By
                        <span class="text-xs hover:underline">{{ details?.author.name }}</span> on
                        <span class="text-xs hover:underline">{{ new Date(details?.publishedAt).toLocaleDateString()
                            }}</span>
                    </p>
                </div>
                <div class="text-gray-900 dark:text-gray-100">
                    <SanityContent :blocks="details?.body" />
                    <div>
                        <div class="flex flex-wrap gap-2 py-6 border-t border-dashed dark:border-gray-600">
                            <a rel="noopener noreferrer" href="#"
                                class="px-3 py-1 rounded-sm hover:underline dark:bg-blue-600 dark:text-gray-50"
                                v-for="category, i in details?.categories" :key="i">{{ category.title }}</a>
                        </div>
                        <div class="space-y-2">
                            <h4 class="text-lg font-semibold">Related posts</h4>
                            <ul class="ml-4 space-y-1 list-disc">
                                <li>
                                    <a rel="noopener noreferrer" href="#" class="hover:underline">Nunc id magna
                                        mollis</a>
                                </li>
                                <li>
                                    <a rel="noopener noreferrer" href="#" class="hover:underline">Duis molestie,
                                        neque
                                        eget
                                        pretium lobortis</a>
                                </li>
                                <li>
                                    <a rel="noopener noreferrer" href="#" class="hover:underline">Mauris nec urna
                                        volutpat,
                                        aliquam lectus sit amet</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>