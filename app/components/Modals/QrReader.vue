<script setup lang='ts'>
import { ModalsConfirmation } from '#components';



const { width } = useWindowSize();
const overlay = useOverlay();

const ConfirmationModal = overlay.create(ModalsConfirmation);
const toast = useToast();

const ready = ref(false);
const data = ref('');
const name = ref<string | undefined>('');
const isLoading = ref(false);

const isMobile = computed(() => width.value < 640)

const emit = defineEmits(
    {
        confirm: (data?: string) => true,
        close: () => true
    }
)
const props = defineProps({
    getDataMethod: {
        type: Function as PropType<(data: string) => Promise<string | undefined>>,
        required: true
    },
})


const onDetect = async (value: string) => {
    data.value = value;
    isLoading.value = true;
    try {
        const fullName = await props.getDataMethod(value);
        name.value = fullName;
    } catch (error) {
        toast.add({
            title: 'Error',
            description: 'Failed to get data from QR Code, please try again.',
            color: 'error',
        });
    } finally {
        isLoading.value = false;
    }
    ConfirmationModal.open({
        title: 'Qr code confirmation',
        body: `Terbaca atas nama (${name.value}) dari QR Code, pengguna mengunjungi agenda?`,
        onConfirm: () => {
            emit('confirm', data.value);
            ConfirmationModal.close();
        }
    })
}

</script>
<template>
    <UModal title="QR Code Reader" :fullscreen="isMobile">
        <template #body>
            <ScannerWrapper @result="onDetect"
                @error="(err) => toast.add({ title: 'Error', description: err, color: 'error' })"
                class="max-w-lg mx-auto aspect-square" />

        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton @click="emit('close')">Cancel</UButton>
            </div>
        </template>
    </UModal>
</template>
