<script setup lang='ts'>
import { ModalsConfirmation, ModalsPDF } from '#components';
import type { DropdownMenuItem } from '@nuxt/ui';
import type { IDoc, IMember } from '~~/types';
import type { IDocResponse, IResponse } from '~~/types/IResponse';
const { data: user } = useAuth();

const { $api } = useNuxtApp();
const { $ts } = useI18n();
const router = useRouter();
const { width } = useWindowSize();
const overlay = useOverlay();
const toast = useToast();

const ConfirmationModal = overlay.create(ModalsConfirmation);
const PDFModal = overlay.create(ModalsPDF);


const isMobile = computed(() => width.value < 768);
const activeTab = ref('0');
const signed = ref<boolean>(false);
const page = ref(1);
const perPage = ref(10);
const { data, refresh, pending: loading, error } = useLazyAsyncData(() => $api<IDocResponse>(`/api/signatures`, {
    query: {
        page: page.value,
        perPage: perPage.value,
        sort: 'createdAt',
        order: 'desc',
        signed: signed.value
    }
}), {
    watch: [signed, page, perPage],
});

const documents = computed<IDoc[]>(() => data.value?.data?.doc as IDoc[] || []);
const downloadDoc = async (doc: IDoc) => {
    try {
        const link = document.createElement('a');
        link.href = doc.doc as string;
        link.setAttribute('download', doc.label);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error(error);
    }
};
const viewDoc = (doc: IDoc) => {
    PDFModal.open({
        doc: doc
    })
};
const removeDoc = async (doc: IDoc) => {
    ConfirmationModal.open({
        title: $ts('remove_doc'),
        body: $ts('remove_doc_confirmation', { name: doc.label }),
        onConfirm: async () => {
            try {
                const response = await $api<IResponse>('/api/doc', {
                    method: 'DELETE',
                    query: {
                        id: doc._id
                    }
                });
                if (response.statusCode === 200) {
                    toast.add({ title: $ts('success'), description: $ts('success_to_delete_document') });
                } else {
                    toast.add({ title: $ts('error'), description: $ts('error_to_delete_document'), color: 'error' });
                }
            } catch (error) {
                toast.add({ title: $ts('error'), description: $ts('error_to_delete_document'), color: 'error' });
            } finally {
                await refresh();
                ConfirmationModal.close();
            }
        }
    })
};
const items = (doc: IDoc): DropdownMenuItem[][] => [
    [
        {
            label: $ts('view'),
            icon: 'i-heroicons-eye',
            onSelect: () => viewDoc(doc)
        },
        {
            label: $ts('sign'),
            icon: 'i-heroicons-finger-print',
            onSelect: () => router.push(`/signatures/${doc._id}`)
        },
        {
            label: $ts('download'),
            icon: 'i-heroicons-arrow-down-tray',
            onSelect: () => downloadDoc(doc)
        },
        {
            label: $ts('delete'),
            icon: 'i-heroicons-trash',
            onSelect: () => removeDoc(doc)
        }
    ]
]
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('signature'),
    icon: 'i-heroicons-finger-print',
}]);
const tabs = computed(() => [
    {
        label: $ts('unsigned'),
        description: $ts('unsigned_description'),
        key: 'unsigned'
    },
    {
        label: $ts('signed'),
        description: $ts('signed_description'),
        key: 'signed'
    }
]);

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => data.value?.data?.length || 0);
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1);
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value));
const perPageOptions = computed(() => {
    const baseOptions = [5, 10, 20, 50, 100];
    if (pageTotal.value < 10) {
        return baseOptions.filter((option) => option <= 10);
    }
    const filteredOptions = baseOptions.filter((option) => option <= pageTotal.value);

    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }

    return filteredOptions;
});

watch(activeTab, (tab) => {
    if (tab === '0') {
        signed.value = false;
    } else {
        signed.value = true;
    }
});


definePageMeta({
    layout: 'dashboard',
});
useHead({
    title: () => $ts('signature'),
    meta: [
        {
            name: 'description',
            content: 'Signatures'
        }
    ]
});
useSeoMeta({
    ogTitle: 'Signatures',
    ogDescription: 'Signatures',
    ogImage: '/img/og-image.png',
    ogUrl: '/signatures',
    twitterTitle: 'Signatures',
    twitterDescription: 'Signatures',
    twitterImage: '/img/og-image.png',
})
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" class="my-4" />
        <UTabs :items="tabs" v-model="activeTab">
            <template #content="{ item }">
                <UCard class="w-full mx-auto mt-4 max-w-10xl" v-if="item.key === 'unsigned'">
                    <template #header>
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-300">{{ item.description }}</h2>
                    </template>
                    <ol class="mt-3 space-y-2 divide-y divide-gray-200 dark:divide-gray-700">
                        <USkeleton v-for="i in 5" :key="i" class="h-14 w-full" v-if="loading" />
                        <div v-else-if="error">
                            <h1 class="text-red-500 text-2xl text-center">{{ error.message }}</h1>
                        </div>
                        <div v-else-if="documents.length === 0">
                            <h1 class="text-2xl text-center">{{ $ts('no_data') }}</h1>
                        </div>
                        <li v-for="doc, i in documents" :key="(doc._id as string)"
                            class="rounded-lg cursor-pointer bg-secondary-light/15 dark:bg-secondary-dark/15" v-else>
                            <div class="items-center block p-3 sm:flex">
                                <NuxtImg provider="localProvider" class="w-12 h-12 mb-3 rounded-full me-3 sm:mb-0"
                                    :src="(doc.uploader as IMember).avatar || '/img/profile-blank.png'"
                                    :alt="(doc.uploader as IMember).fullName" loading="lazy" />
                                <div class="flex items-center justify-between w-full text-gray-600 dark:text-gray-400">
                                    <ULink :to="`/signatures/${doc._id}`"
                                        class="text-sm font-normal text-gray-500 dark:text-gray-300">
                                        <span>{{ doc.label }}</span> |
                                        <span class="font-semibold text-gray-800 dark:text-gray-200">{{ (doc.uploader as
                                            IMember).fullName
                                        }}</span>
                                    </ULink>
                                    <span
                                        class="inline-flex items-center text-xs font-normal text-gray-500 dark:text-gray-400">
                                        <UDropdownMenu class="flex items-center justify-center" :items="items(doc)">
                                            <UButton color="neutral" variant="ghost"
                                                icon="i-heroicons-ellipsis-vertical" />
                                        </UDropdownMenu>
                                    </span>
                                </div>
                            </div>
                        </li>
                    </ol>
                    <!-- Number of rows & Pagination -->
                    <template #footer>
                        <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                            <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                                <span class="text-xs leading-none md:text-sm md:leading-5">{{ $ts('rows_per_page')
                                    }}</span>
                                <USelect v-model="perPage" :items="perPageOptions" class="w-20 me-2" size="xs" />
                            </div>
                            <div class="mb-2 sm:mb-0">
                                <span class="text-xs leading-none md:text-sm md:leading-5">
                                    {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                                </span>
                            </div>
                            <UPagination v-model:page="page" :items-per-page="perPage" :total="pageTotal"
                                :sibling-count="isMobile ? 1 : 2" show-edges />
                        </div>
                    </template>
                </UCard>
                <UCard class="w-full mx-auto mt-4 max-w-10xl" v-else>
                    <template #header>
                        <h2 class="text-lg font-semibold text-gray-800 dark:text-gray-300">{{ item.description }}</h2>
                    </template>
                    <ol class="mt-3 space-y-2 divide-y divide-gray-200 dark:divide-gray-700">
                        <li v-for="doc in documents" :key="(doc._id as string)"
                            class="rounded-lg cursor-pointer bg-secondary-light/15 dark:bg-secondary-dark/15">
                            <div class="items-center block p-3 sm:flex">
                                <NuxtImg provider="localProvider" class="w-12 h-12 mb-3 rounded-full me-3 sm:mb-0"
                                    :src="(doc.uploader as IMember).avatar || '/img/profile-blank.png'"
                                    :alt="(doc.uploader as IMember).fullName" loading="lazy" />
                                <div class="flex items-center justify-between w-full text-gray-600 dark:text-gray-400">
                                    <ULink :to="`/signatures/${doc._id}`"
                                        class="text-sm font-normal text-gray-500 dark:text-gray-300">
                                        <span>{{ doc.label }}</span> |
                                        <span class="font-semibold text-gray-800 dark:text-gray-200">{{ (doc.uploader as
                                            IMember).fullName
                                        }}</span>
                                    </ULink>
                                    <span
                                        class="inline-flex items-center text-xs font-normal text-gray-500 dark:text-gray-400">
                                        <UDropdownMenu class="flex items-center justify-center" :items="items(doc)">
                                            <UButton color="neutral" variant="ghost"
                                                icon="i-heroicons-ellipsis-vertical" />
                                        </UDropdownMenu>
                                    </span>
                                </div>
                            </div>
                        </li>
                    </ol>
                    <!-- Number of rows & Pagination -->
                    <template #footer>
                        <div class="flex flex-col items-center justify-between gap-2 md:flex-row">
                            <div class="flex items-center gap-1.5 mb-2 sm:mb-0">
                                <span class="text-xs leading-none md:text-sm md:leading-5">{{ $ts('rows_per_page')
                                    }}</span>
                                <USelect v-model="perPage" :items="perPageOptions" class="w-20 me-2" size="xs" />
                            </div>
                            <div class="mb-2 sm:mb-0">
                                <span class="text-xs leading-none md:text-sm md:leading-5">
                                    {{ $ts('showing_results', { start: pageFrom, end: pageTo, total: pageTotal }) }}
                                </span>
                            </div>

                            <UPagination v-model:page="page" :items-per-page="perPage" :total="pageTotal"
                                :sibling-count="isMobile ? 1 : 2" show-edges />
                        </div>
                    </template>
                </UCard>
            </template>
        </UTabs>
    </div>
</template>
<style scoped></style>