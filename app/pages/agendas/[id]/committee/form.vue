<script setup lang='ts'>
import type { IQuestion } from '~~/types';
import type { IAgendaResponse, IResponse } from '~~/types/IResponse';


const { $ts } = useI18n();
const { id } = useRoute().params as { id: string };
const { $api } = useNuxtApp();
const toast = useToast();
const overlay = useOverlay();


const { data: agenda, refresh } = useAsyncData('agenda', async () => $api<IAgendaResponse>('/api/agenda', {
    query: {
        id
    }
}), {
    transform: (data) => data.data?.agenda,
});

type IQuestionState = {
    [key: string]: IQuestion;
}

const questionsState = reactiveComputed<IQuestionState>(() => {
    const questions: IQuestionState = {};
    if (!agenda.value?.configuration.committee.questions) {
        return questions;
    }
    for (let i = 0; i < (agenda.value?.configuration.committee.questions).length; i++) {
        const question: IQuestion = agenda.value?.configuration.committee.questions[i] as IQuestion;
        questions[`${question.question} ${i + 1}`] = {
            question: question.question,
            type: question.type,
            options: question.options,
            required: question.required,
            _id: question._id,
        };

    }
    return questions;
});
const addNewQuestion = async () => {
    try {
        const response = await $api<IResponse & { data: string }>(`/api/agenda/${id}/committee/question`, {
            method: 'POST',
        });
        if (response.statusCode === 200) {
            toast.add({ title: $ts('success'), description: $ts('success_to_add_question'), color: 'success' });
            refresh();
        } else {
            toast.add({ title: $ts('success'), description: $ts('failed_to_add_question'), color: 'error' });
        }
    } catch (error) {
        toast.add({ title: $ts('success'), description: $ts('failed_to_add_question'), color: 'error' });
    }
}

const links = computed(() => [
    { label: $ts('dashboard'), to: '/dashboard', icon: 'i-heroicons-home' },
    { label: $ts('agenda'), to: '/dashboard/agendas', icon: 'i-heroicons-clipboard-document-list' },
    { label: agenda.value?.title || '', to: `/agendas/${id}`, icon: 'i-heroicons-document' },
    { label: $ts('committee'), to: `/agendas/${id}/committee`, icon: 'i-heroicons-users' },
    { label: $ts('questions'), icon: 'i-heroicons-document' },
]);
definePageMeta({
    layout: 'client',
    middleware: ['sidebase-auth', 'organizer', 'committee']
})
</script>
<template>

    <div class="items-center justify-center mb-24">
        <UBreadcrumb :items="links" />
        <UCard class="p-2 mt-2 md:p-4">
            <template #header>
                <div class="flex flex-col justify-between gap-2 p-1 md:p-2">
                    <h1 class="text-lg font-semibold text-gray-600 md:text-2xl md:font-bold dark:text-gray-200">
                        {{ $ts('agenda_question') }}
                    </h1>
                    <p>
                        {{ $ts('agenda_question_desc') }}
                    </p>
                </div>
            </template>

            <div class="p-2 space-y-2">
                <CoreQuestion v-for="(question, index) in questionsState" :key="index" :question="question"
                    @update="refresh" is-editing type="committee" />
                <UButton icon="i-heroicons-plus" color="neutral" variant="subtle" @click="addNewQuestion()" block
                    class="mb-2" />
            </div>
        </UCard>
    </div>
</template>
<style scoped></style>