<script setup lang='ts'>
import type { IReqAuth } from "~/types/IRequestPost";

const Form = ref<IReqAuth>({
    username: "",
    password: "",
    password_confirmation: "",
    NIM: 0,
});
const register = async () => {
    try {
        await $fetch('/api/register', {
            method: "post",
            body: Form.value,
        })
        useNuxtApp().$toast("Success to register, welcome to himatika " + Form.value.username);
    } catch (error: any) {
        useNuxtApp().$toast(error.message);
    }
};

definePageMeta({
    pageTransition: {
        name: "flip"
    },
    layout: "auth",
    middleware: ["auth-guest"]
})
</script>
<template>
    <div
        class="shadow-xl card bg-gradient-to-tr from-teal-100 via-white to-indigo-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-900">
        <div class="card-wrap">
            <h4 class="mb-5">REGISTER</h4>
            <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                <nuxtImg class="w-auto h-10 mx-auto" src="/img/himatika-logo.png" alt="Himatika" />
            </div>

            <div class="pb-8 mt-6 sm:mx-auto sm:w-full sm:max-w-sm max-h-96">
                <div class="space-y-2">
                    <div>
                        <label for="NIM"
                            class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">NIM</label>
                        <div class="mt-2">
                            <input id="NIM" name="NIM" type="number" autocomplete="NIM" required v-model="Form.NIM"
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>
                    <div>
                        <label for="username-register"
                            class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Username</label>
                        <div class="mt-2">
                            <input id="username-register" name="username" type="text" autocomplete="username" required
                                v-model="Form.username"
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>

                    <div>
                        <label for="password-register"
                            class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Password</label>
                        <div class="mt-2">
                            <input id="password-register" name="password" type="password"
                                autocomplete="current-password" v-model="Form.password" required
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>
                    <div>
                        <label for="confirm-password"
                            class="block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100">Confirm
                            Password</label>
                        <div class="mt-2">
                            <input id="confirm-password" name="confirm-password" type="password"
                                v-model="Form.password_confirmation" autocomplete="current-password" required
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 dark:text-gray-100 dark:bg-gray-800 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>

                    <div>
                        <button @click="register"
                            class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Register</button>
                    </div>
                </div>
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
    border-radius: 6px;
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

.card-wrap h4 {
    position: relative;
    width: 100%;
    display: block;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-weight: 700;
    letter-spacing: 3px;
    font-size: 22px;
    line-height: 1.7;
    color: #102770;
    transform: translate3d(0, 0, 35px) perspective(100px);
}

.card-wrap h4:before {
    position: absolute;
    content: '';
    z-index: -1;
    background: linear-gradient(217deg, #448ad5, #b8eaf9);
    width: 70px;
    height: 70px;
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