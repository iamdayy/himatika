<script setup lang='ts'>
import { ModalsConfirmation } from '#components';
import { QrcodeStream } from 'vue-qrcode-reader';

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
const cameraOn = () => {
    ready.value = true
}

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
function paintOutline(detectedCodes: any[], ctx: CanvasRenderingContext2D) {
    for (const detectedCode of detectedCodes) {
        const [firstPoint, ...otherPoints] = detectedCode.cornerPoints

        ctx.strokeStyle = 'red'
        ctx.lineWidth = 2

        ctx.beginPath()
        ctx.moveTo(firstPoint.x, firstPoint.y)
        for (const { x, y } of otherPoints) {
            ctx.lineTo(x, y)
        }
        ctx.lineTo(firstPoint.x, firstPoint.y)
        ctx.closePath()
        ctx.stroke()
    }
}
</script>
<template>
    <UModal title="QR Code Reader" :fullscreen="isMobile">
        <template #body>
            <QrcodeStream v-show="ready" @camera-on="cameraOn" @detect="(data: any[]) => onDetect(data[0].rawValue)"
                :track="paintOutline" :formats="['qr_code']" class="max-w-lg mx-auto aspect-square">
                <div class="relative w-full h-full bg-black/60 mix-blend-hard-light">
                    <div class="absolute left-0 right-0 px-4 py-2 text-sm text-center text-white">
                        Scan QR code in the digital viewfinder to get the result.
                    </div>
                    <div
                        class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-gray-500 flex items-center justify-center">
                        <div class="absolute top-0 left-0 right-0 h-0.5 bg-cyan-400 animate-scan" v-if="!isLoading">
                        </div>
                        <div v-else class="absolute inset-0 flex items-center justify-center bg-black/50">
                            <UProgress animation="swing" />
                        </div>
                        <div class="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-white"></div>
                        <div class="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-white"></div>
                        <div class="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-white"></div>
                        <div class="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-white"></div>
                    </div>
                </div>
            </QrcodeStream>
            <div class="flex flex-row gap-2" v-show="!ready">
                <USkeleton class="w-1/2 h-10" />
                <USkeleton class="w-full h-10" />
                <USkeleton class="w-1/2 h-10" />
            </div>
        </template>
        <template #footer>
            <div class="flex justify-end gap-2">
                <UButton @click="emit('close')">Cancel</UButton>
            </div>
        </template>
    </UModal>
</template>
<style scoped>
.animate-scan {
    animation: scan 2s infinite;
}

@keyframes scan {
    0% {
        top: 0;
    }

    50% {
        top: 100%;
    }

    100% {
        top: 0;
    }
}
</style>