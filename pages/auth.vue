<script setup lang='ts'>
import HimatikaLogo from "~/assets/image/himatika-logo.png";
definePageMeta({
    layout: false,
});
useHead({
    title: "Login | Himatika"
});
</script>
<template>
    <!-- <div class="px-3 py-6 mx-auto my-16 max-w-xl sm:px-6 lg:px-8 shadow-lg rounded-xl"> -->
    <!-- <div class="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                <img class="mx-auto h-10 w-auto" :src="HimatikaLogo" alt="Himatika" />
                <h2 class="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">Sign in to your
                    account</h2>
            </div>

            <div class="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form class="space-y-6" action="#" method="POST">
                    <div>
                        <label for="username" class="block text-sm font-medium leading-6 text-gray-900">Username
                            address</label>
                        <div class="mt-2">
                            <input id="username" name="username" type="text" autocomplete="username" required
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>

                    <div>
                        <div class="flex items-center justify-between">
                            <label for="password" class="block text-sm font-medium leading-6 text-gray-900">Password</label>
                            <div class="text-sm">
                                <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">Forgot password?</a>
                            </div>
                        </div>
                        <div class="mt-2">
                            <input id="password" name="password" type="password" autocomplete="current-password" required
                                class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                        </div>
                    </div>

                    <div>
                        <button type="submit"
                            class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign
                            in</button>
                    </div>
                </form>

                <p class="mt-10 text-center text-sm text-gray-500">
                    Not yet registered?
                    {{ ' ' }}
                    <a href="#" class="font-semibold leading-6 text-indigo-600 hover:text-indigo-500">Register your
                        account</a>
                </p>
            </div>
        </div> -->
    <!-- </div> -->
    <div class="section py-16">
        <input class="pricing" type="checkbox" id="pricing" name="pricing" />
        <label for="pricing"><span class="block-diff">Login<span class="float-right">Register</span></span></label>
        <div class="card-3d-wrap mx-auto">
            <div class="card-3d-wrapper h-full w-full">
                <div class="card-front">
                    <div class="pricing-wrap px-3">
                        <h4 class="mb-5">Login</h4>
                        <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                            <img class="mx-auto h-10 w-auto" :src="HimatikaLogo" alt="Himatika" />
                        </div>

                        <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-sm overflow-y-scroll no-scrollbar max-h-96">
                            <form class="space-y-6" action="#" method="POST">
                                <div>
                                    <label for="username"
                                        class="block text-sm font-medium leading-6 text-gray-900">Username</label>
                                    <div class="mt-2">
                                        <input id="username" name="username" type="text" autocomplete="username" required
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                    </div>
                                </div>

                                <div>
                                    <div class="flex items-center justify-between">
                                        <label for="password"
                                            class="block text-sm font-medium leading-6 text-gray-900">Password</label>
                                        <div class="text-sm">
                                            <a href="#" class="font-semibold text-indigo-600 hover:text-indigo-500">Forgot
                                                password?</a>
                                        </div>
                                    </div>
                                    <div class="mt-2">
                                        <input id="password" name="password" type="password" autocomplete="current-password"
                                            required
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                    </div>
                                </div>

                                <div>
                                    <button type="submit"
                                        class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Sign
                                        in</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="card-back">
                    <div class="pricing-wrap">
                        <h4 class="mb-5">Register</h4>
                        <div class="sm:mx-auto sm:w-full sm:max-w-sm">
                            <img class="mx-auto h-10 w-auto" :src="HimatikaLogo" alt="Himatika" />
                        </div>

                        <div class="mt-6 sm:mx-auto sm:w-full sm:max-w-sm overflow-y-scroll no-scrollbar max-h-96 pb-8">
                            <form class="space-y-6" action="#" method="POST">
                                <div>
                                    <label for="NIM" class="block text-sm font-medium leading-6 text-gray-900">NIM</label>
                                    <div class="mt-2">
                                        <input id="NIM" name="NIM" type="number" autocomplete="NIM" required
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                    </div>
                                </div>
                                <div>
                                    <label for="username"
                                        class="block text-sm font-medium leading-6 text-gray-900">Username</label>
                                    <div class="mt-2">
                                        <input id="username" name="username" type="text" autocomplete="username" required
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                    </div>
                                </div>

                                <div>
                                    <label for="password"
                                        class="block text-sm font-medium leading-6 text-gray-900">Password</label>
                                    <div class="mt-2">
                                        <input id="password" name="password" type="password" autocomplete="current-password"
                                            required
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                    </div>
                                </div>
                                <div>
                                    <label for="confirm-password"
                                        class="block text-sm font-medium leading-6 text-gray-900">Confirm Password</label>
                                    <div class="mt-2">
                                        <input id="confirm-password" name="confirm-password" type="password"
                                            autocomplete="current-password" required
                                            class="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" />
                                    </div>
                                </div>

                                <div>
                                    <button type="submit"
                                        class="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Register</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<style scoped>
/* Please ❤ this if you like it! */


@import url('https://fonts.googleapis.com/css?family=Poppins:400,500,600,700,800,900');

:root {
    font-size: 20px;
}

body {
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 15px;
    line-height: 1.7;
    color: #102770;
    background-color: #ffeba7;
    overflow-x: hidden;
}

a {
    cursor: pointer;
    transition: all 200ms linear;
}

.section {
    position: relative;
    width: 100%;
    z-index: 1;
    display: block;
}

.full-height {
    min-height: 100vh;
}

[type="checkbox"]:checked,
[type="checkbox"]:not(:checked) {
    position: absolute;
    left: -9999px;
}

.pricing:checked+label,
.pricing:not(:checked)+label {
    position: relative;
    display: block;
    text-align: center;
    width: 260px;
    height: 44px;
    border-radius: 4px;
    padding: 0;
    margin: 0 auto;
    cursor: pointer;
    font-family: 'Poppins', sans-serif;
    font-weight: 600;
    text-transform: uppercase;
    font-size: 14px;
    letter-spacing: 1px;
    line-height: 44px;
    padding: 0 25px;
    padding-right: 27px;
    overflow: hidden;
    color: #fff;
    text-align: left;
}

.pricing:checked+label:before,
.pricing:not(:checked)+label:before {
    position: absolute;
    content: '';
    z-index: -2;
    background-color: #102770;
    width: 100%;
    height: 100%;
    display: block;
    top: 0;
    left: 0;
}

.pricing:checked+label:after,
.pricing:not(:checked)+label:after {
    position: absolute;
    content: '';
    z-index: -1;
    background-color: #ffeba7;
    width: 128px;
    height: 40px;
    display: block;
    top: 2px;
    left: 2px;
    border-radius: 2px;
    transition: left 300ms linear;
}

.pricing:checked+label:after {
    left: 130px;
}

.block-diff {
    display: block;
    mix-blend-mode: difference;
}

.card-3d-wrap {
    position: relative;
    width: 340px;
    max-width: calc(100% - 20px);
    height: 510px;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    perspective: 1000px;
    margin-top: 90px;
}

.card-3d-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    transition: transform 700ms 400ms ease-out;
}

.card-front,
.card-back {
    width: 100%;
    height: 100%;
    background-color: rgba(255, 255, 255, 1);
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
    box-shadow: 0 12px 35px 0 rgba(16, 39, 112, .07);
}

.card-back {
    transform: rotateY(180deg);
}

.pricing:checked~.card-3d-wrap .card-3d-wrapper {
    transform: rotateY(180deg);
    transition: transform 700ms 400ms ease-out;
}

.pricing-wrap {
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

.pricing-wrap h4 {
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

.pricing-wrap h4:before {
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

.card-back .pricing-wrap h4:before {
    background: linear-gradient(217deg, #f1d950, #e9db14);
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

.pricing-wrap h2 {
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

.pricing-wrap h2 sup {
    font-size: 20px;
}

.pricing-wrap p {
    position: relative;
    width: 100%;
    display: block;
    text-align: center;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.2;
    letter-spacing: 1px;
    color: #102770;
    transform: translate3d(0, 0, 30px) perspective(100px);
}

.card-back h2,
.card-back p,
.card-back h4 {
    color: #0c1c00;
}

.link {
    position: relative;
    padding: 10px 20px;
    border-radius: 4px;
    display: inline-block;
    text-align: center;
    color: #ffeba7;
    background-color: #102770;
    transition: all 200ms linear;
    font-family: 'Poppins', sans-serif;
    font-weight: 500;
    font-size: 14px;
    line-height: 1.2;
    transform: translate3d(0, 0, 30px) perspective(100px);
}

.link:hover {
    color: #102770;
    background-color: #ffeba7;
}

.card-back .link {
    background-color: #0c1c00;
}

.card-back .link:hover {
    color: #0c1c00;
    background-color: #ffeba7;
}

.img-wrap img {
    width: 100%;
    height: auto;
    display: block;
}

.img-1 {
    position: absolute;
    display: block;
    left: -160px;
    top: -50px;
    z-index: 5;
    width: calc(80% + 160px);
    transform: translate3d(0, 0, 45px) perspective(100px);
    opacity: 1;
    pointer-events: auto;
    transition: transform 400ms 1200ms ease, opacity 400ms 1200ms ease;
}

.pricing:checked~.card-3d-wrap .card-3d-wrapper .img-1 {
    opacity: 0;
    transform: translate3d(-50px, 25px, 45px) perspective(100px);
    pointer-events: none;
    transition: transform 400ms ease, opacity 200ms 150ms ease;
}

.img-2 {
    position: absolute;
    display: block;
    left: 0;
    top: 0;
    z-index: 1;
    border-top-left-radius: 6px;
    border-top-right-radius: 6px;
    overflow: hidden;
    width: 100%;
    transform: translate3d(0, 0, 15px) perspective(100px);
}

.img-3 {
    position: absolute;
    display: block;
    right: -20px;
    top: -40px;
    z-index: 5;
    width: calc(60% + 20px);
    transform: translate3d(0, 0, 55px) perspective(100px) scale(1);
    opacity: 1;
    pointer-events: auto;
    transition: transform 300ms 1300ms ease, opacity 200ms 1300ms ease;
}

.pricing:checked~.card-3d-wrap .card-3d-wrapper .img-3 {
    opacity: 0;
    transform: translate3d(-50px, 5px, 55px) perspective(100px) scale(0.4);
    pointer-events: none;
    transition: transform 400ms ease, opacity 200ms 150ms ease;
}

.img-6 {
    position: absolute;
    display: block;
    right: -20px;
    bottom: -55px;
    z-index: 5;
    width: calc(20% + 30px);
    transform: translate3d(0, 0, 25px) perspective(100px) scale(1);
    opacity: 1;
    pointer-events: auto;
    transition: transform 300ms 1300ms ease, opacity 200ms 1300ms ease;
}

.pricing:checked~.card-3d-wrap .card-3d-wrapper .img-6 {
    opacity: 0;
    transform: translate3d(0, 0, 25px) perspective(100px) scale(0.4);
    pointer-events: none;
    transition: transform 400ms ease, opacity 200ms 150ms ease;
}

.img-4 {
    position: absolute;
    display: block;
    left: -60px;
    top: -60px;
    z-index: 5;
    width: calc(65% + 60px);
    transform: translate3d(0, 0, 45px) perspective(100px) scale(0.5);
    opacity: 0;
    pointer-events: none;
    transition: transform 400ms ease, opacity 200ms 150ms ease;
}

.pricing:checked~.card-3d-wrap .card-3d-wrapper .img-4 {
    opacity: 1;
    pointer-events: auto;
    transform: translate3d(0, 0, 45px) perspective(100px) scale(1);
    transition: transform 400ms 1200ms ease, opacity 300ms 1200ms ease;
}

.img-5 {
    position: absolute;
    display: block;
    right: -70px;
    top: -50px;
    z-index: 6;
    width: calc(60% + 70px);
    transform: translate3d(0, 0, 35px) perspective(100px) scale(0.5) rotate(0deg);
    opacity: 0;
    pointer-events: none;
    transition: transform 400ms 100ms ease, opacity 200ms 250ms ease;
}

.pricing:checked~.card-3d-wrap .card-3d-wrapper .img-5 {
    opacity: 1;
    pointer-events: auto;
    transform: translate3d(0, 0, 35px) perspective(100px) scale(1) rotate(10deg);
    transition: transform 400ms 1300ms ease, opacity 300ms 1300ms ease;
}

.img-7 {
    position: absolute;
    display: block;
    right: -30px;
    bottom: -65px;
    z-index: 6;
    width: calc(25% + 30px);
    transform: translate3d(0, 0, 35px) perspective(100px) scale(0.5);
    opacity: 0;
    pointer-events: none;
    transition: transform 400ms 100ms ease, opacity 200ms 250ms ease;
}

.pricing:checked~.card-3d-wrap .card-3d-wrapper .img-7 {
    opacity: 1;
    pointer-events: auto;
    transform: translate3d(0, 0, 35px) perspective(100px) scale(1);
    transition: transform 400ms 1300ms ease, opacity 300ms 1300ms ease;
}



.logo {
    position: fixed;
    top: 30px;
    right: 30px;
    display: block;
    z-index: 100;
    transition: all 250ms linear;
}

.logo img {
    height: 26px;
    width: auto;
    display: block;
}
</style>