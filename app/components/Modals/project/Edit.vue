<script setup lang='ts'>
import { ModalsCategoryAdd, ModalsImageCrop } from '#components';
import imageCompression from 'browser-image-compression';
import type { PropType } from 'vue';
import type { ICategory, IMember, IProject } from '~/types';
import type { ICategoriesResponse, IMemberResponse, IResponse, ITagsResponse } from '~/types/IResponse';

// Access Nuxt app instance and utilities
const { $api } = useNuxtApp();
const toast = useToast();
const overlay = useOverlay();
const searchMember = ref('');
// Define emits for parent component communication
const emit = defineEmits(["triggerRefresh", 'close']);
const props = defineProps({
    project: {
        type: Object as PropType<IProject>,
        required: true
    }
});
const config = useRuntimeConfig();
const { data: tagsData } = useLazyAsyncData(() => $api<ITagsResponse>('/api/project/tags'));
const { data: categoryOptions, refresh: refreshCategory } = useLazyAsyncData(() => $api<ICategoriesResponse>('/api/category'), {
    transform: (data) => {
        const categories = data.data?.categories || [];
        return categories.map((category) => ({
            title: category.title,
            description: category.description,
            value: category._id as string,
        }))
    },
    default: () => []
});
const { data: members, status } = useAsyncData(() => $api<IMemberResponse>("/api/member", { query: { search: searchMember.value } }), {
    transform: (data) => {
        const members = data.data?.members || [];
        return members.map((member) => ({
            label: member.fullName,
            email: member.email,
            value: member.NIM,
            avatar: {
                src: `${config.public.public_uri}${member.avatar}`,
                alt: member.fullName
            }
        }))
    },
    default: () => [],
    watch: [searchMember]
});

const CropImageModal = overlay.create(ModalsImageCrop);
const AddCategoryModal = overlay.create(ModalsCategoryAdd);

// Get window size
const windowSize = useWindowSize();
const { convert } = useImageToBase64();

/**
 * Initialize new project object with default values
 * @type {Ref<IProject>}
 */
const stateProject = reactive<IProject>({
    _id: props.project._id,
    title: props.project.title,
    category: (props.project.category as ICategory)._id as string,
    date: new Date(props.project.date),
    url: props.project.url,
    image: props.project.image,
    description: props.project.description,
    members: (props.project.members as IMember[]).map((member) => member.NIM),
    tags: props.project.tags,
    progress: props.project.progress
});
const tagsSelected = ref<{ id: number, label: string }[]>([]);

/**
 * Reactive references
 */
const openModal = ref<boolean>(false);
const file = ref<File>();
const fileToCropped = ref<{ blob: string, name: string }>({
    blob: "",
    name: ""
});

/**
 * Add a new project to the database
 * @async
 * @throws {Error} When the API call fails
 */
const addProject = async (): Promise<void> => {
    try {
        const added = await $api<IResponse>("/api/project", {
            method: "PUT",
            body: {
                ...stateProject,
                image: {
                    name: file.value!.name,
                    content: await convert(file.value!),
                    size: file.value!.size.toString(),
                    type: file.value!.type,
                    lastModified: file.value!.lastModified.toString()
                },
                tags: tagsSelected.value.map(tag => tag.label),
            },
            query: {
                id: stateProject._id
            }
        });
        toast.add({ title: added.statusMessage! });
        emit("triggerRefresh");
    } catch (error) {
        toast.add({ title: "Failed to add new Project" });
    }
};

const tagsOptions = computed({
    get: () => {
        return tagsData.value?.data?.tags || [];
    },
    set: (value) => {
        tagsOptions.value = value;
    }
});
const addNewTag = (tag: string) => {
    tagsOptions.value.push(tag);
}


const addNewCategory = async (category: string) => {
    AddCategoryModal.open({
        title: category,
        onTriggerRefresh: async () => {
            await refreshCategory();
            AddCategoryModal.close();
        }
    })
}

/**
 * Handle cropped image
 * @param {File} f - Cropped image file
 */
const onCropped = async (f: File) => {
    file.value = f;
    const blob = URL.createObjectURL(f);
    fileToCropped.value.blob = blob;
    openModal.value = false;
}

/**
 * Handle image change
 * @param {File} f - Selected image file
 */
const onChangeImage = async (files: FileList) => {
    if (files.length === 0) return;
    const f = files[0]!;
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        alwaysKeepResolution: true
    }
    const compressedFile = await imageCompression(f, options);
    const blob = URL.createObjectURL(compressedFile);
    CropImageModal.open({
        img: blob,
        title: compressedFile.name,
        stencil: {
            movable: true,
            resizable: true,
            aspectRatio: 16 / 9,
        },
        onCropped: (file: File) => {
            onCropped(file);
            CropImageModal.close();
        }
    });
}


/**
 * Compute the layout based on window size
 * @returns {string} The CSS class for layout
 */
const layoutClass = computed(() => {
    return windowSize.width.value < 640 ? 'grid-cols-1' : 'sm:grid-cols-6';
});

/**
 * Compute the button size based on window size
 * @returns {string} The size prop for UButton
 */
const buttonSize = computed(() => {
    return windowSize.width.value < 640 ? 'sm' : 'md';
});

/**
 * Compute the input size based on window size
 * @returns {string} The size prop for UInput
 */
const inputSize = computed(() => {
    return windowSize.width.value < 640 ? 'sm' : 'md';
});
</script>
<template>
    <UModal :fullscreen="windowSize.width.value < 640" :title="stateProject.title">
        <template #body>
            <UForm :state="stateProject" @submit="addProject">
                <div class="space-y-6 text-start">
                    <div :class="['grid', 'gap-2', layoutClass]">
                        <UFormField class="col-span-full" :label="$ts('title')">
                            <UInput type="text" name="Title" id="Title" placeholder="Project 1"
                                v-model="stateProject.title" required class="w-full" :size="inputSize" />
                        </UFormField>

                        <!-- Categories input -->
                        <UFormField class="col-span-full" :label="$ts('category')">
                            <USelectMenu v-model="stateProject.category as string" :items="categoryOptions" searchable
                                create-item @create="addNewCategory" label-key="title" value-key="value"
                                class="w-full" />
                        </UFormField>
                        <UFormField class="col-span-full lg:col-span-3" :label="$ts('date')">
                            <div class="flex gap-3 border border-gray-300 rounded-lg shadow-sm dark:border-gray-700">
                                <VDatePicker id="date" v-model="stateProject.date" mode="date">
                                    <template #default="{ togglePopover }">
                                        <UButton @click="togglePopover" icon="i-heroicons-calendar" :size="buttonSize"
                                            variant="link" />
                                    </template>
                                </VDatePicker>
                                <label class="block my-auto text-sm font-medium text-gray-900 dark:text-white"
                                    for="date">
                                    {{ stateProject.date.toLocaleDateString() }}
                                </label>
                            </div>
                        </UFormField>
                        <UFormField class="col-span-full lg:col-span-3" :label="$ts('url')">
                            <UInput type="url" name="url" id="url" placeholder="https://example.com"
                                v-model="stateProject.url" required class="w-full" :size="inputSize" />
                        </UFormField>
                        <!-- Image upload -->
                        <UFormField class="col-span-full min-h-36" :label="$ts('image')">
                            <DropFile @change="onChangeImage" accept="image/*">
                                <NuxtImg :src="fileToCropped.blob" v-if="file" />
                                <div v-else-if="stateProject.image && typeof stateProject.image === 'string'">
                                    <NuxtImg provider="localProvider" :src="stateProject.image"
                                        :alt="stateProject.title" class="mx-auto" />
                                </div>
                            </DropFile>
                        </UFormField>
                        <UFormField class="col-span-full" :label="$ts('description')">
                            <CoreTiptap v-model="stateProject.description" />
                        </UFormField>
                        <UFormField class="w-full" :label="$ts('contributor')">
                            <USelectMenu :items="members" :loading="status === 'pending'"
                                :filter-fields="['label', 'email']" icon="i-lucide-user" :placeholder="$ts('search')"
                                v-model:search-term="searchMember" v-model="stateProject.members as number[]" multiple
                                value-key="value" class="w-full">

                                <template #item-label="{ item }">
                                    {{ item.label }}

                                    <span class="text-(--ui-text-muted)">
                                        {{ item.email }}
                                    </span>
                                </template>
                            </USelectMenu>
                        </UFormField>
                        <UFormField class="space-y-4 col-span-full" :label="$ts('tag')">
                            <USelectMenu v-model="stateProject.tags" :items="tagsOptions" multiple create-item
                                @create="addNewTag" name="tag" :placeholder="$ts('select_tag')" />
                        </UFormField>
                        <UFormField class="space-y-4 col-span-full" :label="$ts('progress')">
                            <USlider v-model="stateProject.progress" :min="0" :max="100" :step="5" />
                            <p class="text-sm text-gray-500 dark:text-gray-400 text-end">{{ stateProject.progress
                                }}%
                            </p>
                        </UFormField>
                    </div>
                </div>
            </UForm>
        </template>

        <template #footer>
            <div class="flex items-center justify-between w-full">
                <UButton @click="emit('close')" label="Close" icon="i-heroicons-x-mark" variant="ghost" color="error"
                    :size="buttonSize" />
                <UButton type="submit" @click="addProject" label="Save" icon="i-heroicons-clipboard" trailing
                    :size="buttonSize" />
            </div>
        </template>
    </UModal>
</template>
<style scoped>
/* Responsive styles are now handled by the layoutClass, buttonSize, and inputSize computed properties */
</style>