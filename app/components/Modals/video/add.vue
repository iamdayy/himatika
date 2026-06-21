<script setup lang='ts'>
import { UFileUpload } from '#components';
import { usePresignedUpload } from '~/composables/usePresignedUpload';
import type { IVideo } from '~~/types';
import type { ITagsResponse } from '~~/types/IResponse';

/**
 * Composables
 */
const { $api, $ts } = useNuxtApp();
const { convert } = useImageToBase64();
const { data } = useAsyncData(() => $api<ITagsResponse>("/api/video/tags"));
const presignedUpload = usePresignedUpload();

/**
 * Props
 */
const props = defineProps<{
    agendaId?: string;
}>();

/**
 * Emits
 */
const emit = defineEmits<{
    video: [{ videos: IVideo[] }];
    videoPresigned: [{ fileKey: string; tags: string[] }];
    close: [];
}>();

/**
 * Constants
 */
const PRESIGNED_THRESHOLD = 20 * 1024 * 1024; // 20MB

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
 * Computed: check if any file exceeds the presigned threshold
 */
const hasLargeFile = computed(() => {
    return file.value.some(f => f.size > PRESIGNED_THRESHOLD);
});

const fileSizeLabel = computed(() => {
    if (file.value.length === 0) return '';
    const totalSize = file.value.reduce((acc, f) => acc + f.size, 0);
    if (totalSize > 1024 * 1024 * 1024) {
        return `${(totalSize / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    }
    if (totalSize > 1024 * 1024) {
        return `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${(totalSize / 1024).toFixed(0)} KB`;
});

/**
 * Add new video — decides between legacy FormData or presigned URL flow
 */
const addVideo = async () => {
    if (file.value.length === 0) return;
    loading.value = true;

    try {
        if (hasLargeFile.value && props.agendaId) {
            // === PRESIGNED URL FLOW ===
            for (const f of file.value) {
                if (f.size > PRESIGNED_THRESHOLD) {
                    // Upload directly to R2
                    const result = await presignedUpload.upload(f, props.agendaId);
                    if (result) {
                        emit('videoPresigned', { fileKey: result.fileKey, tags: tags.value });
                    }
                } else {
                    // Small file in a batch with large files — still use legacy
                    emit('video', {
                        videos: [{
                            video: f,
                            tags: tags.value,
                            archived: false,
                        }]
                    });
                }
            }
        } else {
            // === LEGACY FORMDATA FLOW ===
            emit('video', {
                videos: Array.from(file.value).map(f => ({
                    video: f,
                    tags: tags.value,
                    archived: false,
                }))
            });
        }
    } finally {
        loading.value = false;
    }
}

/**
 * Cancel ongoing presigned upload
 */
const cancelUpload = () => {
    presignedUpload.abort();
    loading.value = false;
};

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
const videoOptions = (file: File) => {
    const blob = URL.createObjectURL(file);
    return {
        autoplay: true,
        controls: true,
        fluid: true,
        sources: [
            {
                src: blob,
                type: 'video/mp4'
            }
        ]
    }
};

</script>
<template>
    <UModal :fullscreen="isMobile" :title="$ts('add_video')">
        <template #body>
            <div :class="['space-y-6 text-start', responsiveClasses.container]">
                <div :class="responsiveClasses.grid">
                    <!-- Video upload -->
                    <div :class="[responsiveClasses.fullSpan, 'min-h-36']">
                        <label for="Title"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Video</label>
                        <UFileUpload v-model="file" accept="video/*" multiple>
                            <template #files="{ files }">
                                <div class="grid grid-cols-3 gap-2 py-3 md:px-2 w-full">
                                    <VideoPlayer v-for="file, i in files" :key="i" :options="videoOptions(file)"
                                        class="w-full h-full" />
                                </div>
                            </template>
                        </UFileUpload>
                        <!-- File size info -->
                        <div v-if="file.length > 0"
                            class="mt-2 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <UIcon name="i-heroicons-information-circle" class="text-base" />
                            <span>{{ $ts('file_size') }}: {{ fileSizeLabel }}</span>
                            <UBadge v-if="hasLargeFile" color="warning" variant="soft" size="xs">
                                {{ $ts('video_presigned_mode') }}
                            </UBadge>
                        </div>
                    </div>

                    <!-- Upload progress bar (presigned mode) -->
                    <div v-if="presignedUpload.uploading.value" :class="responsiveClasses.fullSpan">
                        <div class="space-y-2">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-gray-700 dark:text-gray-300">{{ $ts('video_uploading_to_cloud')
                                    }}</span>
                                <span class="font-mono font-medium text-primary">{{ presignedUpload.progress.value
                                    }}%</span>
                            </div>
                            <UProgress :value="presignedUpload.progress.value" />
                            <UButton size="xs" color="error" variant="soft" icon="i-heroicons-x-mark"
                                @click="cancelUpload">
                                {{ $ts('cancel') }}
                            </UButton>
                        </div>
                    </div>

                    <!-- Error message -->
                    <div v-if="presignedUpload.error.value" :class="responsiveClasses.fullSpan">
                        <UAlert color="error" variant="soft" :title="$ts('error')"
                            :description="presignedUpload.error.value" icon="i-heroicons-exclamation-triangle" />
                    </div>

                    <!-- Tags input -->
                    <UFormField :class="responsiveClasses.halfSpan" :label="$ts('tags')">
                        <USelectMenu v-model="tags" :items="tagsOptions" multiple create-item @create="addNewTag"
                            name="tag" placeholder="Select Tags" />
                    </UFormField>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex items-center justify-end space-x-2">
                <UButton :loading="loading || presignedUpload.uploading.value" label="Save" @click="addVideo" />
                <UButton color="neutral" variant="soft" label="Cancel" @click="emit('close')" />
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>