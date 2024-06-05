<script setup lang='ts'>
const slots = defineSlots();
const props = defineProps({
    img: String,
});
const randomCubicBezier = computed(() => {
    const R1 = ((Math.random() * 0.699) + 0.300).toFixed(3);
    const R2 = ((Math.random() * 0.199) + 0.100).toFixed(3);
    const R3 = ((Math.random() * 0.100) + 0.200).toFixed(3);
    const R4 = ((Math.random() * 0.100) + 0.300).toFixed(3);
    return `cubic-bezier(${R1}, ${R2}, ${R3},${R4})`
});
const randomWalk = computed(() => {
    const x = Math.floor(Math.random() * -25) + 'px';
    const y = Math.floor(Math.random() * -35) + 'px';
    return `translateY(${x}) translateX(${y})`
});

</script>
<template>
    <div class="mx-16 wrapper">
        <div class="card">
            <div class="front">
                <slot name="front" />
            </div>
            <div class="right">
                <slot name="back" />
            </div>
        </div>
        <div class="img-wrapper">
            <NuxtImg :src='img' alt='' />
        </div>
    </div>
</template>
<style scoped>
.wrapper {
    width: 280px;
    height: 480px;
    perspective: 800px;
    position: relative;
}

.card {
    width: 320px;
    height: 450px;
    position: relative;
    transform-style: preserve-3d;
    transform: translateZ(-140px);
    transition: transform 350ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
    cursor: pointer;
}

.card>div {
    position: absolute;
    width: 320px;
    height: 450px;
    padding: 34px 21px;
    transition: all 350ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
}

.front {
    background-image: linear-gradient(180deg, rgb(255 138 76) 0%, rgba(92, 91, 94, 0) 95%);
    transform: rotateY(0deg) translateZ(160px);
    border-radius: 34px 8px 0;
}

.right {
    background-image: linear-gradient(0deg, rgb(255 138 76) 0%, rgba(92, 91, 94, 0) 95%);
    opacity: 0.08;
    transform: rotateY(90deg) translateZ(160px);
    border-radius: 0 0 3px 34px;
}

.card:hover {
    transform: translateZ(-160px) rotateY(-90deg);
}

.card:hover .front {
    opacity: 0;
}

.card:hover .right {
    opacity: 1;
}

/* h1,
h2 {
    margin: 0;
    font-size: 38px;
    letter-spacing: -.25px;
    transform: translateX(-44px);
    font-family: 'Sarala';
    font-weight: 700;
}

h2 {
    font-size: 21px;
    transform: translateX(-34px);
}

p {
    margin: 0;
    font-weight: 300;
    font-size: 16px;
}

span {
    margin-left: 13px;
    opacity: .55;
} */

img {
    transform-origin: top right;
    transition: transform 300ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
    transition-delay: 100ms;
    transform: translateX(64%);
    max-width: 180px;
    pointer-events: none;
}

.img-wrapper {
    animation: float 4s v-bind('randomCubicBezier') infinite alternate;
    position: absolute;
    top: 0;
    right: 0;
    pointer-events: none;
    backface-visibility: hidden;
}

@keyframes float {
    0% {
        transform: translateZ(20px);
    }

    100% {
        transform: v-bind('randomWalk') translateZ(30px) scale(1.001);
    }
}

.card:hover~.img-wrapper img {
    transform: scale(0.9) translateX(45%) translateY(195%);
}

/* ul {
    margin-left: 21px;
    padding: 0;
    font-size: 16px;
    font-weight: 300;
    list-style: none;
}

li {
    padding-bottom: 8px;
    position: relative;
}

li:before {
    content: 'x';
    position: absolute;
    left: -21px;
    opacity: .55;
}

button {
    position: absolute;
    right: 21px;
    bottom: 34px;
    border: none;
    box-shadow: none;
    background: none;
    color: inherit;
    font-family: 'Exo 2';
    font-weight: 300;
    font-size: 15px;
    letter-spacing: -.25px;
    font-weight: 700;
    padding: 13px 34px;
    border-radius: 55px 55px 21px 55px;
    background-image: linear-gradient(130deg, rgba(117, 51, 165, 1) 50%, rgba(51, 46, 57, .89) 100%);
    background-size: 125% 100%;
    background-position: right;
    cursor: pointer;
    box-shadow: 8px 5px 13px rgba(34, 34, 34, .08);
    transform: scale(0) skewY(13deg);
    transition: all 150ms cubic-bezier(0.390, 0.575, 0.565, 1.000);
    transform-origin: right bottom;
}

.card:hover button {
    transform: scale(1) skewY(0);
}

.card:not(:hover) button {
    opacity: 0;
}

button:hover {
    background-position: left;
}

.price {
    position: absolute;
    bottom: 34px;
    left: 21px;
    font-size: 34px;
    opacity: .34;
}

@keyframes fadeIn {
    0% {
        opacity: 0.33;
        transform: scale(.89);
    }
}

@media only screen and (max-width: 600px) {
    body {
        transform: scale(.67);
    }
} */
</style>