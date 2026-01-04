<template>
    <ClientOnly fallback-tag="span" fallback="Loading player...">
        <div class="border border-gray-300 dark:border-gray-600 overflow-hidden rounded-lg pdf-viewer" id="pdf-canvas">
            <!-- Top Toolbar -->
            <div class="flex items-center justify-between p-2 border-b border-gray-700">
                <div class="flex items-center space-x-2">
                    <UButton icon="i-heroicons-bars-3" color="neutral" variant="ghost" @click="toggleSidebar"
                        v-if="!isDesktop" />
                    <UButton icon="i-heroicons-magnifying-glass" color="neutral" variant="ghost" />
                    <div class="flex items-center px-2 space-x-1" v-if="totalPages > 1">
                        <UButton icon="i-heroicons-chevron-up" color="neutral" variant="ghost" @click="prevPage"
                            :disabled="currentPage === 1" />
                        <UButton icon="i-heroicons-chevron-down" color="neutral" variant="ghost" @click="nextPage"
                            :disabled="currentPage === totalPages" />
                        <UInput v-model="currentPage" type="number" class="w-16 text-center" :max="totalPages"
                            :min="1" />
                        <span class="text-gray-400">of {{ totalPages }}</span>
                    </div>
                </div>

                <div class="flex flex-wrap items-center space-x-2">
                    <div class="flex flex-wrap items-center space-x-1">
                        <UButton icon="i-heroicons-minus" color="neutral" variant="ghost" @click="zoomOut"
                            :disabled="scale <= 0.5" />
                        <USelect v-model="scale" :items="zoomLevels" class="w-24" />
                        <UButton icon="i-heroicons-plus" color="neutral" variant="ghost" @click="zoomIn"
                            :disabled="scale >= 2.5" />
                    </div>

                    <UButton icon="i-heroicons-arrows-pointing-out" color="neutral" variant="ghost"
                        @click="toggleFullscreen" />
                    <UButton icon="i-heroicons-document-arrow-down" color="neutral" variant="ghost" @click="downloadPdf"
                        v-if="canDownload" />
                    <UButton icon="i-heroicons-printer" color="neutral" variant="ghost" @click="printPdf"
                        v-if="canPrint" />
                </div>
            </div>

            <div class="flex">
                <!-- Left Sidebar -->
                <div v-if="showSidebar && isDesktop" class="w-64 p-2 border-r border-gray-700">
                    <div class="flex justify-between mb-4">
                        <UButton icon="i-heroicons-squares-2x2" color="neutral" variant="ghost" size="xs" />
                        <UButton icon="i-heroicons-bars-4" color="neutral" variant="ghost" size="xs" />
                        <UButton icon="i-heroicons-paper-clip" color="neutral" variant="ghost" size="xs" />
                    </div>
                    <div class="space-y-2">
                        <div v-for="page in totalPages" :key="page" class="cursor-pointer">
                            <div class="border border-gray-700 rounded"
                                :class="{ 'border-blue-500': currentPage === page }" @click="currentPage = page">
                                <canvas :ref="'thumbnail-' + page" :id="'thumbnail-' + page" class="w-full"></canvas>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="relative flex-1">
                    <div v-if="loading" class="absolute inset-0 flex items-center justify-center">
                        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-gray-400 animate-spin" />
                    </div>
                    <div class="overflow-auto" ref="containerRef">
                        <canvas ref="pdfCanvas" v-show="!loading" class="mx-auto"></canvas>
                    </div>
                </div>

                <!-- Right Sidebar -->
                <div class="w-64 p-2 border-l border-gray-700" v-if="isDesktop && showSidebar">
                    <div class="space-y-2">
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-chevron-double-left">
                            Go to First Page
                        </UButton>
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-chevron-double-right">
                            Go to Last Page
                        </UButton>
                        <USeparator />
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-arrow-path">
                            Rotate Clockwise
                        </UButton>
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-arrow-path" class="rotate-180">
                            Rotate Counterclockwise
                        </UButton>
                        <USeparator />
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-cursor-arrow-rays">
                            Text Selection Tool
                        </UButton>
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-hand-raised">
                            Hand Tool
                        </UButton>
                        <USeparator />
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-arrows-up-down">
                            Vertical Scrolling
                        </UButton>
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-arrows-right-left">
                            Horizontal Scrolling
                        </UButton>
                        <UButton block color="neutral" variant="ghost" icon="i-heroicons-arrows-right-left">
                            Wrapped Scrolling
                        </UButton>
                    </div>
                </div>
            </div>
        </div>
    </ClientOnly>
</template>

<script lang="ts" setup>
import * as pdfjsLib from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api';
import { ref, watch } from 'vue';
pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/5.4.149/pdf.worker.min.mjs";

const props = defineProps({
    pdfUrl: {
        type: String,
        required: true
    },
    label: {
        type: String,
        default: 'Document'
    },
    canDownload: {
        type: Boolean,
        default: true
    },
    canPrint: {
        type: Boolean,
        default: true
    },
});
const { width } = useWindowSize();
const isDesktop = computed(() => width.value >= 1024);
const pdfCanvas = ref<HTMLCanvasElement>();
const containerRef = ref(null);
const loading = ref(true);
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref(1);
const showSidebar = ref(true);
const pdfUrl = computed(() => props.pdfUrl);
let pdfDoc: PDFDocumentProxy | null = null;

const emit = defineEmits<{
    (e: 'load', data: PDFDocumentProxy | null): void;
}>()

const zoomLevels = [
    { label: '50%', value: 0.5 },
    { label: '75%', value: 0.75 },
    { label: '100%', value: 1 },
    { label: '125%', value: 1.25 },
    { label: '150%', value: 1.5 },
    { label: '200%', value: 2 },
    { label: '250%', value: 2.5 },
];

const loadPDF = async () => {
    try {
        loading.value = true;
        pdfDoc = await pdfjsLib.getDocument(pdfUrl.value).promise;
        emit('load', pdfDoc);
        totalPages.value = pdfDoc.numPages;
        renderPage(currentPage.value);
        renderThumbnails();
    } catch (error) {
    } finally {
        loading.value = false;
    }
};

const renderPage = async (pageNumber: number) => {
    if (!pdfDoc) return;
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: scale.value });

    const canvas = pdfCanvas.value;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
        // context.scale(scale.value, scale.value);
        const renderContext = {
            canvas,
            canvasContext: context,
            viewport: viewport
        };

        page.render(renderContext);
    }
};

const renderThumbnails = async () => {
    for (let i = 1; i <= totalPages.value; i++) {
        if (!pdfDoc) return;
        const page = await pdfDoc.getPage(i);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas: HTMLCanvasElement | null = document.querySelector(`#thumbnail-${i}`);
        if (canvas) {
            const context = canvas.getContext('2d');
            canvas.height = viewport.height - 20;
            canvas.width = viewport.width - 20;
            if (context) {
                page.render({
                    canvas,
                    canvasContext: context,
                    viewport: viewport
                });
            }
        }
    }
};

const prevPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
    }
};

const zoomIn = () => {
    if (scale.value < 2.5) {
        scale.value += 0.25;
    }
};

const zoomOut = () => {
    if (scale.value > 0.5) {
        scale.value -= 0.25;
    }
};

const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value;
};

const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.getElementById('pdf-canvas')?.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
};

const downloadPdf = () => {
    const link = document.createElement('a');
    link.href = pdfUrl.value;
    link.download = `${props.label}.pdf`;
    link.click();
};

const printPdf = () => {
    window.print();
};

watch(currentPage, (newPage) => {
    renderPage(newPage);
});

watch(scale, (newScale) => {
    renderPage(currentPage.value);
});

watch(pdfUrl, () => {
    loadPDF();
});
onMounted(() => {
    loadPDF();
});
</script>

<style scoped>
.pdf-viewer {
    max-width: 100%;
    margin: 0 auto;
}

canvas {
    max-width: 100%;
    height: auto;
}

@media print {
    .pdf-viewer>*:not(canvas) {
        display: none;
    }
}
</style>