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
onMounted(() => {
    if (!route.query.NIM) {
        navigateTo('/register');
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
    <div
        class="border rounded-lg shadow-2xl card bg-gradient-to-tr from-teal-100/40 via-white/60 to-indigo-50/10 dark:from-gray-800/50 dark:via-gray-800/40 dark:to-gray-900/10 backdrop-blur-sm border-accent-1 dark:border-accent-2">
        <div class="card-wrap">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm" id="img">
                <nuxtImg provider="localProvider" class="w-auto h-10 mx-auto image" src="/img/logo.png"
                    alt="Himatika" />
            </div>
            <h4 class="my-12 text-3xl font-bold text-center text-secondary-dark dark:text-secondary-light">{{
                $ts('change_email') }}
            </h4>
            <div class="pb-8 mt-2 sm:mx-auto sm:w-full sm:max-w-sm max-h-96">
                <UForm ref="form" :state="state" @submit="onSubmit" class="space-y-2">
                    <UFormGroup label="NIM" id="NIM" name="NIM">
                        <UInput type="number" color="neutral" variant="outline" disabled required v-model="state.NIM" />
                    </UFormGroup>
                    <UFormGroup label="Email" id="email" name="email">
                        <UInput type="email" color="neutral" variant="outline" required v-model="state.email" />
                    </UFormGroup>
                    <div>
                        <UButton type="submit" block :loading="loading">{{ $ts('send') }}</UButton>
                    </div>
                </UForm>
            </div>
        </div>
    </div>
</template>
<style scoped>
@import url('https://fonts.googleapis.com/css?family=Poppins:400,500,600,700,800,900');

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