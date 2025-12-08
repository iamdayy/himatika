<script setup lang='ts'>
import { ModalsConfirmation, ModalsDocAdd, ModalsImageAdd, ModalsImageOpen, ModalsPDF, ModalsVideoAdd, UIcon } from '#components';
import type { DropdownMenuItem, TabsItem } from '@nuxt/ui';
import type { DriveStep } from 'driver.js';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { ICategory, ICommittee, IDoc, IMember, IParticipant, IPhoto, IVideo } from '~~/types';
import type { IAgendaResponse, IResponse } from '~~/types/IResponse';

definePageMeta({
    layout: "client",
    auth: false
});
const route = useRoute();
const { $ts } = useI18n();
const id = route.params.id;

const organizerStore = useOrganizerStore();
const { isOrganizer } = storeToRefs(organizerStore);
const overlay = useOverlay();
const ConfirmationModal = overlay.create(ModalsConfirmation);
const addPhotoModalComp = overlay.create(ModalsImageAdd);
const addVideoModalComp = overlay.create(ModalsVideoAdd);
const addDocModalComp = overlay.create(ModalsDocAdd);
const pdfModalComp = overlay.create(ModalsPDF);
const ImageModalComp = overlay.create(ModalsImageOpen);

const config = useRuntimeConfig();
const { $api, $pageGuide } = useNuxtApp();
const { data: user } = useAuth();
const toast = useToast();
const { data: agenda, refresh } = useAsyncData('agenda', async () => $api<IAgendaResponse>('/api/agenda', {
    query: {
        id
    }
}), {
    transform: (data) => data.data?.agenda,
});
const { isCommittee, isRegistered, registeredId, payStatus, canMeUnregister, canMeRegisterAsCommittee, canMeRegisterAsParticipant } = useAgendas(agenda);
const { makeAgendaPrecenceWithQRCode } = useMakeDocs(agenda.value);

const page = ref(1);
const perPage = ref(9);


const perPageOptions = computed(() => {
    const totalPhotos = agenda.value?.photos?.length || 0;
    const maxOptions = 3;
    const baseOption = Math.max(3, Math.ceil(totalPhotos / 9)); // Minimum of 3 photos per page
    const options = [];
    for (let i = 1; i <= maxOptions; i++) {
        options.push(baseOption * i);
    }
    return options.map((value) => ({
        label: `${value} ${$ts('photo')}`,
        value
    }));
});
const pageTotalPhotos = computed(() => agenda.value?.photos?.length) // This value should be dynamic coming from the API
const pageFromPhotos = computed(() => (page.value - 1) * perPage.value + 1)
const pageToPhotos = computed(() => Math.min(page.value * perPage.value, pageTotalPhotos.value || 0));

const pageTotalVideos = computed(() => agenda.value?.videos?.length) // This value should be dynamic coming from the API
const pageFromVideos = computed(() => (page.value - 1) * perPage.value + 1)
const pageToVideos = computed(() => Math.min(page.value * perPage.value, pageTotalVideos.value || 0))

const pageTotalDocs = computed(() => agenda.value?.docs?.length) // This value should be dynamic coming from the API
const pageFromDocs = computed(() => (page.value - 1) * perPage.value + 1)
const pageToDocs = computed(() => Math.min(page.value * perPage.value, pageTotalDocs.value || 0));


const photos = computed(() => {
    const start = (page.value - 1) * perPage.value;
    const end = start + perPage.value;
    return agenda.value?.photos?.slice(start, end);
});
const videos = computed(() => {
    const start = (page.value - 1) * perPage.value;
    const end = start + perPage.value;
    return agenda.value?.videos?.slice(start, end);
});

const docs = computed(() => {
    const start = (page.value - 1) * perPage.value;
    const end = start + perPage.value;
    return agenda.value?.docs?.slice(start, end);
});

// Tambahkan fungsi untuk mengelompokkan foto
const groupedPhotos = computed(() => {

    if (!agenda.value) return [];
    return photos.value?.reduce<IPhoto[][]>((result, item, index) => {
        const chunkIndex = Math.floor(index / 3);
        if (!result[chunkIndex]) {
            result[chunkIndex] = []; // Type is inferred as IPhoto[]
        }
        result[chunkIndex].push(item);
        return result;
    }, []);
});
// Tambahkan fungsi untuk mengelompokkan foto
const groupedVideos = computed(() => {
    if (!agenda.value && !videos.value) return [];
    return videos.value?.reduce<IVideo[][]>((result, item, index) => {
        const chunkIndex = Math.floor(index / 3);
        if (!result[chunkIndex]) {
            result[chunkIndex] = []; // Type is inferred as IPhoto[]
        }
        result[chunkIndex].push(item);
        return result;
    }, []);
});

const deletePhoto = (id: string) => {
    ConfirmationModal.open({
        title: $ts('delete_photo'),
        body: $ts('delete_photo_confirmation'),
        onConfirm: async () => {
            try {
                const response = await $api<IResponse>(`/api/photo`, {
                    method: 'delete',
                    query: {
                        id
                    }
                });
                refresh();
                toast.add({
                    title: "Success",
                    description: response.statusMessage,
                    color: 'success',
                });
            } catch (error: any) {
                toast.add({
                    title: "Error",
                    description: error.data.statusMessage || "Failed to delete photo",
                    color: 'error',
                });
            } finally {
                ConfirmationModal.close();
            }
        }
    });
}

const deleteVideo = (id: string) => {
    ConfirmationModal.open({
        title: $ts('delete_video'),
        body: $ts('delete_video_confirmation'),
        onConfirm: () => {
            $api<IResponse>(`/api/video`, {
                method: 'delete',
                query: {
                    id
                }
            }).then((response) => {
                refresh();
                toast.add({
                    title: "Success",
                    description: response.statusMessage,
                    color: 'success',
                });
            }).catch((error) => {
                toast.add({
                    title: "Error",
                    description: error.data.statusMessage || "Failed to delete video",
                    color: 'error',
                });
            });
            ConfirmationModal.close();
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
        title: $ts('delete_document'),
        body: $ts('delete_document_confirmation'),
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
                refresh();
            } catch (error: any) {
                toast.add({ title: "Failed to delete document", description: error.message });
            } finally {
                ConfirmationModal.close();
            }
        }
    });
};
const addGalleryDropdown = ref(false);
const addGalleryDropdownItems = computed<DropdownMenuItem[]>(() => [
    {
        label: $ts('add_photo'),
        icon: 'i-heroicons-plus',
        onSelect: () => {
            addPhotoModal();
        }
    },
    {
        label: $ts('add_video'),
        icon: 'i-heroicons-plus',
        onSelect: () => {
            addVideoModal();
        }
    },
    {
        label: $ts('add_document'),
        icon: 'i-heroicons-plus',
        onSelect: () => {
            addDocModal();
        }
    }
]);
const addPhotoModal = () => {
    addPhotoModalComp.open({
        async onPhoto({ photos }: { photos: IPhoto[] }) {
            try {
                photos.forEach(async (photo) => {
                    const formData = new CustomFormData<IPhoto>();
                    formData.append('image', photo.image);
                    formData.append('tags', JSON.stringify(photo.tags) || '');
                    const response = await $api<IResponse>(`/api/agenda/${id}/photo`, {
                        method: "POST",
                        body: formData.getFormData()
                    });
                    toast.add({ title: response.statusMessage });
                    refresh();
                });
            } catch (error) {
                toast.add({ title: "Failed to add photo" });
            } finally {
                addPhotoModalComp.close();
            }
        }
    });
};
const addVideoModal = () => {
    addVideoModalComp.open({
        async onVideo({ videos }: { videos: IVideo[] }) {
            try {
                videos.forEach(async (video) => {
                    const formData = new CustomFormData<IVideo>();
                    formData.append('video', video.video);
                    formData.append('tags', JSON.stringify(video.tags) || '');
                    const response = await $api<IResponse>(`/api/agenda/${id}/video`, {
                        method: "POST",
                        body: formData.getFormData()
                    });
                    toast.add({ title: response.statusMessage });
                    refresh();
                });
            } catch (error) {
                toast.add({ title: "Failed to add video" });
            } finally {
                addVideoModalComp.close();
            }
        }
    });
};
const addDocModal = () => {
    addDocModalComp.open({
        async onDoc(v: IDoc) {
            const formData = new CustomFormData<IDoc>();
            formData.append('doc', v.doc);
            formData.append('no', v.no);
            formData.append('signs', JSON.stringify(v.signs) || '');
            formData.append('label', v.label);
            formData.append('tags', JSON.stringify(v.tags) || '');
            try {
                const response = await $api<IResponse>(`/api/agenda/${id}/doc`, {
                    method: "POST",
                    body: formData.getFormData()
                });
                toast.add({ title: response.statusMessage });
                refresh();
            } catch (error) {
                toast.add({ title: "Failed to add photo" });
            } finally {
                addDocModalComp.close();
            }
        }
    });
};

const openImageModal = (photo: IPhoto) => {
    ImageModalComp.open({
        photo,
        canRemove: isCommittee.value,
        onRemove() {
            deletePhoto(photo._id as string);
            ImageModalComp.close();
        },
        onDownload() {
            download(new Date().toUTCString(), photo.image as string);
        }
    })
};

const createQRDoc = async () => {
    ConfirmationModal.open({
        title: $ts('create_qr_doc'),
        body: $ts('create_qr_doc_confirmation'),
        onConfirm: async () => {
            try {
                const response = await makeAgendaPrecenceWithQRCode();
                toast.add({ title: response.statusMessage });
            } catch (error: any) {
                console.log(error);
                toast.add({ title: "Failed to create document" });
            }
        }
    });
}

const checkQRDocIsExist = () => {
    return agenda.value?.docs?.some(doc => doc.label === `Agenda ${agenda.value?.title} QR Code`);
}

const downloadQRDoc = () => {
    const doc = agenda.value?.docs?.find(doc => doc.label === `Agenda ${agenda.value?.title} QR Code`);
    if (doc) {
        download(doc.label, doc.doc as string);
    }
}


const cancelRegister = async (as: string) => {
    ConfirmationModal.open({
        title: $ts('cancel_registration'),
        body: $ts('cancel_registration_confirmation'),
        onConfirm: async () => {
            if (!agenda.value) return;
            const response = await $api<IResponse>(`/api/agenda/${agenda.value._id}/${as}/register/${registeredId()}`, {
                method: "DELETE"
            });
            if (response.statusCode === 200) {
                toast.add({ title: response.statusMessage });
                refresh();
            } else {
                toast.add({ title: "Failed to cancel register" });
            }
        }
    });
}

/**
 * Detect large screen using windowSize
 */
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 768);


/**
 * Responsive UI sizes for components
 */
const responsiveUISizes = useResponsiveUiSizes();
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('agenda'),
    icon: 'i-heroicons-calendar',
    to: '/agendas'
}, {
    label: (agenda.value)?.title,
    icon: 'i-heroicons-link'
}]);

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

const photosDropdownItems = (photo: IPhoto): DropdownMenuItem[] => [
    {
        label: $ts('open'),
        icon: 'i-heroicons-eye',
        onSelect: () => openImageModal(photo)
    },
    {
        label: $ts('delete'),
        icon: 'i-heroicons-trash',
        disabled: !isCommittee,
        onSelect: () => {
            ConfirmationModal.open({
                title: $ts('delete'),
                body: $ts('delete_photo_desc'),
                onConfirm: () => deletePhoto(photo._id as string)
            });
        }
    }
]
const videosDropdownItems = (video: IVideo) => [[
    {
        label: $ts('delete'),
        icon: 'i-heroicons-trash',
        disabled: !isCommittee,
        onSelect: () => deleteVideo(video._id as string)
    }
]]
const docsDropdownItems = (doc: IDoc) => [[
    {
        label: $ts('open'),
        icon: 'i-heroicons-eye',
        onSelect: () => {
            pdfModalComp.open({
                doc,
                canRemove: isCommittee.value,
                onRemove() {
                    deleteDoc(doc._id as string);
                },
                onDownload() {
                    download(doc.label, doc.doc as string)
                }
            });
        }
    },
    {
        label: $ts('download'),
        icon: 'i-heroicons-arrow-down-tray',
        onSelect: () => download(doc.label, doc.doc as string)
    },
    {
        label: $ts('delete'),
        icon: 'i-heroicons-trash',
        disabled: !isCommittee,
        onSelect: () => deleteDoc(doc._id as string)
    }
]];
watch(agenda, () => {
    try {
        const steps: DriveStep[] = [
            {
                element: '#seeCommittee',
                popover: {
                    title: $ts('committee'),
                    description: $ts('committee_desc'),
                    side: 'right'
                }
            },
            {
                element: '#seeRegister',
                popover: {
                    title: $ts('register'),
                    description: $ts('register_agenda_btn_desc'),
                    side: 'right'
                }
            },
            {
                element: '#gallery',
                popover: {
                    title: $ts('gallery'),
                    description: $ts('gallery_desc'),
                    side: 'right'
                }
            }
        ];
        if (user.value) {
            steps.push({
                element: '#seeRegistered',
                popover: {
                    title: $ts('registered'),
                    description: $ts('registered_desc'),
                    side: 'right'
                }
            });
        }
        if (isCommittee) {
            steps.push({
                element: '#seeVisited',
                popover: {
                    title: $ts('visited'),
                    description: $ts('visited_desc'),
                    side: 'right'
                }
            });
            steps.push({
                element: '#openQrReader',
                popover: {
                    title: $ts('qr_reader'),
                    description: $ts('qr_reader_desc'),
                    side: 'right'
                }
            });
        }
        $pageGuide('agenda-detail', steps, {
            showProgress: true,
            showButtons: ['next', 'previous'],
        });
    } catch (error) {
        console.error('Error during onMounted execution:', error);
    }
});

const galleryTabs = computed<TabsItem[]>(() => [
    {
        label: $ts('photo'),
        key: 'photos',
        icon: 'i-heroicons-photo',
        slot: 'photos' as const
    },
    {
        label: $ts('video'),
        key: 'videos',
        icon: 'i-heroicons-play',
        slot: 'videos' as const
    },
    {
        label: $ts('document'),
        key: 'documents',
        icon: 'i-heroicons-document-text',
        slot: 'documents' as const
    }
] satisfies TabsItem[]);

function formatDateRange(date: any): string {
    if (!date) return 'Date not set'

    const start = new Date(date.start)
    const end = new Date(date.end)

    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    }

    if (start.toDateString() === end.toDateString()) {
        return start.toLocaleDateString('id-ID', options)
    }

    return `${start.toLocaleDateString('id-ID', options)} - ${end.toLocaleDateString('id-ID', options)}`
}


function getMemberName(user: IParticipant | ICommittee): string {
    const member = user.member as IMember | string | undefined;
    if (typeof member === 'object' && member?.fullName) {
        return member.fullName
    } else if (typeof member === 'string') {
        return member
    } else if (user && 'guest' in user && user.guest) {
        return user.guest.fullName || 'Guest Member'
    } else {
        return 'Unknown Member'
    }
}


function getPaymentStatusColor(status?: string | boolean) {
    switch (status) {
        case 'success': return 'success'
        case 'failed': return 'error'
        case 'canceled': return 'neutral'
        case 'expired': return 'warning'
        default: return 'warning'
    }
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR'
    }).format(amount)
}

function share() {
    navigator.share({
        title: agenda.value?.title,
        text: agenda.value?.description,
        url: `${window.location.origin}/agendas/${agenda.value?._id}`
    })
}

const canSeeAllParticipants = computed(() => {
    const canSee = agenda.value?.configuration.canSeeRegistered;
    switch (canSee) {
        case 'Public':
            return true;
        case 'Committee':
            return isCommittee || isOrganizer;
        case 'Organizer':
            return isOrganizer;
        case 'Participant':
            return isRegistered() === 'Participant' || isCommittee || isOrganizer;
        case 'Member':
            return user.value !== null;
        default:
            return false;
    }
});

useHead({
    title: () => `${agenda.value?.title} | Agenda`,
});
useSeoMeta({
    ogTitle: () => `${agenda.value?.title} | Agenda` || 'Agenda',
    ogDescription: () => agenda.value?.description || 'Agenda',
    ogImage: () => agenda.value?.photos?.[0]?.image as string || `${config.public.public_uri}/img/logo.png`,
    ogUrl: () => `${config.public.public_uri}/agendas/${id}`,
});

</script>
<template>
    <div class="items-center justify-center mb-24">
        <div v-if="agenda">
            <UBreadcrumb :items="links" />
            <!-- Header Section -->
            <div
                class="bg-secondary-light/15 dark:bg-secondary-dark/25 backdrop-blur-sm ring-secondary-dark/10 dark:ring-secondary-light/10 shadow-xl rounded-xl p-6 mb-6 mt-2">
                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2 w-full justify-between">
                            <UBadge v-if="agenda.category" color="secondary" variant="soft">
                                {{ typeof agenda.category === 'object' ? (agenda.category as ICategory).title :
                                    agenda.category }}
                            </UBadge>
                            <div class="flex gap-2">
                                <UButton icon="i-lucide-square-pen" :to="`/agendas/${agenda._id}/edit`"
                                    v-if="isCommittee" variant="ghost" />

                                <UButton variant="ghost" icon="i-lucide-share-2" @click="share" />
                            </div>
                        </div>
                        <h1 class="text-3xl font-bold text-gray-800 dark:text-gray-300 mb-4">{{ agenda.title }}</h1>

                        <!-- Tags -->
                        <div v-if="agenda.tags && agenda.tags.length" class="flex flex-wrap gap-2 mb-4">
                            <UBadge v-for="tag in agenda.tags" :key="tag" color="neutral" variant="soft">
                                {{ tag }}
                            </UBadge>
                        </div>

                        <!-- Date and Location -->
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-200">
                                <UIcon name="i-heroicons-calendar-days" class="w-5 h-5" />
                                <span>{{ formatDateRange(agenda.date) }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-gray-600 dark:text-gray-200">
                                <UIcon name="i-heroicons-map-pin" class="w-5 h-5" />
                                <span>{{ agenda.at }}</span>
                                <UButton v-if="agenda.atLink" :to="agenda.atLink" target="_blank" variant="ghost"
                                    size="xs">
                                    <UIcon name="i-heroicons-arrow-top-right-on-square" />
                                </UButton>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- Main Content -->
                <div class="lg:col-span-2 space-y-6 h-full">
                    <!-- Description -->
                    <UCard class="h-full">
                        <template #header>
                            <h2 class="text-xl font-semibold">{{ $ts('description') }}</h2>
                        </template>
                        <CoreContent :content="agenda.description" />
                    </UCard>
                </div>

                <!-- Sidebar -->
                <div class="space-y-6">
                    <!-- Registration Detail -->
                    <UCard v-if="isRegistered() && registeredId()">
                        <template #header>
                            <h2 class="text-xl font-semibold">{{ $ts('my_registration_information') }}</h2>
                        </template>
                        <div class="space-y-4">
                            <div class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-300">{{ $ts('registration_status') }}</span>
                                <UBadge :color="isRegistered() ? 'success' : 'warning'" variant="soft" size="xs">
                                    {{ isRegistered() ? $ts('registered') : $ts('not_registered') }}
                                </UBadge>
                            </div>
                            <div v-if="isRegistered() !== false" class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-300">{{ $ts('register_as') }}</span>
                                <span class="font-medium">{{ isRegistered() === 'Committee' ? $ts('committee') :
                                    $ts('participant')
                                    }}</span>
                            </div>
                            <div v-if="isRegistered() !== false" class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-300">ID</span>
                                <span class="font-medium">{{ registeredId() }}</span>
                            </div>
                            <div v-if="isRegistered() !== false" class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-300">{{ $ts('payment_status') }}</span>
                                <UBadge :color="getPaymentStatusColor(payStatus())" variant="soft" size="xs">
                                    {{ payStatus() || $ts('not_paid') }}
                                </UBadge>
                            </div>
                            <div v-if="isRegistered() !== false" class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-300">{{ $ts('visited') }}</span>
                                <UBadge
                                    :color="agenda.participants?.find(p => p._id === registeredId())?.visiting ? 'success' : 'warning'"
                                    variant="soft" size="xs"
                                    :icon="agenda.participants?.find(p => p._id === registeredId())?.visiting ? 'i-lucide-check' : 'i-lucide-x'" />
                            </div>
                            <div v-if="isRegistered() === 'Committee' && agenda.configuration.committee.jobAvailables && agenda.configuration.committee.jobAvailables.length > 0"
                                class="flex items-center justify-between">
                                <span class="text-gray-600 dark:text-gray-300">{{ $ts('selected_job') }}</span>
                                <span class="font-medium">{{agenda.committees?.find(c => c._id ===
                                    registeredId())?.job || $ts('none')}}</span>
                            </div>
                        </div>
                        <template #footer>
                            <!---Registration QR Code-->
                            <Qrcode :value="registeredId() as string" class="max-w-sm mx-auto" style=" --ui-bg: none;"
                                variant="rounded" />
                            <p class="mt-4 text-center text-error-500">{{ $ts('qr_code_presence_desc') }}</p>
                            <UButton class="mt-4" color="primary" size="sm" block
                                @click="cancelRegister(isRegistered() === 'Committee' ? 'committee' : 'participant')"
                                :disabled="!canMeUnregister">
                                {{ $ts('cancel_registration') }}
                            </UButton>
                        </template>
                    </UCard>
                    <!-- Registration Configuration -->
                    <UCard>
                        <template #header>
                            <h3 class="text-lg font-semibold">{{ $ts('registration_information') }}</h3>
                        </template>
                        <div class="space-y-4">
                            <!-- Committee Registration -->
                            <div class="border-b pb-4">
                                <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-2">{{ $ts('committee') }}
                                </h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('payment_required')
                                            }}:</span>
                                        <UIcon
                                            :name="agenda.configuration.committee.pay ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                                            :class="`w-5 h-5 ${agenda.configuration.committee.pay ? 'text-green-500' : 'text-red-500'}`" />
                                    </div>
                                    <div v-if="agenda.configuration.committee.pay" class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('pay') }}</span>
                                        <span class="font-medium">
                                            {{ formatCurrency(agenda.configuration.committee.amount) }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('point') }}</span>
                                        <span class="font-medium">{{ agenda.configuration.committee.point }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('can_register') }}:</span>
                                        <span class="font-medium">
                                            {{ agenda.configuration.committee.canRegister || $ts('none') }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between"
                                        v-if="agenda.configuration.committee.canRegister !== 'None'">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('registration_period')
                                            }}:</span>
                                        <span
                                            :class="`font-medium ${new Date(agenda.configuration.committee.canRegisterUntil.end) < new Date() ? 'text-red-500' : ''}`">
                                            {{ formatDateRange(agenda.configuration.committee.canRegisterUntil) }}
                                        </span>
                                    </div>
                                    <UButton
                                        v-if="isCommittee && (agenda.configuration.committee.questions?.length ?? 0) > 0"
                                        :to="`/agendas/${id}/committee/form`" class="mt-2" color="primary" size="sm"
                                        block>
                                        <UIcon name="i-heroicons-pencil-square" />
                                        {{ $ts('edit_questions') }}
                                    </UButton>
                                    <UButton
                                        v-if="isCommittee && (agenda.configuration.committee.questions?.length ?? 0) === 0"
                                        :to="`/agendas/${id}/committee/form`" class="mt-2" color="primary" size="sm"
                                        block>
                                        <UIcon name="i-heroicons-plus" />
                                        {{ $ts('add_questions') }}
                                    </UButton>
                                    <UButton v-if="canMeRegisterAsCommittee" :to="`/agendas/${id}/committee/register`"
                                        class="mt-2" color="primary" size="sm" block>
                                        <UIcon name="i-heroicons-user-plus" />
                                        {{ $ts('register_as_committee') }}
                                    </UButton>

                                </div>
                            </div>

                            <!-- Participant Registration -->
                            <div>
                                <h4 class="font-medium text-gray-900 dark:text-gray-200 mb-2">{{ $ts('participant') }}
                                </h4>
                                <div class="space-y-2 text-sm">
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('payment_required')
                                        }}</span>
                                        <UIcon
                                            :name="agenda.configuration.participant.pay ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
                                            :class="`w-5 h-5 ${agenda.configuration.participant.pay ? 'text-green-500' : 'text-red-500'}`" />
                                    </div>
                                    <div v-if="agenda.configuration.participant.pay" class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('pay') }}</span>
                                        <span class="font-medium">
                                            {{ formatCurrency(agenda.configuration.participant.amount) }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('point') }}</span>
                                        <span class="font-medium">{{ agenda.configuration.participant.point }}</span>
                                    </div>
                                    <div class="flex justify-between">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('can_register') }}</span>
                                        <span class="font-medium">
                                            {{ agenda.configuration.participant.canRegister || $ts('none') }}
                                        </span>
                                    </div>
                                    <div class="flex justify-between"
                                        v-if="agenda.configuration.participant.canRegister !== 'None'">
                                        <span class="text-gray-600 dark:text-gray-300">{{ $ts('registration_period')
                                        }}</span>
                                        <span
                                            :class="`font-medium ${new Date(agenda.configuration.participant.canRegisterUntil.end) < new Date() ? 'text-red-500' : ''}`">
                                            {{ formatDateRange(agenda.configuration.participant.canRegisterUntil) }}
                                        </span>
                                    </div>
                                    <UButton
                                        v-if="isCommittee && (agenda.configuration.participant.questions?.length ?? 0) > 0"
                                        :to="`/agendas/${id}/participant/form`" class="mt-2" color="primary" size="sm"
                                        block>
                                        <UIcon name="i-heroicons-pencil-square" />
                                        {{ $ts('edit_questions') }}
                                    </UButton>
                                    <UButton
                                        v-if="isCommittee && (agenda.configuration.participant.questions?.length ?? 0) === 0"
                                        :to="`/agendas/${id}/participant/form`" class="mt-2" color="primary" size="sm"
                                        block>
                                        <UIcon name="i-heroicons-plus" />
                                        {{ $ts('add_questions') }}
                                    </UButton>
                                    <UButton v-if="canMeRegisterAsParticipant"
                                        :to="`/agendas/${id}/participant/register`" class="mt-2" color="primary"
                                        size="sm" block>
                                        <UIcon name="i-heroicons-user-plus" />
                                        {{ $ts('register_as_participant') }}
                                    </UButton>
                                </div>
                            </div>
                        </div>
                    </UCard>
                    <!-- Committees -->
                    <UCard v-if="agenda.committees && agenda.committees.length" class="mt-6">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h2 class="text-xl font-semibold">{{ $ts('committee') }}</h2>
                                <UBadge color="secondary">{{ agenda.committees.length }} {{ $ts('member') }}</UBadge>
                            </div>
                        </template>
                        <div class="space-y-4">
                            <div v-for="committee, i in agenda.committees.slice(0, 3)" :key="i"
                                class="flex items-center justify-between p-4 bg-gray-50/20 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <UAvatar :alt="getMemberName(committee)" size="md" />
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-gray-200">{{
                                            getMemberName(committee) }}
                                        </p>
                                        <p class="text-sm text-gray-600 dark:text-gray-300">{{ committee.job }}</p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <UBadge :color="committee.approved ? 'success' : 'warning'" variant="soft">
                                        {{ committee.approved ? $ts('approved') : $ts('pending') }}
                                    </UBadge>
                                    <UBadge v-if="committee.visiting" color="secondary" variant="soft">
                                        {{ $ts('visiting') }}
                                    </UBadge>
                                </div>
                            </div>
                        </div>
                        <template #footer>
                            <UButton :to="`/agendas/${id}/committee`" color="primary" size="sm" block>
                                <UIcon name="i-heroicons-users" />
                                {{ $ts('see_more') }}
                            </UButton>
                        </template>
                    </UCard>
                    <!-- Registered Participants -->
                    <UCard class="mt-6">
                        <template #header>
                            <div class="flex items-center justify-between">
                                <h2 class="text-xl font-semibold">{{ $ts('registered_participant') }}</h2>
                                <UBadge color="secondary" v-if="agenda.participants && agenda.participants.length">{{
                                    agenda.participants.length }} {{ $ts('participant') }}
                                </UBadge>
                            </div>
                        </template>
                        <div class="space-y-4" v-if="agenda.participants && agenda.participants.length">
                            <div v-for="participant, i in agenda.participants.slice(0, 3)" :key="i"
                                class="flex items-center justify-between p-4 bg-gray-50/20 rounded-lg">
                                <div class="flex items-center gap-3">
                                    <UAvatar :alt="getMemberName(participant)" size="md" />
                                    <div>
                                        <p class="font-medium text-gray-900 dark:text-gray-200">{{
                                            getMemberName(participant) }}
                                        </p>
                                    </div>
                                </div>
                                <div class="flex items-center gap-2">
                                    <UBadge :color="participant.visiting ? 'success' : 'warning'" variant="soft">
                                        {{ participant.visiting ? $ts('visited') : $ts('not_visited') }}
                                    </UBadge>
                                </div>
                            </div>
                        </div>

                        <div class="p-4 text-gray-600 dark:text-gray-300" v-else>
                            {{ $ts('no_participant_registered_description') }}
                        </div>
                        <template #footer>
                            <UButton :to="`/agendas/${id}/participant`" class="w-full" color="primary" size="sm" block
                                v-if="canSeeAllParticipants">
                                <UIcon name="i-heroicons-users" />
                                {{ $ts('see_more') }}
                            </UButton>
                        </template>
                    </UCard>
                </div>
            </div>

            <!-- Gallery -->
            <UCard class="mt-6">
                <template #header>
                    <h2 class="text-xl font-semibold">Gallery</h2>
                </template>
                <UTabs :items="galleryTabs" class="w-full">
                    <template #photos="{ item }">
                        <div class="flex flex-col gap-2 mt-4" v-if="groupedPhotos">
                            <div v-if="!groupedPhotos.length" class="flex items-center justify-center">
                                <span>No photos available</span>
                            </div>
                            <div v-else>
                                <div
                                    :class="`grid grid-cols-1 gap-4 md:grid-cols-${Math.floor(groupedPhotos.length / 1)}`">
                                    <div v-for="(group, groupIndex) in groupedPhotos" :key="groupIndex"
                                        class="grid gap-4">
                                        <div v-for="photo, i in group" :key="i"
                                            class="relative w-full group rounded-lg overflow-hidden">
                                            <NuxtImg provider="localProvider" class="object-cover w-full h-full"
                                                :src="(photo.image as string)" :alt="`${i}`"
                                                @click="openImageModal(photo)" loading="lazy" />
                                            <div
                                                class="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-[50px] backdrop-blur-md">
                                            </div>
                                            <UDropdownMenu :items="photosDropdownItems(photo)"
                                                class="absolute top-0 right-0 m-2" :size="responsiveUISizes.button">
                                                <UButton icon="i-heroicons-ellipsis-vertical" size="xl" variant="link"
                                                    color="neutral" />
                                            </UDropdownMenu>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center justify-between gap-1.5 my-4">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-sm leading-5">{{ $ts('rows_per_page') }}</span>
                                        <USelect v-model="perPage" :items="perPageOptions"
                                            :size="responsiveUISizes.select" class="w-20 me-2" />
                                    </div>
                                    <div>

                                        <span class="text-sm leading-5">
                                            {{ $ts('showing_results', {
                                                start: pageFromPhotos, end: pageToPhotos,
                                                total: pageTotalPhotos || 0
                                            }) }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <UPagination v-model:page="page" :items-per-page="perPage"
                                            :total="agenda.photos?.length" :sibling-count="isMobile ? 2 : 6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #videos="{ item }">
                        <div class="flex flex-col gap-2 mt-4">
                            <div v-if="!groupedVideos" class="flex items-center justify-center">
                                <span>No Videos available</span>
                            </div>
                            <div v-else>
                                <div
                                    :class="`grid grid-cols-1 gap-4 md:grid-cols-${Math.floor(groupedVideos.length / 1)}`">
                                    <div v-for="(group, groupIndex) in groupedVideos" :key="groupIndex"
                                        class="grid gap-4">
                                        <div v-for="video, i in group" :key="i"
                                            class="relative w-full group rounded-lg overflow-hidden">
                                            <VideoPlayer provider="localProvider" class="object-cover w-full h-full"
                                                :options="videoOptions(video.video as string)" :alt="`${i}`" />
                                            <div v-if="isOrganizer"
                                                class="absolute inset-0 bg-gradient-to-b from-black/30 to-transparent h-[50px] backdrop-blur-md">
                                            </div>
                                            <UDropdownMenu v-if="isOrganizer" :items="videosDropdownItems(video)"
                                                class="absolute top-0 right-0 m-px" :size="responsiveUISizes.button">
                                                <UButton icon="i-heroicons-ellipsis-vertical" size="xl" variant="link"
                                                    color="neutral" />
                                            </UDropdownMenu>
                                        </div>
                                    </div>
                                </div>
                                <div class="flex flex-wrap items-center justify-between gap-1.5 my-4">
                                    <div class="flex items-center gap-1.5">
                                        <span class="text-sm leading-5">{{ $ts('rows_per_page') }}</span>
                                        <USelect v-model="perPage" :items="perPageOptions"
                                            :size="responsiveUISizes.select" class="w-20 me-2" />
                                    </div>
                                    <div>

                                        <span class="text-sm leading-5">
                                            {{ $ts('showing_results', {
                                                start: pageFromVideos, end: pageToVideos,
                                                total: pageTotalVideos || 0
                                            }) }}
                                        </span>
                                    </div>
                                    <div class="flex items-center gap-3">
                                        <UPagination v-model:page="page" :items-per-page="perPage"
                                            :total="agenda.videos?.length" :sibling-count="isMobile ? 2 : 6" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                    <template #documents="{ item }">
                        <div class="flex flex-col gap-2 mt-4">
                            <div v-if="!docs" class="flex items-center justify-center">
                                <span>No Docs available</span>
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
                                        <span class="text-sm leading-5">{{ $ts('rows_per_page') }}</span>
                                        <USelect v-model="perPage" :items="perPageOptions"
                                            :size="responsiveUISizes.select" class="w-20 me-2" />
                                    </div>
                                    <div>
                                        <span class="text-sm leading-5">
                                            {{ $ts('showing_results', {
                                                start: pageFromDocs, end: pageToDocs, total:
                                                    pageTotalDocs || 0
                                            }) }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </template>
                </UTabs>
                <template #footer>
                    <UFieldGroup v-if="isRegistered() === 'Committee'" class="w-full">
                        <UButton color="primary" variant="solid" :label="$ts('add')"
                            @click="addGalleryDropdown = !addGalleryDropdown" class="w-full" block />
                        <UDropdownMenu :items="addGalleryDropdownItems" v-model:open="addGalleryDropdown">
                            <UButton color="primary" variant="outline" icon="i-lucide-chevron-down" />
                        </UDropdownMenu>
                    </UFieldGroup>
                </template>
            </UCard>

            <UCard class="px-4 py-8 mt-2 md:px-8 md:py-12" v-if="isCommittee">
                <template #header>
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="font-normal leading-tight text-neutral-800 dark:text-neutral-200 ms-2">
                            {{ $ts('qr_code_presence') }}
                        </h2>
                    </div>
                </template>
                <div class="flex flex-col items-center justify-center">
                    <Qrcode :value="(id as string)" variant="rounded" class="max-w-md" />
                    <p class="mt-4 text-center text-error-500">{{ $ts('qr_code_presence_desc') }}</p>
                </div>
                <!-- <template #footer>
                    <div class="space-y-2">
                        <UButton block :size="responsiveUISizes.button" icon="i-heroicons-archive-box"
                            :disabled="checkQRDocIsExist()" @click="createQRDoc">
                            {{ $ts('create') }}
                        </UButton>
                        <UButton block :size="responsiveUISizes.button" icon="i-heroicons-arrow-down-tray"
                            :disabled="!checkQRDocIsExist()" @click="downloadQRDoc">
                            {{ $ts('download') }}
                        </UButton>
                    </div>
                </template> -->
            </UCard>
        </div>
        <UCard v-else>
            <USkeleton class="w-full h-64 mb-4" />
            <USkeleton class="w-3/4 h-8 mb-4" />
            <USkeleton class="w-full h-4 mb-2" v-for="i in 5" :key="i" />
        </UCard>
    </div>
</template>
<style scoped></style>