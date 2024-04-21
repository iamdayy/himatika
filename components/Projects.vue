<script setup lang='ts'>
import type { IProject } from '~/types';
const { data: Projects } = await useAsyncData(() => $fetch<IProject[]>("/api/project"));
</script>
<template>
    <CoreCard title="Projects">
        <div class="px-3 py-8">
          <ol class="relative border-gray-200 border-s dark:border-gray-700">
            <CoreTimelineItem v-for="project, i in Projects" :key="i" :title="project.title" :date="new Date(project.deadline).toDateString()">
              {{ project.description }}
            </CoreTimelineItem>
          </ol>
        </div>
      </CoreCard>
</template>
<style scoped></style>