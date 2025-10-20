<script setup lang='ts'>
import { UFileUpload } from "#components";
import type { TabsItem } from "@nuxt/ui";
import jsQR, { type Options, type QRCode } from "jsqr";
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
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
const { $ts } = useI18n();
const ready = ref(false);
const loading = ref(false);
const pdfs = ref<File | undefined>(undefined);
const pdf = ref<string>('');
const doc = ref<IDoc | null>(null);
const error = ref<string | null>(null);

const cameraOn = () => {
    ready.value = true
}
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
                title: $ts('success'),
                description: $ts('verify_doc_success')
            })
            return response.data;
        } else {
            toast.add({
                title: $ts('failed'),
                description: $ts('verify_doc_failed'),
                color: 'error'
            })
        }
    } catch (error) {
        toast.add({
            title: $ts('failed'),
            description: $ts('verify_doc_error'),
            color: 'error'
        })
    } finally {
        loading.value = false;
    }
};
const onDetect = (result: any[]) => {
    findDocBySignature(result[0].rawValue)
    // Handle the decoded result here, e.g., navigate to another page or show a message
};
function paintOutline(detectedCodes: any[], ctx: CanvasRenderingContext2D) {
    for (const detectedCode of detectedCodes) {
        const [firstPoint, ...otherPoints] = detectedCode.cornerPoints

        ctx.strokeStyle = 'red'
        ctx.lineWidth = 2

        ctx.beginPath()
        ctx.moveTo(firstPoint.x, firstPoint.y)
        for (const { x, y } of otherPoints) {
            ctx.lineTo(x, y)
        }
        ctx.lineTo(firstPoint.x, firstPoint.y)
        ctx.closePath()
        ctx.stroke()
    }
}
const onLoad = async (docProxy: PDFDocumentProxy | null) => {
    const totalPages = docProxy?.numPages || 1;
    if (!docProxy) return;
    const detectionResults: CodeOfQRDetect[] = [];
    error.value = null;
    doc.value = null;

    for (let i = 1; i <= totalPages; i++) {
        const page = await docProxy.getPage(i);
        if (!page) continue;
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const context = canvas.getContext('2d');
        if (context) {
            await page.render({ canvasContext: context, viewport, canvas }).promise;
            const result = await detectQRCode(canvas, context);
            detectionResults.push(result);
            if (result === 'found') {
                break;
            }
        }
    }

    if (!detectionResults.includes('found')) {
        if (detectionResults.includes('not_signed')) {
            error.value = $ts('verify_doc_qr_code_failed');
        } else if (detectionResults.includes('error')) {
            error.value = $ts('verify_doc_qr_code_error');
        } else {
            error.value = $ts('verify_doc_qr_code_not_found');
        }

        if (error.value) {
            toast.add({
                title: $ts('failed'),
                description: error.value,
                color: 'error'
            });
        }
    } else {
        error.value = null;
    }
};

const detectQRCode = async (
    canvas: HTMLCanvasElement,
    context: CanvasRenderingContext2D
): Promise<CodeOfQRDetect> => {
    const codes: string[] = [];

    if (!context) {
        return 'error';
    }

    // --- Grayscale pada tempCanvas ---
    let imageData = context.getImageData(0, 0, canvas.width / 2, canvas.height);

    const options: Options = { inversionAttempts: "dontInvert" };

    // jsQR sekarang akan memproses imageData yang sudah digrayscale
    let code: QRCode | null = jsQR(
        imageData.data,
        imageData.width,
        imageData.height,
        options
    );
    if (!code) {
        imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        code = jsQR(imageData.data, imageData.width, imageData.height, options);
    }

    while (code) {
        codes.push(code.data);

        // Gambar persegi panjang putih di atas area kode QR
        const { topLeftCorner, bottomRightCorner } = code.location;
        context.fillStyle = "white";
        context.fillRect(
            topLeftCorner.x,
            topLeftCorner.y,
            bottomRightCorner.x - topLeftCorner.x,
            bottomRightCorner.y - topLeftCorner.y
        );

        // Ambil ulang imageData setelah menggambar persegi panjang putih
        const updatedImageData = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height
        );
        code = jsQR(
            updatedImageData.data,
            updatedImageData.width,
            updatedImageData.height,
            options
        );
    }

    if (codes.length > 0) {
        let hasUnsigned = false;
        for (const qrCode of codes) {
            try {
                const foundDoc = await findDocBySignature(qrCode);
                if (foundDoc) {
                    if (foundDoc.signs?.some((sign) => !sign.signed)) {
                        hasUnsigned = true;
                    } else {
                        pdf.value = foundDoc.doc as string;
                        return 'found';
                    }
                }
            } catch (err) {
                return 'error';
            }
        }

        if (hasUnsigned) {
            return 'not_signed';
        }

        return 'not_found';
    } else {
        return 'not_found';
    }
};
watch(pdfs, async (file) => {
    if (file) {
        doc.value = null;
        error.value = null;
        loading.value = true;
        const fileBytes = await file.arrayBuffer();
        const url = URL.createObjectURL(new Blob([fileBytes], { type: file.type }));
        pdf.value = url;
    }
});
const links = computed(() => {
    const items = [
        { label: $ts('home'), to: '/', icon: 'i-heroicons-home' },
        { label: $ts('signature'), to: '/signatures', icon: 'i-heroicons-finger-print' },
        { label: $ts('check'), icon: 'i-heroicons-check-circle' }
    ];
    return items;
});
const tabs = computed(() => {
    const items = [
        {
            label: $ts('upload'),
            description: $ts('upload_pdf_description'),
            icon: 'i-heroicons-arrow-up-tray',
            slot: 'upload' as const,
        },
        {
            label: $ts('scan'),
            description: $ts('scan_pdf_description'),
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
                        <QrcodeStream v-show="ready" @camera-on="cameraOn" @detect="onDetect" :track="paintOutline"
                            :formats="['qr_code']" class="max-w-lg mx-auto aspect-square">
                            <div class="relative w-full h-full bg-black/60 mix-blend-hard-light">
                                <div class="absolute left-0 right-0 px-4 py-2 text-sm text-center text-white">
                                    Scan QR code in the digital viewfinder to get the result.
                                </div>
                                <div
                                    class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gray-500 flex items-center justify-center">
                                    <div class="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 animate-scan"></div>
                                    <div class="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white"></div>
                                    <div class="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white">
                                    </div>
                                    <div class="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white">
                                    </div>
                                    <div class="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white">
                                    </div>
                                </div>
                            </div>
                        </QrcodeStream>
                        <div class="flex flex-row gap-2 w-full justify-center" v-if="!ready">
                            <USkeleton class="w-full max-w-lg aspect-square h-full" />
                        </div>
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
                        <UFileUpload accept="pdf" format="pdf" v-model="pdfs" icon="i-heroicons-document" :label="$ts('drag_or_drop_file')" description="PDF (Max. 2MB)" layout="list" class="w-full" />
                    </div>
                </UCard>
            </template>
        </UTabs>
        <UCard v-if="pdf" class="mt-3">
            <template #header>
                <USkeleton class="w-full" v-if="loading" />
                <UAlert v-else-if="error" :title="error" color="error" :description="error" class="w-full" />
                <UAlert v-else color="success" :title="$ts('document_verified')"
                    :description="$ts('document_verified_description')" />
            </template>
            <PDFViewer :pdfUrl="pdf" :label="'Label'" @load="onLoad" />
            <template #footer v-if="doc && !loading">
                <div class="my-4 text-2xl font-bold text-gray-800 dark:text-gray-200">Data</div>

                <!-- Data -->
                <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                    {{ $ts('document_number') }} :
                </div>
                <span class="px-6 text-xl font-bold text-gray-500 underline dark:text-gray-400">{{ doc.no }}</span>
                <!-- Data -->
                <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                    {{ $ts('signed_by') }} :
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between" v-for="sign, i in doc.signs" :key="i">
                        <div class="flex items-center gap-2">
                            <NuxtImg provider="localProvider"
                                :src="(sign.user as IMember).avatar || '/img/profile-blank.png'"
                                class="w-12 h-12 rounded-full" />
                            <div class="flex flex-col">
                                <span class="text-lg font-semibold text-gray-800 dark:text-gray-300">{{ (sign.user as
                                    IMember).fullName
                                }}</span>
                                <span class="text-sm text-gray-500 dark:text-gray-400">{{ sign.as }}</span>
                                <UIcon name="i-heroicons-check-circle" v-if="sign.signed" class="text-green-500 dark:text-green-400" />
                                <UIcon name="i-heroicons-x-circle" v-else class="text-red-500 dark:text-red-400" />
                            </div>
                        </div>
                    </div>
                </div>
                <div class="px-4 my-3 text-xl font-semibold text-gray-800 dark:text-gray-300">
                    {{ $ts('trails') }} :
                </div>
                <div class="flex flex-col gap-2">
                    <div class="flex items-center justify-between" v-for="trail, i in doc.trails" :key="i">
                        <div class="flex items-center gap-2">
                            <NuxtImg provider="localProvider"
                                :src="(trail.user as IMember).avatar || '/img/profile-blank.png'"
                                class="w-12 h-12 rounded-full" />
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
<style scoped>
.animate-scan {
    animation: scan 5s infinite;
}

@keyframes scan {
    0% {
        top: 0;
    }

    50% {
        top: 100%;
    }

    100% {
        top: 0;
    }
}
</style>