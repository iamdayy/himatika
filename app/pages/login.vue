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
const isMagicLink = ref(false); // State for Magic Link mode
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

        // Security: Ensure redirectUrl is a relative path to prevent Open Redirect attacks
        if (redirectUrl && !redirectUrl.startsWith('/')) {
            redirectUrl = '';
        }

        const previousUrlCookie = useCookie<string | null>('previousUrl');
        const previousUrl = previousUrlCookie.value;
        if (previousUrl) {
            previousUrlCookie.value = null;
        }

        // Magic Link Flow
        if (isMagicLink.value) {
            if (!state.email) {
                form.value?.setErrors([{ name: 'email', message: 'Email is required for Magic Link' }]);
                return;
            }
            await $fetch('/api/auth/magic/request', {
                method: 'POST',
                body: { email: state.email }
            });
            toast.add({
                title: 'Magic Link Sent',
                description: 'Check your email for the login link.',
                color: 'success'
            });
            return;
        }

        // Guest Login Flow (if user explicitly toggled or we detect guest intent? For now, let's keep it simple: 
        // If "useEmail" is true (which is toggled for guests currently in UI logic), we might try guest login? 
        // OR add a specific toggle "Login as Guest".
        // The current UI has "Use Magic Link" vs "Use Password".
        // Let's add a "Login as Guest" checkbox or tab?
        // Or simply try Member login, if fails try Guest login? 
        // Better: Explicit option.

        // AUTO-DETECT STRATEGY (Simplified for UX):
        // 1. Try Member Login
        // 2. If 401, Try Guest Login (only if username resembles email)

        try {
            // Attempt Member Login first
            if (useEmail.value) {
                console.log('Member Login');
                await signIn({
                    email: event.data.email,
                    password: event.data.password
                }, { callbackUrl: previousUrl ? previousUrl : '/profile', redirect: true });
            } else {
                console.log('Guest Login');
                await signIn({
                    username: event.data.username,
                    password: event.data.password
                }, { callbackUrl: previousUrl ? previousUrl : '/profile', redirect: true });
            }
            // If successful
            // if (redirectUrl) {
            //     window.location.replace(redirectUrl);
            // } else {
            //     // Default member redirect
            //     window.location.replace('/profile');
            // }
        } catch (memberError: any) {
            console.log(memberError);
            // If Member login failed, check if we should try Guest login
            // Only try if the credential looks like an email (Guest username is email)
            const credential = useEmail.value ? event.data.email : event.data.username;
            const isEmail = credential.includes('@');

            if (isEmail) {
                try {
                    // Manual fetch for guest login because `signIn` from nuxt-auth might be configured for single provider
                    // But we can use a custom endpoint.
                    // IMPORTANT: `signIn` uses `local` provider by default which points to `signin.post.ts`.
                    // We created `api/auth/guest/login.post.ts`. 
                    // We can't easily switch provider in `signIn` without config.
                    // So we call the endpoint directly and then set the token.

                    const guestResponse = await $fetch<{ token: string, refreshToken: string }>('/api/auth/guest/login', {
                        method: 'POST',
                        body: { email: credential, password: event.data.password }
                    });
                    console.log(guestResponse);

                    // If successful, we need to set the token manually in the auth state
                    // nuxt-auth might have a `data` or `token` setter.
                    // Or we just reload/redirect because the backend `guest/login` should set the HttpOnly cookie? 
                    // Wait, our `login.post.ts` returns token. We rely on client to set it? 
                    // `signIn` does this automatically.
                    // The `signin.post.ts` sets a session in DB.
                    // `guest/login.post.ts` ALSO sets a session in DB using `setSession`.
                    // The client needs to receive the token to put in header? 
                    // Our `authHelper` checks Header `Authorization: Bearer ...`.
                    // So specific client side logic is needed to store this token.
                    // But `useAuth` from `@sidebase/nuxt-auth` expects the `local` provider pattern.

                    // ALTERNATIVE: Modify `signin.post.ts` to handle BOTH? 
                    // User requested "Separation". 
                    // But for `login.vue` using `signIn`, it expects one endpoint.
                    // Let's manually handle guest login here:

                    const { token } = guestResponse;
                    console.log(token);
                    const { data, setToken } = useAuthState();
                    setToken(token); // This might be enough to trick existing auth state if it uses `token` property

                    // Typically `signIn` handles token storage (cookies/localstorage).
                    // We need to store it manually if we bypass signIn.
                    const tokenCookie = useCookie('auth:token');
                    tokenCookie.value = token;

                    // Redirect
                    window.location.replace('/guest/dashboard');
                    return;

                } catch (guestError) {
                    // Both failed, throw original error or guest error?
                    throw memberError; // Throw member error to keep it simple, or custom message
                }
            }
            throw memberError;
        }

    } catch (error: any) {
        // ... err handling
        form.value?.setErrors([error.data?.data || {}]);
        toast.add({
            title: $ts('login_failed'),
            description: error.data?.statusMessage || error.message || 'Login failed',
            color: 'error'
        });
    } finally {
        loading.value = false;
    }
}

const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google/redirect';
}

const toggleMagicLink = () => {
    isMagicLink.value = !isMagicLink.value;
    if (isMagicLink.value) {
        useEmail.value = true; // Magic link requires email
        state.username = ""; // Clear username just in case
        state.password = "placeholder"; // Hack to bypass client-side validation if required
    } else {
        useEmail.value = false;
        state.password = "";
    }
    form.value?.clear();
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
    // Check for error query param from OAuth redirect
    const route = useRoute();
    if (route.query.error) {
        toast.add({
            title: 'Login Error',
            description: route.query.error as string,
            color: 'error'
        });
    }

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
        class="mx-auto max-w-md border rounded-lg shadow-2xl card bg-linear-to-tr from-teal-100/40 via-white/60 to-indigo-50/10 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-900/10 backdrop-blur-sm border-accent-1 dark:border-accent-2">
        <div class="card-wrap">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm" id="img">
                <nuxtImg provider="localProvider" class="w-auto h-10 mx-auto image" src="/img/logo.png" alt="Himatika"
                    loading="lazy" />
            </div>
            <h4 class="my-4 text-3xl font-bold text-center text-secondary-dark dark:text-secondary-light">{{
                isMagicLink ? 'Magic Login' : $ts('login') }}</h4>

            <UForm ref="form" :state="state" @submit="onSubmit" class="px-2 mt-6 space-y-6">

                <!-- Email input for Magic Link or Email Login -->
                <UFormField v-if="useEmail || isMagicLink" id="email-login" label="Email" name="email">
                    <UInput color="neutral" variant="outline" :size="responsiveUISizes.input" type="email"
                        placeholder="your@email.com" required v-model="state.email" icon="heroicons-envelope" />
                </UFormField>

                <!-- Username input -->
                <UFormField v-else id="username-login" :label="`${$ts('username')} / NIM / Email`" name="username">
                    <UInput color="neutral" variant="outline" :size="responsiveUISizes.input" type="text"
                        :placeholder="$ts('username_desc')" required v-model="state.username" />
                </UFormField>

                <!-- Password input -->
                <UFormField v-if="!isMagicLink" id="password-login" :label="$ts('password')" name="password">
                    <div class="flex w-full gap-1 mt-2">
                        <UInput color="neutral" variant="outline" :size="responsiveUISizes.input"
                            :type="showPassword ? 'text' : 'password'" :placeholder="$ts('password_desc')" required
                            v-model="state.password" class="flex-1" />
                        <UButton variant="link" color="neutral" :size="responsiveUISizes.button"
                            @click="showPassword = !showPassword"
                            :icon="!showPassword ? 'heroicons-eye' : 'heroicons-eye-slash'" :padded="false" />
                    </div>
                </UFormField>

                <div class="flex justify-between text-sm">
                    <UButton variant="link" :padded="false" color="neutral" @click="toggleMagicLink">
                        {{ isMagicLink ? 'Use Password' : 'Use Magic Link' }}
                    </UButton>
                    <NuxtLink v-if="!isMagicLink" to="/forgot-password"
                        class="font-semibold text-indigo-400 hover:text-indigo-500">
                        {{ $ts('forgot_password') }}?</NuxtLink>
                </div>

                <!-- Login button -->
                <div>
                    <UButton id="signin" type="submit" variant="solid" :size="responsiveUISizes.button" block
                        :loading="loading">
                        {{ isMagicLink ? 'Send Login Link' : $ts('login') }}
                    </UButton>
                </div>

                <div class="text-center text-sm pt-2">
                    <span class="text-gray-500 dark:text-gray-400">Don't have an account?</span>
                    <NuxtLink to="/register" class="font-semibold text-accent-1 hover:text-accent-2 ml-1">
                        Register
                    </NuxtLink>
                    |
                    <NuxtLink to="/guest/register" class="font-semibold text-accent-1 hover:text-accent-2 ml-1">
                        Register as Guest
                    </NuxtLink>
                </div>

                <USeparator class="my-4" label="OR" />

                <!-- Google Login Button -->
                <UButton class="mb-4" icon="i-simple-icons-google" color="neutral" variant="solid" block
                    @click="handleGoogleLogin">
                    Sign in with Google
                </UButton>

            </UForm>
        </div>
    </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css?family=Poppins:400,500,600,700,800,900');

/* Card styles */
.card {
    width: 100%;
    height: auto;
    min-height: 100%;
    position: relative;
    /* position: absolute; removed */
    /* left: 50%; removed */
    /* top: 50%; removed */
    /* transform: translateX(-50%) translateY(-50%); removed */
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
    left: 50%;
    transform: translate(-50%, -100%) translate3d(0, 0, 30px) perspective(100px);
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