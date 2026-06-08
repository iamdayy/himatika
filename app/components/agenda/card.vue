<template>
    <UCard class="group block" :to="`/agendas/${agenda._id}`">
        <template #header>
            <div class="flex justify-between items-start mb-2">
                <UBadge size="xs" :color="agendaIsPast(agenda) ? 'neutral' : 'success'" variant="subtle">
                    {{ agendaIsPast(agenda) ? $ts('closed') : $ts('open') }}
                </UBadge>
                <span class="text-xs dark:text-gray-300 text-gray-500">{{
                    new Date(agenda.date.start).toLocaleDateString() }}</span>
            </div>

            <NuxtLink :to="`/agendas/${agenda._id}`"
                class="font-bold text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors mb-1 line-clamp-1 no-underline text-2xl">
                {{ agenda.title }}
            </NuxtLink>
        </template>

        <div class="flex flex-col gap-2 h-32 overflow-hidden">
            <p class="text-gray-600 dark:text-gray-400 text-sm flex-1 line-clamp-3">
                <CoreContent :content="agenda.description || 'No description provided.'" />
            </p>
            <div class="flex items-center gap-1" :title="$ts('participant')" v-if="agenda.participantsCount !== undefined">
                <UIcon name="i-heroicons-user-group" class="w-3.5 h-3.5" />
                <UAvatarGroup size="3xs" :max="2">
                    <UAvatar src="" alt="Peserta" class="bg-gray-100 dark:bg-gray-800" />
                    <UAvatar src="" alt="Peserta" class="bg-gray-200 dark:bg-gray-700" />
                    <UAvatar v-if="agenda.participantsCount > 2"
                        :alt="'+' + (agenda.participantsCount - 2)"
                        class="bg-gray-300 dark:bg-gray-600 font-medium text-gray-700 dark:text-gray-200" />
                </UAvatarGroup>
            </div>
            <div class="flex items-center gap-1" :title="$ts('committee')" v-if="agenda.committeesCount !== undefined">
                <UIcon name="i-heroicons-users" class="w-3.5 h-3.5" />
                <span class="text-xs">{{ agenda.committeesCount }}</span>
            </div>
        </div>

        <template #footer>
            <div class="flex items-center gap-2 pt-3">
                <span class="text-xs dark:text-gray-300 text-gray-400" v-if="(agenda.participantsCount || 0) > 0">
                    {{ agenda.participantsCount }}
                    {{ $ts('joined') }}</span>
            </div>
        </template>
    </UCard>
</template>

<script lang="ts" setup>
import type { IAgenda, IMember } from "~~/types";
defineProps<{
    agenda: IAgenda;
}>();

const agendaIsPast = (agenda: IAgenda) => {
    const now = new Date();
    const agendaEnd = new Date(agenda.date.end);
    return now > agendaEnd;
};
</script>