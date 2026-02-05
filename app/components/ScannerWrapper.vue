<script setup lang="ts">
const emit = defineEmits(['result', 'error']);

interface IDetectedCode {
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    rawValue: string;
    format: string;
    cornerPoints: { x: number; y: number }[];
}

const onDetect = (detectedCodes: IDetectedCode[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
        const result = detectedCodes[0]?.rawValue;
        if (result) {
            emit('result', result);
        }
    }
};

const onError = (err: any) => {
    console.error("Scanner Error:", err);
    // Filter error yang tidak perlu ditampilkan ke user jika perlu
    if (err.name === 'NotAllowedError') {
        emit('error', 'Izin kamera ditolak. Mohon izinkan akses kamera.');
    } else if (err.name === 'NotFoundError') {
        emit('error', 'Tidak ada kamera yang ditemukan.');
    } else {
        emit('error', 'Terjadi kesalahan pada scanner: ' + (err.message || err));
    }
};

// Track camera init state if needed mostly handled by component
</script>

<template>
    <div class="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl">

        <!-- QrcodeStream Component from nuxt-qrcode -->
        <div class="w-full h-full min-h-[350px]">
            <QrcodeStream @detect="onDetect" @error="onError" />
        </div>

        <div class="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
            <div class="absolute inset-0 bg-black/40 mask-hole"></div>

            <div class="relative w-[75%] aspect-square rounded-2xl border-2 border-primary/50">
                <div class="absolute -top-1 -left-1 w-8 h-8 border-l-4 border-t-4 border-primary rounded-tl-lg"></div>
                <div class="absolute -top-1 -right-1 w-8 h-8 border-r-4 border-t-4 border-primary rounded-tr-lg"></div>
                <div class="absolute -bottom-1 -left-1 w-8 h-8 border-l-4 border-b-4 border-primary rounded-bl-lg">
                </div>
                <div class="absolute -bottom-1 -right-1 w-8 h-8 border-r-4 border-b-4 border-primary rounded-br-lg">
                </div>

                <div
                    class="absolute left-2 right-2 h-0.5 bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-scan">
                </div>
            </div>
        </div>

        <div class="absolute bottom-6 left-0 right-0 text-center z-20">
            <p
                class="text-white text-sm font-medium bg-black/50 inline-block px-4 py-1.5 rounded-full backdrop-blur-sm">
                Arahkan kamera ke QR Code
            </p>
        </div>

    </div>
</template>

<style scoped>
/* Animasi Laser Naik Turun */
@keyframes scan {
    0% {
        top: 5%;
        opacity: 0;
    }

    20% {
        opacity: 1;
    }

    80% {
        opacity: 1;
    }

    100% {
        top: 95%;
        opacity: 0;
    }
}

.animate-scan {
    animation: scan 2s linear infinite;
}

/* Membuat efek "bolong" di tengah overlay gelap */
.mask-hole {
    -webkit-mask-image: radial-gradient(square, transparent 40%, black 41%);
}
</style>