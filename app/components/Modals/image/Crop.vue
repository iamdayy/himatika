<script setup lang='ts'>
import { Cropper } from 'vue-advanced-cropper';
import 'vue-advanced-cropper/dist/style.css';

/**
 * Composables
 */
const { width } = useWindowSize();

/**
 * Responsive design
 */
const isMobile = computed(() => width.value < 640);
const isTablet = computed(() => width.value >= 640 && width.value < 1024);

/**
 * Props definition
 */
const props = defineProps({
    title: {
        type: String,
        required: true,
        description: 'Title of the image to be cropped'
    },
    img: {
        type: String,
        description: 'Source URL of the image to be cropped',
        required: true,
    },
    stencil: {
        type: Object,
        default: {
            movable: true,
            resizable: true,
            aspectRatio: 1,
        },
        description: 'Stencil properties for the cropper'
    },
    loading: {
        type: Boolean,
        default: false,
        description: 'Loading state of the cropper'
    }
});

/**
 * Reactive references
 */
const cropper = ref<InstanceType<typeof Cropper> | null>(null);
const loadingState = ref(false);
const model = defineModel<boolean>();


/**
 * Emits
 */
const emits = defineEmits<{
    (e: 'close'): void;
    (e: 'cropped', file: File): void;
}>();

/**
 * Crop the image
 */
const crop = () => {
    loadingState.value = true;
    if (!cropper.value) return;
    if (!props.img) return;
    if (!cropper.value.getResult()) return;
    const { canvas } = cropper.value.getResult();
    canvas?.toBlob((blob) => {
        if (!blob) return;
        const file = new File([blob], props.title, {
            type: blob.type
        });
        emits('cropped', file);
        URL.revokeObjectURL(props.img); // Revoke the object URL to free up memory
        loadingState.value = false;
    }, 'image/jpeg', 0.7);
};

/**
 * Compute UI size based on screen width
 */
const uiSize = computed(() => isMobile.value ? 'sm' : isTablet.value ? 'md' : 'lg');

/**
 * Responsive classes
 */
const responsiveClasses = computed(() => ({
    container: isMobile.value ? 'p-2' : 'p-3',
    title: isMobile.value ? 'text-lg' : 'text-xl',
    button: isMobile.value ? 'text-sm' : 'text-base',
}));
</script>

<template>
    <UModal :ui="{ wrapper: 'relative z-[60]' }" v-model="model" title="Adjust image" @close="$emit('close')">
        <template #body>
            <div :class="responsiveClasses.container">
                <Cropper :src="img" :auto-zoom="true" :stencil-props="stencil" ref="cropper" class="mb-4" />
                <UButton label="Done" :size="uiSize" block @click="crop" :loading="loadingState"
                    :class="responsiveClasses.button" />
            </div>
        </template>
    </UModal>
</template>

<style scoped>
/* Responsive styles for the cropper */
.vue-advanced-cropper {
    max-height: 70vh;
}

@media (max-width: 640px) {
    .vue-advanced-cropper {
        max-height: 50vh;
    }
}
</style>