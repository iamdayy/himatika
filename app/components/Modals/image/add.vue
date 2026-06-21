<script setup lang='ts'>
import { ModalsImageCrop } from '#components';
import imageCompression from 'browser-image-compression';
import type { IPhoto } from '~~/types';
import type { ITagsResponse } from '~~/types/IResponse';
/**
 * Composables
 */
const { $api } = useNuxtApp();
const toast = useToast();
const { convert } = useImageToBase64();
const { data } = useAsyncData(() => $api<ITagsResponse>("/api/photo/tags"));
const overlay = useOverlay();
/**
 * Emits
 */
const emit = defineEmits<{
    photo: [{ photos: IPhoto[] }];
    close: [];
}>();

/**
 * Reactive references
 */
const ImageCropComp = overlay.create(ModalsImageCrop);

const model = defineModel<boolean>();
const loadingCompress = ref<boolean>(false);
const files = ref<File[]>([]);
const tagsOptions = ref<string[]>([]);

watch(() => data.value?.data?.tags, (newTags) => {
    if (newTags) tagsOptions.value = [...newTags];
}, { immediate: true });
const tags = ref<string[]>([]);

/**
 * Photo data structure
 */
const photos = ref<IPhoto[]>([]);



/**

 * Add new photo
 */
const addPhoto = async () => {
    emit('photo', {
        photos: photos.value
    });
    model.value = false;
}

/**
 * Handle cropped image
 * @param {File} f - Cropped image file
 */
const onCropped = async (f: File) => {
    try {
        files.value.push(f);
        photos.value.push({
            image: f,
            tags: [],
            archived: false,
        });
    } catch (error) {
        toast.add({ title: "Failed to compress image" });
    }
}

/**
 * Handle image change
 * @param {FileList} f - Selected image files
 */
const onChangeImage = async (newFiles: File[]) => {
    if (!newFiles || newFiles.length === 0) return;
    loadingCompress.value = true;
    const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    };
    
    // Proses file satu per satu
    for (const file of newFiles) {
        try {
            const compressedFile = await imageCompression(file, options);
            const blob = URL.createObjectURL(compressedFile);
            // Tunggu modal crop selesai sebelum melanjutkan ke file berikutnya
            await new Promise<void>((resolve) => {
                ImageCropComp.open({
                    img: blob,
                    title: file.name,
                    stencil: {
                        movable: true,
                        resizable: true,
                        aspectRatio: 16 / 9,
                    },
                    onCropped: (croppedFile: File) => {
                        onCropped(croppedFile);
                        resolve();
                        ImageCropComp.close();
                    },
                    onClose: () => {
                        resolve();
                        ImageCropComp.close();
                    }
                });
            });
        } catch (error) {
            console.error("Error processing file:", error);
            toast.add({ title: "Failed to compress image" });
        }
    }

    loadingCompress.value = false;
    // Clear files so the same files can be selected again if needed
    files.value = [];
};

watch(files, (newFiles) => {
    if (newFiles && newFiles.length > 0) {
        onChangeImage(newFiles);
    }
});

/**
 * Add new tag
 * @param {string} tag - New tag
 */
const addNewTag = async (tag: string) => {
    tagsOptions.value.push(tag);
    tags.value.push(tag);
}

/**
 * Responsive design
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

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


</script>
<template>
    <UModal title="Add photo" :dismissible="!loadingCompress">
        <template #body>
            <div :class="['space-y-6 text-start', responsiveClasses.container]">
                <div :class="responsiveClasses.grid">
                    <!-- Image upload -->
                    <div :class="[responsiveClasses.fullSpan, 'min-h-36']">
                        <label for="Title"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Image</label>
                        <UFileUpload v-model="files" accept="image/*" multiple>
                        </UFileUpload>
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
                <UButton :loading="loadingCompress" label="Save" @click="addPhoto" />
                <UButton color="neutral" variant="soft" label="Cancel" @click="emit('close')" />
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>