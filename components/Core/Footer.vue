<script setup lang='ts'>
import type { ILink } from '~/types';
import HimatikaLogo from "~/assets/image/himatika-logo.png";

const props = defineProps({
    links: Array<ILink>
})
</script>
<template>
    <footer class="relative bg-blueGray-200 pt-8 pb-6">
        <div class="container mx-auto px-4">
            <div class="flex flex-wrap text-left lg:text-left">
                <div class="w-full lg:w-6/12 px-4">
                    <img class="w-24 object-contain" :src="HimatikaLogo" alt="">
                    <h4 class="text-3xl font-bold text-uppercase text-blueGray-700">Himatika</h4>
                    <h5 class="text-lg mt-0 mb-2 text-blueGray-600">
                        <span>
                            Jl. Karangdowo No.9, Karangdowo Kec.Kedungwuni, Pekalongan, Jawa Tengah 51173 <br />
                        </span>
                        <span>
                            Email : him.tekom123@gmail.com <br />
                        </span>
                        <span>
                            Tlp/Wa : 088227561673
                        </span>
                    </h5>
                    <div class="mt-6 lg:mb-0 mb-6">
                        <button
                            class="bg-white text-lightBlue-400 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2"
                            type="button">
                            <Icon name="uil:instagram" />
                        </button>
                        <button
                            class="bg-white text-lightBlue-600 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2"
                            type="button">
                            <Icon name="uil:facebook" />
                        </button>
                        <button
                            class="bg-white text-pink-400 shadow-lg font-normal h-10 w-10 items-center justify-center align-center rounded-full outline-none focus:outline-none mr-2"
                            type="button">
                            <Icon name="ion:logo-tiktok" />
                        </button>
                    </div>
                </div>
                <div class="w-full lg:w-6/12 px-4">
                    <div class="flex flex-wrap items-top mb-6">
                        <div class="w-full lg:w-4/12 px-4 ml-auto">
                            <span class="block uppercase text-blueGray-500 text-sm font-semibold mb-2">Useful Links</span>
                            <ul class="list-unstyled">
                                <li v-for="link, i in props.links" :key="i">
                                    <a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm"
                                        :href="link.href">{{ link.name }}</a>
                                </li>
                            </ul>
                        </div>
                        <div class="w-full lg:w-4/12 px-4">
                            <span class="block uppercase text-blueGray-500 text-sm font-semibold mb-2">Other
                                Resources</span>
                            <ul class="list-unstyled">
                                <li>
                                    <a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm"
                                        href="https://github.com/creativetimofficial/notus-js/blob/main/LICENSE.md?ref=njs-profile">MIT
                                        License</a>
                                </li>
                                <li>
                                    <a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm"
                                        href="https://creative-tim.com/terms?ref=njs-profile">Terms &amp; Conditions</a>
                                </li>
                                <li>
                                    <a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm"
                                        href="https://creative-tim.com/privacy?ref=njs-profile">Privacy Policy</a>
                                </li>
                                <li>
                                    <a class="text-blueGray-600 hover:text-blueGray-800 font-semibold block pb-2 text-sm"
                                        href="https://creative-tim.com/contact-us?ref=njs-profile">Contact Us</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <hr class="my-6 border-blueGray-300">
            <div class="flex flex-wrap items-center md:justify-between justify-center">
                <div class="w-full md:w-4/12 px-4 mx-auto text-center">
                    <div class="text-sm text-blueGray-500 font-semibold py-1">
                        Copyright © <span id="get-current-year">2024</span>
                        <a href="https://iamdayy.web.app" class="text-blueGray-500 hover:text-blueGray-800"> Iamdayy</a>.
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>
<style scoped></style>