<template>
  <div>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>

<script lang="ts" setup>
onMounted(() => {
  const user = useFetch("/api/user", {
    method: "get"
  });
  console.log(user.data);
})

</script>