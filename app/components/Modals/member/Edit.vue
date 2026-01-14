<script setup lang='ts'>
import type { IMember } from '~~/types';
import type { IMemberResponse, IResponse } from '~~/types/IResponse';

/**
 * Toast notification composable
 */
const toast = useToast();

/**
 * Modal composable for controlling modal visibility
 */


/**
 * API composable for making API requests
 */
const { $api } = useNuxtApp();
const { $ts } = useI18n();
/**
 * Emit events for parent component communication
 */
const emit = defineEmits(["triggerRefresh", "returnObject", "close"]);
/**
 * Loading state for asynchronous operations
 */
const loading = ref<boolean>(false);

/**
 * Props definition for component
 */
const props = defineProps({
    Member: Object as PropType<IMember>,
    NIM: Number
});
const { data } = useLazyAsyncData<IMemberResponse>('memberData', () => $api('/api/member', {
    query: {
        NIM: props.NIM
    }
}), {
    default() {
        return {
            data: {
                member: {
                    fullName: "",
                    NIM: 0,
                    email: "",
                    phone: "",
                    religion: "",
                    sex: "male",
                    birth: {
                        place: "",
                        date: new Date()
                    },
                    citizen: "",
                    address: {
                        fullAddress: "",
                        village: "",
                        district: "",
                        city: "",
                        province: "",
                        country: "",
                        zip: 0
                    },
                    class: "",
                    semester: 1,
                } as IMember
            },
            statusCode: 0,
            statusMessage: "Not fetched yet"
        }
    },
})

/**
 * Default member member structure
*/
const Member = ref<IMember>({
    fullName: "",
    NIM: 0,
    email: "",
    phone: "",
    religion: "",
    sex: "male",
    birth: {
        place: "",
        date: new Date()
    },
    citizen: "",
    address: {
        fullAddress: "",
        village: "",
        district: "",
        city: "",
        province: "",
        country: "",
        zip: 0o0
    },
    class: "",
    semester: 1,
    enteredYear: new Date().getFullYear(),
});

/**
 * Computed property for member data
 * Returns props.Member if it's an object, otherwise returns Member.value
 */
const member = computed({
    get() {
        if (typeof props.Member == 'object') {
            return props.Member;
        }
        if (data.value?.data) {
            return data.value.data.member as IMember;
        }
        return Member.value;
    },
    set(val) {
        Member.value = val
    }
})

/**
 * Save member member data
 * Makes an API call to update the member
 */
const Save = async () => {
    loading.value = true;
    try {
        const added = await $api<IResponse>("/api/member", {
            method: "put",
            query: {
                NIM: props.NIM
            },
            body: member.value
        });
        if (added.statusCode != 200) {
            toast.add({ title: $ts('failed'), description: $ts('failed_to_update_member'), color: "error" });
        }
        emit("triggerRefresh");
        toast.add({ title: $ts('success'), description: $ts('success_to_update_member'), color: "success" });
    } catch (error: any) {
        toast.add({ title: $ts('failed'), description: $ts('failed_to_update_member'), color: "error" });
    } finally {
        loading.value = false;
    }
}

/**
 * Lifecycle hook to fetch member data on component mount
 */
onMounted(async () => {
    if (props.NIM) {
        member.value = await $api<IMember>('/api/member', {
            query: {
                NIM: props.NIM
            }
        });
    }
})

// Responsive design
/**
 * Window size composable for responsive design
 */
const { width } = useWindowSize()

/**
 * Computed property to determine if the screen is mobile size
 */
const isMobile = computed(() => width.value < 640)

// Responsive UI sizes based on screen width
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    input: isMobile.value ? 'xs' : 'md',
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
}));
</script>
<template>
    <UModal :fullscreen="isMobile" :title="$ts('edit_member', { name: member.fullName })"
        :description="$ts('edit_member_description', { name: member.fullName })" :loading="loading"
        @close="$emit('close')">
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
                    <UFormField class="col-span-1 md:col-span-3" :label="$ts('birth')" required v-if="member.birth">
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