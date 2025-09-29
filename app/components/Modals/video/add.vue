<script setup lang='ts'>
import type { IVideo } from '~/types';
import type { ITagsResponse } from '~/types/IResponse';
/**
 * Composables
 */
const { $api } = useNuxtApp();
const { convert } = useImageToBase64();
const { data } = useAsyncData(() => $api<ITagsResponse>("/api/video/tags"));

/**
 * Emits
 */
const emit = defineEmits<{
    video: [{ videos: IVideo[] }];
    close: [];
}>();

/**
 * Reactive references
 */
const loading = ref<boolean>(false);
const file = ref<File[]>([]);
const tagsOptions = computed({
    get: () => {
        return data.value?.data?.tags || [];
    },
    set: (value) => {
        tagsOptions.value = value;
    }
});
const tags = ref<string[]>([]);

/**
 * Video data structure
 */
const video = ref<IVideo[]>([]);

const onVideoChange = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
        const f = files[i];
        file.value.push(f);
        const blob = await convert(f);
        video.value.push({
            video: blob,
            tags: [],
            archived: false,
        });
    }
}

/**

 * Add new video
 */
const addVideo = async () => {
    loading.value = true;
    emit('video', {
        videos: await Promise.all(video.value.map(async (video, i) => ({
            ...video,
            video: {
                name: file.value![i].name,
                content: await convert(file.value![i]),
                size: file.value![i].size.toString(),
                type: file.value![i].type,
                lastModified: file.value![i].lastModified.toString(),
            },
            tags: tags.value
        })))
    });
}



/**
 * Responsive design
 */
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640)
const isTablet = computed(() => width.value >= 640 && width.value < 1024)

/**
 * Responsive classes
 */
const responsiveClasses = computed(() => ({
    container: isMobile.value ? 'p-4' : 'p-6',
    grid: isMobile.value ? 'grid-cols-1 space-y-4' : 'grid-cols-6 space-y-8',
    fullSpan: isMobile.value ? 'col-span-1' : 'col-span-6',
    halfSpan: isMobile.value ? 'col-span-1' : 'col-span-3',
    title: isMobile.value ? 'text-lg' : 'text-xl',
    button: isMobile.value ? 'text-sm' : 'text-base',
}));
/**
 * Add new tag
 * @param {string} tag - New tag
 */
const addNewTag = async (tag: string) => {
    tagsOptions.value.push(tag);
    tags.value.push(tag);
}
const videoOptions = (file: string) => ({
    autoplay: true,
    controls: true,
    fluid: true,
    sources: [
        {
            src: file,
            type: 'video/mp4'
        }
    ]
});

</script>
<template>
    <UModal :fullscreen="isMobile" :title="$ts('add_video')">
        <template #body>
            <div :class="['space-y-6 text-start', responsiveClasses.container]">
                <div :class="responsiveClasses.grid">
                    <!-- Image upload -->
                    <div :class="[responsiveClasses.fullSpan, 'min-h-36']">
                        <label for="Title"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Video</label>
                        <DropFile @change="onVideoChange" accept="video/*">
                        </DropFile>
                        <div class="grid grid-cols-3 gap-2 py-3 md:px-2">
                            <VideoPlayer v-for="file, i in video" :key="i" :options="videoOptions(file.video as string)"
                                class="" />
                        </div>
                    </div>

                    <!-- Tags input -->
                    <UFormField :class="responsiveClasses.halfSpan" :label="$ts('tags')">
                        <USelectMenu v-model="tags" :items="tagsOptions" multiple create-item @create="addNewTag"
                            name="tag" placeholder="Select Tags" />
                    </UFormField>
                </div>
                <!-- Submit button -->
                <UButton :loading="loading" label="Save" @click="addVideo" icon="i-heroicons-clipboard" block trailing
                    :class="responsiveClasses.button" />
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>