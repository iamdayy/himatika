<script setup lang='ts'>
import { ModalsConfirmation } from '#components';
import type { AccordionItem } from '@nuxt/ui';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';


import PDFViewer from '~/components/PDFViewer.vue';
import type { IConfig, IDoc, IMember } from '~~/types';
import type { IReqSignDocument } from '~~/types/IRequestPost';
import type { IConfigResponse, IDocResponse } from '~~/types/IResponse';

const configPublic = useRuntimeConfig().public;


const { $api } = useNuxtApp();
const { data: user } = useAuth();
const overlay = useOverlay();
const route = useRoute();
const toast = useToast();
const { data, refresh } = useLazyAsyncData('docData', () => $api<IDocResponse>(`/api/doc`, {
    query: {
        id: route.params.id
    }
}));
const { data: configData } = useLazyAsyncData('configData', () => $api<IConfigResponse>(`/api/config`));

const ConfirmationModal = overlay.create(ModalsConfirmation);

const doc = computed<IDoc>(() => data.value?.data?.doc as IDoc || {});
const config = computed<IConfig>(() => configData.value?.data as IConfig);
const pdf = ref<string>('');
const pdfBuffer = ref<Uint8Array>();
const loading = ref<boolean>(false);
const docFullSigned = computed(() => {
    if (!doc.value.signs) return false;
    return doc.value.signs.every((sign) => sign.signed);
});

const trails = computed<AccordionItem[]>(() => {
    const trails = doc.value.trails || [];
    const actions = (action: string, user: string, date: string) => {
        switch (action) {
            case 'create':
                return 'Dibuat oleh ' + user + ' pada ' + date;
            case 'sign':
                return 'Ditandatangani oleh ' + user + ' pada ' + date;
            case 'reject':
                return 'Ditolak oleh ' + user + ' pada ' + date;
            default:
                return 'Unknown';
        }
    }
    return trails.map((trail) => ({
        label: (trail.user as IMember)?.fullName || 'Unknown',
        content: actions(trail.action, (trail.user as IMember)?.fullName || 'Unknown', format(new Date(trail.actionAt), 'EEEE dd MMMM yyyy HH:mm:ss', {
            locale: id,
        })),
        icon: (trail.user as IMember)?.avatar || '/img/profile-blank.png',
    }));
});

const getDocumentHash = async (buffer: Uint8Array): Promise<string> => {
    const hash = await crypto.subtle.digest('SHA-256', buffer as unknown as BufferSource);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('').slice(0, 8);
};


const signDocument = () => {
    ConfirmationModal.open({
        title: 'Sign Document',
        body: 'Sign Document Confirmation',
        onConfirm: async () => {
            try {
                ConfirmationModal.close();
                loading.value = true;
                const buffer = pdfBuffer.value;
                if (!buffer) {
                    toast.add({ title: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.', description: 'Pdf Not Loaded', color: 'error' });
                    return;
                }
                await $api<{ data: string }>('api/sign', {
                    method: 'POST',
                    body: {
                        encryption: config.value.enscriptActivinessLetter,
                        docId: doc.value._id,
                        data: await getDocumentHash(buffer),
                    } as IReqSignDocument,
                });
                toast.add({ title: 'Berhasil!', description: 'Success To Sign Document', color: 'success' });
            } catch (error) {
                toast.add({ title: 'Maaf, terjadi kesalahan. Silakan coba lagi nanti.', description: 'Failed To Sign Document', color: 'error' });
            } finally {
                refresh();
                loading.value = false;
            }
        },
    });
};

const download = () => {
    const link = document.createElement('a');
    link.href = doc.value.doc as string;
    link.download = `Surat Keterangan Aktif ${user?.value?.member.NIM} Semester ${user.value?.member.semester}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

watch(doc, async (value) => {
    if (value.doc) {
        const response = await fetch(value.doc as string);
        const data = await response.arrayBuffer();
        pdfBuffer.value = new Uint8Array(data);
        pdf.value = value.doc as string;
    }
});
definePageMeta({
    layout: 'dashboard',
});
const links = computed(() => [{
    label: 'Beranda',
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: 'Tanda Tangan',
    icon: 'i-heroicons-finger-print',
    to: '/signatures'
}, {
    label: doc.value.label,
}]);
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="w-full mx-auto mt-2 max-w-10xl">
            <template #header>
                <div class="flex items-center justify-between">
                    <h1 class="text-2xl font-semibold text-gray-800 dark:text-gray-300">{{ doc.label }}</h1>
                </div>
            </template>

            <!-- Full-size PDF -->
            <div class="w-full rounded-lg shadow-xl">
                <PDFViewer :pdfUrl="pdf" :label="doc.label" :canDownload="false" :canPrint="false" />
            </div>
            <UCollapsible class="w-full flex flex-col mt-4">
                <UButton :label="'Data'" color="neutral" variant="subtle" trailing-icon="i-heroicons-chevron-down" block
                    size="xl" />
                <template #content>
                    <!-- Data -->
                    <div class="md:px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                        {{ 'Nomor Dokumen' }} :
                    </div>
                    <span
                        class="px-4 md:px-6 text-lg md:text-xl font-bold text-gray-700 underline dark:text-gray-300">{{
                            doc.no
                        }}</span>
                    <!-- Data -->
                    <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                        {{ 'Ditandatangani oleh' }} :
                    </div>
                    <div
                        class="flex flex-col gap-2 ms-2 md:ms-6 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                        <div class="flex items-center justify-between" v-for="sign, i in doc.signs" :key="i">
                            <div class="flex items-center gap-2">
                                <NuxtImg provider="localProvider"
                                    :src="(sign.user as IMember).avatar || '/img/profile-blank.png'"
                                    class="w-12 h-12 rounded-full" loading="lazy" />
                                <div class="flex flex-col">
                                    <span class="text-lg font-semibold text-gray-800 dark:text-gray-300">{{
                                        (sign.user as IMember)
                                            .fullName
                                    }}</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">{{ sign.as }}</span>
                                    <span class="text-sm text-gray-500 dark:text-gray-400">
                                        Ditandatangani pada :
                                        {{
                                            sign.signedAt ?
                                                format(new Date(sign.signedAt!), 'EEEE dd MMMM yyyy HH:mm: ss', {
                                                    locale: id,
                                                })
                                                : '-'
                                        }}
                                    </span>
                                </div>
                            </div>
                            <UIcon :name="sign.signed ? 'i-heroicons-check-circle-solid' : 'i-heroicons-x-circle-solid'"
                                :class="['size-8', sign.signed ? 'text-green-500 dark:text-green-400 ' : 'text-red-500 dark:text-red-400']"
                                size="xl" />
                        </div>
                    </div>
                    <div class="md:px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                        {{ 'Jejak' }} :
                    </div>
                    <div class="ms-2 md:ms-6 px-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
                        <UAccordion :items="trails">
                            <template #leading="{ item }">
                                <NuxtImg provider="localProvider" :src="(item.icon as string)"
                                    class="w-12 h-12 rounded-full" loading="lazy" />
                            </template>
                        </UAccordion>
                    </div>
                </template>
            </UCollapsible>


            <template #footer>
                <UButton :label="'Tandatangani'" @click="signDocument" block :loading="loading"
                    v-if="data?.data?.signedByMe === false" />
                <UButton :label="'Unduh'" block @click="download" :loading="loading"
                    v-else-if="user?.member.NIM == (doc.uploader as IMember | undefined)?.NIM"
                    :disabled="docFullSigned === false" />
            </template>
        </UCard>
    </div>
</template>
<style scoped></style>