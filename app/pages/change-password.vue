<script setup lang='ts'>
import type { Form, FormSubmitEvent } from '#ui/types';
import type { ChangePasswordSchema } from "~~/types/schemas/auth";
const toast = useToast();
const route = useRoute();
const router = useRouter();
const { $api } = useNuxtApp();
const { signOut } = useAuth();
const { $ts } = useI18n();

const state = reactive<ChangePasswordSchema>({
    old_password: '',
    password: '',
    password_confirmation: '',
})
const form = ref<Form<ChangePasswordSchema>>()
const loading = ref(false);
const onSubmit = async (event: FormSubmitEvent<ChangePasswordSchema>) => {
    loading.value = true;
    try {
        const response = await $api('/api/password', {
            method: "post",
            body: {
                oldPassword: event.data.old_password,
                newPassword: event.data.password,
                newPasswordConfirmation: event.data.password_confirmation
            }
        });
        if (response.statusCode == 200) {
            toast.add({ title: response.statusMessage });
            await signOut({ callbackUrl: '/login' });
        }
    } catch (error: any) {
        toast.add({ title: error.message });
        form.value?.setErrors([error.data.data]);
    } finally {
        loading.value = false;
    }
}
definePageMeta({
    pageTransition: {
        name: "flip"
    },
    layout: "auth",
})
useHead({
    title: () => $ts('change_password'),
    meta: [
        {
            name: "description",
            content: "Change Password"
        }
    ]
})
</script>
<template>
    <AuthCard :title="$ts('change_password')">
        <div class="pb-8 mt-2 sm:mx-auto sm:w-full sm:max-w-sm">
            <UForm ref="form" :state="state" @submit="onSubmit" class="space-y-2">
                <UFormField :label="$ts('old_password')" id="oldPassword" name="old_password">
                    <UInput type="password" color="neutral" variant="outline" required v-model="state.old_password" />
                </UFormField>
                <UFormField :label="$ts('new_password')" id="newPassword" name="password">
                    <UInput type="password" color="neutral" variant="outline" required v-model="state.password" />
                </UFormField>
                <UFormField :label="$ts('new_password_confirm')" id="confirmNewPassword" name="password_confirmation">
                    <UInput type="password" color="neutral" variant="outline" required
                        v-model="state.password_confirmation" />
                </UFormField>
                <div>
                    <UButton type="submit" block :loading="loading">{{ $ts('change_password') }}</UButton>
                </div>
            </UForm>
        </div>
    </AuthCard>
</template>