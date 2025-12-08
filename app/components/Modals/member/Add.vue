<script setup lang='ts'>
import type { IResponse } from '~~/types/IResponse';

const toast = useToast();
const { $api } = useNuxtApp();
const { $ts } = useI18n();

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
            toast.add({ title: $ts('failed'), description: $ts('failed_to_add_member'), color: "error" });
        }
        emit("triggerRefresh");
        toast.add({ title: $ts('success'), description: $ts('success_to_add_member'), color: "success" });
    } catch (error: any) {
        toast.add({ title: $ts('failed'), description: $ts('failed_to_add_member'), color: "error" });
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
    <UModal :fullscreen="isMobile" :title="$ts('add_new_member')" :description="$ts('add_new_member_description')"
        :loading="loading" @close="$emit('close')">
        <template #body>
            <div class="p-4 space-y-4 md:p-6 md:space-y-6">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-6 md:gap-6">
                    <UFormField class="col-span-1 md:col-span-6" :label="$ts('name')" required>
                        <UInput type="text" name="fullName" id="fullName" placeholder="Andrea Hirata"
                            v-model="member.fullName" required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="$ts('email')" required>
                        <UInput type="email" name="email" id="email" placeholder="example@company.com"
                            v-model="member.email" required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="$ts('phone')" required>
                        <UInput type="text" name="phone-number" id="phone-number" placeholder="e.g. +(12)3456 789"
                            v-model="member.phone" required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="$ts('birth')" required>
                        <div class="flex flex-row justify-between">
                            <UInput type="text" name="birth" id="birth" placeholder="Jakarta"
                                v-model="member.birth.place" required :size="responsiveUISizes.input" class="w-full" />
                            <div class="flex items-center justify-end min-w-44">
                                <VDatePicker id="date" v-model="member.birth.date" mode="date">
                                    <template #default="{ togglePopover }">
                                        <button @click="togglePopover">
                                            <Icon name="solar:calendar-date-outline"
                                                class="w-6 h-6 mx-2 text-gray-400 hover:text-blue-600" />
                                        </button>
                                    </template>
                                </VDatePicker>
                                <label class="block text-sm font-medium text-gray-900 dark:text-white">
                                    {{ member.birth.date.toLocaleDateString('id-ID', { dateStyle: 'long' }) }}
                                </label>
                            </div>
                        </div>
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-3" :label="$ts('gender')" required>
                        <USelect id="sex"
                            :items="[{ key: 'male', label: 'Laki-Laki' }, { key: 'female', label: 'Perempuan' }]"
                            v-model="member.sex" :size="responsiveUISizes.select" value-key="key" label-key="label" />
                    </UFormField>
                    <USeparator class="col-span-1 md:col-span-6" :label="$ts('academic')" />
                    <UFormField class="col-span-1 md:col-span-3" label="NIM" required>
                        <UInput type="number" name="NIM" id="NIM" placeholder="10220023" v-model="member.NIM" required
                            :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-1" :label="$ts('semester')" required>
                        <UInput type="number" name="semester" id="semester" placeholder="1" v-model="member.semester"
                            required :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-2" :label="$ts('class')" required>
                        <UInput type="text" name="class" id="class" placeholder="IM24A" v-model="member.class" required
                            :size="responsiveUISizes.input" />
                    </UFormField>
                    <UFormField class="col-span-1 md:col-span-2" :label="$ts('generation')" required>
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
                    {{ $ts('cancel') }}
                </UButton>
                <UButton type="submit" @click="Save" :loading="loading" :size="responsiveUISizes.button">
                    {{ $ts('save') }}
                </UButton>
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>