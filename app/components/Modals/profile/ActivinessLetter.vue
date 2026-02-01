<script setup lang="ts">
import { ModalsConfirmation } from '#components';
import type { IPoint } from '~~/types';
import type { IActivinessLetterResponse, IConfigResponse, IMeResponse } from '~~/types/IResponse';

interface IPointWithDisabledAndDoc extends IPoint {
    disabled: boolean;
    doc: string
}

const { $api } = useNuxtApp();
const toast = useToast();
const overlay = useOverlay();

const { data: configData } = useAsyncData('config', () => $api<IConfigResponse>('/api/config'));
const { data: ActivinessLetters, refresh: refreshActivinessLetterData, pending: loadingActivinessLetter } = useLazyAsyncData('ActivinessLetterData', () => $api<IActivinessLetterResponse>('/api/me/documents/activiness-letter'), {
    transform: (data) => {
        if (!data.data) return [];
        return data.data;
    }
});

const { makeActivinessLetter } = useMakeDocs();

const { $ts } = useI18n();


const ConfirmationModal = overlay.create(ModalsConfirmation);

const { data: fullProfile } = await useAsyncData('fullProfile', () => $api<IMeResponse>('/api/me'), {
    transform: (data) => {
        if (!data.data) return null;
        return data.data.user;
    }
});

const config = computed(() => configData.value?.data);
const loading = ref(false);
const points = computed<IPointWithDisabledAndDoc[]>(() => {
    // Use fullProfile instead of user.member
    if (!fullProfile.value?.point) return [];
    return fullProfile.value.point.map((point: any) => ({
        ...point,
        disabled: ActivinessLetters.value?.some((doc) => doc.tags.includes(`Semester ${point.semester}`)) || point.point < (config.value?.minPoint || 0),
        doc: ActivinessLetters.value?.find((doc) => doc.tags.includes(`Semester ${point.semester}`))?._id as string || ''
    }));
});

const generate = async (point: IPointWithDisabledAndDoc) => {
    if (point.disabled) {
        toast.add({ title: $ts('activity_letter_already_generated'), color: 'warning' });
        return;
    }
    ConfirmationModal.open({
        title: $ts('generate_activiness_letter'),
        body: $ts('generate_activiness_letter_confirm'),
        onConfirm: async () => {
            ConfirmationModal.close();
            loading.value = true;
            try {
                await makeActivinessLetter(point);
                refreshActivinessLetterData();
                toast.add({ title: $ts('generate_activiness_letter_success'), color: 'success' });
            } catch (error) {
                console.error(error);
                toast.add({ title: $ts('generate_activiness_letter_failed'), color: 'error' });
            } finally {
                loading.value = false;
            }
        }
    });
};

const canDownload = (point: IPointWithDisabledAndDoc) => {
    const ActivinessLetter = ActivinessLetters.value?.find(doc => doc.tags.includes(`Semester ${point.semester}`));
    if (!ActivinessLetter) {
        return false;
    }
    return true;
}

const downloadActivinessLetter = (point: IPointWithDisabledAndDoc) => {
    const ActivinessLetter = ActivinessLetters.value?.find(doc => doc.tags.includes(`Semester ${point.semester}`));
    if (!ActivinessLetter) {
        toast.add({ title: $ts('activity_letter_not_found'), color: 'error' });
        return false;
    }
    if (ActivinessLetter.signs?.some(sign => !sign.signed)) {
        toast.add({ title: $ts('document_not_signed'), color: 'error' });
        return;
    }
    const link = document.createElement('a');
    link.href = ActivinessLetter.doc as string;
    link.download = ActivinessLetter.label + '.pdf';
    link.click();
    toast.add({ title: $ts('download_success', { document: ActivinessLetter.label }), color: 'success' });
}
</script>
<template>
    <UModal :title="$ts('generate_activiness_letter')" @close="$emit('refreshTrigger')">
        <template #body="{ close }">
            <div class="flex flex-col gap-4 px-4 py-2">
                <div class="flex flex-col gap-2">
                    <p class="text-sm text-gray-500 dark:text-gray-400">
                        {{ $ts('activiness_letter_desc') }}
                    </p>
                    <p class="text-sm text-red-500 dark:text-red-400">
                        *{{ $ts('generate_activiness_letter_info', { point: config?.minPoint || 0 }) }}*
                    </p>
                </div>
                <div class="flex flex-col gap-2" v-if="loadingActivinessLetter || loading">
                    <USkeleton class="h-12 w-full" v-for="i in 3" :key="i" />
                </div>
                <div v-for="point, i in points" :key="i" class="flex items-center gap-2 my-2" v-else>
                    <div class="w-4 h-4 rounded-full bg-gray-200 dark:bg-gray-700"></div>
                    <div class="flex flex-row items-center justify-between w-full">
                        <div class="flex flex-col">
                            <p class="text-lg text-gray-700 dark:text-gray-300">Semester {{ point.semester }}</p>
                            <p class="text-sm text-gray-500 dark:text-gray-400">{{ point.point }} Point</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <UButton class="!px-4 !py-2" :loading="loading" variant="outline" v-if="!point.disabled"
                                @click="generate(point)">{{
                                    $ts('generate') }}</UButton>
                            <UButton class="!px-4 !py-2" :loading="loading" variant="subtle" v-else
                                :to="`/signatures/${point.doc}`" @click="close">{{
                                    $ts('view') }}</UButton>
                            <UButton class="!px-4 !py-2" v-if="canDownload(point)" variant="solid"
                                :disabled="!canDownload(point)" :loading="loading"
                                @click="downloadActivinessLetter(point)">{{
                                    $ts('download') }}</UButton>

                        </div>
                    </div>
                </div>
            </div>
        </template>
    </UModal>
</template>
