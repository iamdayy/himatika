<script setup lang='ts'>
import type { IPost } from '~/types';


const query = groq`*[_type == "post"] {
title,
"mainImage": mainImage.asset._ref,
"slug": slug.current}`
const { data } = await useSanityQuery<IPost>(query);

onMounted(() => {
    console.log(data);

})
</script>
<template>
    <CoreCard title="Posts">
        <div class="px-3 py-8 overflow-auto max-h-[70vh]">
            <ol class="relative">
                <li class="mb-10 ms-4" v-for="{ title, slug, mainImage }, i in data" :key="i">
                    <NuxtLink :to="`/post/${slug}`" class="text-2xl font-bold dark:text-gray-100">
                        <SanityImage class="object-contain w-48" w="128" auto="format" :asset-id="mainImage" />
                        {{ title }}
                    </NuxtLink>
                </li>
            </ol>
        </div>
    </CoreCard>
</template>
<style scoped></style>