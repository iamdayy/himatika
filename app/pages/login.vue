<script setup lang='ts'>
import type { Form, FormSubmitEvent } from '#ui/types';
import type { DriveStep } from "driver.js";
import type { LoginSchema } from "~~/types/schemas/auth";
// Page metadata
definePageMeta({
    pageTransition: {
        name: "flip"
    },
    layout: "auth",
    auth: {
        unauthenticatedOnly: true,
        navigateAuthenticatedTo: '/profile'
    }
});
// Authentication composable
const { signIn } = useAuth();
const { $ts } = useI18n();

// Toast notification composable
const toast = useToast();
const { $pageGuide } = useNuxtApp();
const responsiveUISizes = useResponsiveUiSizes();
const useEmail = ref(false);
const showPassword = ref(false);
const loading = ref(false);
const state = reactive<LoginSchema>({
    username: "",
    email: "",
    password: "",
});
// Form data reactive reference
const form = ref<Form<LoginSchema>>();


/**
 * Handles user login
 * Attempts to sign in the user with provided credentials
 * Redirects to dashboard on success, shows error toast on failure
 */
const onSubmit = async (event: FormSubmitEvent<LoginSchema>) => {
    loading.value = true;
    form.value!.clear();
    try {
        const route = useRoute();
        let redirectUrl = route.query.redirect as string;
        const previousUrlCookie = useCookie<string | null>('previousUrl');
        const previousUrl = previousUrlCookie.value;
        if (previousUrl) {
            previousUrlCookie.value = null;
        }
        if (useEmail.value) {
            await signIn({
                email: event.data.email,
                password: event.data.password
            }, { callbackUrl: previousUrl ? previousUrl : '/profile', redirect: redirectUrl ? false : true });
            if (redirectUrl) {
                window.location.replace(redirectUrl);
            }
            return;
        }
        await signIn({
            username: event.data.username,
            password: event.data.password
        }, { callbackUrl: previousUrl ? previousUrl : '/profile', redirect: redirectUrl ? false : true });
        if (redirectUrl) {
            window.location.replace(redirectUrl);
        }
    } catch (error: any) {
        form.value?.setErrors([error.data.data]);
        toast.add({
            title: $ts('login_failed'),
            description: error.data.data.message,
            color: 'error'
        });
    } finally {
        loading.value = false;
    }
}


// Set page head metadata
useHead({
    title: "Login",
    meta: [
        {
            name: "description",
            content: "Login to your account"
        }
    ]
});
onMounted(() => {
    const steps: DriveStep[] = [
        {
            element: '#username-login',
            popover: {
                title: $ts('username'),
                description: $ts('username_desc'),
                side: 'right'
            }
        },
        {
            element: '#password-login',
            popover: {
                title: $ts('password'),
                description: $ts('password_desc'),
                side: 'right'
            }
        },
        {
            element: '#signin',
            popover: {
                title: $ts('login'),
                description: $ts('login_desc'),
                side: 'right'
            }
        }
    ]
    $pageGuide('login', steps, {
        showProgress: true,
        showButtons: ['next', 'previous'],
    });
})
</script>

<template>
    <div
        class="max-w-md border rounded-lg shadow-2xl card bg-gradient-to-tr from-teal-100/40 via-white/60 to-indigo-50/10 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-900/10 backdrop-blur-sm border-accent-1 dark:border-accent-2">
        <div class="card-wrap">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm" id="img">
                <nuxtImg provider="localProvider" class="w-auto h-10 mx-auto image" src="/img/logo.png" alt="Himatika"
                    loading="lazy" />
            </div>
            <h4 class="my-12 text-3xl font-bold text-center text-secondary-dark dark:text-secondary-light">{{
                $ts('login') }}</h4>

            <UForm ref="form" :state="state" @submit="onSubmit"
                class="px-2 mt-6 space-y-6 overflow-y-scroll no-scrollbar max-h-96">
                <!-- Username input -->
                <UFormField id="username-login" :label="`${$ts('username')} / NIM`" name="username">
                    <UInput color="neutral" variant="outline" :size="responsiveUISizes.input" type="text"
                        :placeholder="$ts('username_desc')" required v-model="state.username" />
                </UFormField>
                <UFormField id="password-login" :label="$ts('password')" name="password">
                    <div class="flex w-full gap-1 mt-2">
                        <UInput color="neutral" variant="outline" :size="responsiveUISizes.input"
                            :type="showPassword ? 'text' : 'password'" :placeholder="$ts('password_desc')" required
                            v-model="state.password" class="flex-1" />
                        <UButton variant="link" color="neutral" :size="responsiveUISizes.button"
                            @click="showPassword = !showPassword"
                            :icon="!showPassword ? 'heroicons-eye' : 'heroicons-eye-slash'" :padded="false" />
                    </div>
                </UFormField>

                <div class="text-sm text-end">
                    <NuxtLink to="/forgot-password" class="font-semibold text-indigo-400 hover:text-indigo-500">
                        {{ $ts('forgot_password') }}?</NuxtLink>
                </div>

                <!-- Login button -->
                <div>
                    <UButton id="signin" type="submit" variant="solid" :size="responsiveUISizes.button" block
                        :loading="loading">
                        {{ $ts('login') }}
                    </UButton>
                </div>
            </UForm>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Poppins:400,500,600,700,800,900');

/* Card styles */
.card {
    width: 100%;
    height: 100%;
    position: absolute;
    left: 0;
    top: 0;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    -webkit-backface-visibility: hidden;
    -moz-backface-visibility: hidden;
    -o-backface-visibility: hidden;
    backface-visibility: hidden;
    justify-self: anchor-center;
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