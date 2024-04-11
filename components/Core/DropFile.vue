<template>
    <div class="main">
        <div class="flex items-center justify-center w-full max-w-xl p-4 mx-auto border-2 border-gray-400 border-dashed rounded-lg"
            :style="isDragging && 'border-color: green;'" @dragover="dragover" @dragleave="dragleave" @drop="drop">
            <input type="file" multiple name="file" id="fileInput" class="absolute w-px h-px overflow-hidden opacity-0" @change="e => onChange((e.target as HTMLInputElement).files!)" accept=".csv" />

            <label for="fileInput" class="block text-lg cursor-pointer">
                <div v-if="isDragging">Release to drop files here.</div>
                <div v-else>Drop files here or click here to upload.</div>
            </label>
        </div>
        <div class="flex mt-4" v-if="files">
            <div v-for="file in files" :key="file.name" class="flex p-1 ml-1 border border-gray-400">
                <div>
                    <p>
                        {{ file.name }}
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
const emit = defineEmits(["change"]);
const isDragging = ref<boolean>(false);
const files = ref<FileList>();
const onChange = (e: FileList) => {
    files.value = e;
    emit("change", files.value[0]);
};
const dragover = (e: DragEvent) => {
    e.preventDefault();
    isDragging.value = true;
};
const dragleave = () => {
    isDragging.value = false;
};
const drop = (e: DragEvent) => {
    e.preventDefault();
    files.value = e.dataTransfer?.files!;
    onChange(e.dataTransfer?.files!);
    isDragging.value = false;
};
</script>