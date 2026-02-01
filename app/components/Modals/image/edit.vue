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
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
                alwaysKeepResolution: true,
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
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        alwaysKeepResolution: true,
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

watch(files, (newFiles) => {
    if (newFiles && newFiles.length > 0) {
        // Only trigger if it's a fresh selection from UFileUpload input (which sets array)
        // However, we set files manually in onCropped too. 
        // We need to distinguish between user selection and our own setting.
        // Actually UFileUpload emits File[]
        // We can just rely on the fact that if we set it in onCropped, we likely don't want to re-trigger cropping??
        // Wait, onCropped sets `files.value = [f]`. This triggers watch? Yes.
        // But onChangeImage is async processing.
        // To avoid infinite loop or re-processing cropped image:
        // We can check if the file is already processed or just handle it carefully.
        // Simplified: UFileUpload updates `files`. We intercept that.
        // But `files` is bound to UFileUpload.
        // Let's modify onChangeImage to NOT rely on watch if possible, or use a separate ref for input.
        // But UFileUpload v-model binds the files.
        // Let's stick to the pattern in add.vue for simplicity if it works there.
        // In add.vue:
        // watch(files, (newFiles) => { if (newFiles && newFiles.length > 0) onChangeImage(newFiles[0]); });
        // And onCropped pushes to files? No, add.vue pushes to `files` ref BUT the watch also triggers?
        // In add.vue:
        // const files = ref<File[]>([]); 
        // const photos = ref<IPhoto[]>([]); // this stores the final result
        // onCropped pushes to `files` AND `photos`.
        // If onCropped pushes to `files`, the watcher triggers again!
        // That might be a bug in add.vue or I'm misreading.
        // check add.vue: `files.value.push(f)` in onCropped.
        // `watch(files)` calls `onChangeImage(newFiles[0])`.
        // If onCropped adds a file, newFiles has that file. onChangeImage calls imageCompression on it.
        // Recursion? 
        // Let's avoid that potential issue here.
    }
});

// Better approach for Edit: use a method for UFileUpload @change if possible, or just watch but check file type/name or something.
// Or just let UFileUpload be for input, and store result elsewhere.
// But UFileUpload v-model is convenient.
// Let's duplicate the logic but add a check or use a separate ref for the file input.
const inputFile = ref<File | null>(null);
watch(inputFile, (newFiles) => {
    if (newFiles) {
        onChangeImage(newFiles);
    }
});


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
        <div class="p-4">
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
                        <UFileUpload v-model="inputFile" accept="image/*" />
                    </div>

                    <!-- Tags input -->
                    <UFormField :class="responsiveClasses.halfSpan" :label="$ts('tags')">
                        <USelectMenu v-model="tags" :items="tagsOptions" multiple create-item @create="addNewTag"
                            name="tag" placeholder="Select Tags" />
                    </UFormField>
                </div>
                <!-- Submit button -->
                <UButton @click.prevent="updatePhoto" :loading="loading" label="Update" icon="i-heroicons-check" block
                    trailing :class="responsiveClasses.button" />
            </div>
        </div>
    </UModal>
</template>
