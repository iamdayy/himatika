<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
import { initFlowbite } from "flowbite";
onMounted(() => {
  initFlowbite();
  const user = useFetch("/api/user", {
    method: "get"
  });
  console.log(user.data);
})
</script>