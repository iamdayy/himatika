<script setup lang="ts">
import { ModalsImageCrop } from '#components';
import { onUnmounted, ref, watch } from 'vue';
import type { ICertificateConfiguration, ICertificateItem } from '~~/types';
import type { IMemberResponse } from '~~/types/IResponse';

const props = defineProps<{
    modelValue: ICertificateConfiguration;
    agendaId: string;
}>();

const emit = defineEmits(['update:modelValue']);
const overlay = useOverlay();
// Local state for smooth dragging and immediate updates
const config = ref<ICertificateConfiguration>(JSON.parse(JSON.stringify(props.modelValue)));

const CropImageModal = overlay.create(ModalsImageCrop);

// Sync back to parent
watch(config, (newVal) => {
    emit('update:modelValue', newVal);
}, { deep: true });

// Optional: Sync from parent if changed externally (e.g. initial load or reset)
watch(() => props.modelValue, (newVal) => {
    // Simple check to avoid loop if we just emitted this
    if (JSON.stringify(newVal) !== JSON.stringify(config.value)) {
        config.value = JSON.parse(JSON.stringify(newVal));
    }
}, { deep: true });

const isUploading = ref(false);
const previewImage = ref<string | null>(props.modelValue.previewUrl || null);
const containerRef = ref<HTMLElement | null>(null);
const fileInput = ref<HTMLInputElement | null>(null);

const availableItems = [
    { type: 'name', label: 'Nama Peserta', icon: 'i-heroicons-user' },
    { type: 'role', label: 'Peran (Peserta/Panitia)', icon: 'i-heroicons-identification' },
    { type: 'text', label: 'Teks Statis', icon: 'i-heroicons-pencil-square' },
    { type: 'date', label: 'Tanggal', icon: 'i-heroicons-calendar' },
    { type: 'qr', label: 'QR Code Verifikasi', icon: 'i-heroicons-qr-code' },
    { type: 'code', label: 'Kode Sertifikat', icon: 'i-heroicons-key' },
    { type: 'signature', label: 'Tanda Tangan', icon: 'i-heroicons-pencil' },
];

const selectedItemIndex = ref<number | null>(null);

const alignOptions = [
    {
        value: 'left',
        icon: 'i-heroicons-bars-3-bottom-left'
    },
    {
        value: 'center',
        icon: 'i-heroicons-bars-3'
    },
    {
        value: 'right',
        icon: 'i-heroicons-bars-3-bottom-right'
    }
] as const;

// --- Snap / Center helpers ---
function centerItemH() {
    if (selectedItemIndex.value === null) return;
    const item = config.value.items[selectedItemIndex.value];
    if (!item) return;
    item.x = ((config.value.pdfWidth || 600) - (item.width || 0)) / 2;
}
function centerItemV() {
    if (selectedItemIndex.value === null) return;
    const item = config.value.items[selectedItemIndex.value];
    if (!item) return;
    item.y = ((config.value.pdfHeight || 400) - (item.height || 0)) / 2;
}

// --- Member search for signature signer picker ---
const { $api } = useNuxtApp();
const runtimeConfig = useRuntimeConfig();
const memberSearchTerm = ref('');
const { data: members, status: memberSearchStatus } = useAsyncData(
    'cert-designer-members',
    () => $api<IMemberResponse>('/api/member/public', {
        method: 'GET',
        params: { search: memberSearchTerm.value, page: 0, perPage: 15 }
    }),
    {
        transform: (data) => {
            return (data.data?.members || []).map((m) => ({
                label: m.fullName,
                value: String(m.NIM),
                avatar: { src: `${runtimeConfig.public.public_uri}${m.avatar}`, alt: m.fullName }
            }));
        },
        default: () => [] as { label: string; value: string; avatar: { src: string; alt: string } }[],
        watch: [memberSearchTerm],
    }
);

async function handleFileUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

    isUploading.value = true;
    const formData = new FormData();
    formData.append('file', file);

    try {
        // 1. Get Preview & Dimensions from Worker
        const previewData = await $fetch<{ success: boolean; url: string; pdfUrl: string; width: number; height: number; }>('/api/pdf/certificate-preview', {
            method: 'POST',
            body: formData
        });

        if (previewData.success) {
            // Update Config with new Template info
            config.value = {
                ...config.value,
                active: true,
                templateUrl: previewData.pdfUrl,
                previewUrl: previewData.url,
                pdfWidth: previewData.width,
                pdfHeight: previewData.height
            };
            previewImage.value = previewData.url;
        }
    } catch (err) {
        console.error(err);
        alert("Proses upload gagal.");
    } finally {
        isUploading.value = false;
    }
}

// --- Signature image upload (for external signers) ---
const sigFileInput = ref<HTMLInputElement | null>(null);
const isUploadingSignature = ref(false);

async function handleSignatureImageUpload(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file || selectedItemIndex.value === null) return;

    // Only allow PNG (must have transparent background)
    if (file.type !== 'image/png') {
        alert('Gambar tanda tangan harus berformat PNG dengan latar belakang transparan.');
        if (sigFileInput.value) sigFileInput.value.value = '';
        return;
    }

    // Read PNG directly as Object URL — do NOT compress (killer of transparency/alpha)
    const blob = URL.createObjectURL(file);

    isUploadingSignature.value = true;
    CropImageModal.open({
        img: blob,
        title: 'ttd.png',
        transparency: true,                // ← PNG export + checkered bg
        stencil: {
            movable: true,
            resizable: true,
            aspectRatio: 0,                // bebas — TTD tidak harus kotak
        },
        onCropped: async (croppedImage: File) => {
            if (!croppedImage || selectedItemIndex.value === null) return;
            const formData = new FormData();
            formData.append('file', croppedImage);
            try {
                const result = await $fetch<{ success: boolean; url: string }>('/api/upload/image', {
                    method: 'POST',
                    body: formData,
                });
                if (result.success && result.url) {
                    config.value.items[selectedItemIndex.value!]!.value = result.url;
                }
            } catch (err: any) {
                console.error('Signature image upload error:', err);
                alert('Upload gambar TTD gagal: ' + (err?.data?.statusMessage || err?.message || 'Error'));
            } finally {
                isUploadingSignature.value = false;
                if (sigFileInput.value) sigFileInput.value.value = '';
                CropImageModal.close();
            }
        }
    });
}

// --- Drag & Drop / Resize Logic ---

const interactionState = ref<{
    isDragging: boolean;
    isResizing: boolean;
    itemIndex: number;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
    initialW: number;
    initialH: number;
} | null>(null);

function onMouseDown(index: number, e: MouseEvent) {
    if (!containerRef.value || !config.value.items[index]) return;
    e.preventDefault();
    e.stopPropagation();

    selectedItemIndex.value = index;
    const item = config.value.items[index];
    if (!item) return;

    interactionState.value = {
        isDragging: true,
        isResizing: false,
        itemIndex: index,
        startX: e.clientX,
        startY: e.clientY,
        initialX: item.x,
        initialY: item.y,
        initialW: item.width || 100,
        initialH: item.height || 50
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
}

function onResizeStart(index: number, e: MouseEvent) {
    if (!containerRef.value || !config.value.items[index]) return;

    e.preventDefault();
    e.stopPropagation();

    selectedItemIndex.value = index;
    const item = config.value.items[index];
    if (!item) return;
    if (item.type === 'signature' && item.signerType === 'system') return;

    interactionState.value = {
        isDragging: false,
        isResizing: true,
        itemIndex: index,
        startX: e.clientX,
        startY: e.clientY,
        initialX: item.x,
        initialY: item.y,
        initialW: item.width || 100,
        initialH: item.height || 50
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
}

function handleGlobalMouseMove(e: MouseEvent) {
    if (!interactionState.value || !containerRef.value || !config.value.pdfWidth || !config.value.pdfHeight) return;

    const state = interactionState.value;
    const containerRect = containerRef.value.getBoundingClientRect();

    // Calculate Scale Factor (Pixels per PDF Point)
    const scaleX = config.value.pdfWidth / containerRect.width;
    const scaleY = config.value.pdfHeight / containerRect.height;

    const deltaX = (e.clientX - state.startX) * scaleX;
    const deltaY = (e.clientY - state.startY) * scaleY;

    // Mutate directly for performance
    const item = config.value.items[state.itemIndex];
    if (!item) return;

    if (state.isDragging) {
        item.x = state.initialX + deltaX;
        item.y = state.initialY + deltaY;
    } else if (state.isResizing) {
        item.width = Math.max(10, state.initialW + deltaX);
        item.height = Math.max(10, state.initialH + deltaY);
    }
}

function handleGlobalMouseUp() {
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
    interactionState.value = null;
}

// --- Item Management ---

// --- Item Management ---

function addItem(type: string) {
    let newItem: ICertificateItem = {
        id: crypto.randomUUID(), // stable id for cross-referencing signers
        type: type as any,
        x: 50,
        y: 50,
        width: 200,
        height: 40,
        fontSize: 12,
        fontWeight: 'normal',
        fontFamily: 'Times-Roman',
        align: 'center',
        color: '#000000',
        value: type === 'text' ? 'Sample Text' : undefined
    };

    // Smart Defaults based on Type
    if (type === 'name') {
        newItem.fontSize = 24;
        newItem.fontWeight = 'bold';
        newItem.width = 400;
        newItem.height = 60;
    } else if (type === 'role') {
        newItem.fontSize = 18;
        newItem.fontWeight = 'bold';
        newItem.width = 300;
        newItem.height = 40;
    } else if (type === 'date') {
        newItem.fontSize = 10;
        newItem.width = 150;
    } else if (type === 'code') {
        newItem.fontSize = 10;
        newItem.width = 150;
        newItem.value = "/II.3.AI/B01.01/01.A0/Sert/II/2026"
    } else if (type === 'qr') {
        newItem.width = 80;
        newItem.height = 80;
    } else if (type === 'signature') {
        newItem.width = 80;
        newItem.height = 80;
    }

    // Push directly

    // Push directly
    if (!config.value.items) config.value.items = [];
    config.value.items.push(newItem);

    selectedItemIndex.value = config.value.items.length - 1;
}

function removeItem(index: number) {
    config.value.items.splice(index, 1);
    selectedItemIndex.value = null;
}

// Cleanup listeners on unmount
onUnmounted(() => {
    window.removeEventListener('mousemove', handleGlobalMouseMove);
    window.removeEventListener('mouseup', handleGlobalMouseUp);
});
</script>

<template>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Tools Panel -->
        <div class="space-y-4">
            <UCard>
                <template #header>
                    <h3 class="font-semibold">Tools</h3>
                </template>
                <div class="grid grid-cols-2 gap-2">
                    <UButton v-for="item in availableItems" :key="item.type" :icon="item.icon" :label="item.label"
                        color="neutral" variant="solid" size="sm" class="justify-start" @click="addItem(item.type)" />
                </div>
            </UCard>

            <!-- Properties Panel -->
            <UCard v-if="selectedItemIndex !== null && config.items[selectedItemIndex]">
                <template #header>
                    <div class="flex justify-between items-center">
                        <h3 class="font-semibold">Properties</h3>
                        <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs"
                            @click="removeItem(selectedItemIndex!)" />
                    </div>
                </template>

                <div class="space-y-3">
                    <div class="text-sm font-medium text-gray-500 uppercase tracking-wide">
                        {{availableItems.find(i => i.type === config.items[selectedItemIndex!]!.type)?.label ??
                            config.items[selectedItemIndex]!.type}}
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        <UFormField label="Font Size">
                            <UInput v-model.number="config.items[selectedItemIndex]!.fontSize" type="number" min="1"
                                max="200" />
                        </UFormField>
                        <UFormField label="Font Family">
                            <USelect v-model="config.items[selectedItemIndex]!.fontFamily" :items="[
                                { label: 'Times New Roman', value: 'Times-Roman' },
                                { label: 'Helvetica / Arial', value: 'Helvetica' },
                            ]" value-key="value" label-key="label" />
                        </UFormField>
                    </div>

                    <div class="flex gap-2 items-center">
                        <UFormField label="Color" class="w-full">
                            <UInput v-model="config.items[selectedItemIndex]!.color" type="color" class="h-10" />
                        </UFormField>
                        <UFormField label="Style" class="w-full">
                            <div class="flex items-center gap-2 mt-1">
                                <USwitch size="md" :model-value="config.items[selectedItemIndex]!.fontWeight === 'bold'"
                                    @update:model-value="(val: boolean) => config.items[selectedItemIndex!]!.fontWeight = val ? 'bold' : 'normal'" />
                                <span class="text-sm">Bold</span>
                            </div>
                        </UFormField>
                    </div>

                    <UFormField label="Align">
                        <div class="flex gap-2">
                            <UButton v-for="(align, index) in alignOptions" :key="index" :icon="align.icon"
                                :color="config.items[selectedItemIndex]!.align === align.value ? 'primary' : 'neutral'"
                                variant="soft" @click="config.items[selectedItemIndex]!.align = align.value" />
                        </div>
                    </UFormField>

                    <UFormField v-if="config.items[selectedItemIndex]!.type === 'text'" label="Text Content">
                        <UInput v-model="config.items[selectedItemIndex]!.value" />
                    </UFormField>

                    <UFormField v-if="config.items[selectedItemIndex]!.type == 'qr'" label="Image URL / Data">
                        <UInput v-model="config.items[selectedItemIndex]!.value" placeholder="https://..." />
                        <p class="text-xs text-gray-500">For QR, this is the data content.</p>
                    </UFormField>
                    <UFormField v-if="config.items[selectedItemIndex]!.type === 'code'" label="No Sertifikat">
                        <UInput v-model="config.items[selectedItemIndex]!.value" placeholder="No Sertifikat" />
                        <p class="text-xs text-gray-500">Format: /II.3.AI/B01.01/Pan-LKMMTD2026/01.A0/Sert/II/2026</p>
                    </UFormField>
                    <!-- Signature Config: mode toggle -->
                    <template v-if="config.items[selectedItemIndex!]!.type === 'signature'">
                        <!-- Mode selector -->
                        <UFormField label="Tipe Penandatangan">
                            <UButtonGroup class="w-full">
                                <UButton class="flex-1" size="sm"
                                    :color="(!config.items[selectedItemIndex!]!.signerType || config.items[selectedItemIndex!]!.signerType === 'external') ? 'primary' : 'neutral'"
                                    :variant="(!config.items[selectedItemIndex!]!.signerType || config.items[selectedItemIndex!]!.signerType === 'external') ? 'solid' : 'outline'"
                                    label="Eksternal" icon="i-heroicons-photo"
                                    @click="config.items[selectedItemIndex!]!.signerType = 'external'" />
                                <UButton class="flex-1" size="sm"
                                    :color="config.items[selectedItemIndex!]!.signerType === 'system' ? 'primary' : 'neutral'"
                                    :variant="config.items[selectedItemIndex!]!.signerType === 'system' ? 'solid' : 'outline'"
                                    label="Member Sistem" icon="i-heroicons-academic-cap"
                                    @click="config.items[selectedItemIndex!]!.signerType = 'system'" />
                            </UButtonGroup>
                        </UFormField>

                        <!-- EKSTERNAL: upload gambar TTD -->
                        <template
                            v-if="!config.items[selectedItemIndex!]!.signerType || config.items[selectedItemIndex!]!.signerType === 'external'">
                            <UFormField label="Gambar Tanda Tangan Basah">
                                <div class="space-y-2">
                                    <div v-if="config.items[selectedItemIndex!]!.value"
                                        class="border rounded overflow-hidden bg-gray-50 flex items-center justify-center h-20">
                                        <img :src="config.items[selectedItemIndex!]!.value"
                                            class="max-h-full max-w-full object-contain" alt="TTD Preview" />
                                    </div>
                                    <div v-else
                                        class="border border-dashed rounded h-14 flex items-center justify-center text-gray-400 text-xs">
                                        Belum ada gambar TTD
                                    </div>
                                    <div class="flex gap-2 items-center">
                                        <input ref="sigFileInput" type="file" accept="image/png" class="hidden"
                                            @change="handleSignatureImageUpload" />
                                        <UButton icon="i-heroicons-arrow-up-tray" size="xs" variant="soft"
                                            label="Upload TTD (PNG)" :loading="isUploadingSignature"
                                            @click="sigFileInput?.click()" />
                                        <UButton v-if="config.items[selectedItemIndex!]!.value"
                                            icon="i-heroicons-x-mark" size="xs" color="error" variant="ghost"
                                            @click="config.items[selectedItemIndex!]!.value = ''" />
                                    </div>
                                    <p class="text-[10px] text-amber-600 mt-1">PNG transparan saja — TTD hitam,
                                        background tembus pandang</p>
                                </div>
                            </UFormField>
                            <UFormField label="Nama Penandatangan">
                                <UInput v-model="config.items[selectedItemIndex!]!.signerName"
                                    placeholder="mis: Prof. Dr. Ahmad Yani, M.T." />
                            </UFormField>
                        </template>

                        <!-- SISTEM: pilih member untuk e-sign digital -->
                        <template v-else>
                            <UFormField label="Member Penandatangan"
                                description="Member ini akan sign secara digital (QR overlay)">
                                <USelect v-model="config.items[selectedItemIndex!]!.signerNIM" :items="members ?? []"
                                    value-key="value" label-key="label" :loading="memberSearchStatus === 'pending'"
                                    searchable searchable-placeholder="Cari nama / NIM..."
                                    @search="(q: string) => memberSearchTerm = q" placeholder="Pilih penandatangan" />
                            </UFormField>
                        </template>

                        <!-- Jabatan (kedua mode) -->
                        <UFormField label="Jabatan Penandatangan">
                            <UInput v-model="config.items[selectedItemIndex!]!.signerAs"
                                placeholder="mis: Dekan Fakultas Teknik" />
                        </UFormField>
                    </template>

                    <div class="grid grid-cols-2 gap-2 text-xs text-gray-500">
                        <div>X: {{ Math.round(config.items[selectedItemIndex]!.x) }}</div>
                        <div>Y: {{ Math.round(config.items[selectedItemIndex]!.y) }}</div>
                        <div>W: {{ Math.round(config.items[selectedItemIndex]!.width || 0) }}</div>
                        <div>H: {{ Math.round(config.items[selectedItemIndex]!.height || 0) }}</div>
                    </div>
                </div>
            </UCard>


        </div>

        <!-- Preview Area -->
        <div class="lg:col-span-2">
            <UCard :ui="{ root: 'p-0' }">
                <template #header>
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-2">
                            <h3 class="font-semibold">Preview</h3>
                            <USwitch v-model="config.active" />
                            <span class="text-xs text-gray-500">{{ config.active ? 'Active' : 'Inactive' }}</span>
                        </div>

                        <div class="flex gap-2">
                            <!-- Hidden file input for actual PDF upload -->
                            <input ref="fileInput" type="file" accept="application/pdf" class="hidden"
                                @change="handleFileUpload" />
                            <UButton icon="i-heroicons-arrow-up-tray" label="Upload Template (PDF)"
                                :loading="isUploading" @click="fileInput?.click()" />
                        </div>
                    </div>

                    <!-- Context Toolbar: shown when an item is selected -->
                    <div v-if="selectedItemIndex !== null"
                        class="flex items-center gap-1 pt-1 border-t border-gray-200 flex-wrap">
                        <span class="text-xs text-gray-500 mr-1">
                            {{ config.items[selectedItemIndex]?.label || config.items[selectedItemIndex]?.type }}
                        </span>
                        <UButtonGroup>
                            <UButton size="xs" icon="i-heroicons-arrows-right-left" variant="soft"
                                title="Tengahkan Horizontal" @click="centerItemH" />
                            <UButton size="xs" icon="i-heroicons-arrows-up-down" variant="soft"
                                title="Tengahkan Vertikal" @click="centerItemV" />
                        </UButtonGroup>
                        <USeparator orientation="vertical" class="h-5" />
                        <UButton size="xs" icon="i-heroicons-trash" color="error" variant="ghost" title="Hapus item"
                            @click="config.items.splice(selectedItemIndex, 1); selectedItemIndex = null" />
                    </div>
                </template>

                <div class="relative bg-gray-100 overflow-hidden flex items-center justify-center min-h-[500px] select-none"
                    ref="containerRef">
                    <div v-if="previewImage" class="relative shadow-lg" :style="{ maxWidth: '100%' }">
                        <img :src="previewImage" alt="Certificate Preview" class="max-w-full block" draggable="false" />

                        <!-- Overlay Items -->
                        <div v-for="(item, index) in config.items" :key="index"
                            class="absolute border-2 cursor-move flex items-center bg-white/30 backdrop-blur-[1px] group hover:bg-white/50 transition-colors"
                            :class="{
                                'border-primary-500 z-10': selectedItemIndex === index,
                                'border-dashed border-gray-400': selectedItemIndex !== index,
                                'justify-start': item.align === 'left',
                                'justify-center': item.align === 'center' || !item.align,
                                'justify-end': item.align === 'right'
                            }" :style="{
                                left: `${(item.x / (config.pdfWidth || 600)) * 100}%`,
                                top: `${(item.y / (config.pdfHeight || 400)) * 100}%`,
                                width: `${((item.width || 0) / (config.pdfWidth || 600)) * 100}%`,
                                height: `${((item.height || 0) / (config.pdfHeight || 400)) * 100}%`,
                            }" @mousedown.stop="onMouseDown(index, $event)">

                            <!-- Text Rendering (non-image types) -->
                            <span v-if="!['qr', 'signature'].includes(item.type)"
                                class="truncate px-1 pointer-events-none whitespace-pre" :style="{
                                    color: item.color,
                                    fontWeight: item.fontWeight,
                                    fontFamily: item.fontFamily === 'Times-Roman' ? 'Times New Roman, serif' : 'Helvetica, Arial, sans-serif',
                                    fontSize: `${(item.fontSize || 12) * ((containerRef?.clientWidth || 600) / (config.pdfWidth || 600))}px`,
                                    textAlign: item.align
                                }">
                                <template v-if="item.type === 'text'">{{ item.value || '(teks)' }}</template>
                                <template v-else-if="item.type === 'code'">{{ item.value || '/No.Sertifikat/...'
                                    }}</template>
                                <template v-else-if="item.type === 'date'">{{ new Date().toLocaleDateString('id-ID',
                                    { day: '2-digit', month: 'long', year: 'numeric' }) }}</template>
                                <template v-else-if="item.type === 'name'">Fulan bin Fulan</template>
                                <template v-else-if="item.type === 'role'">Peserta</template>
                                <template v-else>{{ item.label }}</template>
                            </span>

                            <!-- QR Item: show miniature QR icon -->
                            <div v-else-if="item.type === 'qr'"
                                class="w-full h-full flex flex-col items-center justify-center bg-black/5 pointer-events-none gap-1">
                                <UIcon name="i-heroicons-qr-code" class="text-gray-600" style="width:40%;height:40%;" />
                                <span class="text-[8px] text-gray-500 font-medium">QR Code</span>
                            </div>

                            <!-- Signature Item: show image or placeholder -->
                            <div v-else-if="item.type === 'signature'"
                                class="w-full h-full flex flex-col pointer-events-none overflow-hidden">
                                <!-- Top 70%: signature visual -->
                                <div class="relative flex items-center justify-center bg-black/5" style="height:70%;">
                                    <!-- External with image -->
                                    <img v-if="(!item.signerType || item.signerType === 'external') && item.value"
                                        :src="item.value" class="max-h-full max-w-full object-contain p-1" alt="TTD" />
                                    <!-- External without image -->
                                    <div v-else-if="!item.signerType || item.signerType === 'external'"
                                        class="flex flex-col items-center justify-center gap-0.5 w-full h-full border-2 border-dashed border-gray-400">
                                        <UIcon name="i-heroicons-camera" class="text-gray-400"
                                            style="width:30%;height:30%;" />
                                        <span class="text-[7px] text-gray-400">Upload TTD</span>
                                    </div>
                                    <!-- System signer: QR overlay placeholder -->
                                    <div v-else
                                        class="flex flex-col items-center justify-center gap-0.5 w-full h-full border-2 border-dashed border-blue-300 bg-blue-50/30">
                                        <UIcon name="i-heroicons-qr-code" class="text-blue-400"
                                            style="width:32%;height:32%;" />
                                        <span class="text-[7px] text-blue-400">QR Digital Sign</span>
                                    </div>
                                </div>
                                <!-- Bottom 30%: name + role text -->
                                <div class="flex flex-col items-center justify-center bg-white/40 border-t border-gray-300/50 px-1"
                                    style="height:30%;">
                                    <span
                                        class="text-[7px] font-bold text-gray-700 truncate w-full text-center leading-tight">
                                        {{ (!item.signerType || item.signerType === 'external') ?
                                            (item.signerName || 'Nama Penandatangan') :
                                            (item.signerNIM || 'Pilih Member') }}
                                    </span>
                                    <span class="text-[6px] text-gray-500 truncate w-full text-center leading-tight">
                                        {{ item.signerAs || 'Jabatan' }}
                                    </span>
                                </div>
                            </div>

                            <!-- Resize Handles -->
                            <div v-if="selectedItemIndex === index"
                                class="absolute bottom-0 right-0 w-4 h-4 bg-primary-500 cursor-se-resize flex items-center justify-center rounded-tl-sm"
                                @mousedown.stop="onResizeStart(index, $event)">
                                <UIcon name="i-heroicons-arrows-pointing-out" class="text-white w-3 h-3" />
                            </div>
                        </div>
                    </div>

                    <div v-else class="text-gray-400 flex flex-col items-center">
                        <UIcon name="i-heroicons-document" class="text-6xl mb-2" />
                        <p>Upload a PDF template to start designing</p>
                    </div>
                </div>
            </UCard>

            <div class="mt-4 text-xs text-gray-500">
                <p>Dimensions: {{ config.pdfWidth }} x {{ config.pdfHeight }} pts</p>
                <p>Template: {{ config.templateUrl || 'None' }}</p>
            </div>
        </div>
    </div>
</template>
