<script setup lang="ts">
import { CoreStepper, ModalsDocAdd, ModalsImageAdd, ModalsVideoAdd } from '#components';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { IAspiration, IDoc, IPhoto, IVideo } from '~~/types';
import type { FieldValidationRules, Step } from '~~/types/component/stepper';
import type { IResponse } from '~~/types/IResponse';
definePageMeta({
    middleware: ['sidebase-auth'],
    layout: 'dashboard',
});

const router = useRouter();
const overlay = useOverlay();
const toast = useToast();
const { $api } = useNuxtApp();
const AddDocModal = overlay.create(ModalsDocAdd);
const AddPhotoModal = overlay.create(ModalsImageAdd);
const AddVideoModal = overlay.create(ModalsVideoAdd);

const newPhotos = ref<IPhoto[]>([]);
const newVideos = ref<IVideo[]>([]);
const newDocs = ref<IDoc[]>([]);

const readFileAsBlob = (file: File) => {
    return URL.createObjectURL(file);
}

const steps = computed<Step[]>(() => [
    {
        id: 'step1',
        label: 'Create Aspiration',
        title: 'Create Aspiration',
        description: 'Create Aspiration Description',
        formData: state,
        validationRules: stateRules,

    },
    {
        id: 'step2',
        label: 'Bukti',
        title: 'Bukti',
        description: 'Proof Description',
        formData: {},
    },
    {
        id: 'step3',
        label: 'Review Your Aspiration',
        title: 'Review Your Aspiration',
        description: 'Review Your Aspiration Description',
        formData: {},
    },
])
const tab = ref(0);



const state = reactive<IAspiration>({
    subject: '',
    message: '',
    anonymous: false,
});
const stateRules = reactiveComputed<FieldValidationRules<IAspiration>>(() => ({
    subject: (value: string) => {
        return value ? null : { path: 'subject', message: 'Wajib diisi' };
    },
    message: (value: string) => {
        return value ? null : { path: 'message', message: 'Wajib diisi' };
    },
    anonymous: (value: boolean) => {
        return typeof value === 'boolean' ? null : { path: 'anonymous', message: 'Wajib diisi' };
    },
}))
const loading = ref(false);

async function onSubmit() {
    loading.value = true;
    try {
        const response = await $api<IResponse & { data?: { id: string } }>('api/aspiration', {
            method: 'POST',
            body: state,
        });
        if (response.statusCode === 200) {
            loading.value = false;
            const id = response.data?.id;
            newPhotos.value.forEach(async (photo) => {
                const body = new CustomFormData<IPhoto>();
                body.append('image', photo.image);
                body.append('tags', photo.tags ? JSON.stringify(photo.tags) : '');
                const response = await $api<IResponse>(`/api/aspiration/${id}/photo`, {
                    method: "POST",
                    body: body.getFormData()
                });
                toast.add({ title: response.statusMessage });
            });
            newVideos.value.forEach(async (video) => {
                const body = new CustomFormData<IVideo>();
                body.append('video', video.video);
                body.append('tags', video.tags ? JSON.stringify(video.tags) : '');
                const response = await $api<IResponse>(`/api/aspiration/${id}/video`, {
                    method: "POST",
                    body: body.getFormData()
                });
                toast.add({ title: response.statusMessage });
            });
            newDocs.value.forEach(async (doc) => {
                const body = new CustomFormData<IDoc>();
                body.append('doc', doc.doc);
                body.append('label', doc.label);
                body.append('tags', doc.tags ? JSON.stringify(doc.tags) : '');
                body.append('no', doc.no.toString());
                const response = await $api<IResponse>(`/api/aspiration/${id}/doc`, {
                    method: "POST",
                    body: body.getFormData()
                });
                toast.add({ title: response.statusMessage });
            });
            toast.add({ title: 'Berhasil!', description: 'Aspiration Success Description', color: 'success' });
        }
    } catch (err: any) {
        loading.value = false;
        if (err.response) {
            toast.add({ title: err.response.data.message, color: 'error' });
        } else {
            toast.add({ title: 'Something Went Wrong', color: 'error' });
        }
    } finally {
        loading.value = false;
        setTimeout(() => {
            router.push('/dashboard/aspirations');
        }, 3000);
    }
};
const links = [
    { label: 'Dasbor', to: '/dashboard', icon: 'i-heroicons-home' },
    { label: 'Aspirasi', to: '/dashboard/aspirations', icon: 'i-heroicons-clipboard-document-list' },
    { label: 'Create Aspiration', icon: 'i-heroicons-plus' },
];

const addPhotoModal = () => {
    AddPhotoModal.open({
        async onPhoto({ photos }: { photos: IPhoto[] }) {
            newPhotos.value.push(...photos);
            AddPhotoModal.close();
        }
    });
}
const addVideoModal = () => {
    AddVideoModal.open({
        onVideo({ videos }: { videos: IVideo[] }) {
            newVideos.value.push(...videos);
            AddVideoModal.close();
        }
    });
}
const addDocModal = () => {
    AddDocModal.open({
        async onDoc(v: IDoc) {
            newDocs.value.push(v);
            AddDocModal.close();
        }
    });
}
const deletePhoto = (index: number) => {
    newPhotos.value.splice(index, 1);
    URL.revokeObjectURL(newPhotos.value[index]?.image as string);
}
const deleteVideo = (index: number) => {
    newVideos.value.splice(index, 1);
    URL.revokeObjectURL(newVideos.value[index]?.video as string);
}
const deleteDoc = (index: number) => {
    newDocs.value.splice(index, 1);
    URL.revokeObjectURL(newDocs.value[index]?.doc as string);
}
</script>

<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <CoreStepper class="mt-2" :steps="steps" v-model="tab" @complete="onSubmit">
            <template #default="{ step, errors }">
                <div v-if="step?.id === 'step1'">
                    <div class="flex flex-col gap-4">
                        <UFormField :label="'Subjek'" name="subject" required :help="'Subject Description'"
                            :error="errors.subject?.message">
                            <UInput v-model="state.subject" />
                        </UFormField>
                        <UFormField :label="'Pesan'" name="message" required :help="'Message Description'"
                            :error="errors.message?.message">
                            <UTextarea v-model="state.message" />
                        </UFormField>
                        <UFormField :label="'Anonim'" name="anonymous" :help="'Anonymous Description'"
                            :error="errors.anonymous?.message">
                            <USwitch v-model="state.anonymous" />
                        </UFormField>
                    </div>
                </div>
                <div v-else-if="step?.id === 'step2'">
                    <div class="flex flex-col gap-2 p-2">
                        <div class="flex flex-col gap-2">
                            <div>{{ 'Foto' }}:</div>
                            <div class="flex flex-wrap items-center gap-2">
                                <div v-for="photo, i in newPhotos" :key="i" class="relative group">
                                    <img :src="readFileAsBlob(photo.image as File)" :alt="photo.tags?.join(', ')"
                                        class="max-h-[120px]" />
                                    <div
                                        class="absolute inset-0 flex items-center justify-center transition-opacity bg-gray-900 opacity-0 bg-opacity-70 group-hover:opacity-100">
                                        <UButton variant="link" color="error" icon="i-heroicons-trash" size="xl"
                                            @click="deletePhoto(i)">
                                        </UButton>
                                    </div>
                                </div>
                            </div>
                            <UButton block @click="addPhotoModal" icon="i-heroicons-plus"></UButton>
                        </div>
                        <div class="flex flex-col gap-2">
                            <div>{{ 'Video' }}:</div>
                            <div class="flex flex-wrap items-center gap-2">
                                <div v-for="video, i in newVideos" :key="i" class="relative group">
                                    <video :src="readFileAsBlob(video.video as File)" controls
                                        class="max-h-[120px]"></video>
                                    <div
                                        class="absolute inset-0 flex items-center justify-center transition-opacity bg-gray-900 opacity-0 bg-opacity-70 group-hover:opacity-100">
                                        <UButton variant="link" color="error" icon="i-heroicons-trash" size="xl"
                                            @click="deleteVideo(i)">
                                        </UButton>
                                    </div>
                                </div>
                            </div>
                            <UButton block @click="addVideoModal" icon="i-heroicons-plus"></UButton>
                        </div>
                        <div class="flex flex-col gap-2">
                            <div>{{ 'Dokumen' }}:</div>
                            <div class="flex flex-col items-center gap-2">
                                <div v-for="document, i in newDocs" :key="i"
                                    class="flex flex-row items-center justify-between w-full gap-2 px-3 py-2 bg-opacity-25 border border-gray-400 rounded-md shadow-md dark:border-gray-700 hover:bg-gray-400">
                                    <a :href="readFileAsBlob(document.doc as File)" target="_blank"
                                        class="text-blue-500 hover:cursor-pointer">
                                        {{ document.label }}
                                    </a>
                                    <UButton variant="link" color="error" icon="i-heroicons-trash" size="xl"
                                        @click="deleteDoc(i)" />
                                </div>
                            </div>
                            <UButton block @click="addDocModal" icon="i-heroicons-plus">
                            </UButton>
                        </div>
                    </div>
                </div>
                <div v-else-if="step?.id === 'step3'">
                    <div class="p-2">
                        <div class="flex flex-row items-center justify-between gap-2">
                            <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                                {{ state.subject }}
                            </h1>
                        </div>
                        <div class="flex flex-col gap-2">
                            <p class="text-sm text-gray-500 dark:text-gray-300">
                                {{ state.message }}
                            </p>
                            <div class="flex flex-row items-center justify-between gap-2">
                                <p class="text-sm text-gray-500 dark:text-gray-400">
                                    {{ state.anonymous ? 'Anonymous' : 'Not Anonymous' }}
                                </p>
                            </div>
                            <div class="flex flex-row items-center justify-between gap-2">
                                <h1
                                    class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                                    {{ 'Bukti' }}
                                </h1>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div>{{ 'Foto' }}:</div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <div v-for="photo, i in newPhotos" :key="i" class="relative group">
                                        <img :src="readFileAsBlob(photo.image as File)" :alt="photo.tags?.join(', ')"
                                            class="max-h-[120px]" />
                                        <div
                                            class="absolute inset-0 flex items-center justify-center transition-opacity bg-gray-900 opacity-0 bg-opacity-70 group-hover:opacity-100">
                                            <UButton variant="link" color="error" icon="i-heroicons-trash" size="xl"
                                                @click="deletePhoto(i)">
                                            </UButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div>{{ 'Video' }}:</div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <div v-for="video, i in newVideos" :key="i" class="relative group">
                                        <video :src="readFileAsBlob(video.video as File)" controls
                                            class="max-h-[120px]"></video>
                                        <div
                                            class="absolute inset-0 flex items-center justify-center transition-opacity bg-gray-900 opacity-0 bg-opacity-70 group-hover:opacity-100">
                                            <UButton variant="link" color="error" icon="i-heroicons-trash" size="xl"
                                                @click="deleteVideo(i)">
                                            </UButton>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div>{{ 'Dokumen' }}:</div>
                                <div class="flex flex-col items-center gap-2">
                                    <div v-for="document, i in newDocs" :key="i"
                                        class="flex flex-row items-center justify-between w-full gap-2 px-3 py-2 bg-opacity-25 border border-gray-400 rounded-md shadow-md dark:border-gray-700 hover:bg-gray-400">
                                        <a :href="readFileAsBlob(document.doc as File)" target="_blank"
                                            class="text-blue-500 hover:cursor-pointer">
                                            {{ document.label }}
                                        </a>
                                        <UButton variant="link" color="error" icon="i-heroicons-trash" size="xl"
                                            @click="deleteDoc(i)" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </CoreStepper>
    </div>
</template>
