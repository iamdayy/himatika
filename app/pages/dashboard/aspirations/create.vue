<script setup lang="ts">
import { CoreStepper, ModalsDocAdd, ModalsImageAdd, ModalsVideoAdd } from '#components';
import type { IAspiration, IDoc, IFile, IPhoto, IVideo } from '~~/types';
import type { FieldValidationRules, Step } from '~~/types/component/stepper';
import type { IResponse } from '~~/types/IResponse';
definePageMeta({
    middleware: ['sidebase-auth'],
    layout: 'dashboard',
});
const route = useRoute();
const router = useRouter();
const overlay = useOverlay();
const toast = useToast();
const { $api } = useNuxtApp();
const { $ts } = useI18n();

const AddDocModal = overlay.create(ModalsDocAdd);
const AddPhotoModal = overlay.create(ModalsImageAdd);
const AddVideoModal = overlay.create(ModalsVideoAdd);

const newPhotos = ref<IPhoto[]>([]);
const newVideos = ref<IVideo[]>([]);
const newDocs = ref<IDoc[]>([]);

const steps = computed<Step[]>(() => [
    {
        id: 'step1',
        label: $ts('create_aspiration'),
        title: $ts('create_aspiration'),
        description: $ts('create_aspiration_description'),
        formData: state,
        validationRules: stateRules,

    },
    {
        id: 'step2',
        label: $ts('proof'),
        title: $ts('proof'),
        description: $ts('proof_description'),
        formData: {},
    },
    {
        id: 'step3',
        label: $ts('review_your_aspiration'),
        title: $ts('review_your_aspiration'),
        description: $ts('review_your_aspiration_description'),
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
        return value ? null : { path: 'subject', message: $ts('required') };
    },
    message: (value: string) => {
        return value ? null : { path: 'message', message: $ts('required') };
    },
    anonymous: (value: boolean) => {
        return typeof value === 'boolean' ? null : { path: 'anonymous', message: $ts('required') };
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
                const response = await $api<IResponse>(`/api/aspiration/${id}/photo`, {
                    method: "POST",
                    body: { photo }
                });
                toast.add({ title: response.statusMessage });
            });
            newVideos.value.forEach(async (video) => {
                const response = await $api<IResponse>(`/api/aspiration/${id}/video`, {
                    method: "POST",
                    body: { video }
                });
                toast.add({ title: response.statusMessage });
            });
            newDocs.value.forEach(async (doc) => {
                const response = await $api<IResponse>(`/api/aspiration/${id}/doc`, {
                    method: "POST",
                    body: doc
                });
                toast.add({ title: response.statusMessage });
            });
            toast.add({ title: $ts('success'), description: $ts('aspiration_success_description'), color: 'success' });
        }
    } catch (err: any) {
        loading.value = false;
        if (err.response) {
            toast.add({ title: err.response.data.message, color: 'error' });
        } else {
            toast.add({ title: $ts('something_went_wrong'), color: 'error' });
        }
    } finally {
        loading.value = false;
        setTimeout(() => {
            router.push('/dashboard/aspirations');
        }, 3000);
    }
};
const links = [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('aspiration'), to: '/dashboard/aspirations', icon: 'i-heroicons-clipboard-document-list' },
    { label: $ts('create_aspiration'), icon: 'i-heroicons-plus' },
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
}
const deleteVideo = (index: number) => {
    newVideos.value.splice(index, 1);
}
const deleteDoc = (index: number) => {
    newDocs.value.splice(index, 1);
}
</script>

<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <CoreStepper class="mt-2" :steps="steps" v-model="tab" @complete="onSubmit">
            <template #default="{ step, errors }">
                <div v-if="step?.id === 'step1'">
                    <div class="flex flex-col gap-4">
                        <UFormField :label="$ts('subject')" name="subject" required :help="$ts('subject_description')"
                            :error="errors.subject?.message">
                            <UInput v-model="state.subject" />
                        </UFormField>
                        <UFormField :label="$ts('message')" name="message" required :help="$ts('message_description')"
                            :error="errors.message?.message">
                            <UTextarea v-model="state.message" />
                        </UFormField>
                        <UFormField :label="$ts('anonymous')" name="anonymous" :help="$ts('anonymous_description')"
                            :error="errors.anonymous?.message">
                            <USwitch v-model="state.anonymous" />
                        </UFormField>
                    </div>
                </div>
                <div v-else-if="step?.id === 'step2'">
                    <div class="flex flex-col gap-2 p-2">
                        <div class="flex flex-col gap-2">
                            <div>{{ $ts('photo') }}:</div>
                            <div class="flex flex-wrap items-center gap-2">
                                <div v-for="photo, i in newPhotos" :key="i" class="relative group">
                                    <img :src="((photo.image as IFile).content as string)" :alt="photo.tags?.join(', ')"
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
                            <div>{{ $ts('video') }}:</div>
                            <div class="flex flex-wrap items-center gap-2">
                                <div v-for="video, i in newVideos" :key="i" class="relative group">
                                    <video :src="((video.video as IFile).content as string)" controls
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
                            <div>{{ $ts('document') }}:</div>
                            <div class="flex flex-col items-center gap-2">
                                <div v-for="document, i in newDocs" :key="i"
                                    class="flex flex-row items-center justify-between w-full gap-2 px-3 py-2 bg-opacity-25 border border-gray-400 rounded-md shadow-md dark:border-gray-700 hover:bg-gray-400">
                                    <a :href="((document.doc as IFile).content as string)" target="_blank"
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
                                    {{ $ts('proof') }}
                                </h1>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div>{{ $ts('photo') }}:</div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <div v-for="photo, i in newPhotos" :key="i" class="relative group">
                                        <img :src="((photo.image as IFile).content as string)"
                                            :alt="photo.tags?.join(', ')" class="max-h-[120px]" />
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
                                <div>{{ $ts('video') }}:</div>
                                <div class="flex flex-wrap items-center gap-2">
                                    <div v-for="video, i in newVideos" :key="i" class="relative group">
                                        <video :src="((video.video as IFile).content as string)" controls
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
                                <div>{{ $ts('document') }}:</div>
                                <div class="flex flex-col items-center gap-2">
                                    <div v-for="document, i in newDocs" :key="i"
                                        class="flex flex-row items-center justify-between w-full gap-2 px-3 py-2 bg-opacity-25 border border-gray-400 rounded-md shadow-md dark:border-gray-700 hover:bg-gray-400">
                                        <a :href="((document.doc as IFile).content as string)" target="_blank"
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
