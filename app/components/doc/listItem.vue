<script setup lang='ts'>
import type { IDoc } from '~/types';
defineProps({
    doc: { type: Object as PropType<IDoc>, required: true },
    editOptions: { type: Array as PropType<Array<Array<{ label: string; icon: string; disabled?: boolean; onSelect: () => void }>>> }
});
const emits = defineEmits(["triggerRefresh"]);
const formatFileSize = (size: number) => {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
        size /= 1024;
        index++;
    }
    return `${size.toFixed(2)} ${units[index]}`;
};
const getFileSize = (doc: string) => {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', doc, false);
    try {
        xhr.send();
        if (xhr.status >= 200 && xhr.status < 300) {
            const size = parseInt(xhr.getResponseHeader('Content-Length') || '0', 10);
            return formatFileSize(size);
        } else {
            console.error('Error fetching file size: Network response was not ok');
            return 'Unknown size';
        }
    } catch (error) {
        console.error('Error fetching file size:', error);
        return 'Unknown size';
    }
};

</script>
<template>
    <div class="space-y-2">
        <div class="dark:border-gray-700 hover:bg-gray-800/25 dark:hover:bg-gray-200/25 rounded-xl">
            <div class="flex items-center py-2">
                <div class="items-center flex-grow ml-4">
                    <h1 class="text-lg font-medium md:text-xl">{{ doc.label }}</h1>
                    <div class="items-center ms-1">
                        <h2 class="font-semibold text-gray-700 dark:text-gray-200">No:
                            <span class="text-sm text-gray-600 dark:text-gray-300"> {{ doc.no }}</span>
                        </h2>
                        <h2 class="font-semibold text-gray-700 dark:text-gray-200">Size:
                            <span class="text-sm text-gray-600 dark:text-gray-300"> {{ getFileSize(doc.doc as string)
                                }}</span>

                        </h2>
                    </div>
                </div>
                <div class="flex">
                    <UBadge size="xs" variant="soft" color="info" v-for="tag, i in doc.tags" :key="i">
                        {{ tag }}
                    </UBadge>
                </div>
                <div class="flex items-center justify-between">
                    <UDropdownMenu :items="editOptions">
                        <UButton color="neutral" variant="link" icon="i-heroicons-ellipsis-vertical" />
                    </UDropdownMenu>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped></style>