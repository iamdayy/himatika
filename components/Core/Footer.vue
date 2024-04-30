<script setup lang='ts'>
import type { ILink } from '~/types';
import Logo from "~/assets/image/himatika-logo.png";

</script>
<template>
    <footer class="w-full pt-8 mb-4">
        <div class="container">
            <div class="flex flex-wrap">
                <div class="w-full px-4">
                    <img class="object-contain w-24" :src="Logo" alt="">
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
            </div>
        </div>
        <hr class="mx-auto my-6 border-blueGray-300">
        <div class="flex flex-wrap items-center justify-center mx-auto md:justify-between">
            <div class="w-full px-4 mx-auto text-center md:w-4/12">
                <div class="py-1 text-sm font-semibold text-blueGray-500">
                    Copyright © <span id="get-current-year">2024</span>
                    <a href="https://iamdayy.web.app" class="text-blueGray-500 hover:text-blueGray-800"> Iamdayy</a>.
                </div>
            </div>
        </div>
    </footer>
</template>
<style scoped></style>