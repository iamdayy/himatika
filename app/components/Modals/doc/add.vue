<script setup lang='ts'>
import type { IDoc } from '~~/types';
import type { ITagsResponse } from '~~/types/IResponse';
/**
 * Composables
 */
const { $api } = useNuxtApp();
const toast = useToast();

const { data } = useAsyncData(() => $api<ITagsResponse>("/api/doc/tags"));
/**
 * Emits
 */
const emit = defineEmits<{
    (event: 'doc', value: IDoc): void
}>();

/**
 * Reactive references
 */
const loadingCompress = ref<boolean>(false);
const file = ref<File>();
const tagsOptions = computed({
    get: () => {
        return data.value?.data?.tags || [];
    },
    set: (value) => {
        tagsOptions.value = value;
    }
});
const tags = ref<string[]>([]);

/**
 * Doc data structure
 */
const doc = ref<IDoc>({
    label: "",
    doc: "",
    tags: [],
    archived: false,
    no: ""
});



/**

 * Add new doc
 */
const addDoc = async () => {
    if (!file.value) {
        toast.add({
            title: 'File Required',
            color: 'error'
        });
    }
    emit('doc', {
        ...doc.value,
        doc: file.value!,
        tags: tags.value
    });
}


/**
 * Handle image change
 * @param {File} f - Selected image file
 */
const onChangeFile = async (f: FileList) => {
    file.value = f[0];
}


/**
 * Add new tag
 * @param {string} tag - New tag
 */
const addNewTag = async (tag: string) => {
    tagsOptions.value.push(tag);
    tags.value.push(tag);
}


/**
 * Responsive design
 */
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 640)
const isTablet = computed(() => width.value >= 640 && width.value < 1024)

/**
 * Responsive classes
 */
const responsiveClasses = computed(() => ({
    container: isMobile.value ? 'p-4' : 'p-6',
    grid: isMobile.value ? 'grid-cols-1 space-y-4' : 'grid-cols-6 space-y-8',
    fullSpan: isMobile.value ? 'col-span-1' : 'col-span-6',
    halfSpan: isMobile.value ? 'col-span-1' : 'col-span-3',
    title: isMobile.value ? 'text-lg' : 'text-xl',
    button: isMobile.value ? 'text-sm' : 'text-base',
}));
/**
 * Compute UI size
 */
const uiSize = computed(() => isMobile.value ? 'sm' : isTablet.value ? 'md' : 'lg')


</script>
<template>
    <UModal :fullscreen="isMobile" :title="'Add Doc'">
        <template #body>

            <div :class="['space-y-6 text-start', responsiveClasses.container]">
                <div :class="responsiveClasses.grid">
                    <div :class="responsiveClasses.fullSpan">
                        <UFormField label="Label">
                            <UInput v-model="doc.label" />
                        </UFormField>
                    </div>
                    <div :class="responsiveClasses.fullSpan">
                        <UFormField label="No">
                            <UInput v-model="doc.no" />
                        </UFormField>
                    </div>
                    <!-- Image upload -->
                    <div :class="[responsiveClasses.fullSpan, 'min-h-36']">
                        <label for="Title"
                            class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Doc</label>
                        <UFileUpload v-model="file" single accept="*">
                        </UFileUpload>
                    </div>

                    <!-- Tags input -->
                    <UFormField :class="responsiveClasses.halfSpan" :label="'Tag'">
                        <USelectMenu v-model="tags" :items="tagsOptions" multiple create-item @create="addNewTag"
                            name="tag" placeholder="Select Tags" />
                    </UFormField>
                </div>
                <!-- Submit button -->
                <UButton @click.prevent="addDoc" :loading="loadingCompress" label="Save" icon="i-heroicons-clipboard"
                    block trailing :class="responsiveClasses.button" />
            </div>
        </template>

    </UModal>
</template>
<style scoped></style>