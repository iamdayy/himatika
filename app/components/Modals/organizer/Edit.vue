<script setup lang="ts">
import { ModalsImageCrop } from '#components';
import imageCompression from 'browser-image-compression';
import type { IMember, IOrganizer } from '~/types';
import type { IConfigResponse, IMemberResponse, IOrganizerResponse } from '~/types/IResponse';


const { $api } = useNuxtApp();
const overlay = useOverlay();
const toast = useToast();
const config = useRuntimeConfig();
const { $ts } = useI18n();
const { convert } = useImageToBase64();
const items = [
    { slot: 'dailyManager', label: 'Daily Manager' },
    { slot: 'departements', label: 'Departements' }
];

const CropImageModal = overlay.create(ModalsImageCrop)
const searchMember = ref('');
const { data } = await useAsyncData<IConfigResponse>(() => $fetch<IConfigResponse>("/api/config"));
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
const { width } = useWindowSize();
const props = defineProps({
    org: {
        type: Object as PropType<IOrganizer>,
        required: true,
    }
});
const emits = defineEmits<{
    (e: 'refreshTrigger'): void
}>();

const dailyManagements = computed(() => {
    if (!data.value) return [];
    return data.value.data.dailyManagements.map((management) => ({
        position: management,
        member: 0,
    }));
});

const departements = computed(() => {
    if (!data.value) return [];
    return data.value.data.departments.map((department) => ({
        name: department,
        coordinator: 0,
        members: [],
    }));
});

// Initialize organizer with existing data
const organizer = ref<IOrganizer>({
    ...props.org,
    considerationBoard: props.org.considerationBoard.map(c => (c as IMember).NIM),
    dailyManagement: dailyManagements.value.map((dayly) => {
        return {
            ...dayly,
            member: (props.org.dailyManagement.find(d => d.position == dayly.position)?.member as IMember)?.NIM || 0
        }
    }),
    department: departements.value.map((department) => {

        return {
            ...department,
            coordinator: (props.org.department.find(d => d.name == department.name)?.coordinator as IMember)?.NIM || 0,
            members: props.org.department.find(d => d.name == department.name)?.members.map(m => (m as IMember).NIM || 0) || []
        }
    }),
});

const departementsTabs = computed(() => {
    return organizer.value.department.map((department) => ({
        slot: 'departement',
        label: department.name,
    }));
});


const files = ref<File[]>([]);
const filesToCropped = ref<{ blob: string, name: string }[]>([{ blob: '', name: '' }, { blob: '', name: '' }, { blob: '', name: '' }]);
const loadingCompress = ref<boolean>(false);
const openModals = ref<boolean[]>([false, false, false]);
const isMobile = computed(() => width.value < 768);

const onChangeImages = async (files: FileList, i: number) => {
    if (files.length === 0) return;
    const f = files[0]!;
    loadingCompress.value = true;
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        alwaysKeepResolution: true
    }
    const compressedFile = await imageCompression(f, options);
    const blob = URL.createObjectURL(compressedFile);
    CropImageModal.open({
        img: blob,
        title: f.name,
        stencil: {
            movable: true,
            resizable: true,
            aspectRatio: 1 / 1,
        },
        onCropped: (file: File) => {
            onCropped(file, i);
            CropImageModal.close();
        },
    });
    loadingCompress.value = false;
}

const onCropped = async (f: File, i: number) => {
    try {
        openModals.value[i] = false;
        if (files.value[i]) {
            files.value[i] = f;
        } else {
            files.value.push(f);
        }
        const blob = URL.createObjectURL(f);
        filesToCropped.value[i]!.blob = blob;
    } catch (error) {
        toast.add({ title: "Failed to compress image" });
    }
}

const editOrganizer = async () => {
    const body: IOrganizer = {
        ...organizer.value,
        council: await Promise.all(organizer.value.council.map(async (council, i) => {
            if (files.value[i]) {
                council.image = {
                    name: files.value[i]?.name,
                    content: await convert(files.value[i]),
                    size: files.value[i]?.size.toString(),
                    type: files.value[i]?.type,
                    lastModified: files.value[i]?.lastModified.toString(),

                }
            }
            return council;
        })),
        advisor: {
            ...organizer.value.advisor,
            image: files.value[organizer.value.council.length] ? {
                name: files.value[organizer.value.council.length]!.name,
                content: await convert(files.value[organizer.value.council.length]!),
                size: files.value[organizer.value.council.length]!.size.toString(),
                type: files.value[organizer.value.council.length]!.type,
                lastModified: files.value[organizer.value.council.length]!.lastModified.toString(),
            } : organizer.value.advisor.image
        },
    }
    try {
        const response = await $api<IOrganizerResponse>("/api/organizer", {
            method: "PUT",
            query: {
                period: `${new Date(organizer.value.period.start).getFullYear()}-${new Date(organizer.value.period.end).getFullYear()}`,
            },
            body: body,
            headers: {
                "Content-Type": "application/json"
            }
        });
        if (response.statusCode !== 200) {
            toast.add({ title: $ts('failed'), color: 'error', description: $ts('edit_organizer_failed') });
        }
        toast.add({ title: $ts('success'), color: 'success', description: $ts('edit_organizer_success') });
        emits("refreshTrigger");
    } catch (error) {
        toast.add({ title: $ts('failed'), color: 'error', description: $ts('edit_organizer_failed') });
    }
}
const addNewConsideration = () => {
    (organizer.value.considerationBoard as number[]).push(0);
}


watch(() => organizer.value.period.start, (newVal) => {
    const date = new Date(newVal);
    organizer.value.period.end = new Date(date.getFullYear() + 1, date.getMonth(), date.getDate());
});
// Responsive UI sizes based on screen width
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));
onMounted(() => {
    if (!props.org) {
        organizer.value = {
            council: [{
                position: '',
                name: '',
                image: {
                    name: '',
                    content: '',
                    size: '',
                    type: '',
                    lastModified: '',
                },
            },
            {
                position: '',
                name: '',
                image: {
                    name: '',
                    content: '',
                    size: '',
                    type: '',
                    lastModified: '',
                },
            }],
            advisor: {
                position: '',
                name: '',
                image:
                {
                    name: '',
                    content: '',
                    size: '',
                    type: '',
                    lastModified: '',
                },
            },
            considerationBoard: [0, 0],
            dailyManagement: dailyManagements.value,
            department: departements.value,
            period: {
                start: new Date(),
                end: new Date(Date.now() + 12 * 30 * 24 * 60 * 60 * 1000)
            }
        }
    }
})
</script>
<template>
    <UModal :fullscreen="true"
        :title="$ts('edit_organizer', { count: `${new Date(organizer.period.start).getFullYear()} - ${new Date(organizer.period.end).getFullYear()}` })">
        <template #body>
            <div class="mb-6 ms-3">
                <label for="Title" class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Period</label>
                <VDatePicker id="deadline" v-model="organizer.period.start" mode="date">
                    <template #default="{ togglePopover }">
                        <UButton @click="togglePopover" icon="i-heroicons-calendar" variant="outline">
                            <template #trailing>
                                <span class="text-sm font-medium text-gray-900 dark:text-white" for="deadline">
                                    {{ new Date(organizer.period.start).getFullYear() }} -
                                    {{ new Date(organizer.period.end).getFullYear() }}
                                </span>
                            </template>
                        </UButton>
                    </template>
                </VDatePicker>
            </div>
            <div class="my-4">
                <label for="council" class="block mb-2 text-lg font-semibold text-gray-900 dark:text-white">{{
                    $ts('council')
                    }}</label>
                <div class="grid grid-cols-12 gap-2 px-2 md:px-4" id="council">
                    <div class="grid grid-cols-12 col-span-6 gap-2" v-for="(council, i) in organizer.council" :key="i">
                        <UFormField class="col-span-12" :label="$ts('name')" required>
                            <UInput type="text" name="Name" id="Name" :placeholder="$ts('name')" required
                                :size="responsiveUISizes.input" v-model="organizer.council[i]!.name" class="w-full" />
                        </UFormField>
                        <UFormField class="col-span-12" :label="$ts('position')" required>
                            <UInput type="text" name="Position" id="Position" placeholder="Rector, etc." required
                                :size="responsiveUISizes.input" v-model="organizer.council[i]!.position"
                                class="w-full" />
                        </UFormField>
                        <UFormField class="col-span-12" :label="$ts('image')" required>
                            <DropFile :identifier="i" @change="v => onChangeImages(v, i)" accept="image/*">
                                <div v-if="filesToCropped[i]!.blob">
                                    <NuxtImg :src="filesToCropped[i]!.blob" :alt="filesToCropped[i]!.name"
                                        class="mx-auto" />
                                </div>
                                <div
                                    v-else-if="organizer.council[i]!.image && typeof organizer.council[i]!.image === 'string'">
                                    <NuxtImg provider="localProvider" :src="organizer.council[i]!.image"
                                        :alt="organizer.council[i]!.name" class="mx-auto" />
                                </div>
                            </DropFile>
                        </UFormField>
                    </div>
                </div>
            </div>
            <div class="my-4">
                <label for="advisor" class="block mb-2 text-lg font-semibold text-gray-900 dark:text-white">{{
                    $ts('advisor')
                }}</label>
                <div class="grid grid-cols-12 gap-2 px-2 md:px-4" id="advisor">
                    <UFormField class="col-span-12" :label="$ts('name')" required>
                        <UInput type="text" name="Name" id="Name" :placeholder="$ts('name')" required
                            :size="responsiveUISizes.input" v-model="organizer.advisor.name" class="w-full" />
                    </UFormField>
                    <UFormField class="col-span-12" :label="$ts('position')" required>
                        <UInput type="text" name="Position" id="Position" placeholder="Advisor, etc." required
                            :size="responsiveUISizes.input" v-model="organizer.advisor.position" class="w-full" />
                    </UFormField>
                    <UFormField class="col-span-12" :label="$ts('image')" required>
                        <DropFile :identifier="organizer.council.length"
                            @change="v => onChangeImages(v, organizer.council.length)" accept="image/*">
                            <div v-if="filesToCropped[organizer.council.length]!.blob">
                                <NuxtImg :src="filesToCropped[organizer.council.length]!.blob"
                                    :alt="filesToCropped[organizer.council.length]!.name" class="mx-auto" />
                            </div>
                            <div v-else-if="organizer.advisor.image && typeof organizer.advisor.image === 'string'">
                                <NuxtImg provider="localProvider" :src="(organizer.advisor.image as string)"
                                    :alt="organizer.advisor.name" class="mx-auto" />
                            </div>
                        </DropFile>
                    </UFormField>
                </div>
            </div>
            <div class="my-4">
                <label for="ConsiderationBoard"
                    class="block mb-2 text-lg font-semibold text-gray-900 dark:text-white">{{
                        $ts('considers') }}</label>
                <div class="grid grid-cols-12 gap-2 px-2 md:px-4">
                    <div class="col-span-6" v-for="(consideration, i) in organizer.considerationBoard" :key="i">
                        <USelectMenu :items="members" :loading="status === 'pending'" v-model:search-term="searchMember"
                            :filter-fields="['label', 'email']" icon="i-lucide-user" :placeholder="$ts('search')"
                            v-model="(organizer.considerationBoard[i] as number)" value-key="value" class="w-full">

                            <template #item-label="{ item }">
                                {{ item.label }}

                                <span class="text-(--ui-text-muted)">
                                    {{ item.email }}
                                </span>
                            </template>
                        </USelectMenu>
                    </div>
                </div>
                <UButton label="Tambah" class="mt-2" variant="solid" block :size="responsiveUISizes.button"
                    @click="addNewConsideration" />
            </div>
            <UTabs :items="items">
                <template #dailyManager="{ item }">
                    <UCard>
                        <div class="grid grid-cols-12 gap-2" v-for="(member, i) in organizer.dailyManagement" :key="i">
                            <UFormField class="col-span-6" :label="$ts('position')" required>
                                <UInput type="text" name="Position" id="Position" placeholder="Leader, Secretary, etc."
                                    :size="responsiveUISizes.input" required
                                    v-model="organizer.dailyManagement[i]!.position" disabled class="w-full" />
                            </UFormField>
                            <UFormField class="col-span-6" :label="$ts('member')" required>
                                <USelectMenu :items="members" :loading="status === 'pending'"
                                    :filter-fields="['label', 'email']" icon="i-lucide-user"
                                    :placeholder="$ts('search')" v-model:search-term="searchMember"
                                    v-model="(organizer.dailyManagement[i]!.member as number)" value-key="value"
                                    class="w-full">
                                    <template #item-label="{ item }">
                                        {{ item.label }}
                                        <span class="text-(--ui-text-muted)">
                                            {{ item.email }}
                                        </span>
                                    </template>
                                </USelectMenu>
                            </UFormField>
                        </div>
                    </UCard>
                </template>
                <template #departements="{ item }">
                    <UCard>
                        <UTabs :items="departementsTabs">
                            <template #departement="{ item, index }">
                                <div class="grid grid-cols-12 gap-2 my-2">
                                    <UFormField class="col-span-12" :label="$ts('departement')" required>
                                        <UInput type="text" name="Position" id="Position"
                                            :size="responsiveUISizes.input" placeholder="Name of Departement" required
                                            v-model="organizer.department[index]!.name" class="w-full" />
                                    </UFormField>
                                    <UFormField class="col-span-12 px-2 md:px-4" :label="$ts('coordinator')" required>
                                        <USelectMenu :items="members" :loading="status === 'pending'"
                                            :filter-fields="['label', 'email']" icon="i-lucide-user"
                                            :placeholder="$ts('search')" v-model:search-term="searchMember"
                                            v-model="(organizer.department[index]!.coordinator as number)"
                                            value-key="value" class="w-full">

                                            <template #item-label="{ item }">
                                                {{ item.label }}

                                                <span class="text-(--ui-text-muted)">
                                                    {{ item.email }}
                                                </span>
                                            </template>
                                        </USelectMenu>
                                    </UFormField>
                                    <UFormField class="col-span-12" :label="$ts('member')" required>
                                        <USelectMenu :items="members" :loading="status === 'pending'"
                                            :filter-fields="['label', 'email']" icon="i-lucide-user"
                                            :placeholder="$ts('search')" v-model:search-term="searchMember"
                                            v-model="organizer.department[index]!.members as number[]" multiple
                                            value-key="value" class="w-full">

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
                        </UTabs>
                    </UCard>
                </template>
            </UTabs>
        </template>
        <template #footer>
            <UButton @click="editOrganizer" label="Save" variant="solid" block :size="responsiveUISizes.button" />
        </template>
    </UModal>
</template>
