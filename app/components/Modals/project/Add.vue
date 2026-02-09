<script setup lang='ts'>
import { ModalsCategoryAdd, ModalsImageCrop } from '#components';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IProject } from '~~/types';
import type { ICategoriesResponse, IMemberResponse, IResponse, ITagsResponse } from '~~/types/IResponse';

// Access Nuxt app instance and utilities
const { $api } = useNuxtApp();
const toast = useToast();

const searchMember = ref('');
const loading = ref(false);

const config = useRuntimeConfig();

const overlay = useOverlay();

const CropImageModal = overlay.create(ModalsImageCrop);
const AddCategoryModal = overlay.create(ModalsCategoryAdd)
const { data: tagsData } = useLazyAsyncData(() => $api<ITagsResponse>('/api/project/tags'));
const { data: categoryOptions, refresh: refreshCategory, pending: pendingCategory } = useLazyAsyncData(() => $api<ICategoriesResponse>('/api/category'), {
    transform: (data) => {
        const categories = data.data?.categories || [];
        return categories.map((category) => ({
            label: category.title,
            description: category.description,
            value: category._id as string
        }))
    },
    default: () => undefined
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
    default: () => undefined,
    watch: [searchMember]
});
// Define emits for parent component communication
const emit = defineEmits(["close"]);


// Get window size
const windowSize = useWindowSize();

/**
 * Initialize new project object with default values
 * @type {IProject}
 */
const stateProject: IProject = reactive<IProject>({
    title: "",
    image: "",
    date: new Date(),
    category: "",
    progress: 0,
    description: "",
    url: "",
    tags: [],
    members: [
    ],

});

/**
 * Reactive references
 */
const file = ref<File>();
const fileCropped = ref<File>();

/**
 * Add a new project to the database
 * @async
 * @throws {Error} When the API call fails
 */
const addProject = async (): Promise<void> => {
    loading.value = true;
    try {
        const formData = new CustomFormData<IProject>();
        formData.append('title', stateProject.title);
        formData.append('image', fileCropped.value!);
        formData.append('date', stateProject.date.toISOString());
        formData.append('category', stateProject.category as string || '');
        formData.append('progress', stateProject.progress.toString());
        formData.append('description', stateProject.description);
        formData.append('url', stateProject.url || '');
        formData.append('tags', stateProject ? JSON.stringify(stateProject.tags) : '');
        formData.append('members', stateProject ? JSON.stringify(stateProject.members) : '');
        const added = await $api<IResponse>("/api/project", {
            method: "POST",
            body: formData.getFormData()
        });
        toast.add({ title: added.statusMessage! });
    } catch (error) {
        toast.add({ title: "Failed to add new Project" });
    } finally {
        loading.value = false;
        emit('close');
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
        onTriggerRefresh: () => {
            refreshCategory();
            AddCategoryModal.close();
        }
    })
}

const handleCropImage = (fileFromInput?: File | null) => {
    if (!fileFromInput) return;
    CropImageModal.open({
        img: URL.createObjectURL(fileFromInput),
        title: fileFromInput.name,
        stencil: {
            movable: true,
            resizable: true,
        },
        onCropped: (f: File) => {
            fileCropped.value = f;
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
    <UModal :fullscreen="windowSize.width.value < 640" title="New Project">

        <template #body>
            <UForm :state="stateProject" @submit="addProject">
                <div class="space-y-6 text-start">
                    <div :class="['grid', 'gap-2', layoutClass]">
                        <UFormField class="col-span-full" :label="'Judul'">
                            <UInput type="text" name="Title" id="Title" placeholder="Project 1"
                                v-model="stateProject.title" required class="w-full" :size="inputSize" />
                        </UFormField>

                        <!-- Categories input -->
                        <UFormField class="col-span-full" :label="'Kategori'">
                            <USelectMenu v-model="(stateProject.category as string)" :items="categoryOptions" searchable
                                create-item @create="addNewCategory" label-key="label" value-key="value" class="w-full"
                                :loading="pendingCategory" />
                        </UFormField>
                        <UFormField class="col-span-full lg:col-span-3" :label="'Tanggal'">
                            <DatePicker v-model="stateProject.date" />
                        </UFormField>
                        <UFormField class="col-span-full lg:col-span-3" :label="'Tautan'">
                            <UInput type="url" name="url" id="url" placeholder="https://example.com"
                                v-model="stateProject.url" required class="w-full" :size="inputSize" />
                        </UFormField>
                        <!-- Image upload -->
                        <UFormField class="col-span-full min-h-36" :label="'Gambar'">
                            <UFileUpload v-model="file" accept="image/*" @update:model-value="handleCropImage" />
                        </UFormField>
                        <UFormField class="col-span-full" :label="'Deskripsi'">
                            <CoreTiptap v-model="stateProject.description" />
                        </UFormField>
                        <UFormField class="w-full" :label="'Contributor'">
                            <USelectMenu :items="members" :loading="status === 'pending'"
                                v-model:search-term="searchMember" :filter-fields="['label', 'email']"
                                icon="i-lucide-user" :placeholder="'Cari...'" v-model="stateProject.members as number[]"
                                multiple value-key="value" class="w-full">

                                <template #item-label="{ item }">
                                    {{ item.label }}

                                    <span class="text-(--ui-text-muted)">
                                        {{ item.email }}
                                    </span>
                                </template>
                            </USelectMenu>
                        </UFormField>
                        <UFormField class="space-y-4 col-span-full" :label="'Tag'">
                            <USelectMenu v-model="stateProject.tags" :items="tagsOptions" multiple create-item
                                @create="addNewTag" name="tag" :placeholder="'Pilih Tag'" />
                        </UFormField>
                        <UFormField class="space-y-4 col-span-full" :label="'Progres'">
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
                <UButton @click="$emit('close')" label="Close" icon="i-heroicons-x-mark" variant="ghost" color="error"
                    :size="buttonSize" :loading="loading" />
                <UButton type="submit" @click="addProject" label="Save" icon="i-heroicons-clipboard" trailing
                    :size="buttonSize" :loading="loading" />
            </div>
        </template>
    </UModal>
</template>
<style scoped>
/* Responsive styles are now handled by the layoutClass, buttonSize, and inputSize computed properties */
</style>