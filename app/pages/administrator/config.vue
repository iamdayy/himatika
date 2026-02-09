<script setup lang="ts">
import { CoreTiptap, ModalsCarouselAdd, ModalsImageCrop, UInput } from '#components';
import imageCompression from 'browser-image-compression';
import { CustomFormData } from '~/helpers/CustomFormData';
import type { ICarousel, IConfig, IPhoto } from "~~/types";
import type { IConfigResponse, IEncryptionsResponse, IResponse } from '~~/types/IResponse';
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
});

useHead({
    title: 'Config'
});
const searchQuery = ref('');
const { token } = useAuth();
const { data, refresh } = await useAsyncData(() => $fetch<IConfigResponse>("/api/config"));
const { data: enscriptions, refresh: refreshEncriptions } = await useAsyncData(() => $fetch<IEncryptionsResponse>('/api/enscryption', {
    query: {
        search: searchQuery.value
    },
    headers: {
        Authorization: token.value || ''
    }
}), {
    watch: [searchQuery],
    transform: (data) => {
        if (data.statusCode !== 200 || data.data?.count == 0) return [];
        return data.data?.encryptions?.map((d) => ({
            label: d.title,
            value: d._id as string
        }));
    }
});
const organizerStore = useOrganizerStore();
const { organizer } = storeToRefs(organizerStore);
const toast = useToast();
const { $api } = useNuxtApp();
const overlay = useOverlay();

const CropImageModal = overlay.create(ModalsImageCrop);
const AddCarouselModal = overlay.create(ModalsCarouselAdd);

const loading = ref(false);
const Config = ref<IConfig>({
    dailyManagements: data.value?.data?.dailyManagements || [],
    enscriptActivinessLetter: data.value?.data?.enscriptActivinessLetter || '',
    minPoint: data.value?.data?.minPoint || 0,
    departments: data.value?.data?.departments || [],
    description: data.value?.data?.description || '',
    name: data.value?.data?.name || '',
    contact: data.value?.data?.contact || { email: '', phone: '' },
    address: data.value?.data?.address || '',
    socialMedia: data.value?.data?.socialMedia || [{ name: '', url: '' }],
    vision: data.value?.data?.vision || '',
    mission: data.value?.data?.mission || [],
    carousels: data.value?.data?.carousels || [],
});

const notEditMode = ref(true);
const isSaving = ref(false);
const file = ref<File>();
const newDailyManagement = ref('');
const openPopoverAddDailyManagement = ref(false);
const newDepartment = ref('');
const newMission = ref('');
const newSocialMedia = ref({
    name: '',
    url: ''
});
const openPopoverAddDepartment = ref(false);
const addDailyManagement = () => {
    if (notEditMode.value) return;
    Config.value.dailyManagements.push(newDailyManagement.value);
    newDailyManagement.value = '';
    openPopoverAddDailyManagement.value = false;
};
const deleteDailyManagement = (dailyManagement: string) => {
    if (notEditMode.value) return;
    Config.value.dailyManagements = Config.value.dailyManagements.filter(management => management !== dailyManagement);
};
const addDepartment = () => {
    if (notEditMode.value) return;
    Config.value.departments.push(newDepartment.value);
    newDepartment.value = '';
    openPopoverAddDepartment.value = false;
};
const deleteDepartment = (department: string) => {
    if (notEditMode.value) return;
    Config.value.departments = Config.value.departments.filter(d => d !== department);
};
const addSocialMedia = () => {
    if (notEditMode.value) return;
    Config.value.socialMedia.push({ name: newSocialMedia.value.name, url: newSocialMedia.value.url });
    newSocialMedia.value = { name: '', url: '' };
};
const deleteSocialMedia = (socialMedia: { name: string, url: string }) => {
    if (notEditMode.value) return;
    Config.value.socialMedia = Config.value.socialMedia.filter((sm) => !(sm.name === socialMedia.name && sm.url === socialMedia.url));
}

const addMission = () => {
    if (notEditMode.value) return;
    Config.value.mission.push(newMission.value);
    newMission.value = '';
};
const deleteMission = (miss: string) => {
    if (notEditMode.value) return;
    Config.value.mission = Config.value.mission.filter(mission => mission !== miss);
}

/**
 * Handle cropped image
 * @param {File} f - Cropped image file
 */
const onCropped = async (f: File) => {
    file.value = f;
    CropImageModal.close();
}

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
    CropImageModal.open({
        onCropped,
        img: blob,
        title: f.name,
        stencil: {
            movable: true,
            resizable: true,
            aspectRatio: 16 / 9,
        }
    })
}

const addPhoto = async () => {
    AddCarouselModal.open({
        onSaveCarousel: async (carousel: ICarousel) => {
            try {
                const body = new CustomFormData<IPhoto>();
                body.append('image', file.value!);
                const response = await $api<IResponse & { data?: IPhoto }>('/api/config/carousel', {
                    method: "POST",
                    body: body.getFormData()
                });
                if (response.statusCode == 200 && response.data) {
                    toast.add({ title: 'Berhasil!', description: 'Success To Add Carrousel' });
                    const newCarousel: ICarousel = {
                        ...carousel,
                        image: response.data
                    };
                    Config.value.carousels?.push(newCarousel);
                }
            } catch (error: any) {
                toast.add({ title: 'Failed', description: 'Failed To Add Carrousel', color: "error" })
            }
        }
    })
}

const deletePhoto = async (index: number, id: string) => {
    console.log('delete photo');
    if (notEditMode.value && !isSaving.value) return;
    try {
        const response = await $api<IResponse>("/api/photo", {
            method: "delete",
            query: {
                id
            }
        });
        if (response.statusCode == 200) {
            toast.add({ title: 'Berhasil!', description: 'Success To Delete Carrousel' });
            Config.value.carousels?.splice(index, 1);
        }
    } catch (error: any) {
        toast.add({ title: 'Failed', description: 'Failed To Delete Carrousel', color: "error" });
    }

}

const createNewEncription = async (title: string) => {
    try {
        const response = await $api<IResponse>('/api/enscryption', {
            method: 'POST',
            body: {
                title
            }
        });
        if (response.statusCode == 200) {
            toast.add({
                title: 'Berhasil!',
                description: 'Success To Create New Encription',
                icon: 'i-heroicons-check-circle',
                color: 'success'
            });
            refreshEncriptions();
        }
    } catch (error) {
        toast.add({
            title: 'Failed',
            description: 'Failed To Create New Encription',
            icon: 'i-heroicons-x-circle',
            color: 'error'
        });
    }
}

// Responsive design
const { width } = useWindowSize();
const ismobile = computed(() => width.value < 640);


const onSubmit = async () => {
    loading.value = true;
    try {
        await $api<IResponse>('/api/config', {
            method: 'POST',
            body: {
                ...Config.value,
                carousels: Config.value.carousels?.map(carousel => ({ ...carousel, image: carousel.image?._id }))
            }
        });
        toast.add({
            title: 'Berhasil!',
            description: 'Success To Update Config',
            icon: 'i-heroicons-check-circle',
            color: 'success'
        });
    } catch (error) {
        toast.add({
            title: 'Failed',
            description: 'Failed To Update Config',
            icon: 'i-heroicons-x-circle',
            color: 'error'
        });
    } finally {
        loading.value = false;
    }
};
// Responsive UI sizes based on screen width
const responsiveUISizes = computed<{ [key: string]: "xs" | "md" }>(() => ({
    input: ismobile.value ? 'xs' : 'md',
    button: ismobile.value ? 'xs' : 'md',
    select: ismobile.value ? 'xs' : 'md',
    form: ismobile.value ? 'xs' : 'md',
}));
const links = computed(() => [{
    label: 'Dasbor',
    icon: 'i-heroicons-home',
    to: '/dashboard'
}, {
    label: 'Config',
    icon: 'i-heroicons-cog',
}]);
// const debouncedSave = useDebounceFn(async () => {
//     if (notEditMode.value) return;

//     isSaving.value = true;
//     try {
//         await $api<IResponse>('/api/config', {
//             method: 'POST',
//             body: {
//                 ...Config.value,
//                 carousels: Config.value.carousels?.map(carousel => ({ ...carousel, image: carousel.image?._id }))
//             }
//         });
//         refresh();
//         toast.add({
//             title: 'Berhasil!',
//             description: 'Success To Update Config',
//             icon: 'i-heroicons-check-circle',
//             color: 'success'
//         });
//     } catch (error) {
//         toast.add({
//             title: 'Failed',
//             description: 'Failed To Update Config',
//             icon: 'i-heroicons-x-circle',
//             color: 'error'
//         });
//     } finally {
//         isSaving.value = false;
//     }
// }, 2000); // 2000ms delay
// watch(() => Config.value, () => {
//     if (!notEditMode.value) {
//         debouncedSave();
//     }
// }, { deep: true });

</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-row items-center justify-between w-full p-1 md:p-2">
                    <h2 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                        {{ 'Config' }}
                    </h2>
                    <UButton icon="i-heroicons-pencil" @click="notEditMode = !notEditMode"
                        :size="responsiveUISizes.button" />
                </div>
                <div v-if="!notEditMode" class="flex flex-row items-center gap-2 text-gray-500">
                    <UIcon name="i-heroicons-inbox-arrow-down" />
                    {{ 'Auto Save Enabled' }}
                </div>
            </template>
            <div class="px-2 py-6 space-y-2 md:py-12 md:px-8">
                <UFormField :label="'Nama Lengkap'">
                    <UInput name="name" v-model="Config.name" :size="responsiveUISizes.input"
                        :disabled="notEditMode && !isSaving" class="px-2 md:px-4" />
                </UFormField>
                <UFormField :label="'Deskripsi'">
                    <div class="px-2 md:px-4">
                        <CoreTiptap v-model="Config.description" :disabled="notEditMode" />
                    </div>
                </UFormField>
                <UFormField :label="'Visi'">
                    <UTextarea name="vision" :size="responsiveUISizes.input" v-model="Config.vision"
                        :disabled="notEditMode && !isSaving" class="px-2 md:px-4" />
                </UFormField>
                <UFormField :label="'Misi'">
                    <div class="flex items-center gap-2 px-2 md:px-4">
                        <UTextarea name="mission" :size="responsiveUISizes.input" v-model="newMission"
                            :disabled="notEditMode && !isSaving" class="flex-1" />
                        <UButton icon="i-heroicons-plus" class="flex-none" @click="addMission" variant="ghost"
                            :disabled="notEditMode && !isSaving" :size="responsiveUISizes.button" />
                    </div>
                    <ul
                        class="px-2 py-2 space-y-2 text-gray-800 list-decimal list-inside md:px-4 text-start dark:text-gray-400">
                        <li v-for="(mission, index) in Config.mission" :key="index"
                            class="flex items-start gap-2 group">
                            <span class="flex-1">{{ mission }}</span>
                            <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs"
                                :disabled="notEditMode"
                                class="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                                @click="deleteMission(mission)" />
                        </li>
                    </ul>
                </UFormField>
                <UFormField :label="'Alamat'">
                    <UTextarea name="address" :size="responsiveUISizes.input" :rows="4" v-model="Config.address"
                        :disabled="notEditMode && !isSaving" class="px-2 md:px-4" />
                </UFormField>
                <UFormField :label="'Hubungi Kami'">
                    <div class="grid grid-cols-2 gap-2 px-2 md:px-4">
                        <UFormField :label="'Email'">
                            <UInput name="contact.email" :size="responsiveUISizes.input"
                                :disabled="notEditMode && !isSaving" v-model="Config.contact.email" />
                        </UFormField>
                        <UFormField :label="'Nomor Telepon'">
                            <UInput name="contact.phone" :size="responsiveUISizes.input"
                                :disabled="notEditMode && !isSaving" v-model="Config.contact.phone" />
                        </UFormField>

                    </div>

                </UFormField>
                <UFormField :label="'Media Sosial'">
                    <div class="flex flex-col gap-2 px-2 md:px-4">
                        <div class="flex flex-col w-full gap-2">
                            <div class="flex w-full gap-2">
                                <UFormField :label="'Label'" class="flex-1">
                                    <UInput name="socialMedia.name" v-model="newSocialMedia.name"
                                        :disabled="notEditMode && !isSaving" :size="responsiveUISizes.input" />
                                </UFormField>
                                <div class="flex items-end flex-1 gap-2">
                                    <UFormField :label="'Tautan'" class="flex-1">
                                        <UInput name="socialMedia.url" v-model="newSocialMedia.url"
                                            :disabled="notEditMode && !isSaving" :size="responsiveUISizes.input" />
                                    </UFormField>

                                    <UButton icon="i-heroicons-plus" variant="ghost" class="flex-none"
                                        :disabled="notEditMode && !isSaving" @click="addSocialMedia" />
                                </div>
                            </div>
                            <div class="flex w-full gap-2" v-for="socialMedia, i in Config.socialMedia" :key="i">
                                <UFormField :label="'Label'" class="flex-1">
                                    <UInput name="socialMedia.name" v-model="Config.socialMedia[i]!.name"
                                        :disabled="notEditMode && !isSaving" :size="responsiveUISizes.input" />
                                </UFormField>
                                <div class="flex items-end flex-1 gap-2">
                                    <UFormField :label="'Tautan'" class="flex-1">
                                        <UInput name="socialMedia.url" v-model="Config.socialMedia[i]!.url"
                                            :disabled="notEditMode && !isSaving" :size="responsiveUISizes.input" />
                                    </UFormField>
                                    <UButton icon="i-heroicons-trash" color="error" variant="ghost"
                                        :disabled="notEditMode" class="flex-none md:mt-2"
                                        @click="deleteSocialMedia(socialMedia)" />
                                </div>

                            </div>
                        </div>
                    </div>
                </UFormField>
                <UFormField :label="'Pengurus Harian'">
                    <div class="flex flex-col gap-2 px-2 md:px-4">
                        <div class="flex items-end gap-2">
                            <UFormField :label="'Label'" class="flex-1">
                                <UInput name="dailyManagement" v-model="newDailyManagement"
                                    :disabled="notEditMode && !isSaving" :size="responsiveUISizes.input" />
                            </UFormField>
                            <UButton icon="i-heroicons-plus" variant="ghost" class="flex-none" :disabled="notEditMode"
                                @click="addDailyManagement" />
                        </div>
                        <div class="flex flex-wrap items-center w-full gap-2 py-2 ps-2">
                            <UBadge v-for="(dailyManagement, index) in Config.dailyManagements" :key="index"
                                :label="dailyManagement" variant="subtle" size="lg" class="pr-1 gap-1">
                                <template #trailing>
                                    <UButton icon="i-heroicons-x-mark" color="neutral" variant="link" :padded="false"
                                        size="xs" @click="deleteDailyManagement(dailyManagement)"
                                        :disabled="notEditMode" />
                                </template>
                            </UBadge>
                        </div>
                    </div>
                </UFormField>
                <UFormField :label="'Departemen'">
                    <div class="flex flex-col gap-2 px-2 md:px-4">
                        <div class="flex items-end gap-2">
                            <UFormField :label="'Label'" class="flex-1">
                                <UInput name="department" v-model="newDepartment" :size="responsiveUISizes.input"
                                    :disabled="notEditMode && !isSaving" />
                            </UFormField>
                            <UButton icon="i-heroicons-plus" variant="ghost" class="flex-none"
                                :disabled="notEditMode && !isSaving" @click="addDepartment" />
                        </div>
                        <div class="flex flex-wrap items-center w-full gap-2 py-2 ps-2">
                            <UBadge v-for="(department, index) in Config.departments" :key="index" :label="department"
                                variant="subtle" size="lg" class="pr-1 gap-1">
                                <template #trailing>
                                    <UButton icon="i-heroicons-x-mark" color="neutral" variant="link" :padded="false"
                                        size="xs" @click="deleteDepartment(department)" :disabled="notEditMode" />
                                </template>
                            </UBadge>
                        </div>
                    </div>
                </UFormField>
                <UFormField :label="'Enskripsi surat keaktifan'">
                    <USelectMenu v-model="(Config.enscriptActivinessLetter as string)" v-model:search-term="searchQuery"
                        :size="responsiveUISizes.select" :disabled="notEditMode && !isSaving" class="px-2 md:px-4"
                        :items="enscriptions" value-key="value" searchable v-model:query="searchQuery" create-item
                        @create="createNewEncription">
                    </USelectMenu>
                </UFormField>
                <UFormField :label="'Minimal Poin'">
                    <UInput name="minPoint" v-model="Config.minPoint" :size="responsiveUISizes.input"
                        :disabled="notEditMode && !isSaving" class="px-2 md:px-4" />
                </UFormField>
                <UFormField :label="'Carousel'">
                    <div class="flex flex-col gap-2 px-2 md:gap-4 md:px-8">
                        <UFileUpload v-model="file" accept="image/*" :disabled="notEditMode && !isSaving"
                            @update:model-value="onChangeImage">
                        </UFileUpload>
                        <UButton block @click="addPhoto" :disabled="notEditMode && !isSaving"
                            :size="responsiveUISizes.button">
                            {{ 'Unggah' }}</UButton>
                    </div>
                    <div class="flex flex-wrap gap-2 my-2 md:my-4">
                        <div class="relative inline-block max-w-[240px]" v-for="img, i in Config.carousels" :key="i">
                            <NuxtImg provider="localProvider" :src="((img as ICarousel).image?.image as string)"
                                class="object-cover rounded-lg shadow-md" alt="Carousel Image" loading="lazy" />
                            <UButton icon="i-heroicons-x-mark" color="error" variant="soft" size="xs"
                                class="absolute top-2 right-2 !bg-white/80 hover:!bg-white/100"
                                @click="deletePhoto(i, img.image?._id as string)"
                                :disabled="notEditMode && !isSaving" />
                        </div>
                    </div>
                    <!-- Image upload -->
                </UFormField>
            </div>

            <template #footer>
                <UButton @click="onSubmit" :label="'Simpan'" :loading="loading" variant="solid" block
                    :size="responsiveUISizes.button"
                    :v-if="organizer?.role.includes('Ketua') || organizer?.role.includes('Chairman')" />
            </template>
        </UCard>
    </div>
</template>