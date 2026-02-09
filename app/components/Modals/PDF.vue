<script setup lang='ts'>
import type { IDoc } from '~~/types';

const props = defineProps({
    doc: {
        type: Object as PropType<IDoc>,
        required: true
    },
    canRemove: {
        type: Boolean,
        required: false,
        default: false,
    }
});
const emit = defineEmits(['remove', 'download', 'close']);
</script>
<template>
    <UModal :title="doc.label" @close="emit('close')">
        <template #body>
            <div class="w-full rounded-lg shadow-xl">
                <client-only>
                    <!-- <PDFViewer :pdfUrl="(doc.doc as string)" /> -->
                </client-only>
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>