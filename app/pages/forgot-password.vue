<script setup lang="ts">
import type { FormError, Step } from "~~/types/component/stepper";
import type { IReqGenerateOTP } from "~~/types/IRequestPost";
import type {
    IGenerateOTPResponse,
    IResponse,
    IVerifyOTPResponse,
} from "~~/types/IResponse";
import type {
    ResetPasswordSchema,
    RstPasswordSchema,
} from "~~/types/schemas/auth";

const router = useRouter();
const route = useRoute();
const toast = useToast();
const { $ts } = useI18n();

const query = route.query as {
    NIM?: string;
    email?: string;
    code?: string;
    expiresAt?: string;
};
const remainingTime = ref(0);
let timer: string | number | NodeJS.Timeout | undefined = undefined;

// Check if otp parameters are present in the URL
const hasVerificationParams = computed(() => {
    return !!(query.NIM && query.email && query.code);
});

// Determine the target step based on URL parameters
const targetStep = computed(() => {
    if (hasVerificationParams.value) {
        return "otp"; // Navigate to otp step if params exist
    }
    return undefined; // Otherwise, start from the beginning
});

const stateAccount = reactive<ResetPasswordSchema>({
    email: query.email || "",
    NIM: parseInt(query.NIM || "0") || 0,
});
const stateOTP = reactive({
    otp: query.code?.split("") || ["", "", "", "", "", ""],
    expiresAt: query.expiresAt || new Date().toISOString(),
    token: "",
});
const statePassword = reactive<RstPasswordSchema>({
    password: "",
    password_confirmation: "",
});

const showPasswordReType = ref(false);
const loading = ref(false);
const activeStep = ref(0);

const verifyOTP = async (): Promise<boolean> => {
    loading.value = true;
    try {
        const response = await $fetch<IVerifyOTPResponse>("/api/otp/verify", {
            method: "post",
            body: {
                email: stateAccount.email,
                code: stateOTP.otp.join(""),
                type: "Reset Password",
            },
        });
        if (response.statusCode == 200) {
            toast.add({ title: $ts("otp_verified"), color: "success" });

            stateOTP.token = response.data?.token || "";
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

const SendOTPCode = async () => {
    try {
        const link = `/forgot-password?NIM=${stateAccount.NIM}&email=${stateAccount.email}`;
        const response = await $fetch<IGenerateOTPResponse>("/api/otp/generate", {
            method: "post",
            body: {
                email: stateAccount.email,
                type: "Reset Password",
                link: link,
                NIM: stateAccount.NIM,
            } as IReqGenerateOTP,
        });
        if (response.statusCode == 200) {
            stateOTP.expiresAt = response.data?.expiresAt || "";
            toast.add({ title: $ts("otp_send_success"), color: "success" });
            return true;
        }
    } catch (error: any) {
        toast.add({ title: $ts("otp_send_failed"), color: "error" });
        return false;
    }
};

const resetPassword = async () => {
    loading.value = true;
    try {
        const response = await $fetch<IResponse & { data?: FormError }>(
            "/api/reset-password",
            {
                method: "post",
                body: {
                    token: stateOTP.token,
                    code: stateOTP.otp.join(""),
                    password: statePassword.password,
                    password_confirmation: statePassword.password_confirmation,
                },
            }
        );
        if (response.statusCode == 200) {
            toast.add({ title: response.statusMessage, color: "success" });
        }
        if (response.data) {
            return response.data;
        }
    } catch (error: any) {
        toast.add({ title: error.statusMessage, color: "error" });
    } finally {
        loading.value = false;
    }
};

const onComplete = async () => {
    setTimeout(() => {
        navigateTo("/login");
    }, 5000);
};

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
    title: () => $ts("forgot_password"),
    meta: [
        {
            name: "description",
            content: "Forgot Password",
        },
    ],
});

const steps = computed<Step[]>(() => [
    {
        id: "account",
        label: $ts("account"),
        title: $ts("account"),
        description: $ts("account_description"),
        formData: stateAccount,
        validationRules: {},
        onNext: SendOTPCode,
    },
    {
        id: "otp",
        label: $ts("otp"),
        title: $ts("otp"),
        description: $ts("otp_description"),
        formData: stateOTP,
        validationRules: {},
        onNext: verifyOTP,
    },
    {
        id: "reset-password",
        label: $ts("reset_password"),
        title: $ts("reset_password"),
        description: $ts("reset_password_description"),
        formData: statePassword,
        validationRules: {},
        onNext: resetPassword,
    },
    {
        id: "complete",
        label: $ts("complete"),
        title: $ts("complete"),
        description: $ts("complete_description"),
        formData: {},
        validationRules: {},
    },
]);

const calculateRemainingTime = () => {
    const now = Date.now();
    return Math.max(0, new Date(stateOTP.expiresAt).getTime() - now);
};

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

    // Update the countdown every second
    timer = setInterval(() => {
        remainingTime.value = calculateRemainingTime();
    }, 1000);

    // If otp parameters are present, clean up the URL
    if (hasVerificationParams.value) {
        // We'll keep the parameters in the state but remove them from the URL for security
        router.replace({ path: route.path });
    }
});


onBeforeUnmount(() => {
    if (timer) {
        clearInterval(timer);
    }
});
</script>
<template>
    <AuthCard :title="$ts('forgot_password')">
        <CoreStepper :steps="steps" v-model="activeStep" @complete="onComplete" :target-step="targetStep"
            :skip-validation="hasVerificationParams" :ui="{
                root: 'bg-transparent dark:bg-transparent shadow-none backdrop-blur-none ',
            }">
            <template #default="{ step, errors }">
                <div v-if="step?.id === 'account'" class="px-2">
                    <UFormField label="NIM" id="NIM" name="NIM" :error="errors.NIM?.message">
                        <UInput type="text" color="neutral" variant="outline" required v-model="stateAccount.NIM" />
                    </UFormField>
                    <UFormField label="Email" id="email" name="email" :error="errors.email?.message">
                        <UInput type="email" color="neutral" variant="outline" required v-model="stateAccount.email" />
                    </UFormField>
                </div>
                <div v-if="step?.id === 'otp'" class="px-2">
                    <div class="flex flex-col px-1 space-y-6">
                        <UFormField id="otp" label="Verification" name="otp" :error="errors.otp?.message">
                            <UPinInput v-model="stateOTP.otp" :length="6" />
                        </UFormField>

                        <p class="text-gray-500 text-md dark:text-gray-400">
                            {{ formatTime(remainingTime) }}
                        </p>
                        <UButton @click="SendOTPCode()" :disabled="remainingTime > 0" block :loading="loading"
                            color="primary" variant="solid">
                            {{ $ts("resend_otp") }}
                        </UButton>
                    </div>
                </div>
                <div v-if="step?.id === 'reset-password'" class="px-2">
                    <CorePasswordInput v-model="statePassword.password" />
                    <UFormField :label="$ts('password_confirmation')" id="password-retype" name="password-retype"
                        :error="errors.password_confirmation?.message">
                        <div class="flex w-full gap-1 mt-2">
                            <UInput color="neutral" variant="outline" :type="showPasswordReType ? 'text' : 'password'"
                                autocomplete="current-password" required v-model="statePassword.password_confirmation"
                                class="flex-1" />
                            <UButton variant="link" color="neutral" @click="showPasswordReType = !showPasswordReType"
                                :icon="!showPasswordReType
                                    ? 'heroicons-eye'
                                    : 'heroicons-eye-slash'
                                    " :padded="false" />
                        </div>
                    </UFormField>
                </div>
            </template>
        </CoreStepper>
    </AuthCard>
</template>
