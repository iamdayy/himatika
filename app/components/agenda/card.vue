<template>
    <UCard class="group block" :to="`/agendas/${agenda._id}`">
        <template #header>
            <div class="flex justify-between items-start mb-2">
                <UBadge size="xs" :color="agendaIsPast(agenda) ? 'success' : 'neutral'" variant="subtle">
                    {{ agendaIsPast(agenda) ? $ts('open') : $ts('closed') }}
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
        </div>

        <template #footer>
            <div class="flex items-center gap-2 pt-3">
                <UAvatarGroup size="xs" :max="3">
                    <UAvatar v-for="participant in agenda.participants || []" :key="participant._id as string"
                        :src="(participant.member as IMember)?.avatar || '/img/profile-blank.png'"
                        :alt="(participant.member as IMember)?.fullName || 'Participant Name'" />
                </UAvatarGroup>
                <span class="text-xs dark:text-gray-300 text-gray-400" v-if="(agenda.participants?.length || 0) > 3">+
                    {{
                        agenda.participants?.length ?
                            (agenda.participants.length - 2) : 0 }}
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