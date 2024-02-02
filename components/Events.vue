<script setup lang='ts'>
const date = ref<Date>(new Date());
const pickDay = (day: any) => {
  date.value = day.date;
}
</script>
<template>
    <CoreCard title="Events">
        <div class="py-8 px-3">
          <VCalendar expanded borderless @dayclick="pickDay" />
          <div>
            {{ date }}
          </div>
        </div>
      </CoreCard>
</template>
<style scoped></style>