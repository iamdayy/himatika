<script setup lang="ts">
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const emit = defineEmits(['result', 'error']);

const scannerId = 'reader';
let html5QrCode: Html5Qrcode | null = null;

onMounted(async () => {
    // Tunggu DOM benar-benar siap
    await nextTick();

    try {
        // 1. Inisialisasi Instance
        html5QrCode = new Html5Qrcode(scannerId, {
            verbose: false,
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] // PENTING: Fokus QR saja biar cepat
        });

        // 2. Konfigurasi Cerdas
        const config = {
            fps: 10, // Scan 10x per detik
            // qrbox dinamis: Ambil 70% dari sisi terpendek layar
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
                const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                return {
                    width: Math.floor(minEdge * 0.75),
                    height: Math.floor(minEdge * 0.75),
                };
            },
            aspectRatio: undefined, // Biarkan library menyesuaikan rasio kamera HP (PENTING)
            experimentalFeatures: {
                useBarCodeDetectorIfSupported: true // Gunakan Chip native HP jika ada (Super Cepat)
            }
        };

        // 3. Start Kamera Belakang
        await html5QrCode.start(
            { facingMode: "environment" },
            config,
            (decodedText) => {
                // Success Callback
                emit('result', decodedText);
            },
            (errorMessage) => {
                // Error callback per frame (diabaikan biar gak spam console)
            }
        );

    } catch (err) {
        console.error("Scanner Init Error:", err);
        emit('error', 'Gagal akses kamera. Pastikan izin diberikan dan menggunakan HTTPS.');
    }
});

onBeforeUnmount(async () => {
    if (html5QrCode && html5QrCode.isScanning) {
        await html5QrCode.stop();
        html5QrCode.clear();
    }
});
</script>

<template>
    <div class="relative w-full bg-black rounded-2xl overflow-hidden shadow-2xl">

        <div :id="scannerId" class="w-full h-full min-h-[350px]"></div>

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
    /* Fallback sederhana jika mask-image tidak support sempurna di beberapa browser,
       biasanya overlay div di atas sudah cukup */
}

/* CSS Hack untuk memastikan video memenuhi container */
:deep(#reader video) {
    object-fit: cover !important;
    width: 100% !important;
    height: 100% !important;
    border-radius: 1rem;
}
</style>