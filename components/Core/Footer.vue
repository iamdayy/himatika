<script setup lang='ts'>
import type { ILink } from '~/types';
import HimatikaLogo from "~/assets/image/himatika-logo.png";

const props = defineProps({
    links: Array<ILink>
})
</script>
<template>
    <footer class="relative pt-8 pb-6 bg-blueGray-200">
        <div class="container px-4 mx-auto">
            <div class="flex flex-wrap text-left lg:text-left">
                <div class="w-full px-4 lg:w-6/12">
                    <img class="object-contain w-24" :src="HimatikaLogo" alt="">
                    <h4 class="text-3xl font-bold text-gray-600 text-uppercase">Himpunan Mahasiswa Informatika</h4>
                    <h5 class="mt-0 mb-2 text-lg text-gray-500">
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
                    <div class="mt-6 mb-6 lg:mb-0">
                        <button
                            class="items-center justify-center w-10 h-10 mr-2 font-normal text-gray-500 bg-white rounded-full shadow-lg outline-none align-center focus:outline-none hover:text-gray-600"
                            type="button">
                            <Icon name="uil:instagram" />
                        </button>
                        <button
                            class="items-center justify-center w-10 h-10 mr-2 font-normal text-gray-500 bg-white rounded-full shadow-lg outline-none align-center focus:outline-none hover:text-gray-600"
                            type="button">
                            <Icon name="uil:facebook" />
                        </button>
                        <button
                            class="items-center justify-center w-10 h-10 mr-2 font-normal text-gray-500 bg-white rounded-full shadow-lg outline-none align-center focus:outline-none hover:text-gray-600"
                            type="button">
                            <Icon name="ion:logo-tiktok" />
                        </button>
                    </div>
                </div>
                <div class="w-full px-4 lg:w-6/12">
                    <div class="flex flex-wrap mb-6 items-top">
                        <div class="w-full px-4 pt-8 ml-auto lg:w-4/12">
                            <span class="block mb-2 text-sm font-semibold text-gray-500 uppercase">Useful Links</span>
                            <ul class="list-unstyled">
                                <li v-for="link, i in props.links" :key="i">
                                    <a class="block pb-2 text-sm font-semibold text-gray-600 hover:text-blueGray-800"
                                        :href="link.href">{{ link.name }}</a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            <hr class="my-6 border-blueGray-300">
            <div class="flex flex-wrap items-center justify-center md:justify-between">
                <div class="w-full px-4 mx-auto text-center md:w-4/12">
                    <div class="py-1 text-sm font-semibold text-blueGray-500">
                        Copyright © <span id="get-current-year">2024</span>
                        <a href="https://iamdayy.web.app" class="text-blueGray-500 hover:text-blueGray-800"> Iamdayy</a>.
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>
<style scoped></style>