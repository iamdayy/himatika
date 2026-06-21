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
        default: () => ({
            movable: true,
            resizable: true,
            aspectRatio: 1,
        }),
        description: 'Stencil properties for the cropper'
    },
    loading: {
        type: Boolean,
        default: false,
        description: 'Loading state of the cropper'
    },
    /**
     * If true: exports as PNG (preserves transparency), background shows checkered pattern.
     * If false: exports as JPEG (opaque, white bg).
     */
    transparency: {
        type: Boolean,
        default: false,
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
 * Crop the image.
 * When transparency=true → PNG (preserves alpha).
 * When transparency=false → JPEG at 0.85 quality.
 */
const crop = () => {
    loadingState.value = true;
    if (!cropper.value) return;
    if (!props.img) return;
    if (!cropper.value.getResult()) return;
    const { canvas } = cropper.value.getResult();
    if (!canvas) { loadingState.value = false; return; }

    if (props.transparency) {
        // Export as PNG to keep transparent background
        canvas.toBlob((blob) => {
            if (!blob) { loadingState.value = false; return; }
            const file = new File([blob], props.title.replace(/\.(jpe?g)$/i, '.png'), {
                type: 'image/png'
            });
            emits('cropped', file);
            URL.revokeObjectURL(props.img);
            loadingState.value = false;
        }, 'image/png');
    } else {
        canvas.toBlob((blob) => {
            if (!blob) { loadingState.value = false; return; }
            const file = new File([blob], props.title, { type: blob.type });
            emits('cropped', file);
            URL.revokeObjectURL(props.img);
            loadingState.value = false;
        }, 'image/jpeg', 0.85);
    }
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
    <UModal :ui="{ wrapper: 'relative z-[60]' }" v-model="model" title="Adjust image" @close="emits('close')">
        <template #body>
            <div :class="responsiveClasses.container">
                <!-- Hint for transparency mode -->
                <p v-if="transparency"
                    class="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-1 mb-2">
                    💡 Pastikan gambar TTD berformat PNG dengan latar belakang transparan agar tanda tangan terlihat
                    jelas di sertifikat.
                </p>

                <div :class="transparency ? 'bg-checker' : 'bg-white'" class="rounded overflow-hidden mb-4">
                    <Cropper :src="img" :auto-zoom="true" :stencil-props="stencil" ref="cropper"
                        :background-class="transparency ? 'cropper-transparent-bg' : 'cropper-white-bg'" />
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex items-center justify-end space-x-2">
                <UButton :loading="loadingState" label="Crop & Gunakan" @click="crop" />
                <UButton color="neutral" variant="soft" label="Cancel" @click="emits('close')" />
            </div>
        </template>
    </UModal>
</template>

<style scoped>
/* Responsive styles for the cropper */
.vue-advanced-cropper {
    max-height: 70vh;
    max-width: 100%;
}

@media (max-width: 640px) {
    .vue-advanced-cropper {
        max-height: 50vh;
    }
}

/* ── Checkered background — shows transparency ── */
.bg-checker {
    background-color: #fff;
    background-image:
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 16px 16px;
    background-position: 0 0, 0 8px, 8px -8px, -8px 0px;
}
</style>

<style>
/* Global (non-scoped) so vue-advanced-cropper can pick them up */
.cropper-transparent-bg {
    background-color: transparent !important;
    /* checker pattern visible through the transparent cropper background */
}

.cropper-white-bg {
    background: #f5f5f5 !important;
}
</style>