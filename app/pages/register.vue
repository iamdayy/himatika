<script setup lang="ts">
import { useIntervalFn } from "@vueuse/core";
import type { DriveStep } from "driver.js";
import type { FieldValidationRules, FormError, Step } from "~~/types/component/stepper";
import type { IReqGenerateOTP } from "~~/types/IRequestPost";
import type { IGenerateOTPResponse, IResponse, IVerifyOTPResponse } from "~~/types/IResponse";
import type { RegisterSchema, VerifyNIMSchema } from "~~/types/schemas/auth";

const { $pageGuide } = useNuxtApp();
const { $ts } = useI18n();
const router = useRouter();
const route = useRoute();
const responsiveUISizes = useResponsiveUiSizes();

const query = route.query as { NIM?: string, username?: string, email?: string, code?: string, expiresAt?: string };
const loading = ref(false);
const activeTab = ref(0);
const fullName = ref("");

const remainingTime = ref(0);

const toast = useToast();
const showPasswordReType = ref(false);

// Check if verification parameters are present in the URL
const hasVerificationParams = computed(() => {
    return !!(query.NIM && query.username && query.email && query.code);
});

// Determine the target step based on URL parameters
const targetStep = computed(() => {
    if (hasVerificationParams.value) {
        return 'verification'; // Navigate to verification step if params exist
    }
    return undefined; // Otherwise, start from the beginning
});

const stateVerifyNIM = reactive<VerifyNIMSchema>({
    NIM: parseInt(query.NIM as string) || 0,
}); // Form data reactive reference

const stateForm = reactive<RegisterSchema>({
    username: query?.username || "",
    email: query?.email || "",
    password: "",
    password_confirmation: "",
}); // Form data reactive reference

const OTPForm = reactive({
    otp: query.code?.split("") || ["", "", "", "", "", ""],
    expiresAt: query.expiresAt || new Date().toISOString(),
    token: ""
});


const SendOTPCode = async () => {
    try {
        const link = `/register?NIM=${stateVerifyNIM.NIM}&username=${stateForm.username}&email=${stateForm.email}`;
        const response = await $fetch<IGenerateOTPResponse>("/api/otp/generate", {
            method: "post",
            body: {
                email: stateForm.email,
                type: "Verify Account",
                link: link,
                NIM: stateVerifyNIM.NIM,
            } as IReqGenerateOTP,
        });
        if (response.statusCode == 200) {
            OTPForm.expiresAt = response.data?.expiresAt || "";
            if (import.meta.client) {
                sessionStorage.setItem('otpExpiresAt', OTPForm.expiresAt);
            }
            toast.add({ title: $ts("otp_send_success"), color: "success" });
        }
    } catch (error: any) {
        toast.add({ title: $ts("otp_send_failed"), color: "error" });
    }
};
const finish = async () => {
    try {
        const response = await $fetch<IResponse>("/api/user/verify", {
            method: "post",
            body: {
                email: stateForm.email,
                token: OTPForm.token,
            },
        });
        if (response.statusCode == 200) {
            toast.add({ title: $ts("account_verified"), description: $ts('account_verified_desc'), color: "success" });
            router.push("/login");
        } else {
            toast.add({ title: $ts("account_not_verified"), description: response.statusMessage, color: "error" });
        }
    } catch (error: any) {
        toast.add({ title: error.statusMessage, color: "error" });
    }
};

const register = async (): Promise<boolean | FormError> => {
    loading.value = true;
    try {
        const registered = await $fetch("/api/register", {
            method: "post",
            body: { ...stateForm, NIM: stateVerifyNIM.NIM },
        });
        if (registered.statusCode == 200) {
            toast.add({ title: $ts("register_success"), description: $ts('register_success_desc'), color: "success" });
            SendOTPCode();
            return true;
        } else {
            toast.add({ title: $ts("register_failed"), description: $ts('register_failed_desc'), color: "error" });
            return false;
        }
    } catch (error: any) {
        const errMsg = error?.data?.data?.message || 'Terjadi kesalahan pada sistem';
        const errPath = error?.data?.data?.path || 'server';
        toast.add({ title: errMsg, color: "error" });
        return { path: errPath, message: errMsg };
    } finally {
        loading.value = false;
    }
};
const verifyNIM = async (): Promise<true | FormError> => {
    try {
        const verified = await $fetch<IResponse & { fullName: string }>(
            "/api/member/verifyNIM",
            {
                method: "post",
                body: stateVerifyNIM,
            }
        );
        if (verified.statusCode == 200) {
            toast.add({
                title: $ts("verification_nim_success"),
                description: $ts("verification_nim_success_desc"),
                color: "success",
            });
            const steps: DriveStep[] = [
                {
                    element: "#username-register",
                    popover: {
                        title: $ts("username"),
                        description: $ts("username_desc"),
                        side: "right",
                    },
                },
                {
                    element: "#email-register",
                    popover: {
                        title: $ts("email"),
                        description: $ts("email_desc"),
                        side: "right",
                    },
                },
                {
                    element: "#password",
                    popover: {
                        title: $ts("password"),
                        description: $ts("password_desc"),
                        side: "right",
                    },
                },
                {
                    element: "#password-retype",
                    popover: {
                        title: $ts("password_confirmation"),
                        description: $ts("password_confirmation_desc"),
                        side: "right",
                    },
                },
                {
                    element: "#register",
                    popover: {
                        title: $ts("register"),
                        description: $ts("register_desc"),
                        side: "right",
                    },
                },
            ];
            $pageGuide("register", steps, {
                showProgress: true,
                showButtons: ["next", "previous"],
            });
            return true;
        } else {
            toast.add({ title: $ts("verification_nim_failed"), description: $ts('verification_nim_failed_desc'), color: "error" });
            return { path: "NIM", message: verified.statusMessage };
        }
    } catch (error: any) {
        toast.add({ title: $ts("verification_nim_failed"), description: $ts('verification_nim_failed_desc'), color: "error" });
        return { path: error?.data?.data?.path || 'NIM', message: error?.data?.data?.message || 'Verifikasi gagal' };
    }
};
const verifyNIMFormRules = reactiveComputed<FieldValidationRules>(() => ({
    NIM: async (value: string | number) => {
        !value ? { path: "NIM", message: $ts("nim_required") } : null;
        const isValid = await verifyNIM();
        return isValid === true ? null : isValid;
    },
}));
const accountFormRules = reactiveComputed<FieldValidationRules>(() => ({
    username: (value: string) => {
        return value ? null : { path: "username", message: $ts("username_required") };
    },
    email: (value: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!value) return { path: "email", message: $ts("email_required") };
        if (!emailRegex.test(value)) return { path: "email", message: $ts("email_invalid") };
        return null;
    },
    password: (value: string) => {
        if (!value) return { path: "password", message: $ts("password_required") };
        if (value.length < 8) {
            return { path: "password", message: $ts("password_min_length") }; // Minimum eight characters
        }
        if (!/[a-z]/.test(value)) {
            return { path: "password", message: $ts("password_lowercase_required") }; // At least one lowercase letter
        }
        if (!/[A-Z]/.test(value)) {
            return { path: "password", message: $ts("password_uppercase_required") }; // At least one uppercase letter
        }
        if (!/\d/.test(value)) {
            return { path: "password", message: $ts("password_number_required") }; // At least one number
        }
        return null;
    },
    password_confirmation: (value: string) => {
        if (!value) return { path: "password_confirmation", message: $ts("password_confirmation_required") };
        if (value !== stateForm.password) return { path: "password_confirmation", message: $ts("password_confirmation_not_match") };
        return null;
    },
}));

const verifyOTP = async (): Promise<boolean> => {
    loading.value = true;
    try {
        const response = await $fetch<IVerifyOTPResponse>("/api/otp/verify", {
            method: "post",
            body: {
                email: stateForm.email,
                code: OTPForm.otp.join(""),
                type: "Verify Account",
            },
        });
        if (response.statusCode == 200) {
            toast.add({ title: $ts("otp_verified"), color: "success" });
            console.log(response.data);

            OTPForm.token = response.data?.token || "";
            return true;
        } else {
            toast.add({ title: $ts("otp_failed"), color: "error" });
            return false;
        }
    } catch (error: any) {
        toast.add({ title: error.statusMessage, color: "error" });
        return false;
    } finally {
        loading.value = false;
    }
};

const items = computed<Step[]>(() => [
    {
        id: "verifyNIM",
        label: $ts("verification_nim"),
        title: $ts("verification_nim"),
        description: $ts("verification_nim_desc"),
        formData: stateVerifyNIM,
        validationRules: verifyNIMFormRules,
    },
    {
        id: "account",
        label: $ts("account"),
        title: $ts("account"),
        description: $ts("account_desc", { name: fullName.value }),
        formData: stateForm,
        validationRules: accountFormRules,
        onNext: register,
    },
    {
        id: "verification",
        label: $ts("verification"),
        title: $ts("verification"),
        description: $ts("verification_desc"),
        formData: OTPForm,
        onNext: verifyOTP,
    },
    {
        id: "finish",
        label: $ts("finish"),
        title: $ts("finish"),
        description: $ts("finish_desc", { name: fullName.value }),
        formData: {},
    }
]);
definePageMeta({
    pageTransition: {
        name: "flip",
    },
    layout: "auth",
    auth: {
        unauthenticatedOnly: true,
        navigateAuthenticatedTo: "/profile",
    },
});

useHead({
    title: () => $ts('register'),
    meta: [
        {
            name: "description",
            content: "Register account",
        },
    ],
});

const calculateRemainingTime = () => {
    const now = Date.now();
    return Math.max(0, new Date(OTPForm.expiresAt).getTime() - now);
};

const { pause, resume } = useIntervalFn(() => {
    remainingTime.value = calculateRemainingTime();
}, 1000);

function formatTime(ms: number) {
    if (ms <= 0) return "00:00:00";

    const seconds = Math.floor((ms / 1000) % 60);
    const minutes = Math.floor((ms / (1000 * 60)) % 60);
    const hours = Math.floor(ms / (1000 * 60 * 60));

    return [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
    ].join(":");
}

onMounted(() => {
    if (import.meta.client && sessionStorage.getItem('otpExpiresAt')) {
        OTPForm.expiresAt = sessionStorage.getItem('otpExpiresAt') as string;
    }

    const steps: DriveStep[] = [
        {
            element: "#NIM",
            popover: {
                title: "NIM",
                description: $ts("nim_desc"),
                side: "right",
            },
        },
        {
            element: "#verify-nim",
            popover: {
                title: $ts("verification_nim"),
                description: $ts("verification_nim_btn_desc"),
                side: "right",
            },
        },
    ];
    $pageGuide("register-verify-nim", steps, {
        showProgress: true,
        showButtons: ["next", "previous"],
    });

    // If verification parameters are present, clean up the URL
    if (hasVerificationParams.value) {
        // We'll keep the parameters in the state but remove them from the URL for security
        router.replace({ path: route.path });
    }
});
</script>
<template>
    <AuthCard :title="$ts('register')">
        <CoreStepper :steps="items" v-model="activeTab" @complete="finish" :target-step="targetStep"
            :skip-validation="hasVerificationParams" :ui="{
                root: 'bg-transparent dark:bg-transparent shadow-none backdrop-blur-none ',
            }"><template #default="{ step, errors }">
                <div v-if="step?.id === 'verifyNIM'" class="px-2">
                    <div class="px-1">
                        <UFormField id="NIM" label="NIM" name="NIM" :error="errors.NIM?.message">
                            <UInput type="number" color="neutral" :size="responsiveUISizes.input" variant="outline"
                                required v-model="stateVerifyNIM.NIM" />
                        </UFormField>
                    </div>
                </div>

                <div v-if="step?.id === 'account'" class="space-y-3">
                    <div class="px-1 space-y-6">
                        <UFormField :label="$ts('NIM')" id="NIM" name="NIM" :error="errors.NIM?.message">
                            <UInput type="number" :size="responsiveUISizes.input" disabled required
                                v-model="stateVerifyNIM.NIM" color="neutral" variant="outline" />
                        </UFormField>
                        <UFormField :label="$ts('username')" id="username" name="username"
                            :error="errors.username?.message">
                            <UInput type="text" autocomplete="username" :size="responsiveUISizes.input" required
                                v-model="stateForm.username" color="neutral" variant="outline" />
                        </UFormField>
                        <UFormField :label="$ts('email')" id="email-register" name="email"
                            :error="errors.email?.message">
                            <UInput type="email" autocomplete="email" :size="responsiveUISizes.input" required
                                v-model="stateForm.email" color="neutral" variant="outline" />
                        </UFormField>
                        <CorePasswordInput v-model="stateForm.password" />
                        <UFormField :label="$ts('password_confirmation')" id="password-retype" name="password-retype"
                            :error="errors.password_confirmation?.message">
                            <div class="flex w-full gap-1 mt-2">
                                <UInput color="neutral" variant="outline" :size="responsiveUISizes.input"
                                    :type="showPasswordReType ? 'text' : 'password'" autocomplete="current-password"
                                    required v-model="stateForm.password_confirmation" class="flex-1" />
                                <UButton variant="link" color="neutral" :size="responsiveUISizes.button"
                                    @click="showPasswordReType = !showPasswordReType" :icon="!showPasswordReType
                                        ? 'heroicons-eye'
                                        : 'heroicons-eye-slash'
                                        " :padded="false" />
                            </div>
                        </UFormField>
                    </div>
                </div>
                <div v-if="step?.id === 'verification'" class="px-2">
                    <div class="flex flex-col px-1 space-y-6">
                        <UFormField id="verification" label="Verification" name="verification"
                            :error="errors.verification?.message">

                            <UPinInput v-model="OTPForm.otp" :length="6" :size="responsiveUISizes.input" />
                        </UFormField>

                        <p class="text-gray-500 text-md dark:text-gray-400">
                            {{ formatTime(remainingTime) }}
                        </p>
                        <UButton @click="SendOTPCode" :disabled="remainingTime > 0" block :loading="loading"
                            :size="responsiveUISizes.button" color="primary" variant="solid">
                            {{ $ts("resend_otp") }}
                        </UButton>
                    </div>
                </div>
            </template>
        </CoreStepper>
    </AuthCard>
</template>