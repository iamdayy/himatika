<script setup lang='ts'>
import { ModalsCategoryAdd, ModalsImageCrop, UFileUpload } from '#components';
import imageCompression from 'browser-image-compression';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { INews } from '~~/types';
import type { IReqNews } from '~~/types/IRequestPost';
import type { ICategoriesResponse, IMemberResponse, IResponse, ITagsResponse } from '~~/types/IResponse';

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
const loading = ref(false);

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
        label: category.title,
            description: category.description,
            value: category._id as string
        }))
    },
    default: () => []
});
/**
 * Emits & Props
 */
const emit = defineEmits(["triggerRefresh", "close"]);
const props = defineProps({
    fullscreen: { type: Boolean, default: false }
})
/**
 * Reactive references
 */
const file = ref<File>();
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
    if (!file.value) {
        toast.add({ title: $ts("error"), description: $ts("please_select_image") });
        return;
    }
    loading.value = true;
    try {
        const body = new CustomFormData<IReqNews>();
        body.append("title", news.value.title);
        body.append("mainImage", file.value as File);
        body.append("body", news.value.body);
        body.append("category", news.value.category as string);
        body.append("tags", news.value.tags ? JSON.stringify(news.value.tags) : "");
        body.append("authors", news.value.authors ? JSON.stringify(news.value.authors) : "");
        const added = await $api<IResponse>("/api/news", {
            method: "POST",
            body: body.getFormData()
        });
        if (added.statusCode !== 200) {
            throw new Error(added.statusMessage);
        }
        toast.add({ title: $ts("success"), description: $ts("success_to_add_news") });
        emit("triggerRefresh");
    } catch (error) {
        toast.add({ title: $ts("failed"), description: $ts("failed_to_add_news") });
    } finally {
        loading.value = false;
    }
};


/**
 * Handle image change
 * @param {File} f - Selected image file
 */
const onChangeImage = async (f?: File | null) => {
    if (!f) return;
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        alwaysKeepResolution: true
    }
    const compressedFile = await imageCompression(f, options);
    const blob = URL.createObjectURL(compressedFile);
    ImageCropModal.open({
        img: blob,
        title: compressedFile.name,
        stencil: {
            movable: true,
            resizable: true,
            aspectRatio: 16 / 9,
        },
        onCropped: (f: File) => {
            file.value = f;
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
                    <USelectMenu v-model="(news.category as string)" :items="categoryOptions" create-item
                        :size="responsiveUISizes.select" value-key="value" class="w-full"
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
                <UFormField :label="$ts('image')">
                    <UFileUpload :size="responsiveUISizes.input"  accept="image/*" v-model="file" @update:model-value="onChangeImage">
                    </UFileUpload>
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
                <UButton @click="$emit('close')" :label="$ts('cancel')" :size="responsiveUISizes.button" :loading="loading" :disabled="loading" />
                <!-- Submit button -->
                <UButton @click="addNews" :label="$ts('save')" :size="responsiveUISizes.button" :loading="loading" :disabled="loading" />
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>