<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
import { initFlowbite } from "flowbite";

onMounted(async () => {
  initFlowbite();
})
</script>
<style>
.flip-enter-active,
.flip-leave-active {
    transition: transform 700ms 400ms ease-out;
}
.flip-enter-from {
  transform: rotateY(-180deg);
}
.flip-leave-to {
    transform: rotateY(180deg);
}
</style>