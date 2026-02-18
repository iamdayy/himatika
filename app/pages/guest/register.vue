<script setup lang="ts">
import type { FormSubmitEvent } from "#ui/types";
import * as z from "zod";

definePageMeta({
    layout: "auth",
    auth: {
        unauthenticatedOnly: true,
        navigateAuthenticatedTo: "/profile",
    },
});

const toast = useToast();
const loading = ref(false);
const responsiveUISizes = useResponsiveUiSizes();

// Schema for guest registration
const schema = z.object({
    fullName: z.string().min(3, "Name is too short"),
    email: z.string().email("Invalid email"),
    phone: z.string().min(10, "Phone number is too short"),
    instance: z.string().min(3, "Instance/School name is required"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});

type Schema = z.infer<typeof schema>;

const state = reactive<Schema>({
    fullName: "",
    email: "",
    phone: "",
    instance: "",
    password: "",
    confirmPassword: "",
});

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
    loading.value = true;
    try {
        await $fetch("/api/auth/guest/register", {
            method: "POST",
            body: {
                fullName: state.fullName,
                email: state.email,
                phone: state.phone,
                instance: state.instance,
                password: state.password,
            },
        });

        toast.add({
            title: "Registration Successful",
            description: "Please login with your new account.",
            color: "success",
        });

        navigateTo("/login");
    } catch (error: any) {
        toast.add({
            title: "Registration Failed",
            description: error.data?.statusMessage || error.message || "Unknown error",
            color: "error",
        });
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div
        class="mx-auto max-w-md w-full border rounded-lg shadow-2xl card bg-linear-to-tr from-teal-100/40 via-white/60 to-indigo-50/10 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-900/10 backdrop-blur-sm border-accent-1 dark:border-accent-2">
        <div class="card-wrap p-6">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm mb-6">
                <nuxtImg provider="localProvider" class="w-auto h-10 mx-auto" src="/img/logo.png" alt="Himatika"
                    loading="lazy" />
            </div>
            <h4 class="mb-6 text-2xl font-bold text-center text-secondary-dark dark:text-secondary-light">
                Guest Registration
            </h4>

            <UForm :schema="schema" :state="state" @submit="onSubmit" class="space-y-4 px-1">
                <UFormField label="Full Name" name="fullName">
                    <UInput v-model="state.fullName" color="neutral" variant="outline" :size="responsiveUISizes.input"
                        placeholder="John Doe" icon="heroicons-user" />
                </UFormField>

                <UFormField label="Email" name="email">
                    <UInput v-model="state.email" color="neutral" variant="outline" :size="responsiveUISizes.input"
                        type="email" placeholder="john@example.com" icon="heroicons-envelope" />
                </UFormField>

                <UFormField label="Phone (WhatsApp)" name="phone">
                    <UInput v-model="state.phone" color="neutral" variant="outline" :size="responsiveUISizes.input"
                        placeholder="081234567890" icon="heroicons-phone" />
                </UFormField>

                <UFormField label="Instance / School" name="instance">
                    <UInput v-model="state.instance" color="neutral" variant="outline" :size="responsiveUISizes.input"
                        placeholder="University / High School Name" icon="heroicons-building-office-2" />
                </UFormField>

                <UFormField label="Password" name="password">
                    <UInput v-model="state.password" color="neutral" variant="outline" :size="responsiveUISizes.input"
                        type="password" placeholder="********" icon="heroicons-lock-closed" />
                </UFormField>

                <UFormField label="Confirm Password" name="confirmPassword">
                    <UInput v-model="state.confirmPassword" color="neutral" variant="outline"
                        :size="responsiveUISizes.input" type="password" placeholder="********"
                        icon="heroicons-lock-closed" />
                </UFormField>

                <div class="pt-4">
                    <UButton type="submit" variant="solid" :size="responsiveUISizes.button" block :loading="loading">
                        Register
                    </UButton>
                </div>

                <div class="text-center text-sm">
                    Already have an account?
                    <NuxtLink to="/login" class="font-semibold text-indigo-400 hover:text-indigo-500">
                        Login here
                    </NuxtLink>
                </div>
            </UForm>
        </div>
    </div>
</template>

<style scoped>
/* Card styles */
.card {
    width: 100%;
    height: auto;
    min-height: 100%;
    position: relative;
    /* position: absolute; removed */
    /* left: 0; removed */
    /* top: 0; removed */
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    -o-backface-visibility: hidden;
    backface-visibility: hidden;
    /* justify-self: anchor-center; removed */
}

.card-wrap {
    position: relative;
    width: 100%;
    display: block;
    padding-left: 1rem;
    padding-right: 1rem;
    z-index: 1;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    -o-backface-visibility: hidden;
    backface-visibility: hidden;
}

.card-wrap #img {
    position: relative;
    width: 100%;
    display: block;
    text-align: center;
    margin-top: 1rem;
    transform: translate3d(0, 0, 30px) perspective(100px);
}

/* Animated background for heading */
.card-wrap #img:before {
    position: absolute;
    content: '';
    z-index: -1;
    background: linear-gradient(217deg, #448ad5, #b8eaf9);
    width: 80px;
    height: 80px;
    display: block;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    box-shadow: 0 6px 20px 0 rgba(16, 39, 112, .3);
    animation: border-transform 6s linear infinite;
}

/* Animation for heading background */
@keyframes border-transform {

    0%,
    100% {
        border-radius: 63% 37% 54% 46% / 55% 48% 52% 45%;
    }

    14% {
        border-radius: 40% 60% 54% 46% / 49% 60% 40% 51%;
    }

    28% {
        border-radius: 54% 46% 38% 62% / 49% 70% 30% 51%;
    }

    42% {
        border-radius: 61% 39% 55% 45% / 61% 38% 62% 39%;
    }

    56% {
        border-radius: 61% 39% 67% 33% / 70% 50% 50% 30%;
    }

    70% {
        border-radius: 50% 50% 34% 66% / 56% 68% 32% 44%;
    }

    84% {
        border-radius: 46% 54% 50% 50% / 35% 61% 39% 65%;
    }
}

/* Additional heading styles */
.card-wrap h2 {
    position: relative;
    width: 100%;
    display: block;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-weight: 400;
    letter-spacing: 1px;
    font-size: 36px;
    line-height: 1.1;
    color: #102770;
    transform: translate3d(0, 0, 30px) perspective(100px);
}
</style>
