<script setup lang='ts'>
import { ModalsImageCrop, ModalsImageOpen, ModalsProfileActivinessLetter, NuxtImg, UTextarea } from "#components";
import type { AccordionItem, TabsItem } from "@nuxt/ui";
import imageCompression from "browser-image-compression";
import { format } from 'date-fns';
import type { DriveStep } from "driver.js";
import { DatePicker } from 'v-calendar';
import type { IAgenda, IConfig } from "~~/types";
import { type IConfigResponse } from "~~/types/IResponse";
// Define page metadata
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
});

// Set page title
useHead({
    title: "My Profile"
});

const { $ts } = useI18n();
// Fetch user data and refresh function
const { data: user, refresh } = useAuth();

// Fetch administrators data
const { convert } = useImageToBase64();
const { $api, $pageGuide } = useNuxtApp();
const overlay = useOverlay();
const toast = useToast();

const CropImageModal = overlay.create(ModalsImageCrop);
const ImageModal = overlay.create(ModalsImageOpen);
const ActivinessLetterModal = overlay.create(ModalsProfileActivinessLetter);



const editMode = ref(false);
const file = ref<File | null>(null);
const { data: configData } = useAsyncData(() => $api<IConfigResponse>("/api/config"));
const Config = computed<IConfig | undefined>(() => configData.value?.data);

// Use window size to determine if the device is mobile
const windowSize = useWindowSize();
const isMobile = computed(() => windowSize.width.value < 640);

/**
 * Handle file change event for avatar upload
 * @param {Event} $event - The file input change event
 */
const onFileChange = async ($event: Event) => {
    const target = $event.target as HTMLInputElement;
    const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
    }
    if (target && target.files) {
        file.value = target.files[0]!;
        const compressedFile = await imageCompression(file.value, options);
        const blob = URL.createObjectURL(compressedFile);
        CropImageModal.open({
            img: blob,
            title: file.value.name,
            async onCropped(file: File) {
                const body = new FormData();
                body.append("avatar", file);
                await $api("/api/member/avatar", {
                    method: "put",
                    query: {
                        NIM: user?.value?.member.NIM
                    },
                    body
                });
                CropImageModal.close();
                refresh();
            }
        });
    }
}
const member = ref({
    email: user?.value?.member.email || "",
    fullName: user?.value?.member.fullName || "",
    class: user?.value?.member.class || "",
    semester: user?.value?.member.semester || "",
    birth: {
        place: user?.value?.member.birth.place || "",
        date: new Date(user?.value?.member.birth.date!) || new Date(),
    },
    sex: user?.value?.member.sex || "",
    religion: user?.value?.member.religion || "",
    citizen: user?.value?.member.citizen || "",
    phone: user?.value?.member.phone || "",
    address: {
        fullAddress: user?.value?.member.address.fullAddress || "",
        village: user?.value?.member.address.village || "",
        district: user?.value?.member.address.district || "",
        city: user?.value?.member.address.city || "",
        province: user?.value?.member.address.province || "",
        country: user?.value?.member.address.country || "",
        zip: user?.value?.member.address.zip || "",
    },
    point: user?.value?.member.point || [],
    agendasCommittee: user?.value?.member.agendas.committees || [],
    agendasMember: user?.value?.member.agendas.members || [],
    projects: user?.value?.member.projects || [],
    aspirations: user?.value?.member.aspirations || [],
    organizer: user?.value?.member.organizer || [],
})
const openImage = () => {
    ImageModal.open({
        photo: {
            image: user?.value?.member.avatar || '/img/member-blank.png',
            archived: false,
        },
        canRemove: false
    });
}
const saveProfile = async () => {
    try {
        const response = await $api("/api/member", {
            method: "put",
            query: {
                NIM: user?.value?.member.NIM
            },
            body: member.value
        });
        if (response.statusCode === 200) {
            refresh();
            toast.add({ title: response.statusMessage, color: 'success' });
            editMode.value = false;
        }
    } catch (error: any) {

        toast.add({ title: error.statusMessage, color: 'error' });
    }

}

const generateActivinessLetterConfirm = () => {
    ActivinessLetterModal.open();

}
onMounted(() => {
    const steps: DriveStep[] = [
        {
            element: '#profile',
            popover: {
                title: $ts('profile'),
                description: $ts('profile_desc'),
                side: 'right'
            },
        },
        {
            element: '#avatar',
            popover: {
                title: $ts('photo_profile'),
                description: $ts('avatar_desc'),
                side: 'right'
            }
        },
        {
            element: '#details',
            popover: {
                title: $ts('details'),
                description: $ts('details_desc'),
                side: 'right'
            }
        },
        {
            element: '#organization',
            popover: {
                title: $ts('organization'),
                description: $ts('organization_desc'),
                side: 'right'
            }
        },
        {
            element: '#activiness',
            popover: {
                title: $ts('generate_activiness_letter'),
                description: $ts('generate_activiness_letter_description'),
                side: 'right'
            }
        },
        {
            element: '#edit',
            popover: {
                title: $ts('edit'),
                description: $ts('edit_desc'),
                side: 'right'
            }
        }
    ]
    $pageGuide('profile', steps, {
        showProgress: true,
        showButtons: ['next', 'previous'],
    });
});
function toTitleCase(str: string) {
    return str.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }).join(' ');
};

const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

const pointAccordionItems = computed<AccordionItem[]>(() => {
    return member.value?.point?.map(point => ({
        label: `Semester ${point.semester}`,
    })) || [];
});

const getAgendasCommitteeByRange = (range: { start: Date; end: Date }): IAgenda[] => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const agendas = member.value?.agendasCommittee?.filter((agenda: { date: { start: string; end: string; }; }) => {
        const agendaDateStart = new Date(agenda.date.start as string);
        const agendaDateEnd = new Date(agenda.date.end as string);
        return agendaDateStart >= start && agendaDateEnd <= end;
    }) || [];
    return agendas;
};
const getAgendasMemberByRange = (range: { start: Date; end: Date }): IAgenda[] => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const agendas = member.value?.agendasMember?.filter((agenda: { date: { start: string; end: string; }; }) => {
        const agendaDateStart = new Date(agenda.date.start as string);
        const agendaDateEnd = new Date(agenda.date.end as string);
        return agendaDateStart >= start && agendaDateEnd <= end;
    }) || [];
    return agendas;
};
const getProjectsByRange = (range: { start: Date; end: Date }) => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const projects = member.value?.projects?.filter((project: { date: string | number | Date; }) => {
        const projectDate = new Date(project.date);
        return projectDate >= start && projectDate <= end;
    }) || [];
    return projects;
};
const getAspirationsByRange = (range: { start: Date; end: Date }) => {
    const start = new Date(range.start);
    const end = new Date(range.end);
    const aspirations = member.value?.aspirations?.filter((aspiration: { createdAt: string | number | Date; anonymous: any; }) => {
        const aspirationDate = new Date(aspiration.createdAt);
        return aspirationDate >= start && aspirationDate <= end && !aspiration.anonymous;
    }) || [];
    return aspirations;
};

const tabItems = computed(() => [
    {
        label: $ts('personal_information'),
        icon: 'i-heroicons-user',
        slot: 'personal' as const
    },
    {
        label: $ts('organization'),
        icon: 'i-heroicons-building-office-2',
        slot: 'organization' as const
    }
] satisfies TabsItem[]);
const breadcumbs = computed(() => [
    { label: $ts('dashboard'), icon: 'i-heroicons-home' },
    { label: $ts('profile'), icon: 'i-heroicons-user' }
]);
</script>
<template>
    <div class="items-center justify-center mb-2">
        <UBreadcrumb :items="breadcumbs" class="ms-4" v-if="!isMobile" />
        <div class="pt-12 mt-2 md:pt-0 gap-4 flex flex-col-reverse md:flex-row">
            <UTabs :items="tabItems" class="md:flex-3/4 flex-1" v-if="user">
                <template #personal>
                    <div class="space-y-4">
                        <UCard class="px-4 py-8 md:px-8 md:py-12">
                            <template #header>
                                <div class="flex items-center justify-between">
                                    <h5
                                        class="text-xl font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                                        {{ $ts('personal_information') }}
                                    </h5>
                                    <UButton id="edit" icon="i-heroicons-pencil-square" color="neutral" variant="ghost"
                                        @click="editMode = !editMode" />
                                </div>
                            </template>
                            <dl class="text-gray-800 dark:text-white">
                                <!-- User details -->
                                <div class="flex flex-col pb-2">
                                    <dt class="mb-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">{{
                                        $ts('name') }}
                                    </dt>
                                    <dd class="text-base font-semibold sm:text-lg">{{ user?.member.fullName }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">{{
                                        $ts('birth') }}
                                    </dt>
                                    <div class="flex flex-col items-start justify-start md:items-center md:flex-row"
                                        v-if="editMode">
                                        <UInput type="text" name="birth" id="birth" placeholder="Jakarta"
                                            v-model="member.birth.place" required
                                            :class="isMobile ? 'mb-2 w-full' : 'flex-1 mb-0 mr-2'" />
                                        <div class="flex flex-row items-center gap-2">
                                            <!-- TODO: FIX DATE PICKER -->
                                            <UPopover :popper="{ placement: 'bottom-start', strategy: 'absolute' }">
                                                <UButton icon="i-heroicons-calendar-days-20-solid" color="neutral"
                                                    variant="outline" class="w-full">
                                                    {{ format(member.birth.date as Date, 'd MMM, yyy') }}
                                                </UButton>
                                                <template #content>
                                                    <div
                                                        class="flex items-center divide-gray-200 sm:divide-x dark:divide-gray-800">
                                                        <DatePicker v-model="member.birth.date" mode="datetime"
                                                            color="orange-hima" />
                                                    </div>
                                                </template>
                                            </UPopover>
                                            <label :class="isMobile ? 'w-full' : 'w-auto text-left'"
                                                class="block my-auto text-sm font-medium text-gray-900 dark:text-white">
                                                {{ new Date(member.birth.date).toLocaleDateString('id-ID', {
                                                    year: 'numeric', month: 'long', day: 'numeric'
                                                }) }}
                                            </label>
                                        </div>
                                    </div>
                                    <dd v-else class="text-base font-semibold sm:text-lg">{{ `${member.birth.place},
                                        ${new
                                            Date(user?.member.birth.date!).toLocaleDateString('id-ID', {
                                                year: 'numeric', month:
                                                    'long', day: 'numeric'
                                            })}` }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">{{
                                        $ts('gender') }}
                                    </dt>
                                    <USelect v-model="member.sex" v-if="editMode"
                                        :options="[{ value: 'male', label: $ts('male') }, { value: 'female', label: $ts('female') }]">
                                    </USelect>
                                    <dd v-else class="text-base font-semibold sm:text-lg">{{
                                        $ts(user?.member.sex === 'male' ? 'male' : 'female') }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">{{
                                        $ts('religion') }}
                                    </dt>
                                    <UInput v-model="member.religion" v-if="editMode" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.religion }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">{{ $ts('citizenship')
                                    }}</dt>
                                    <UInput v-model="member.citizen" v-if="editMode" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.citizen }}</dd>
                                </div>
                                <div class="flex flex-col pt-2">
                                    <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">{{ $ts('phone') }}</dt>
                                    <UInput v-model="member.phone" v-if="editMode" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.phone }}</dd>
                                </div>
                            </dl>
                        </UCard>
                        <UCard class="px-4 py-8 md:px-8 md:py-12">
                            <template #header>
                                <h5
                                    class="text-lg font-semibold text-gray-600 md:text-2xl md:font-semibold dark:text-gray-200">
                                    {{ $ts('address') }}
                                </h5>
                            </template>
                            <dl class="text-gray-800 dark:text-white">
                                <!-- User Address -->
                                <div class="flex flex-col pb-2">
                                    <dt class="mb-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">{{
                                        $ts('address') }}
                                    </dt>
                                    <UTextarea v-if="editMode" placeholder="Address "
                                        v-model="member.address.fullAddress">
                                    </UTextarea>
                                    <dd v-else class="text-base font-semibold sm:text-lg">{{
                                        user?.member.address.fullAddress }}
                                    </dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">{{
                                        $ts('village') }}
                                    </dt>
                                    <UInput v-model="member.address.village" v-if="editMode" />
                                    <dd v-else class="text-base font-semibold sm:text-lg">{{
                                        user?.member.address.village }}
                                    </dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-sm text-gray-500 sm:text-base dark:text-gray-400">{{
                                        $ts('district') }}
                                    </dt>
                                    <UInput v-model="member.address.district" v-if="editMode" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.address.district }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">{{ $ts('city') }}</dt>
                                    <UInput v-model="member.address.city" v-if="editMode" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.address.city }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">{{ $ts('province') }}
                                    </dt>
                                    <UInput v-model="member.address.province" v-if="editMode" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.address.province }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">{{ $ts('country') }}
                                    </dt>
                                    <UInput v-model="member.address.country" v-if="editMode" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.address.country }}</dd>
                                </div>
                                <div class="flex flex-col py-2">
                                    <dt class="mb-1 text-gray-500 md:text-lg dark:text-gray-400">{{ $ts('zipcode') }}
                                    </dt>
                                    <UInput v-model="member.address.zip" v-if="editMode" type="number" />
                                    <dd v-else class="text-lg font-semibold">{{ user?.member.address.zip }}</dd>
                                </div>
                            </dl>
                        </UCard>
                    </div>
                </template>
                <template #organization>
                    <div class="space-y-4">
                        <!-- Current Role -->
                        <UCard>
                            <template #header>
                                <h3 class="text-lg font-semibold">{{ $ts('organization') }}</h3>
                            </template>

                            <div class="flex items-center justify-between" v-if="member.organizer">
                                <div>
                                    <h4 class="font-medium">{{ member.organizer.role }}</h4>
                                    <p class="text-sm text-gray-600 dark:text-gray-300">
                                        {{ formatDate(member.organizer.period.start) }} - {{
                                            formatDate(member.organizer.period.end) }}
                                    </p>
                                </div>
                                <UBadge
                                    :color="new Date(member.organizer.period.end) > new Date() ? 'success' : 'neutral'"
                                    variant="subtle">
                                    {{ new Date(member.organizer.period.end) > new Date() ? $ts('active') :
                                        $ts('inactive') }}
                                </UBadge>
                            </div>
                            <div class="flex items-center justify-between" v-else>
                                <div>
                                    <h4 class="font-medium">{{ $ts('member') }}</h4>
                                </div>
                                <UBadge :color="Number(member.semester) > 14 ? 'error' : 'success'" variant="subtle">{{
                                    Number(member.semester) > 14
                                        ? $ts('active') : $ts('inactive') }}</UBadge>
                            </div>
                        </UCard>
                        <!-- Points Summary -->
                        <UCard>
                            <template #header>
                                <h3 class="text-lg font-semibold">{{ $ts('point_summary') }}</h3>
                            </template>

                            <div class="space-y-4">
                                <div v-if="member.point && member.point.length > 0">
                                    <UAccordion :items="pointAccordionItems" :ui="{ label: 'w-full flex-1' }">
                                        <template #default="{ index }">
                                            <div class="flex justify-between items-center mb-2 w-full">
                                                <span
                                                    class="text-sm font-medium text-gray-700 dark:text-gray-300">Semester
                                                    {{ member.point[index]!.semester
                                                    }}</span>
                                                <UBadge color="secondary" variant="subtle">{{
                                                    member.point[index]!.point
                                                    }} pts</UBadge>
                                            </div>
                                            <div class="text-xs text-gray-500 dark:text-gray-300">
                                                {{ formatDate(member.point[index]!.range.start) }} - {{
                                                    formatDate(member.point[index]!.range.end) }}
                                            </div>
                                            <div class="grid grid-cols-3 gap-2 mt-2 text-xs">
                                                <div class="text-center">
                                                    <div class="font-medium">{{
                                                        member.point[index]!.activities.agendas.committees +
                                                        member.point[index]!.activities.agendas.participants }}</div>
                                                    <div class="text-gray-500 dark:text-gray-300">{{ $ts('agenda')
                                                        }}
                                                    </div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="font-medium">{{
                                                        getProjectsByRange(member.point[index]!.range)?.length
                                                        ||
                                                        0
                                                    }}</div>
                                                    <div class="text-gray-500 dark:text-gray-300">{{ $ts('project')
                                                        }}
                                                    </div>
                                                </div>
                                                <div class="text-center">
                                                    <div class="font-medium">{{
                                                        getAspirationsByRange(member.point[index]!.range)?.length ||
                                                        0 }}</div>
                                                    <div class="text-gray-500 dark:text-gray-300">{{
                                                        $ts('aspiration')
                                                        }}</div>
                                                </div>
                                            </div>
                                        </template>
                                        <template #content="{ index }">
                                            <div class="space-y-4">
                                                <!-- Activities Summary -->
                                                <!-- Agendas -->
                                                <UCard>
                                                    <template #header>
                                                        <div class="flex items-center justify-between">
                                                            <h3 class="text-lg font-semibold">{{ $ts('agenda') }}
                                                            </h3>
                                                            <UBadge variant="subtle">
                                                                {{
                                                                    (getAgendasCommitteeByRange(member.point[index]!.range)?.length
                                                                        || 0) +
                                                                    (getAgendasMemberByRange(member.point[index]!.range)?.length
                                                                        || 0)
                                                                }} total
                                                            </UBadge>
                                                        </div>
                                                    </template>

                                                    <div class="space-y-4">
                                                        <div
                                                            v-if="getAgendasCommitteeByRange(member.point[index]!.range) && getAgendasCommitteeByRange(member.point[index]!.range).length > 0">
                                                            <h4 class="font-medium mb-2">{{ $ts('committee') }}</h4>
                                                            <div class="space-y-2">
                                                                <div v-for="agenda, i in getAgendasCommitteeByRange(member.point[index]!.range)"
                                                                    :key="i"
                                                                    class="flex items-center justify-between p-3 bg-green-50/20 rounded-lg">
                                                                    <div>
                                                                        <p class="font-medium">{{ agenda.title }}
                                                                        </p>
                                                                        <p
                                                                            class="text-sm text-gray-600 dark:text-gray-300">
                                                                            {{ agenda.at }}</p>
                                                                    </div>
                                                                    <UBadge color="success" variant="subtle">{{
                                                                        agenda.configuration.committee.point || 0 }} Pts
                                                                    </UBadge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div
                                                            v-if="getAgendasMemberByRange(member.point[index]!.range) && getAgendasMemberByRange(member.point[index]!.range).length > 0">
                                                            <h4 class="font-medium mb-2">{{ $ts('participant') }}
                                                            </h4>
                                                            <div class="space-y-2">
                                                                <div v-for="agenda, i in getAgendasMemberByRange(member.point[index]!.range)"
                                                                    :key="i"
                                                                    class="flex items-center justify-between p-3 bg-blue-50/20 rounded-lg">
                                                                    <div>
                                                                        <p class="font-medium">{{ agenda.title }}
                                                                        </p>
                                                                        <p
                                                                            class="text-sm text-gray-600 dark:text-gray-300">
                                                                            {{ agenda.at }}</p>
                                                                    </div>
                                                                    <UBadge variant="subtle">{{
                                                                        agenda.configuration.participant.point || 0 }}
                                                                        Pts</UBadge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div v-if="(!getAgendasCommitteeByRange(member.point[index]!.range) || getAgendasCommitteeByRange(member.point[index]!.range).length === 0) && (!getAgendasMemberByRange(member.point[index]!.range) || getAgendasMemberByRange(member.point[index]!.range).length === 0)"
                                                            class="text-center text-gray-500 dark:text-gray-300 py-4">
                                                            {{ $ts('no_agendas') }}
                                                        </div>
                                                    </div>
                                                </UCard>
                                                <!-- Projects -->
                                                <UCard>
                                                    <template #header>
                                                        <div class="flex items-center justify-between">
                                                            <h3 class="text-lg font-semibold">Projects</h3>
                                                            <UBadge variant="subtle">{{
                                                                getProjectsByRange(member.point[index]!.range)?.length
                                                                ||
                                                                0
                                                            }} projects</UBadge>
                                                        </div>
                                                    </template>

                                                    <div class="space-y-4">
                                                        <div
                                                            v-if="getProjectsByRange(member.point[index]!.range) && getProjectsByRange(member.point[index]!.range).length > 0">
                                                            <div v-for="project in getProjectsByRange(member.point[index]!.range)"
                                                                :key="project._id"
                                                                class="flex items-center justify-between p-3 bg-purple-50/20 rounded-lg">
                                                                <div class="flex-1">
                                                                    <p class="font-medium">{{ project.title }}</p>
                                                                    <p class="text-sm text-gray-600">{{
                                                                        project.description
                                                                    }}</p>
                                                                    <div class="flex items-center gap-2 mt-2">
                                                                        <div
                                                                            class="w-full bg-gray-200 rounded-full h-2">
                                                                            <div class="bg-purple-600 h-2 rounded-full"
                                                                                :style="{ width: project.progress + '%' }">
                                                                            </div>
                                                                        </div>
                                                                        <span
                                                                            class="text-xs text-gray-500 dark:text-gray-300">{{
                                                                                project.progress }}%</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div v-else
                                                            class="text-center text-gray-500 dark:text-gray-300 py-4">
                                                            {{ $ts('no_projects') }}
                                                        </div>
                                                    </div>
                                                </UCard>
                                                <!-- Aspirations -->
                                                <UCard>
                                                    <template #header>
                                                        <div class="flex items-center justify-between">
                                                            <h3 class="text-lg font-semibold">{{ $ts('aspiration')
                                                                }}
                                                            </h3>
                                                            <UBadge variant="subtle">{{
                                                                getAspirationsByRange(member.point[index]!.range)?.length
                                                                ||
                                                                0 }} {{ $ts('aspiration') }}
                                                            </UBadge>
                                                        </div>
                                                    </template>
                                                    <div
                                                        v-if="getAspirationsByRange(member.point[index]!.range) && getAspirationsByRange(member.point[index]!.range).length > 0">
                                                        <div class="space-y-4">
                                                            <div v-for="aspiration, i in getAspirationsByRange(member.point[index]!.range)"
                                                                :key="i"
                                                                class="flex items-center justify-between p-3 bg-yellow-50/20 rounded-lg">
                                                                <div class="flex-1">
                                                                    <p class="font-medium">{{ aspiration.subject }}
                                                                    </p>
                                                                </div>
                                                                <UBadge variant="subtle">{{ aspiration.totalVotes }}
                                                                </UBadge>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div v-else
                                                        class="text-center text-gray-500 dark:text-gray-300 py-4">
                                                        {{ $ts('no_aspirations') }}
                                                    </div>
                                                </UCard>
                                            </div>

                                        </template>

                                    </UAccordion>

                                </div>
                                <div v-else class="text-center text-gray-500 dark:text-gray-300 py-4">
                                    {{ $ts('no_points_data') }}
                                </div>
                            </div>
                        </UCard>
                    </div>
                </template>
            </UTabs>
            <div class="flex-1 md:flex-1/4 space-y-4 pt-12">
                <UCard class="px-4 pt-8 md:px-8 md:pt-12" id="profile" :ui="{ root: 'overflow-visible' }">
                    <!-- User avatar and member summary -->
                    <div id="avatar" class="relative w-56 h-56 mx-auto -mt-32 overflow-hidden rounded-full group">
                        <NuxtImg provider="cloudflare" :src="user?.member.avatar || '/img/profile-blank.png'"
                            class="object-cover w-full aspect-square" loading="lazy" />
                        <div
                            class="absolute top-0 left-0 flex items-center justify-center w-full h-0 gap-2 duration-500 rounded-full opacity-0 bg-accent-2/60 bg-opacity-95 group-hover:h-full group-hover:opacity-100">
                            <label for="inputAvatar" class="cursor-pointer">
                                <Icon name="solar:upload-minimalistic-outline"
                                    class="w-8 h-8 text-white hover:text-gray-300" />
                                <input id="inputAvatar" type="file" class="hidden" @change="onFileChange" />
                            </label>
                            <button>
                                <Icon name="solar:eye-outline" class="w-8 h-8 text-white hover:text-gray-300"
                                    @click="openImage" />
                            </button>
                        </div>
                    </div>
                    <div class="mx-auto mt-8 text-center">
                        <h2 class="text-4xl font-bold leading-tight tracking-tight text-gray-600 dark:text-gray-200">
                            {{ user?.username }}
                        </h2>
                        <dl class="w-full text-gray-900 dark:text-white">
                            <!-- User member summary -->
                            <div class="flex flex-col pb-6">
                                <dd class="text-lg font-semibold">{{ user?.member.email }}</dd>
                            </div>
                            <div class="flex flex-col py-3">
                                <dt class="text-sm text-gray-500 dark:text-gray-400">NIM</dt>
                                <dd class="text-lg font-semibold">{{ user?.member.NIM }}
                                </dd>
                            </div>
                            <div class="flex flex-col py-3">
                                <dt class="text-sm text-gray-500 dark:text-gray-400">{{ $ts('class') }}</dt>
                                <UInput v-model="member.class" placeholder="Class" v-if="editMode" />
                                <dd v-else class="text-lg font-semibold">{{ user?.member.class }}</dd>
                            </div>
                            <div class="flex flex-col py-3">
                                <dt class="text-sm text-gray-500 dark:text-gray-400">{{ $ts('semester') }}</dt>

                                <UInput v-model="member.semester" placeholder="Semester" v-if="editMode" />
                                <dd class="text-lg font-semibold" v-else>{{ user?.member.semester }}</dd>
                            </div>
                            <div class="flex flex-col">
                                <dt class="text-sm text-gray-500 dark:text-gray-400">{{ $ts('generation') }}</dt>
                                <dd class="text-lg font-semibold">{{ user?.member.enteredYear }}</dd>
                            </div>
                        </dl>
                    </div>
                </UCard>
                <UCard>
                    <div class="flex flex-col pt-3 gap-4">
                        <UButton block :label="$ts('generate_activiness_letter')" variant="solid"
                            @click="generateActivinessLetterConfirm" />
                        <div class="flex flex-row gap-2">
                            <UButton block class="flex-1" :label="$ts('change_email')" size="sm" color="success"
                                :to="{ path: '/change-email', query: { NIM: user?.member.NIM, email: user?.member.email, username: user?.username } }" />
                            <UButton block class="flex-1" :label="$ts('change_password')" size="sm" color="error"
                                :to="{ path: '/change-password' }" />
                        </div>
                        <UButton block :label="editMode ? $ts('cancel') : $ts('edit')"
                            :color="editMode ? 'error' : 'success'" @click="editMode = !editMode" />
                        <UButton block label="Save" @click="saveProfile" class="pt-2" v-if="editMode" />
                    </div>
                </UCard>
            </div>
        </div>
    </div>
</template>