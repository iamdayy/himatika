<script setup lang='ts'>
</script>

<template>
    <div class="relative h-screen">
        <div class="absolute py-8 transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2">
            <ul class="flex flex-row gap-3 font-sans font-semibold text-center text-white dark:text-gray-400 mx-auto w-fit bg-[#102770] rounded-xl mb-12">
                <li class="w-1/2 m-1">
                        <nuxt-link to="/login"
                        class="inline-block px-4 py-3 rounded-lg hover:bg-[#42538a] hover:text-white" active-class="bg-[#ffeba7] text-[#102770] hover:bg-[#ffeba7] hover:text-[#102770]">Login</nuxt-link>
                </li>
                <li class="w-1/2 m-1">
                        <nuxt-link to="/register"
                        class="inline-block px-4 py-3 rounded-lg hover:bg-[#42538a] hover:text-white" active-class="bg-[#ffeba7] text-[#102770] hover:bg-[#ffeba7] hover:text-[#102770]">Register</nuxt-link>
                </li>
            </ul>
            <div class="mx-auto card-3d-wrap">
                <div class="w-full h-full card-3d-wrapper">
                    <slot></slot>
                </div>
            </div>
        </div>
    </div>
</template>

<style>

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
}

.card-3d-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    -webkit-transform-style: preserve-3d;
    transform-style: preserve-3d;
    transition: transform 700ms 400ms ease-out;
}
</style>