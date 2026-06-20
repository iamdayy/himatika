<script setup lang='ts'>
import type { Form, FormSubmitEvent } from '#ui/types';
import type { IReqGenerateOTP } from "~~/types/IRequestPost";
import type { IGenerateOTPResponse, IResponse } from "~~/types/IResponse";
import type { ChangeEmailSchema } from "~~/types/schemas/auth";
const toast = useToast();
const route = useRoute();
const router = useRouter();
const { $ts } = useI18n();


const state = reactive<ChangeEmailSchema>({
    email: route.query.email as string || "",
    NIM: Number(route.query.NIM as string),
    username: route.query.username as string || "",
})
const form = ref<Form<ChangeEmailSchema>>()
const loading = ref(false);
const onSubmit = async (event: FormSubmitEvent<ChangeEmailSchema>) => {
    loading.value = true;
    try {
        const link = "/verify?email=" + event.data.email + "&type=" + "Change Email" + "&NIM=" + event.data.NIM;
        const response = await $fetch<IGenerateOTPResponse>('/api/otp/generate', {
            method: "post",
            body: {
                email: event.data.email,
                type: 'Change Email',
                link: link,
                NIM: event.data.NIM,
            } as IReqGenerateOTP
        });
        if (response.statusCode == 200) {
            navigateTo(link);
            toast.add({ title: $ts('otp_success') });
        }
    } catch (error: any) {
        toast.add({ title: error.message });
        form.value?.setErrors([error.data.data]);
    } finally {
        loading.value = false;
    }
}
onMounted(async () => {
    if (!route.query.NIM) {
        navigateTo('/register');
        return;
    }

    const { data } = await $fetch<IResponse & { data: { email: string, username: string } }>('/api/member/email', {
        method: 'get',
        query: {
            NIM: Number(route.query.NIM as string)
        }
    })
    const email = data.email || route.query.email as string;
    const username = data.username || route.query.username as string;
    if (email) {
        state.email = email;
        state.username = username;
    } else {
        router.push('/register');
    }
});
definePageMeta({
    pageTransition: {
        name: "flip"
    },
    layout: "auth",
    auth: false
})
useHead({
    title: "Change Email",
    meta: [
        {
            name: "description",
            content: "Change Email"
        }
    ]
})
</script>
<template>
    <AuthCard :title="$ts('change_email')">
        <div class="pb-8 mt-2 sm:mx-auto sm:w-full sm:max-w-sm">
                <UForm ref="form" :state="state" @submit="onSubmit" class="space-y-2">
                    <UFormField label="NIM" id="NIM" name="NIM">
                        <UInput type="number" color="neutral" variant="outline" disabled required v-model="state.NIM" />
                    </UFormField>
                    <UFormField label="Email" id="email" name="email">
                        <UInput type="email" color="neutral" variant="outline" required v-model="state.email" />
                    </UFormField>
                    <div>
                        <UButton type="submit" block :loading="loading">{{ $ts('send') }}</UButton>
                    </div>
                </UForm>
            </div>
    </AuthCard>
</template>