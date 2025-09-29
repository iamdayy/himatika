<script setup lang='ts'>
import { ModalsCategoryAdd, ModalsImageCrop } from '#components';
import imageCompression from 'browser-image-compression';
import type { INews } from '~/types';
import type { IReqNews } from '~/types/IRequestPost';
import type { ICategoriesResponse, IMemberResponse, IResponse, ITagsResponse } from '~/types/IResponse';

/**
 * Composables
 */
const { $api } = useNuxtApp();
const { $ts } = useI18n();
const toast = useToast();
const overlay = useOverlay();
const config = useRuntimeConfig();

const ImageCropModal = overlay.create(ModalsImageCrop);
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
    default: () => [],
    watch: [searchMember]
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
const file = ref<File>();
const fileToCropped = ref<{ blob: string, name: string }>({
    blob: "",
    name: ""
});
const { convert } = useImageToBase64();
/**
 * News data structure
 */


const news = ref<INews>({
    title: "",
    mainImage: "",
    body: "",
    slug: "",
    category: {
        title: "",
        description: "",
    },
    tags: [],
    authors: []
});

/**
 * Add new news
 */
const addNews = async () => {
    try {
        const body: IReqNews = {
            title: news.value.title,
            mainImage: {
                name: file.value!.name,
                content: await convert(file.value!),
                size: file.value!.size.toString(),
                type: file.value!.type,
                lastModified: file.value!.lastModified.toString()
            },
            body: news.value.body,
            slug: news.value.slug,
            category: news.value.category,
            tags: news.value.tags,
            authors: news.value.authors
        }
        const added = await $api<IResponse>("/api/news", {
            method: "POST",
            body
        });
        toast.add({ title: $ts("success"), description: $ts("success_to_add_news") });
        emit("triggerRefresh");
    } catch (error) {
        toast.add({ title: $ts("failed"), description: $ts("failed_to_add_news") });
    }
};

/**
 * Handle cropped image
 * @param {File} f - Cropped image file
 */
const onCropped = async (f: File) => {
    file.value = f;
    const blob = URL.createObjectURL(f);
    fileToCropped.value.blob = blob;
    ImageCropModal.close();
}

/**
 * Handle image change
 * @param {File} f - Selected image file
 */
const onChangeImage = async (f: FileList) => {
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        alwaysKeepResolution: true
    }
    const compressedFile = await imageCompression(f[0]!, options);
    const blob = URL.createObjectURL(compressedFile);
    ImageCropModal.open({
        img: blob,
        title: compressedFile.name,
        stencil: {
            movable: true,
            resizable: true,
            aspectRatio: 16 / 9,
        },
        onCropped: (file: File) => {
            onCropped(file);
            ImageCropModal.close();
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
const isMobile = computed(() => width.value < 640);
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
    <UModal :title="$ts('add_news')">
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
                        :size="responsiveUISizes.select" :placeholder="$ts('select_tag')" @create="addNewTag"
                        class="w-full">
                    </USelectMenu>
                </UFormField>
                <!-- Image upload -->
                <UFormField class="min-h-36" :label="$ts('image')">
                    <DropFile @change="onChangeImage" accept="image/*">
                        <NuxtImg :src="fileToCropped.blob" v-if="file" />
                    </DropFile>
                </UFormField>
                <!-- Description input -->
                <UFormField :label="$ts('description')">
                    <CoreTiptap id="description" v-model="news.body" />
                </UFormField>
                <!-- Authors Input -->
                <UFormField class="col-span-full" :label="$ts('author')">
                    <USelectMenu :items="members" :loading="status === 'pending'" :filter-fields="['label', 'email']"
                        icon="i-lucide-user" :placeholder="$ts('search')" v-model="news.authors as number[]" multiple
                        v-model:search-term="searchMember" value-key="value" class="w-full"
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
                <UButton @click="$emit('close')" :label="$ts('cancel')" :size="responsiveUISizes.button" />
                <!-- Submit button -->
                <UButton @click="addNews" :label="$ts('save')" :size="responsiveUISizes.button" />
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>