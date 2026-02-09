<script setup lang='ts'>
import type { IResponse } from '~~/types/IResponse';

const toast = useToast();
const { $api } = useNuxtApp();
const emit = defineEmits(["triggerRefresh", "close"]);
const loading = ref<boolean>(false);
const member = ref({
    fullName: "",
    NIM: 0,
    email: undefined,
    phone: "",
    sex: "male",
    birth: {
        place: "",
        date: new Date()
    },
    class: "",
    semester: 1,
    status: "free",
    enteredYear: new Date().getFullYear(),
});

const Save = async () => {
    loading.value = true;
    try {
        const added = await $api<IResponse>("/api/member", {
            method: "post",
            body: member.value
        });
        if (added.statusCode != 200) {
            toast.add({ title: 'Failed', description: 'Failed To Add Member', color: "error" });
        }
        emit("triggerRefresh");
        toast.add({ title: 'Berhasil!', description: 'Success To Add Member', color: "success" });
    } catch (error: any) {
        toast.add({ title: 'Failed', description: 'Failed To Add Member', color: "error" });
    } finally {
        loading.value = false;
    }
}

// Responsive design
const { width } = useWindowSize();
const isMobile = computed(() => width.value < 640);

// Responsive UI sizes based on screen width
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));
</script>
<template>
    <UModal :fullscreen="isMobile" :title="'Add New Member'" :description="'Add New Member Description'"
        :loading="loading" @close="$emit('close')">
        <template #body>
            <div class="p-4 space-y-4 md:p-6 md:space-y-6">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-6">
                    <UFormField class="col-span-1 md:col-span-6" :label="'Nama Lengkap'" required>
                        <UInput type="text" name="fullName" id="fullName" placeholder="Andrea Hirata"
                            v-model="member.fullName" required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="'Email'" required>
                        <UInput type="email" name="email" id="email" placeholder="example@company.com"
                            v-model="member.email" required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="'Nomor Telepon'" required>
                        <UInput type="text" name="phone-number" id="phone-number" placeholder="e.g. +(12)3456 789"
                            v-model="member.phone" required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="'Tempat & Tanggal Lahir'" required>
                        <div class="flex flex-row justify-between gap-4">
                            <UInput type="text" name="birth" id="birth" placeholder="Jakarta"
                                v-model="member.birth.place" required :size="responsiveUISizes.input" class="w-full" />
                            <DatePicker v-model="member.birth.date" />
                        </div>
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="'Jenis Kelamin'" required>
                        <USelect id="sex"
                            :items="[{ key: 'male', label: 'Laki-Laki' }, { key: 'female', label: 'Perempuan' }]"
                            v-model="member.sex" :size="responsiveUISizes.select" value-key="key" label-key="label" />
                    </UFormField>
                    <USeparator class="col-span-1 md:col-span-6" :label="'Akademik'" />
                    <UFormField class="col-span-1 md:col-span-3" label="NIM" required>
                        <UInput type="number" name="NIM" id="NIM" placeholder="10220023" v-model="member.NIM" required
                            :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-1" :label="'Semester'" required>
                        <UInput type="number" name="semester" id="semester" placeholder="1" v-model="member.semester"
                            required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-2" :label="'Kelas'" required>
                        <UInput type="text" name="class" id="class" placeholder="IM24A" v-model="member.class" required
                            :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-2" :label="'Angkatan'" required>
                        <UInput type="number" name="enteredYear" id="enteredYear" placeholder="2023"
                            v-model="member.enteredYear" required :size="responsiveUISizes.input" />
                    </UFormField>
                </div>
            </div>
        </template>
        <template #footer>
            <div class="flex items-center justify-between w-full">
                <UButton @click="$emit('close')" :size="responsiveUISizes.button" color="neutral" variant="soft"
                    :loading="loading">
                    {{ 'Batal' }}
                </UButton>
                <UButton type="submit" @click="Save" :loading="loading" :size="responsiveUISizes.button">
                    {{ 'Simpan' }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>