<script setup lang="ts">
import { ModalsConfirmation, ModalsImageAdd, ModalsImageOpen } from '#components';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { ICategory, IMember, IPhoto, IProject } from '~~/types';
import type { IProjectsResponse, IResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'client',
    auth: false
})
const route = useRoute()
const { width } = useWindowSize();
const { data: user } = useAuth();
const { $api } = useNuxtApp();
const { $ts } = useI18n();
const toast = useToast();

const overlay = useOverlay();
const ImageAddComp = overlay.create(ModalsImageAdd);
const ImageOpenComp = overlay.create(ModalsImageOpen);
const ConfirmComp = overlay.create(ModalsConfirmation);

const { data, refresh } = useAsyncData(() => $api<IProjectsResponse>(`/api/project`, {
    query: {
        id: route.params.id
    }
}))

const modalConfirmation = ref(false);
const photoId = ref('');

const project = computed(() => data.value?.data?.project);
const isMobile = computed(() => width.value < 768);
// Tambahkan fungsi untuk mengelompokkan foto
const groupedPhotos = computed(() => {

    if (!data.value) return [];
    return project.value?.photos?.reduce<IPhoto[][]>((result, item, index) => {
        const chunkIndex = Math.floor(index / 3);
        if (!result[chunkIndex]) {
            result[chunkIndex] = []; // Type is inferred as IPhoto[]
        }
        result[chunkIndex].push(item);
        return result;
    }, []);
});

const page = ref(1);
const perPage = ref(9);

const perPageOptions = computed(() => {
    const totalPhotos = project.value?.photos?.length || 0;
    const maxOptions = 3;
    const baseOption = Math.max(3, Math.ceil(totalPhotos / 9)); // Minimum of 3 photos per page

    return Array.from({ length: maxOptions }, (_, index) => baseOption * (index + 1) * 3)
        .filter(option => option <= totalPhotos);
});
const pageTotal = computed(() => project.value?.photos?.length) // This value should be dynamic coming from the API
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1)
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value || 0));


const deletePhoto = (id: string) => {
    $api<IResponse>(`/api/photo`, {
        method: 'delete',
        query: {
            id
        }
    }).then((response) => {
        refresh();
        toast.add({
            title: $ts('success'),
            description: response.statusMessage,
            color: 'success',
        });
    }).catch((error) => {
        toast.add({
            title: $ts('failed'),
            description: error.data.statusMessage,
            color: 'error',
        });
    });
    modalConfirmation.value = false;
}

const addPhotoModal = () => {
    ImageAddComp.open({
        async onPhoto({ photos }: { photos: IPhoto[] }) {
            try {
                const promises = photos.map(async (photo) => {
                    const formData = new CustomFormData<IPhoto>();
                    formData.append('image', photo.image as File);
                    formData.append('tags', JSON.stringify(photo.tags));
                    return $api<IResponse>(`/api/project/${route.params.id}/photo`, {
                        method: "POST",
                        body: formData.getFormData()
                    });
                });
                await Promise.all(promises);
                refresh();
                toast.add({ title: "Photo added" });
            } catch (error) {

                toast.add({ title: "Failed to add photo" });
            } finally {
                ImageAddComp.close();
            }
        }
    });
}

const openImageModal = (photo: IPhoto) => {
    ImageOpenComp.open({
        photo,
        canRemove: project.value?.members.map(member => (member as IMember).NIM).includes(user.value?.member.NIM as number),
        onRemove: () => {
            photoId.value = photo._id as string;
            modalConfirmation.value = true;
        },
        onDownload: () => {
            const link = document.createElement('a');
            link.href = photo.image as string;
            link.download = photo.tags?.join('-') || 'photo';
            link.click();
        }
    })
};
const responsiveUISizes = computed<{ [key: string]: 'sm' | 'md' }>(() => ({
    button: isMobile.value ? 'sm' : 'md',
    input: isMobile.value ? 'sm' : 'md',
}));
watch(data, () => {
    useHead({
        title: `${(data.value?.data?.project as IProject)?.title} | Project`
    });
});
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('project'),
    icon: 'i-heroicons-code-bracket',
    to: '/projects'
}, {
    label: (data.value?.data?.project as IProject)?.title,
    icon: 'i-heroicons-link'
}]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :links="links" />
        <div v-if="project">
            <UCard class="mt-2" :ui="{ header: 'p-0 sm:p-0', root: 'overflow-hidden' }">
                <template #header>
                    <NuxtImg provider="localProvider" :src="project.image as string" :alt="project.title" size="3xl"
                        class="object-cover w-full h-64" />
                </template>
                <div class="space-y-6">
                    <div class="flex items-center justify-between">
                        <h1 class="text-3xl font-bold">{{ project.title }}</h1>
                    </div>
                    <div v-if="project?.publishedAt" class="mt-2">
                        <div v-if="project?.publishedAt"
                            class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                            <span>
                                {{ $ts('published_at') }} {{ new Date(project?.publishedAt!).toLocaleDateString('id-ID',
                                    {
                                        dateStyle:
                                            'long'
                                    }) }}
                                {{ $ts('by') }}</span>
                            <UAvatarGroup :max="3">
                                <UAvatar v-for="member, i in project?.members" :key="i"
                                    :src="(member as IMember).avatar" :alt="(member as IMember).NIM.toString()"
                                    size="sm" />
                            </UAvatarGroup>
                        </div>
                        <span v-else class="text-gray-500 dark:text-gray-400">
                            {{ $ts('draft') }}
                        </span>
                    </div>
                    <div v-if="project?.category" class="mt-2">
                        <span class="text-gray-500">{{ $ts('category') }} : </span>
                        <UBadge>{{
                            (project?.category as ICategory)?.title }}</UBadge>
                    </div>
                    <CoreContent :content="project.description" />
                    <div class="mt-2">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-hashtag" size="24" />
                            <h2 class="mb-2 text-xl font-semibold">{{ $ts('tag') }}</h2>
                        </div>
                        <div class="flex items-center gap-2">
                            <UBadge v-for="(tag, index) in project.tags" :key="index" color="secondary" size="lg">{{ tag
                            }}
                            </UBadge>
                        </div>
                    </div>
                    <div class="mt-2">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-calendar" size="24" />
                            <h2 class="mb-2 text-xl font-semibold">{{ $ts('date') }}</h2>
                        </div>
                        <p class="my-2 ms-2">{{ new Date(project.date).toLocaleDateString('id-ID', {
                            dateStyle: 'long'
                        }) }}</p>
                    </div>
                    <div class="mt-2">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-arrow-trending-up" size="24" />
                            <h2 class="mb-2 text-xl font-semibold">{{ $ts('progress') }}</h2>
                        </div>
                        <UProgress class="my-2" :model-value="Math.ceil(project.progress / 20)"
                            :color="project.progress === 100 ? 'success' : 'secondary'" status
                            :max="['Not Started', 'Starting', 'On Progress', 'On Progress', 'On Progress', 'Complete']" />
                    </div>
                    <div class="mt-2">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-link" size="24" />
                            <h2 class="mb-2 text-xl font-semibold">{{ $ts('link') }}</h2>
                        </div>
                        <UButton class="my-2" v-if="project.url" :to="project.url" target="_blank"
                            rel="noopener noreferrer" color="neutral">
                            {{ $ts('open') }}
                        </UButton>
                    </div>
                    <div class="mt-2">
                        <div class="flex items-center gap-2">
                            <UIcon name="i-heroicons-user" size="24" />
                            <h2 class="mb-2 text-xl font-semibold">{{ $ts('member') }}</h2>
                        </div>
                        <UAvatarGroup size="md" :max="5" class="my-2 ms-2">
                            <UTooltip v-for="member in project.members" :key="(member as IMember).NIM"
                                :text="(member as IMember).fullName" :popper="{ strategy: 'absolute' }">
                                <UAvatar :src="(member as IMember).avatar" :alt="(member as IMember).fullName" />
                            </UTooltip>
                        </UAvatarGroup>
                    </div>
                </div>
            </UCard>
            <UCard class="mt-4">
                <template #header>
                    <h2 class="mb-2 text-xl font-semibold">{{ $ts('gallery') }}</h2>
                </template>
                <div v-if="!groupedPhotos?.length" class="flex items-center justify-center">
                    <span>No photos available</span>
                </div>
                <div v-else :class="`grid grid-cols-1 gap-4 md:grid-cols-${Math.floor(groupedPhotos.length / 1)}`">
                    <div v-for="(group, groupIndex) in groupedPhotos" :key="groupIndex" class="grid gap-4">
                        <div v-for="photo, i in group" :key="i" class="relative w-full group">
                            <NuxtImg provider="localProvider" class="object-cover w-full h-full rounded-lg"
                                :src="(photo.image as string)" :alt="`${i}`" @click="openImageModal(photo)" />
                            <!-- <div
                                class="absolute top-0 left-0 flex flex-col items-center justify-center w-full h-0 duration-500 bg-black opacity-0 group-hover:h-full group-hover:opacity-70">
                                <UButton icon="i-heroicons-trash" size="xl" variant="ghost" color="error"
                                    @click="deletePhoto(photo._id as string)" />
                                <UCheckbox v-model="photo.showInCarrousel"
                                    @update:modelValue="setShow(photo._id as string, photo.showInCarrousel!)"
                                    label="Show to public" />
                            </div> -->
                        </div>
                    </div>
                </div>
                <div class="flex flex-wrap items-center justify-between gap-1.5 my-4">
                    <div class="flex items-center gap-1.5">
                        <span class="text-sm leading-5">Rows per page:</span>
                        <USelect v-model="perPage" :options="perPageOptions" :size="responsiveUISizes.select"
                            class="w-20 me-2" />
                    </div>
                    <div>

                        <span class="text-sm leading-5">
                            Showing
                            <span class="font-medium">{{ pageFrom }}</span>
                            to
                            <span class="font-medium">{{ pageTo }}</span>
                            of
                            <span class="font-medium">{{ pageTotal }}</span>
                            results
                        </span>
                    </div>
                    <div class="flex items-center gap-3">
                        <UPagination v-model:page="page" :items-per-page="perPage" :total="project.photos?.length!"
                            :sibling-count="isMobile ? 2 : 6" />
                    </div>
                </div>
                <template #footer>
                    <UButton class="flex-1" color="secondary" block variant="solid" :size="responsiveUISizes.button"
                        icon="i-heroicons-user-plus"
                        v-if="project.members.map(member => (member as IMember).NIM).includes(user?.member.NIM as number)"
                        @click="addPhotoModal">Add Photo</UButton>
                </template>
            </UCard>
        </div>
        <UCard v-else>
            <USkeleton class="w-full h-64 mb-4" />
            <USkeleton class="w-3/4 h-8 mb-4" />
            <USkeleton class="w-full h-4 mb-2" v-for="i in 5" :key="i" />
        </UCard>
        <ModalsConfirmation v-model="modalConfirmation" @confirm="deletePhoto(photoId)" title="Delete Photo"
            body='Are you sure you want to delete this photo?' />
    </div>
</template>