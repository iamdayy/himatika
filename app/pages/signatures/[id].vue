<script setup lang='ts'>
import { ModalsConfirmation } from '#components';
import type { AccordionItem } from '@nuxt/ui';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { PDFDocument } from 'pdf-lib';
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import PDFViewer from '~/components/PDFViewer.vue';
import type { IConfig, IDoc, IMember, IOverlayLocation } from '~~/types';
import type { IReqSignDocument } from '~~/types/IRequestPost';
import type { IConfigResponse, IDocResponse } from '~~/types/IResponse';

pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs";


const { $api } = useNuxtApp();
const { data: user } = useAuth();
const overlay = useOverlay();
const { $ts } = useI18n();
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
const pdfDocument = ref<PDFDocument>();
const loading = ref<boolean>(false);

const trails = computed<AccordionItem[]>(() => {
    const trails = doc.value.trails || [];
    return trails.map((trail) => ({
        label: (trail.user as IMember)?.fullName || 'Unknown',
        content: $ts(trail.action, {
            user: (trail.user as IMember)?.fullName || 'Unknown', date: format(new Date(trail.actionAt), 'EEEE dd MMMM yyyy HH:mm:ss', {
                locale: id,
            })
        }),
        icon: (trail.user as IMember)?.avatar || '/img/profile-blank.png',
    }));
});

const getDocumentHash = async (pdfDoc: PDFDocument): Promise<string> => {
    const pdfBytes = await pdfDoc.save();
    const hash = await crypto.subtle.digest('SHA-256', pdfBytes as Uint8Array<ArrayBuffer>);
    return Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('').slice(0, 8);
};

async function findTextCoordinates(
    searchText: string
): Promise<IOverlayLocation[]> {
    const matchingLocations: IOverlayLocation[] = [];
    try {

        // Memuat dokumen PDF dari buffer
        const loadingTask = pdfjs.getDocument({ url: doc.value.doc as string });
        const pdfDocument = await loadingTask.promise;

        // Iterasi melalui setiap halaman PDF
        for (let pageNum = 1; pageNum <= pdfDocument.numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Iterasi melalui setiap item teks di halaman
            for (const item of textContent.items) {
                // Konversi item.item ke any untuk menghindari error tipe jika item.str bukan string
                const textItem = item as any; // Cast ke any untuk akses str dan transform

                if (textItem.str && textItem.str.includes(searchText)) {
                    // Mendapatkan transformasi matriks untuk posisi teks
                    const transform = textItem.transform;

                    // Koordinat (x, y) dari teks item berada di transform [4] dan [5]
                    // PDF.js menggunakan sistem koordinat di mana Y=0 adalah di bagian bawah halaman.
                    // Jika Anda butuh Y dari atas, Anda perlu menguranginya dari tinggi halaman.
                    const viewport = page.getViewport({ scale: 1 }); // Skala 1 untuk koordinat asli PDF

                    const x = transform[4];
                    const y = viewport.height - transform[5]; // Konversi Y dari bawah ke atas

                    matchingLocations.push({
                        text: textItem.str,
                        page: pageNum,
                        x: x,
                        y: y,
                        width: textItem.width,
                        height: textItem.height,
                    });
                }
            }
            page.cleanup(true); // Penting untuk membebaskan memori
        }

        return matchingLocations;
    } catch (error) {
        console.error("Error finding text coordinates in PDF:", error);
        throw new Error("Failed to process PDF for text coordinates.");
    }
}

const signDocument = () => {
    ConfirmationModal.open({
        title: $ts('sign_document'),
        body: $ts('sign_document_confirmation'),
        onConfirm: async () => {
            try {
                ConfirmationModal.close();
                loading.value = true;
                const pdfDoc = pdfDocument.value;
                if (!pdfDoc) {
                    toast.add({ title: $ts("error"), description: $ts("pdf_not_loaded"), color: 'error' });
                    return;
                }
                const coordinates = await findTextCoordinates(`/${user.value?.member.NIM}signature/`);
                await $api<{ data: string }>('api/sign', {
                    method: 'POST',
                    body: {
                        encryption: config.value.enscriptActivinessLetter,
                        docId: doc.value._id,
                        data: await getDocumentHash(pdfDoc),
                        coordinates
                    } as IReqSignDocument,
                });
                toast.add({ title: $ts("success"), description: $ts("success_to_sign_document"), color: 'success' });
            } catch (error) {
                toast.add({ title: $ts("error"), description: $ts("failed_to_sign_document"), color: 'error' });
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
        const pdfDoc = await PDFDocument.load(data);
        pdfDocument.value = pdfDoc;
        pdf.value = value.doc as string;
    }
});
definePageMeta({
    layout: 'dashboard',
});
const links = computed(() => [{
    label: $ts('home'),
    icon: 'i-heroicons-home',
    to: '/'
}, {
    label: $ts('signature'),
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
                <UButton :label="$ts('data')" color="neutral" variant="subtle" trailing-icon="i-heroicons-chevron-down"
                    block size="xl" />
                <template #content>
                    <!-- Data -->
                    <div class="md:px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                        {{ $ts('document_number') }} :
                    </div>
                    <span
                        class="px-4 md:px-6 text-lg md:text-xl font-bold text-gray-700 underline dark:text-gray-300">{{
                            doc.no
                        }}</span>
                    <!-- Data -->
                    <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                        {{ $ts('signed_by') }} :
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
                                        {{
                                            $ts('signed_at', {
                                                date: sign.signedAt ?
                                                    format(new Date(sign.signedAt!), 'EEEE dd MMMM yyyy HH:mm: ss', {
                                                        locale: id,
                                                    }) :
                                                    '-',
                                            })
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
                        {{ $ts('trails') }} :
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
                <UButton :label="$ts('sign')" @click="signDocument" block :loading="loading"
                    v-if="!data?.data?.signedByMe" />
                <UButton :label="$ts('download')" block @click="download" :loading="loading"
                    v-else-if="user?.member.NIM == (doc.uploader as IMember | undefined)?.NIM" />
            </template>

        </UCard>
    </div>
</template>
<style scoped></style>