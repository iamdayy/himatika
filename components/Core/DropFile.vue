<template>
    <div class="main">
        <div class="dropzone-container" :style="isDragging && 'border-color: green;'" @dragover="dragover" @dragleave="dragleave" @drop="drop">
            <input type="file" multiple name="file" id="fileInput" class="hidden-input"
                @change="e => onChange((e.target as HTMLInputElement).files!)" ref="file" accept=".csv" />

            <label for="fileInput" class="file-label">
                <div v-if="isDragging">Release to drop files here.</div>
                <div v-else>Drop files here or <u>click here</u> to upload.</div>
            </label>
        </div>
        <div class="mt-4 preview-container" v-if="files">
        <div v-for="file in files" :key="file.name" class="preview-card">
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
const remove = (i: number) => {
    
}
</script>
<style scoped>
.dropzone-container {
    padding: 4rem;
    background: #f7fafc;
    border: 2px dashed;
    border-color: #9e9e9e;
}

.hidden-input {
    opacity: 0;
    overflow: hidden;
    position: absolute;
    width: 1px;
    height: 1px;
}

.file-label {
    font-size: 20px;
    display: block;
    cursor: pointer;
}

.preview-container {
    display: flex;
    margin-top: 2rem;
}

.preview-card {
    display: flex;
    border: 1px solid #a2a2a2;
    padding: 5px;
    margin-left: 5px;
}

.preview-img {
    width: 50px;
    height: 50px;
    border-radius: 5px;
    border: 1px solid #a2a2a2;
    background-color: #a2a2a2;
}
</style>