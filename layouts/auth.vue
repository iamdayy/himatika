<script setup lang='ts'>
</script>

<template>
    <div class="section py-8">
        <ul class="flex flex-wrap text-sm font-medium text-center text-white dark:text-gray-400 mx-auto w-fit bg-[#102770] rounded-xl mb-12">
            <li class="m-1">
                    <nuxt-link to="/login"
                    class="inline-block px-4 py-3 rounded-lg hover:bg-[#42538a] hover:text-white" active-class="bg-[#ffeba7] text-[#102770]">Login</nuxt-link>
            </li>
            <li class="m-1">
                    <nuxt-link to="/register"
                    class="inline-block px-4 py-3 rounded-lg hover:bg-[#42538a] hover:text-white" active-class="bg-[#ffeba7] text-[#102770]">Register</nuxt-link>
            </li>
        </ul>
        <div class="card-3d-wrap mx-auto">
            <div class="card-3d-wrapper h-full w-full">
                <slot></slot>
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