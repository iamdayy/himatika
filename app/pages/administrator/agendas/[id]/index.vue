<script setup lang='ts'>
import { ModalsConfirmation, ModalsReqruitmentAdd, ModalsReqruitmentEdit } from '#components';
import type { ICategory, IReqruitment } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';

definePageMeta({
    layout: 'dashboard',
    middleware: ['sidebase-auth', 'organizer']
});

const route = useRoute();
const id = route.params.id as string;
const { $api, $ts } = useNuxtApp();
const overlay = useOverlay();
const toast = useToast();

// --- DATA FETCHING ---
const { data: agenda, pending, refresh } = await useAsyncData('admin-agenda-detail',
    () => $api<IAgendaResponse>('/api/agenda', { query: { id } }), {
    transform: (data) => data.data?.agenda
});

// --- STATISTIK COMPUTED ---
const stats = computed(() => {
    if (!agenda.value) return [];
    const participants = agenda.value.participants || [];
    const committees = agenda.value.committees || [];

    const totalParticipants = participants.length;
    const paidParticipants = participants.filter(p => p.payment?.status === 'success').length;
    const totalCommittees = committees.length;
    const approvedCommittees = committees.filter(c => c.approved).length;

    const incomeParticipant = participants
        .filter(p => p.payment?.status === 'success')
        .reduce((sum, p) => sum + (agenda.value?.configuration.participant.amount || 0), 0);
    const incomeCommittee = committees
        .filter(c => c.payment?.status === 'success')
        .reduce((sum, c) => sum + (agenda.value?.configuration.committee.amount || 0), 0);

    return [
        { label: 'Total Peserta', value: totalParticipants, desc: `${paidParticipants} Lunas`, icon: 'i-heroicons-users', color: 'blue' },
        { label: 'Total Panitia', value: totalCommittees, desc: `${approvedCommittees} Diterima`, icon: 'i-heroicons-user-group', color: 'orange' },
        { label: 'Estimasi Pemasukan', value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(incomeParticipant + incomeCommittee), desc: 'Dari Pembayaran Valid', icon: 'i-heroicons-banknotes', color: 'green' }
    ];
});

// --- NAVIGATION & UTILS ---
const links = computed(() => [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('administrator'), icon: 'i-heroicons-shield-check' },
    { label: 'Agendas', to: '/administrator/agendas', icon: 'i-heroicons-calendar' },
    { label: agenda.value?.title || 'Detail', icon: 'i-heroicons-document-text' }
]);

const publicLink = computed(() => `/agendas/${id}`);
const shareAgenda = () => {
    if (navigator.share) {
        navigator.share({ title: agenda.value?.title, text: agenda.value?.description, url: window.location.href });
    } else {
        navigator.clipboard.writeText(window.location.href);
        toast.add({ title: 'Link disalin ke clipboard' });
    }
};

// --- LOGIKA KONFIGURASI INSTAN (BARU) ---

// Options untuk Dropdown Akses
const accessOptions = [
    { label: 'Publik (Semua Orang)', value: 'Public' },
    { label: 'Hanya Member', value: 'Member' },
    { label: 'Hanya Organizer', value: 'Organizer' },
    { label: 'Tutup Pendaftaran', value: 'None' },
];
// Shortcut Menu
const shortcuts = [
    {
        label: 'Edit Agenda',
        desc: 'Ubah info dasar, tanggal, & deskripsi',
        icon: 'i-heroicons-pencil-square',
        to: `/administrator/agendas/${id}/edit`,
        color: 'primary'
    },
    {
        label: 'Data Peserta',
        desc: 'Kelola pendaftaran & presensi peserta',
        icon: 'i-heroicons-users',
        to: `/administrator/agendas/${id}/participant`,
        color: 'secondary'
    },
    {
        label: 'Data Panitia',
        desc: 'Seleksi & manajemen panitia',
        icon: 'i-heroicons-briefcase',
        to: `/administrator/agendas/${id}/committee`,
        color: 'secondary'
    },
    {
        label: 'Scanner Presensi',
        desc: 'Buka kamera untuk scan tiket',
        icon: 'i-heroicons-qr-code',
        to: `/administrator/agendas/${id}/scan`, // Asumsi route
        color: 'neutral'
    }
];

// State Lokal untuk Edit Cepat (agar tidak langsung kirim API saat ngetik)
const configState = reactive({
    canRegister: 'None',
    pay: false,
    amount: 0,
    reqruitments: [] as IReqruitment[]
});

// Sync data dari server ke local state saat load
watch(agenda, (newVal) => {
    if (newVal) {
        configState.canRegister = newVal.configuration.participant.canRegister || 'None';
        configState.pay = newVal.configuration.participant.pay || false;
        configState.amount = newVal.configuration.participant.amount || 0;
        // Clone array agar tidak reaktif langsung ke agenda.value sebelum disimpan
        configState.reqruitments = JSON.parse(JSON.stringify(newVal.configuration.participant.reqruitments || []));
    }
}, { immediate: true });

// Modals
const AddReqruitmentModal = overlay.create(ModalsReqruitmentAdd);
const EditReqruitmentModal = overlay.create(ModalsReqruitmentEdit);
const ConfirmationModal = overlay.create(ModalsConfirmation);

// Actions Manajemen Syarat
const addRequirement = () => {
    AddReqruitmentModal.open({
        onSubmit: (req: IReqruitment) => {
            configState.reqruitments.push({ label: req.label, description: req.description });
            AddReqruitmentModal.close();
            saveConfig(); // Auto-save untuk UX yang lebih cepat
        }
    });
};

const editRequirement = (req: IReqruitment, index: number) => {
    EditReqruitmentModal.open({
        reqruitment: req,
        onSubmit: (newReq: IReqruitment) => {
            configState.reqruitments[index] = { label: newReq.label, description: newReq.description };
            EditReqruitmentModal.close();
            saveConfig();
        },
        onClose: () => EditReqruitmentModal.close()
    });
};

const deleteRequirement = (index: number) => {
    ConfirmationModal.open({
        title: 'Hapus Syarat',
        body: `Yakin ingin menghapus syarat "${configState.reqruitments[index]!.label}"?`,
        onConfirm: () => {
            configState.reqruitments.splice(index, 1);
            ConfirmationModal.close();
            saveConfig();
        },
        onClose: () => ConfirmationModal.close()
    });
};

// Fungsi Simpan ke Server
const saving = ref(false);
const saveConfig = async () => {
    if (!agenda.value) return;
    saving.value = true;
    try {
        // Konstruksi payload
        const payload = {
            ...agenda.value, // Bawa semua data lama
            category: (agenda.value.category as any)?._id || agenda.value.category, // Fix format category jika populated
            configuration: {
                ...agenda.value.configuration,
                participant: {
                    ...agenda.value.configuration.participant,
                    canRegister: configState.canRegister,
                    pay: configState.pay,
                    amount: configState.amount,
                    reqruitments: configState.reqruitments
                }
            },
            // Mapping committees agar sesuai schema API
            committees: agenda.value.committees?.map((c: any) => ({
                job: c.job,
                member: c.member?.NIM || c.member,
                approved: c.approved,
                approvedAt: c.approvedAt
            })) || []
        };

        await $api('/api/agenda', {
            method: 'PUT',
            query: { id },
            body: payload
        });

        toast.add({ title: 'Konfigurasi berhasil disimpan', color: 'success' });
        refresh(); // Refresh data asli
    } catch (err) {
        toast.add({ title: 'Gagal menyimpan konfigurasi', color: 'error' });
        console.error(err);
    } finally {
        saving.value = false;
    }
};
const cetakQrCode = () => {
    // 1. Cari elemen SVG di dalam container
    const svgElement = document.querySelector('#qr-container svg');

    if (!svgElement) {
        useToast().add({ title: 'Gagal memuat QR Code', color: 'error' });
        return;
    }

    // 2. Serialisasi SVG (Ubah elemen DOM SVG menjadi string XML)
    const serializer = new XMLSerializer();
    const svgString = serializer.serializeToString(svgElement);

    // 3. Buat Blob Object URL (Lebih aman & cepat daripada base64 untuk SVG)
    const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const qrUrl = URL.createObjectURL(svgBlob);

    // 4. Buka jendela baru
    const win = window.open('', '_blank', 'height=600,width=500');
    if (!win) return;

    // 5. Siapkan Style CSS
    const styles = `
        body {
            font-family: sans-serif;
            text-align: center;
            padding: 40px;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .card {
            border: 2px solid #000;
            padding: 20px;
            border-radius: 12px;
            display: inline-block;
            max-width: 100%;
        }
        h2 { margin-bottom: 5px; font-size: 24px; }
        p { margin-top: 0; color: #555; font-size: 14px; }
        /* Atur ukuran gambar agar pas di kertas */
        img { margin: 20px 0; width: 300px; height: 300px; object-fit: contain; }
        .footer { font-size: 12px; margin-top: 20px; color: #888; }
        @media print {
            .no-print { display: none; }
        }
    `;

    // 6. Manipulasi DOM Jendela Baru
    win.document.title = `Cetak QR - ${agenda.value?.title}`;

    // Inject Style
    const styleSheet = win.document.createElement("style");
    styleSheet.innerText = styles;
    win.document.head.appendChild(styleSheet);

    // Inject Content HTML
    win.document.body.innerHTML = `
        <div class="card">
            <h2>${agenda.value?.title}</h2>
            <p>${new Date(agenda.value?.date.start as string).toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
            <p>${agenda.value?.at}</p>
            
            <img id="qr-img" src="${qrUrl}" alt="QR Code" />
            
            <p><strong>SCAN UNTUK PRESENSI</strong></p>
        </div>
        <div class="footer">
            Dicetak pada ${new Date().toLocaleString('id-ID')}
        </div>
    `;

    // 7. Print Otomatis setelah gambar termuat
    const imgElement = win.document.getElementById('qr-img') as HTMLImageElement;
    if (imgElement) {
        imgElement.onload = () => {
            setTimeout(() => {
                win.print();
                // Bersihkan memory URL setelah print dialog muncul
                URL.revokeObjectURL(qrUrl);
            }, 500);
        };
    }
};
</script>

<template>
    <div class="space-y-6 mb-24">
        <UBreadcrumb :items="links" />

        <div v-if="pending" class="flex justify-center py-10">
            <UIcon name="i-heroicons-arrow-path" class="animate-spin text-4xl text-primary" />
        </div>

        <div v-else-if="agenda" class="space-y-6">

            <div
                class="bg-white/30 dark:bg-gray-800/40 p-6 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between md:items-center gap-4 rounded-2xl">
                <div>
                    <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {{ agenda.title }}
                        <UBadge v-if="agenda.category" color="primary" variant="subtle" size="xs">
                            {{ (agenda.category as ICategory)?.title || 'Tidak Berkategori' }}
                        </UBadge>
                    </h1>
                    <p class="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 text-sm">
                        <UIcon name="i-heroicons-calendar" />
                        {{ new Date(agenda.date.start as string).toLocaleDateString('id-ID', { dateStyle: 'long' }) }}
                        <span class="mx-1">•</span>
                        <UIcon name="i-heroicons-map-pin" />
                        {{ agenda.at }}
                    </p>
                </div>
                <div class="flex gap-2">
                    <UButton :to="publicLink" target="_blank" color="neutral" variant="ghost"
                        icon="i-heroicons-arrow-top-right-on-square">
                        Lihat Publik
                    </UButton>
                    <UButton icon="i-heroicons-share" variant="soft" color="neutral" @click="shareAgenda">
                        Bagikan
                    </UButton>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <UCard v-for="(stat, idx) in stats" :key="idx">
                    <div class="flex items-center gap-4">
                        <div
                            :class="`p-3 rounded-full bg-${stat.color}-100 dark:bg-${stat.color}-900/30 text-${stat.color}-500`">
                            <UIcon :name="stat.icon" class="w-6 h-6" />
                        </div>
                        <div>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ stat.label }}</p>
                            <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
                            <p class="text-xs text-gray-400">{{ stat.desc }}</p>
                        </div>
                    </div>
                </UCard>
            </div>

            <h3 class="text-lg font-semibold mb-3">Manajemen Agenda</h3>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <NuxtLink v-for="(menu, i) in shortcuts" :key="i" :to="menu.to" class="block group">
                                <UCard
                                    class="h-full hover:ring-2 hover:ring-primary-500/50 transition-all cursor-pointer"
                                    :ui="{ body: 'p-4 sm:p-5' }">
                                    <div class="flex items-start gap-4">
                                        <UAvatar :icon="menu.icon"
                                            :class="`bg-${menu.color}-100 dark:bg-${menu.color}-900 text-${menu.color}-500`"
                                            size="md" />
                                        <div>
                                            <h4
                                                class="font-semibold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                {{ menu.label }}
                                            </h4>
                                            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                {{ menu.desc }}
                                            </p>
                                        </div>
                                        <UIcon name="i-heroicons-chevron-right"
                                            class="ml-auto text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                    </div>
                                </UCard>
                            </NuxtLink>
                        </div>
                    </div>
                    <UCard>
                        <template #header>
                            <div class="flex justify-between items-center">
                                <h3 class="font-semibold flex items-center gap-2 text-lg">
                                    <UIcon name="i-heroicons-cog-6-tooth" /> Konfigurasi Pendaftaran
                                </h3>
                                <UButton v-if="!saving" size="xs" variant="ghost" icon="i-heroicons-check"
                                    @click="saveConfig">
                                    Simpan Perubahan
                                </UButton>
                                <UIcon v-else name="i-heroicons-arrow-path" class="animate-spin text-primary" />
                            </div>
                        </template>

                        <div class="space-y-6">
                            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <UFormField label="Status Pendaftaran">
                                    <USelectMenu v-model="configState.canRegister" :items="accessOptions"
                                        value-key="value" label-key="label" @change="saveConfig">
                                    </USelectMenu>
                                </UFormField>

                                <UFormField label="Mode Pembayaran">
                                    <div class="flex items-center gap-3 h-9">
                                        <USwitch v-model="configState.pay" @change="saveConfig" />
                                        <span class="text-sm">{{ configState.pay ? 'Berbayar' : 'Gratis' }}</span>
                                    </div>
                                </UFormField>
                            </div>

                            <div v-if="configState.pay" class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                                <UFormField label="Nominal Biaya Pendaftaran">
                                    <UInput type="number" v-model="configState.amount" icon="i-heroicons-banknotes"
                                        @blur="saveConfig">
                                        <template #leading>Rp</template>
                                    </UInput>
                                </UFormField>
                            </div>

                            <USeparator />

                            <div>
                                <div class="flex justify-between items-center mb-3">
                                    <h4 class="font-medium text-sm text-gray-700 dark:text-gray-200">
                                        Syarat / Ketentuan Pendaftaran
                                    </h4>
                                    <UButton size="xs" icon="i-heroicons-plus" variant="soft" @click="addRequirement">
                                        Tambah
                                    </UButton>
                                </div>

                                <div v-if="configState.reqruitments.length === 0"
                                    class="text-center py-4 text-sm text-gray-400 border border-dashed rounded-lg">
                                    Belum ada syarat yang ditambahkan
                                </div>

                                <div v-else class="space-y-2">
                                    <div v-for="(req, idx) in configState.reqruitments" :key="idx"
                                        class="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg group">
                                        <div>
                                            <p class="font-medium text-sm">{{ req.label }}</p>
                                            <p class="text-xs text-gray-500 line-clamp-1">{{ req.description }}</p>
                                        </div>
                                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <UButton icon="i-heroicons-pencil" color="neutral" variant="ghost" size="xs"
                                                @click="editRequirement(req, idx)" />
                                            <UButton icon="i-heroicons-trash" color="error" variant="ghost" size="xs"
                                                @click="deleteRequirement(idx)" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <USeparator />

                            <div class="flex flex-col sm:flex-row gap-3">
                                <UButton :to="`/administrator/agendas/${id}/participant/form`" block
                                    icon="i-heroicons-list-bullet" color="primary" variant="soft">
                                    Edit Pertanyaan Form Peserta
                                </UButton>
                                <UButton :to="`/administrator/agendas/${id}/committee/form`" block
                                    icon="i-heroicons-list-bullet" color="neutral" variant="soft">
                                    Edit Form Panitia
                                </UButton>
                            </div>
                        </div>
                    </UCard>
                </div>

                <div class="space-y-6 h-full lg:col-span-1">
                    <UCard :ui="{ root: 'h-full flex flex-col justify-between py-4' }">
                        <template #header>
                            <h3 class="font-semibold flex items-center gap-2">
                                <UIcon name="i-heroicons-qr-code" /> QR Code Agenda
                            </h3>
                        </template>
                        <div id="qr-container" class="flex flex-col items-center justify-center py-4">
                            <Qrcode :value="id" :size="200" level="H" class="bg-white p-2 rounded-lg" />
                            <p class="text-sm text-gray-500 mt-4 text-center max-w-xs">
                                Gunakan QR ini untuk presensi peserta.
                            </p>
                            <UButton class="mt-4" icon="i-heroicons-printer" size="sm" variant="soft"
                                @click="cetakQrCode">Cetak QR Code
                            </UButton>
                        </div>
                    </UCard>
                </div>
            </div>

        </div>
    </div>
</template>