<script setup lang='ts'>
import { UFileUpload } from "#components";
import type { TabsItem } from "@nuxt/ui";
import type { IDoc, IMember } from '~~/types';

definePageMeta({
    layout: 'client',
    auth: false
});

interface IVerifyResponse {
    status: number;
    message: string;
    data: IDoc
}

type CodeOfQRDetect = 'not_found' | 'found' | 'not_signed' | 'error';

const { $api } = useNuxtApp();
const toast = useToast();
const ready = ref(false);
const loading = ref(false);
const pdfs = ref<File | undefined>(undefined);
const pdf = ref<string>('');
const doc = ref<IDoc | null>(null);
const error = ref<string | null>(null);


const findDocBySignature = async (signature: string): Promise<IDoc | undefined> => {
    loading.value = true;
    error.value = null;
    try {
        const response = await $api<IVerifyResponse>('api/sign/verify', {
            method: 'POST',
            body: JSON.stringify({ signature })
        });
        if (response.status === 200) {
            doc.value = response.data
            toast.add({
                title: 'Berhasil!',
                description: 'Verify Doc Success'
            })
            return response.data;
        } else {
            toast.add({
                title: 'Failed',
                description: 'Verify Doc Failed',
                color: 'error'
            })
        }
    } catch (error) {
        toast.add({
            title: 'Failed',
            description: 'Verify Doc Error',
            color: 'error'
        })
    } finally {
        loading.value = false;
    }
};
const onDetect = (result: string) => {
    findDocBySignature(result);
};

watch(pdfs, async (file) => {
    if (file) {
        doc.value = null;
        error.value = null;
        loading.value = true;

        // Display PDF
        const fileBytes = await file.arrayBuffer();
        const url = URL.createObjectURL(new Blob([fileBytes], { type: file.type }));
        pdf.value = url;

        // Scan for QR
        try {
            const formData = new FormData();
            formData.append('file', file);

            const { data: scanResult } = await useFetch<{ statusCode: number, data: { status: string, data?: string } }>('/api/pdf/scan', {
                method: 'POST',
                body: formData
            });

            if (scanResult.value?.data?.status === 'found' && scanResult.value.data.data) {
                await findDocBySignature(scanResult.value.data.data);
            } else {
                error.value = 'Verify Doc Qr Code Not Found';
                toast.add({
                    title: 'Failed',
                    description: 'Verify Doc Qr Code Not Found',
                    color: 'error'
                });
            }
        } catch (err) {
            console.error("Scan error:", err);
            error.value = 'Verify Doc Qr Code Error';
            toast.add({
                title: 'Failed',
                description: 'Verify Doc Qr Code Error',
                color: 'error'
            });
        } finally {
            loading.value = false;
        }
    }
});
const links = computed(() => {
    const items = [
        { label: 'Beranda', to: '/', icon: 'i-heroicons-home' },
        { label: 'Tanda Tangan', to: '/signatures', icon: 'i-heroicons-finger-print' },
        { label: 'Check', icon: 'i-heroicons-check-circle' }
    ];
    return items;
});
const tabs = computed(() => {
    const items = [
        {
            label: 'Unggah',
            description: 'Upload Pdf Description',
            icon: 'i-heroicons-arrow-up-tray',
            slot: 'upload' as const,
        },
        {
            label: 'Pindai',
            description: 'Scan Pdf Description',
            icon: 'i-heroicons-qr-code',
            slot: 'scan' as const,
        },
    ]
    return items satisfies TabsItem[];;
})
</script>
<template>
    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" class="my-4 ms-2" />
        <UTabs :items="tabs">
            <template #scan="{ item }">
                <UCard>
                    <template #header>
                        <h2 class="text-2xl font-bold">{{ item.label }}</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-200">{{ item.description }}</p>
                    </template>
                    <div class="flex flex-col items-center justify-center gap-2">
                        <ScannerWrapper @result="onDetect" class="max-w-lg mx-auto aspect-square" />
                    </div>
                </UCard>
            </template>
            <template #upload="{ item }">
                <UCard>
                    <template #header>
                        <h2 class="text-2xl font-bold">{{ item.label }}</h2>
                        <p class="text-sm text-gray-500 dark:text-gray-200">{{ item.description }}</p>
                    </template>
                    <div class="flex flex-col items-center justify-center gap-2">
                        <UFileUpload accept="pdf" format="pdf" v-model="pdfs" icon="i-heroicons-document"
                            :label="'Drag Or Drop File'" description="PDF (Max. 2MB)" layout="list"
                            class="w-full" />
                    </div>
                </UCard>
            </template>
        </UTabs>
        <UCard v-if="pdf" class="mt-3">
            <template #header>
                <USkeleton class="w-full" v-if="loading" />
                <UAlert v-else-if="error" :title="error" color="error" :description="error" class="w-full" />
                <UAlert v-else color="success" :title="'Document Verified'"
                    :description="'Document Verified Description'" />
            </template>
            <PDFViewer :pdfUrl="pdf" :label="'Label'" />
            <template #footer v-if="doc && !loading">
                <div class="my-4 text-2xl font-bold text-gray-800 dark:text-gray-200">Data</div>

                <!-- Data -->
                <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                    {{ 'Nomor Dokumen' }} :
                </div>
                <span class="px-6 text-xl font-bold text-gray-500 underline dark:text-gray-400">{{ doc.no }}</span>
                <!-- Data -->
                <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                    {{ 'Ditandatangani oleh' }} :
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between" v-for="sign, i in doc.signs" :key="i">
                        <div class="flex items-center gap-2">
                            <NuxtImg provider="localProvider"
                                :src="(sign.user as IMember).avatar || '/img/profile-blank.png'"
                                class="w-12 h-12 rounded-full" loading="lazy" />
                            <div class="flex flex-col">
                                <span class="text-lg font-semibold text-gray-800 dark:text-gray-300">{{ (sign.user as
                                    IMember).fullName
                                }}</span>
                                <span class="text-sm text-gray-500 dark:text-gray-400">{{ sign.as }}</span>
                                <UIcon name="i-heroicons-check-circle" v-if="sign.signed"
                                    class="text-green-500 dark:text-green-400" />
                                <UIcon name="i-heroicons-x-circle" v-else class="text-red-500 dark:text-red-400" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                    {{ 'Jejak' }} :
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between" v-for="trail, i in doc.trails" :key="i">
                        <div class="flex items-center gap-2">
                            <NuxtImg provider="localProvider"
                                :src="(trail.user as IMember).avatar || '/img/profile-blank.png'"
                                class="w-12 h-12 rounded-full" loading="lazy" />
                            <div class="flex flex-col">
                                <span class="text-lg font-semibold text-gray-800 dark:text-gray-300">{{ (trail.user as
                                    IMember).fullName
                                }}</span>
                                <span class="text-sm text-gray-500 dark:text-gray-400">{{ trail.action }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </UCard>
    </div>
</template>
