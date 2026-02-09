<template>
    <UContainer class="py-16">
        <UCard>
            <template #header>
                <div class="flex items-center justify-between">
                    <div class="space-y-1.5 gap-2">
                        <UBadge :color="aspiration.read ? 'success' : 'warning'" class="max-w-[200px]"
                            :icon="aspiration.read ? 'i-heroicons-check-circle' : 'i-heroicons-exclamation-circle'"
                            :label="aspiration.read ? 'Readed' : 'Unreaded'">
                        </UBadge>
                        <h1 class="text-2xl font-bold ms-3">{{ aspiration.subject }}</h1>
                    </div>
                    <div class="flex items-center gap-2">
                        <UButton :color="aspiration.archived ? 'neutral' : 'primary'" @click="archiveAspiration">
                            <template #leading>
                                <Icon
                                    :name="aspiration.archived ? 'i-heroicons-archive-box' : 'i-heroicons-archive-box-arrow-down'" />
                            </template>
                            {{ aspiration.archived ? 'Batalkan Arsip' : 'Arsipkan' }}
                        </UButton>
                        <UButton color="error" variant="outline" @click="deleteAspiration"
                            :disabled="!isMine || !isOrganizer">
                            <template #leading>
                                <Icon
                                    :name="aspiration.deleted ? 'i-heroicons-arrow-uturn-left' : 'i-heroicons-trash'" />
                            </template>
                            {{ aspiration.deleted ? 'Pulihkan' : 'Hapus' }}
                        </UButton>
                    </div>
                </div>
            </template>

            <div class="space-y-6">
                <div>
                    <p class="whitespace-pre-wrap">{{ aspiration.message }}</p>
                </div>

                <USeparator />

                <div>
                    <h2 class="mb-2 text-xl font-semibold">{{ 'dari' }}</h2>
                    <div v-if="aspiration.anonymous">
                        <UBadge color="neutral">{{ 'Anonim' }}</UBadge>
                    </div>
                    <div v-else-if="typeof aspiration.from === 'object' && aspiration.from !== null">
                        <p><strong>Name:</strong> {{ (aspiration.from as IMember).fullName }}</p>
                        <p><strong>NIM:</strong> {{ (aspiration.from as IMember).NIM }}</p>
                    </div>
                    <div v-else>
                        <UBadge color="error">Unknown Sender</UBadge>
                    </div>
                </div>
            </div>

            <template #footer>
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">

                        <UButton variant="link"
                            :icon="voted && voteType == 'upvote' ? 'i-heroicons-hand-thumb-up-20-solid' : 'i-heroicons-hand-thumb-up'"
                            :color="voted && voteType == 'upvote' ? 'success' : 'neutral'" @click="vote('upvote')">
                        </UButton>
                        <span class="text-sm font-semibold">{{ aspiration.totalVotes || 0 }}</span>
                        <UButton variant="link"
                            :icon="voted && voteType == 'downvote' ? 'i-heroicons-hand-thumb-down-20-solid' : 'i-heroicons-hand-thumb-down'"
                            :color="voted && voteType == 'downvote' ? 'error' : 'neutral'" @click="vote('downvote')">
                        </UButton>
                    </div>

                </div>
                <div class="flex flex-wrap items-center gap-3 mt-4">
                    <div class="flex items-center justify-between w-full gap-3">
                        <UButton class="flex-1" v-if="isMine" color="secondary" block variant="solid"
                            :size="responsiveUISizes.button" icon="i-heroicons-photo" @click="addPhoto">{{
                                'Tambah' /* params: { key: 'Foto' } */ }}
                        </UButton>
                        <UButton class="flex-1" v-if="isMine" color="secondary" block variant="solid"
                            :size="responsiveUISizes.button" icon="i-heroicons-film" @click="addVideo">{{
                                'Tambah' /* params: { key: 'Video' } */ }}
                        </UButton>
                    </div>
                    <UButton class="flex-1" v-if="isMine" color="neutral" block variant="solid"
                        :size="responsiveUISizes.button" icon="i-heroicons-document" @click="addDoc">{{ 'Tambah' /*
                        params: {
                        key:
                        'Dokumen'
                        } */ }}
                    </UButton>
                </div>
            </template>
        </UCard>
        <!-- Bukti Section -->
        <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12" id="bukti">
            <template #header>
                <h2
                    :class="['font-normal leading-tight text-gray-800 dark:text-gray-200 ms-2', responsiveClasses.listTitle]">
                    {{ 'Bukti' }}
                </h2>
            </template>
            <UTabs :items="items" class="w-full">
                <template #content="{ item }">
                    <div v-if="item.key === 'photos'">
                        <div class="flex flex-col gap-2 mt-4" v-if="photos">
                            <div v-if="!photos.length" class="flex items-center justify-center">
                                <span>{{ 'No Available' /* params: { key: 'Foto' } */ }}</span>
                            </div>
                            <div v-else>
                                <div class="flex flex-wrap gap-4">
                                    <div v-for="photo, i in photos" :key="i" class="relative max-w-md group">
                                        <NuxtImg provider="localProvider" class="rounded-lg max-h-[250px]"
                                            :src="(photo.image as string)" :alt="`${i}`" @click="openImageModal(photo)"
                                            loading="lazy" />
                                        <div
                                            class="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-[25px] backdrop-blur-sm">
                                        </div>
                                        <UDropdownMenu :items="photosDropdownItems(photo)"
                                            class="absolute top-0 right-0 mx-2 mt-1"
                                            :popper="{ arrow: true, strategy: 'absolute' }"
                                            :size="responsiveUISizes.button">
                                            <UButton icon="i-heroicons-ellipsis-vertical" size="xl" variant="ghost"
                                                :padded="false" color="primary" />
                                        </UDropdownMenu>
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center justify-between gap-1.5 my-4">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-sm leading-5">Rows per page:</span>
                                        <USelect v-model="perPage" :items="perPageOptions"
                                            :size="responsiveUISizes.select" class="w-20 me-2" />
                                    </div>
                                    <div>

                                        <span class="text-sm leading-5">
                                            Showing
                                            <span class="font-medium">{{ pageFromPhotos }}</span>
                                            to
                                            <span class="font-medium">{{ pageToPhotos }}</span>
                                            of
                                            <span class="font-medium">{{ pageTotalPhotos }}</span>
                                            results
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <UPagination v-model:page="page" :items-per-page="perPage"
                                            :total="aspiration.proofs?.photos?.length!"
                                            :sibling-count="isMobile ? 2 : 6" />

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="item.key === 'videos'">
                        <div class="flex flex-col gap-2 mt-4">
                            <div v-if="!groupedVideos" class="flex items-center justify-center">
                                <span>{{ 'No Available' /* params: { key: 'Video' } */ }}</span>
                            </div>
                            <div v-else>
                                <div class="flex flex-wrap gap-3">
                                    <div v-for="video, i in videos" :key="i" class="relative w-full max-w-md group">
                                        <VideoPlayer provider="localProvider" class="rounded-lg max-h-[250px] w-full"
                                            :options="videoOptions(video.video as string)" :alt="`${i}`" />
                                        <div
                                            class="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-[50px] backdrop-blur-md">
                                        </div>
                                        <UDropdownMenu :items="videosDropdownItems(video)"
                                            class="absolute top-0 right-0 m-px"
                                            :popper="{ arrow: true, strategy: 'absolute' }"
                                            :size="responsiveUISizes.button">
                                            <UButton icon="i-heroicons-ellipsis-vertical" size="xl" variant="link"
                                                color="neutral" />
                                        </UDropdownMenu>
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center justify-between gap-1.5 my-4">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-sm leading-5">Rows per page:</span>
                                        <USelect v-model="perPage" :items="perPageOptions"
                                            :size="responsiveUISizes.select" class="w-20 me-2" />
                                    </div>
                                    <div>

                                        <span class="text-sm leading-5">
                                            Showing
                                            <span class="font-medium">{{ pageFromVideos }}</span>
                                            to
                                            <span class="font-medium">{{ pageToVideos }}</span>
                                            of
                                            <span class="font-medium">{{ pageTotalVideos }}</span>
                                            results
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <UPagination v-model:page="page" :items-per-page="perPage"
                                            :total="aspiration.proofs?.videos?.length!"
                                            :sibling-count="isMobile ? 2 : 6" />

                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div v-if="item.key === 'docs'">
                        <div class="flex flex-col gap-2 mt-4">
                            <div v-if="!docs" class="flex items-center justify-center">
                                <span>{{ 'No Available' }}</span>
                            </div>
                            <div v-else>
                                <div v-if="docs.length">
                                    <ul>
                                        <li v-for="(doc, index) in docs" :key="index">
                                            <DocListItem :doc="doc" :edit-options="docsDropdownItems(doc)"
                                                @trigger-refresh="refresh" />
                                        </li>
                                    </ul>
                                </div>
                                <div v-else>
                                    <span>No documents available</span>
                                </div>
                                <div class="flex flex-wrap items-center justify-between gap-1.5 my-4">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-sm leading-5">Rows per page:</span>
                                        <USelect v-model="perPage" :items="perPageOptions"
                                            :size="responsiveUISizes.select" class="w-20 me-2" />
                                    </div>
                                    <div>
                                        <span class="text-sm leading-5">
                                            Showing
                                            <span class="font-medium">{{ pageFromDocs }}</span>
                                            to
                                            <span class="font-medium">{{ pageToDocs }}</span>
                                            of
                                            <span class="font-medium">{{ pageTotalDocs }}</span>
                                            results
                                        </span>
                                    </div>
                                    <UPagination v-model:page="page" :items-per-page="perPage"
                                        :total="aspiration.proofs?.docs?.length!" :sibling-count="isMobile ? 2 : 6" />

                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </UTabs>
        </UCard>
    </UContainer>
</template>

<script setup lang="ts">
import { ModalsConfirmation, ModalsDocAdd, ModalsImageAdd, ModalsImageOpen, ModalsVideoAdd } from '#components';
import type { IAspiration, IDoc, IMember, IPhoto, IVideo } from '~~/types';
import type { IAspirationResponse, IResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth',
});

const route = useRoute();
const id = route.params.id;
const photoId = ref('');

const config = useRuntimeConfig();
const { width } = useWindowSize();

const isMobile = computed(() => width.value < 768);
/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = computed<{ [key: string]: 'sm' | 'md' }>(() => ({
    button: isMobile.value ? 'sm' : 'md',
    input: isMobile.value ? 'sm' : 'md',
    breadcrumb: isMobile.value ? 'sm' : 'md',
}));
/**
 * Computed property for responsive class names
 */
const responsiveClasses = computed(() => ({
    cardHeader: isMobile.value ? 'text-2xl' : 'text-4xl',
    eventDetailsWrapper: isMobile.value ? 'mt-4' : 'ml-4',
    listItem: isMobile.value ? 'text-sm' : 'text-md',
    listTitle: isMobile.value ? 'text-md' : 'text-xl',
    icon: isMobile.value ? 'w-3 h-3' : 'w-4 h-4',
}));
const items = computed(() => [
    {
        label: 'Photos',
        icon: 'i-heroicons-photo',
        key: 'photos'
    },
    {
        label: 'Videos',
        icon: 'i-heroicons-play',
        key: 'videos'
    },
    {
        label: 'Docs',
        icon: 'i-heroicons-document-text',
        key: 'docs'
    }
]);
const { $api } = useNuxtApp();
const { data, refresh } = useLazyAsyncData<IAspirationResponse>('aspiration', () => $api(`api/aspiration`, {
    query: { id },
}));
const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);

const toast = useToast();
const overlay = useOverlay();
const ConfirmationModal = overlay.create(ModalsConfirmation);
const addPhotoModal = overlay.create(ModalsImageAdd);
const addVideoModal = overlay.create(ModalsVideoAdd);
const addDocModal = overlay.create(ModalsDocAdd);
const ImageModal = overlay.create(ModalsImageOpen);

const voted = computed<boolean>(() => data.value?.data?.voted || false);
const voteType = computed<"upvote" | "downvote" | "">(() => data.value?.data?.voteType || "");
const isMine = computed<boolean>(() => data.value?.data?.isMine || false);
// Sample aspiration data (you would typically fetch this from an API)
const aspiration = computed<IAspiration>(() => (data.value?.data?.aspiration || {
    id: '1',
    subject: 'Hello World',
    message: 'This is a sample aspiration message.',
    anonymous: false,
    read: false,
    archived: false,
    deleted: false,
    totalVotes: 0,
    votes: [
        {
            user: "",
            voteType: 'upvote'
        }
    ]
}))

const vote = async (voteType: 'upvote' | 'downvote') => {
    try {
        const response = await $api<IResponse>(`/api/aspiration/${route.params.id}/vote`, {
            method: 'POST',
            body: JSON.stringify({
                voteType,
            }),
        });
        refresh();
        toast.add({
            title: voteType === 'upvote' ? 'Upvoted' : 'Downvoted',
            color: 'success',
            description: 'Your vote has been submitted',
        });
    } catch (error) {
        console.error('Error voting:', error);
        toast.add({
            title: voteType === 'upvote' ? 'Error upvoting' : 'Error downvoting',
            color: 'error',
            description: 'Please try again',
        });
    }
};

const archiveAspiration = async () => {
    ConfirmationModal.open({
        title: aspiration.value.archived ? 'Batalkan Arsip' : 'Arsipkan',
        body: aspiration.value.archived ? 'Unarchive Aspiration Description' : 'Archive Aspiration Description',
        onConfirm: async () => {
            try {
                const response = await $api<IResponse>(`/api/aspiration/${id}/archive`, {
                    method: 'GET',
                });
                toast.add({
                    title: aspiration.value.archived ? 'Aspirasi berhasil dipulihkan' : 'Aspirasi berhasil diarsipkan',
                    color: 'success',
                });
            } catch (error: any) {
                toast.add({
                    title: "Error",
                    description: error.data.statusMessage,
                    color: 'error',
                });
            } finally {
                refresh();
                ConfirmationModal.close();
            }
        }
    });
}

const deleteAspiration = () => {
    ConfirmationModal.open({
        title: aspiration.value.deleted ? 'Pulihkan' : 'Hapus',
        body: aspiration.value.deleted ? 'Restore Aspiration Description' : 'Delete Aspiration Description',
        onConfirm: async () => {
            try {
                const response = await $api<IResponse>(`/api/aspiration`, {
                    method: 'DELETE',
                    query: { id },
                });
                toast.add({
                    title: aspiration.value.deleted ? 'Aspirasi berhasil dipulihkan' : 'Aspirasi berhasil dihapus',
                    color: 'success',
                });
            } catch (error: any) {
                toast.add({
                    title: "Error",
                    description: error.data.statusMessage,
                    color: 'error',
                });
            } finally {
                refresh();
                ConfirmationModal.close();
            }
        }
    });
}

const page = ref(1);
const perPage = ref(9);
const perPageOptions = computed(() => {
    const totalPhotos = aspiration.value.proofs?.photos?.length || 0;
    const maxOptions = 3;
    const baseOption = Math.max(3, Math.ceil(totalPhotos / 9)); // Minimum of 3 photos per page

    return Array.from({ length: maxOptions }, (_, index) => baseOption * (index + 1) * 3)
        .filter(option => option <= totalPhotos);
});
const pageTotalPhotos = computed(() => aspiration.value.proofs?.photos?.length) // This value should be dynamic coming from the API
const pageFromPhotos = computed(() => (page.value - 1) * perPage.value + 1)
const pageToPhotos = computed(() => Math.min(page.value * perPage.value, pageTotalPhotos.value || 0));

const pageTotalVideos = computed(() => aspiration.value.proofs?.videos?.length) // This value should be dynamic coming from the API
const pageFromVideos = computed(() => (page.value - 1) * perPage.value + 1)
const pageToVideos = computed(() => Math.min(page.value * perPage.value, pageTotalVideos.value || 0))

const pageTotalDocs = computed(() => aspiration.value.proofs?.docs?.length) // This value should be dynamic coming from the API
const pageFromDocs = computed(() => (page.value - 1) * perPage.value + 1)
const pageToDocs = computed(() => Math.min(page.value * perPage.value, pageTotalDocs.value || 0));


const photos = computed(() => {
    const start = (page.value - 1) * perPage.value;
    const end = start + perPage.value;
    return aspiration.value.proofs?.photos?.slice(start, end);
});
const videos = computed(() => {
    const start = (page.value - 1) * perPage.value;
    const end = start + perPage.value;
    return aspiration.value.proofs?.videos?.slice(start, end);
});

const docs = computed(() => {
    const start = (page.value - 1) * perPage.value;
    const end = start + perPage.value;
    return aspiration.value.proofs?.docs?.slice(start, end);
});

// Tambahkan fungsi untuk mengelompokkan foto
const groupedVideos = computed(() => {
    if (!data.value && !videos.value) return [];
    return videos.value?.reduce<IVideo[][]>((result, item, index) => {
        const chunkIndex = Math.floor(index / 3);
        if (!result[chunkIndex]) {
            result[chunkIndex] = []; // Type is inferred as IPhoto[]
        }
        result[chunkIndex].push(item);
        return result;
    }, []);
});
const videoOptions = (url: string) => ({
    controls: true,
    fluid: true,
    sources: [
        {
            src: config.public.public_uri + url,
            type: 'video/mp4'
        }
    ]
});

const deletePhoto = (id: string) => {
    ConfirmationModal.open({
        title: 'Hapus' /* params: { key: 'Foto' } */,
        body: 'Apakah Anda yakin ingin menghapus {key} ini?' /* params: { key: 'Foto' } */,
        onConfirm: () => {
            $api<IResponse>(`/api/photo`, {
                method: 'delete',
                query: {
                    id
                }
            }).then((response) => {
                toast.add({
                    title: "Success",
                    description: response.statusMessage,
                    color: 'success',
                });
            }).catch((error) => {
                toast.add({
                    title: "Error",
                    description: error.data.statusMessage,
                    color: 'error',
                });
            }).finally(() => {
                refresh();
                ConfirmationModal.close();
            });
        }
    });
}

const deleteVideo = (id: string) => {
    ConfirmationModal.open({
        title: 'Hapus' /* params: { key: 'Video' } */,
        body: 'Apakah Anda yakin ingin menghapus {key} ini?' /* params: { key: 'Video' } */,
        onConfirm: () => {
            $api<IResponse>(`/api/video`, {
                method: 'delete',
                query: {
                    id
                }
            }).then((response) => {
                toast.add({
                    title: "Success",
                    description: response.statusMessage,
                    color: 'success',
                });
            }).catch((error) => {
                toast.add({
                    title: "Error",
                    description: error.data.statusMessage,
                    color: 'error',
                });
            }).finally(() => {
                refresh();
                ConfirmationModal.close();
            });
        }
    });
}
const download = (title: string, file: string) => {
    const link = document.createElement('a');
    if (typeof file === 'string') {
        link.href = file;
        link.download = title;
    } else {
        console.error('Document URL is not a string');
        return;
    }
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
const deleteDoc = async (id: string) => {
    ConfirmationModal.open({
        title: 'Hapus' /* params: { key: 'Dokumen' } */,
        body: 'Apakah Anda yakin ingin menghapus {key} ini?' /* params: { key: 'Dokumen' } */,
        onConfirm: async () => {
            try {
                const deleted = await $api<IResponse>(`/api/doc`, {
                    method: "DELETE",
                    query: { id }
                });
                if (deleted.statusCode != 200) {
                    toast.add({ title: "Failed to delete document", description: deleted.statusMessage });
                }
                toast.add({ title: deleted.statusMessage });
            } catch (error: any) {
                toast.add({ title: "Failed to delete document", description: error.message });
            } finally {
                refresh();
                ConfirmationModal.close();
            }
        }
    });
};
const addPhoto = () => {
    addPhotoModal.open({
        async onPhoto({ photos }: { photos: IPhoto[] }) {
            try {
                for (let index = 0; index < photos.length; index++) {
                    const photo = photos[index];
                    const response = await $api<IResponse>(`/api/aspiration/${id}/photo`, {
                        method: "POST",
                        body: { photo }
                    });
                    toast.add({ title: response.statusMessage });
                }
                refresh();
            } catch (error) {
                toast.add({ title: "Failed to add photo" });
            } finally {
                addPhotoModal.close();
            }
        }
    });
}
const addVideo = () => {
    addVideoModal.open({
        onVideo({ videos }: { videos: IVideo[] }) {
            try {
                videos.forEach(async (video) => {
                    const response = await $api<IResponse>(`/api/aspiration/${id}/video`, {
                        method: "POST",
                        body: { video }
                    });
                    toast.add({ title: response.statusMessage });
                });
            } catch (error: any) {
                toast.add({ title: "Failed to add video", description: error.statusMessage });
            } finally {
                refresh();
                addVideoModal.close();
            }
        }
    });
}
const addDoc = () => {
    addDocModal.open({
        async onDoc(v: IDoc) {
            try {
                const response = await $api<IResponse>(`/api/aspiration/${id}/doc`, {
                    method: "POST",
                    body: v
                });
                toast.add({ title: response.statusMessage });
                refresh();
            } catch (error) {
                toast.add({ title: "Failed to add photo" });
            }
            finally {
                addDocModal.close();
            }
        }
    });
}
const openImageModal = (photo: IPhoto) => {
    ImageModal.open({
        photo,
        canRemove: true,

        onRemove() {
            photoId.value = photo._id as string;
            ConfirmationModal.open({
                title: 'Hapus' /* params: { key: 'Foto' } */,
                body: 'Apakah Anda yakin ingin menghapus {key} ini?' /* params: { key: 'Foto' } */,
                onConfirm: () => {
                    $api<IResponse>(`/api/photo`, {
                        method: 'delete',
                        query: {
                            id: photoId.value
                        }
                    }).then((response) => {
                        toast.add({
                            title: "Success",
                            description: response.statusMessage,
                            color: 'success',
                        });
                    }).catch((error) => {
                        toast.add({
                            title: "Error",
                            description: error.data.statusMessage,
                            color: 'error',
                        });
                    }).finally(() => {
                        refresh();
                        ConfirmationModal.close();
                    });
                }
            });
        },
        onDownload() {
            download(new Date().toUTCString(), photo.image as string);
        }
    })
};

const photosDropdownItems = (photo: IPhoto) => [[
    {
        label: 'Lihat',
        icon: 'i-heroicons-eye',
        click: () => openImageModal(photo)
    },
    {
        label: 'Hapus',
        icon: 'i-heroicons-trash',
        disabled: !isMine.value,
        click: () => deletePhoto(photo._id as string)
    }
]]
const videosDropdownItems = (video: IVideo) => [[
    // {
    //     label: 'Open',
    //     icon: 'i-heroicons-eye',
    //     click: () => openImageModal(photo)
    // },
    {
        label: 'Hapus',
        icon: 'i-heroicons-trash',
        disabled: !isMine.value,
        click: () => deleteVideo(video._id as string)
    }
]]
const docsDropdownItems = (doc: IDoc) => [[
    {
        label: 'Unduh',
        icon: 'i-heroicons-arrow-down-tray',
        onSelect: () => download(doc.label, doc.doc as string)
    },
    {
        label: 'Hapus',
        icon: 'i-heroicons-trash',
        disabled: !isMine.value,
        onSelect: () => deleteDoc(doc._id as string)
    }
]];
</script>