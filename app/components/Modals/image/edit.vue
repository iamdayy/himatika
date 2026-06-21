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
const { data: tagData } = useAsyncData(() => $api<ITagsResponse>("/api/photo/tags"));
const overlay = useOverlay();

/**
 * Props & Emits
 */
const props = defineProps<{
    photo: IPhoto;
}>();

const emit = defineEmits<{
    updated: [];
    close: [];
}>();

/**
 * Reactive references
 */
const ImageCropComp = overlay.create(ModalsImageCrop);

const model = defineModel<boolean>({
    required: true,
    type: Boolean,
});
const loading = ref<boolean>(false);
const files = ref<File[]>([]);
const photoPreview = ref<string>((props.photo.image as string));

const tagsOptions = computed({
    get: () => {
        return tagData.value?.data?.tags || [];
    },
    set: (value) => {
        // tagsOptions.value = value;
    }
});

const tags = ref<string[]>([...(props.photo.tags || [])]);

/**
 * Handle updated photo
 */
const updatePhoto = async () => {
    loading.value = true;
    try {
        const formData = new FormData();
        if (files.value.length > 0) {
            const file = files.value[0] || null;
            if (!file) return;
            const compressedFile = await imageCompression(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            formData.append('image', compressedFile);
        }
        formData.append('tags', JSON.stringify(tags.value));

        await $api(`/api/photo/${props.photo._id}`, {
            method: 'PUT',
            body: formData,
        });

        toast.add({ title: "Photo updated successfully" });
        emit('updated');
        model.value = false;
    } catch (error: any) {
        toast.add({ title: "Failed to update photo", description: error.message || error.statusMessage, color: "error" });
    } finally {
        loading.value = false;
    }
}

/**
 * Handle cropped image logic similar to add.vue, but for single replacement
 */
const onCropped = async (f: File) => {
    try {
        files.value = [f];
        photoPreview.value = URL.createObjectURL(f);
    } catch (error) {
        toast.add({ title: "Failed to process image" });
    }
}

const onChangeImage = async (file?: File | null) => {
    if (!file) return;
    loading.value = true;
    const options = {
        maxSizeMB: 2,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: 'image/webp',
    };
    try {
        const compressedFile = await imageCompression(file, options);
        const blob = URL.createObjectURL(compressedFile);

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
            });
        });
    } catch (error) {
        console.error("Error processing file:", error);
        toast.add({ title: "Failed to compress image" });
    }
    loading.value = false;
};

const onFilesUpdate = (newFile: File | FileList | File[] | null | undefined) => {
    if (!newFile) return;
    const f = newFile instanceof File ? newFile : (newFile as FileList | File[])[0];
    if (!f) return;
    onChangeImage(f);
};


const addNewTag = async (tag: string) => {
    // tagsOptions.value.push(tag); // Computed setter might need handling?
    // For now locally push.
    tags.value.push(tag);
}

/**
 * Responsive design
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

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
    <UModal v-model="model" title="Edit photo" :dismissible="!loading">
        <template #body>
            <h2 class="text-lg font-semibold mb-4">Edit Photo</h2>
            <div :class="['space-y-6 text-start', responsiveClasses.container]">
                <div :class="responsiveClasses.grid">
                    <!-- Image Preview & Upload -->
                    <div :class="[responsiveClasses.fullSpan, 'min-h-36']">
                        <div class="mb-4 relative w-full h-48 rounded-lg overflow-hidden bg-gray-100">
                            <img :src="photoPreview" class="w-full h-full object-cover" />
                        </div>
                        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Replace
                            Image</label>
                        <UFileUpload :model-value="files.length > 0 ? files[0] : null" @update:model-value="onFilesUpdate" accept="image/*" />
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
                <UButton :loading="loading" label="Save" @click="updatePhoto" />
                <UButton color="neutral" variant="soft" label="Cancel" @click="emit('close')" />
            </div>
        </template>
    </UModal>
</template>
