<template>
    <ClientOnly fallback-tag="span" fallback="Loading PDF...">
        <div class="border border-gray-300 dark:border-gray-600 overflow-hidden rounded-lg pdf-viewer">
            <object :data="pdfUrl" type="application/pdf" class="w-full h-full">
                <iframe :src="pdfUrl" class="w-full h-full">
                </iframe>
            </object>
        </div>
    </ClientOnly>
</template>
<script lang="ts" setup>
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

const pdfUrl = computed(() => props.pdfUrl);
</script>

<style scoped>
.pdf-viewer {
    max-width: 100%;
    margin: 0 auto;
    height: 80vh;
    /* Set a default height */
}
</style>
