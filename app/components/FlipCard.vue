<script setup lang='ts'>
import { useWindowSize } from '@vueuse/core';

// Define the component's slots
const slots = defineSlots();

// Define the component's props
defineProps({
    img: String, // URL or path to the image
});

/**
 * Compute a random cubic-bezier timing function
 * @returns {string} A cubic-bezier function with random parameters
 */
const randomCubicBezier = computed(() => {
    const R1 = ((Math.random() * 0.699) + 0.300).toFixed(3);
    const R2 = ((Math.random() * 0.199) + 0.100).toFixed(3);
    const R3 = ((Math.random() * 0.100) + 0.200).toFixed(3);
    const R4 = ((Math.random() * 0.100) + 0.300).toFixed(3);
    return `cubic-bezier(${R1}, ${R2}, ${R3},${R4})`
});

/**
 * Compute a random translation for the floating animation
 * @returns {string} A CSS transform function with random X and Y translations
 */
const randomWalk = computed(() => {
    const x = Math.floor(Math.random() * -25) + 'px';
    const y = Math.floor(Math.random() * -35) + 'px';
    return `translateY(${x}) translateX(${y})`
});

// Use VueUse's useWindowSize composable for responsive design
const { width } = useWindowSize();

// Compute if the screen is mobile
const isMobile = computed(() => width.value < 768);

// Compute responsive dimensions
const wrapperDimensions = computed(() => ({
    width: isMobile.value ? '180px' : '240px',
    height: isMobile.value ? '340px' : '440px'
}));

const cardDimensions = computed(() => ({
    height: isMobile.value ? '320px' : '420px'
}));

const imageDimensions = computed(() => ({
    width: isMobile.value ? '80px' : '120px',
    height: isMobile.value ? '80px' : '120px'
}));

</script>
<template>
    <div class="mx-auto wrapper" :style="wrapperDimensions">
        <div class="card" :style="{ height: cardDimensions.height }">
            <div class="front" :style="{ height: cardDimensions.height }">
                <slot name="front" />
            </div>
            <div class="right" v-if="slots.back" :style="{ height: cardDimensions.height }">
                <slot name="back" />
            </div>
        </div>
        <div class="img-wrapper" :style="imageDimensions">
            <NuxtImg :src='img' alt='' class="object-cover rounded-full aspect-square" provider="localProvider"
                loading="lazy" />
        </div>
    </div>
</template>
<style scoped>
/* Wrapper for the entire component */
.wrapper {
    perspective: 800px;
    position: relative;
}

/* Main card container */
.card {
    width: 100%;
    position: relative;
    transform-style: preserve-3d;
    transform: translateZ(-140px);
    transition: transform 350ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
    cursor: pointer;
}

/* Common styles for front and back of the card */
.card>div {
    position: absolute;
    width: 100%;
    padding: 34px 21px;
    transition: all 350ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
}

/* Front face of the card */
.front {
    background-image: linear-gradient(180deg, #FF6600 0%, rgba(92, 91, 94, 0) 95%);
    transform: rotateY(0deg) translateZ(160px);
    border-radius: 34px 8px 0;
}

/* Back face of the card */
.right {
    background-image: linear-gradient(0deg, #FF6600 0%, rgba(92, 91, 94, 0) 95%);
    opacity: 0.08;
    transform: rotateY(90deg) translateZ(125px);
    border-radius: 0 0 3px 34px;
}

/* Card hover effects */
.card:hover {
    transform: translateZ(-160px) rotateY(-90deg);
}

.card:hover .front {
    opacity: 0;
}

.card:hover .right {
    opacity: 1;
}

/* Image styles */
img {
    transform-origin: top right;
    transition: transform 300ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
    transition-delay: 100ms;
    transform: translateX(50%);
    max-width: 100%;
    pointer-events: none;
    border-radius: 9999px !important;
}

/* Image wrapper styles */
.img-wrapper {
    animation: float 4s v-bind('randomCubicBezier') infinite alternate;
    position: absolute;
    transform-style: preserve-3d;
    top: 0;
    right: 0;
    pointer-events: none;
    backface-visibility: hidden;
}

/* Floating animation keyframes */
@keyframes float {
    0% {
        transform: translateZ(20px);
    }

    100% {
        transform: v-bind('randomWalk') translateZ(30px) scale(1.001);
    }
}

/* Image hover effect */
.card:hover~.img-wrapper img {
    transform: scale(0.9) translateX(45%) translateY(290%);
}

/* Responsive styles */
@media (max-width: 768px) {
    .card>div {
        padding: 20px 15px;
    }

    .card:hover {
        transform: translateZ(-60px) rotateY(-90deg);
    }

    .front {
        border-radius: 20px 5px 0;
        transform: rotateY(0deg) translateZ(180px);

    }

    .right {
        border-radius: 0 0 5px 20px;
        transform: rotateY(90deg) translateZ(100px);
    }

    .card:hover~.img-wrapper img {
        transform: scale(0.9) translateX(40%) translateY(370%);
    }
}
</style>