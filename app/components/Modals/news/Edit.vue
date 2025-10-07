<script setup lang='ts'>
import { ModalsCategoryAdd, ModalsImageCrop } from '#components';
import imageCompression from 'browser-image-compression';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { ICategory, IMember, INews } from '~~/types';
import type { IReqNews } from '~~/types/IRequestPost';
import type { ICategoriesResponse, IMemberResponse, IResponse, ITagsResponse } from '~~/types/IResponse';

/**
 * Props definition
 */
const props = defineProps({
    data: { type: Object as PropType<INews>, required: true },
    fullscreen: { type: Boolean, default: false }
})

/**
 * Composables
 */
const toast = useToast();
const overlay = useOverlay();
const { $api } = useNuxtApp();
const { convert } = useImageToBase64();
const { $ts } = useI18n();
const config = useRuntimeConfig();

const CropImageModal = overlay.create(ModalsImageCrop);
const AddCategoryModal = overlay.create(ModalsCategoryAdd);

const searchMember = ref('');
const { data: tagsData } = useLazyAsyncData(() => $api<ITagsResponse>('/api/news/tags'));
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
    default: () => []
});
const { data: categoryOptions, refresh: refreshCategory } = useLazyAsyncData(() => $api<ICategoriesResponse>('/api/category'), {
    transform: (data) => {
        const categories = data.data?.categories || [];
        return categories.map((category) => ({
            title: category.title,
            description: category.description,
            value: category._id as string
        }))
    },
    default: () => []
});

/**
 * Emits
 */
const emit = defineEmits(["triggerRefresh", "close"]);

/**
 * Reactive references
 */
const openModal = ref<boolean>(false)
const file = ref<File>()
const fileToCropped = ref<{ blob: string, name: string }>({
    blob: "",
    name: ""
});

const tagsSelected = ref<{ id: number, label: string }[]>(props.data.tags?.map((tag, i) => ({
    id: i + 1,
    label: tag
})) || []);

/**
 * News data structure
 */
const news = ref<INews>({
    title: props.data.title,
    mainImage: props.data.mainImage,
    category: (props.data.category as ICategory)._id as string,
    tags: props.data.tags,
    body: props.data.body,
    authors: (props.data.authors as IMember[]).map(author => author.NIM)
});

/**
 * Edit news
 */
const editNews = async () => {
    try {
        const body = new CustomFormData<IReqNews>();
        body.append("title", news.value.title);
        body.append("mainImage", file.value as File);
        body.append("body", news.value.body);
        body.append("category", news.value.category as string);
        body.append("tags", news.value.tags ? JSON.stringify(news.value.tags) : "");
        body.append("authors", news.value.authors ? JSON.stringify(news.value.authors) : "");
        const added = await $api<IResponse>("/api/news", {
            method: "PUT",
            body: body.getFormData(),
            query: {
                slug: props.data.slug
            }
        });
        toast.add({ title: $ts("success"), description: $ts("success_to_edit_news") });
        emit("triggerRefresh");
    } catch (error) {
        console.log(error);
        toast.add({ title: $ts("failed"), description: $ts("failed_to_edit_news") });
    }
};

/**
 * Handle cropped image
 * @param {File} f - Cropped image file
 */
const onCropped = async (f: File) => {
    const blob = URL.createObjectURL(f);
    fileToCropped.value.blob = blob;
    file.value = f;
    openModal.value = false;
}

/**
 * Handle image change
 * @param {File} f - Selected image file
 */
const onChangeImage = async (files: FileList) => {
    if (!files.length) return;
    const f = files[0]!;
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
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

const tagsOptions = computed({
    get: () => {
        return tagsData.value?.data?.tags || [];
    },
    set: (value) => {
        tagsOptions.value = value;
    }
});
const addNewTag = async (tag: string) => {
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


/**
 * Responsive design
 */
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640)
/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    input: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));
</script>
<template>
    <UModal :title="$ts('edit_news')" :fullscreen="fullscreen">
        <template #body>
            <div class="grid grid-cols-1 space-y-4 md:space-y-6 text-start">
                <!-- Title input -->
                <UFormField :label="$ts('title')">
                    <UInput type="text" name="Title" id="Title" placeholder="News 1" :size="responsiveUISizes.input"
                        v-model="news.title" required />
                </UFormField>
                <!-- Categories input -->
                <UFormField :label="$ts('category')">
                    <USelectMenu v-model="news.category as string" :items="categoryOptions" searchable create-item
                        :size="responsiveUISizes.select" label-key="title" value-key="value" class="w-full"
                        :placeholder="$ts('select_category')" @create="addNewCategory">
                    </USelectMenu>
                </UFormField>

                <!-- Tags input -->
                <UFormField :label="$ts('tag')">
                    <USelectMenu v-model="news.tags" :items="tagsOptions" multiple create-item
                        :size="responsiveUISizes.select" :placeholder="$ts('select_tag')" class="w-full"
                        @create="addNewTag">
                    </USelectMenu>
                </UFormField>
                <!-- Image upload -->
                <UFormField class="min-h-36" :label="$ts('image')">
                    <DropFile @change="onChangeImage" accept="image/*">
                        <NuxtImg :src="fileToCropped.blob" v-if="file" />
                        <div v-else-if="news.mainImage && typeof news.mainImage === 'string'">
                            <NuxtImg provider="localProvider" :src="news.mainImage" :alt="news.title" class="mx-auto" />
                        </div>
                    </DropFile>
                </UFormField>
                <!-- Description input -->
                <UFormField :label="$ts('description')">
                    <CoreTiptap id="description" v-model="news.body" />
                </UFormField>
                <!-- Authors Input -->
                <UFormField class="col-span-full" :label="$ts('author')">
                    <USelectMenu :items="members" :loading="status === 'pending'" :filter-fields="['label', 'email']"
                        v-model:search-term="searchMember" icon="i-lucide-user" :placeholder="$ts('search')"
                        v-model="news.authors as number[]" multiple value-key="value" class="w-full"
                        :size="responsiveUISizes.select">
                        <template #item-label="{ item }">
                            {{ item.label }}

                            <span class="text-(--ui-text-muted)">
                                {{ item.email }}
                            </span>
                        </template>
                    </USelectMenu>
                </UFormField>
            </div>

        </template>
        <template #footer>
            <div class="flex flex-row justify-between w-full gap-2">
                <!-- Cancel button -->
                <UButton @click="emit('close')" :label="$ts('cancel')" :size="responsiveUISizes.button" color="error" />


                <!-- Submit button -->
                <UButton @click="editNews" :label="$ts('save')" :size="responsiveUISizes.button" />
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>