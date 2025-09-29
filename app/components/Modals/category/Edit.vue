<script setup lang='ts'>
import type { ICategory } from '~/types';
import type { IResponse } from '~/types/IResponse';

const { $api } = useNuxtApp();
const { $ts } = useI18n();
const toast = useToast();


const props = defineProps<{
    data: ICategory;
}>();

const emit = defineEmits<{
    (e: 'triggerRefresh'): void;
    (e: 'close'): void;
}>();

const category = reactive<ICategory>({
    title: props.data.title || '',
    description: props.data.description || '',
    slug: props.data.slug || '',
});
const save = async () => {
    try {
        const data: ICategory = {
            title: category.title,
            description: category.description,
        }
        const res = await $api<IResponse>('/api/category', {
            method: 'PUT',
            query: {
                slug: category.slug
            },
            body: data
        });
        if (res.statusCode === 200) {
            toast.add({ title: $ts('success'), description: $ts('success_to_edit_category') });
            emit('triggerRefresh');
        } else {
            toast.add({ title: $ts('failed'), description: $ts('failed_to_edit_category'), color: 'error' });
        }
    } catch (error) {
        console.error(error);
        toast.add({ title: $ts('failed'), description: $ts('failed_to_edit_category'), color: 'error' });
    }
}
</script>
<template>
    <UModal :title="$ts('edit_category', { title: category.title })">
        <template #body>
            <div class="flex flex-col gap-4">
                <UFormField :label="$ts('title')">
                    <UInput v-model="category.title" :placeholder="$ts('title')" />
                </UFormField>
                <UFormField :label="$ts('description')">
                    <UTextarea v-model="category.description" :placeholder="$ts('description')" />
                </UFormField>
            </div>
        </template>
        <template #footer>
            <div class="flex flex-row justify-between w-full gap-2">
                <UButton @click="$emit('close')" color="neutral">{{ $ts('cancel') }}</UButton>
                <UButton @click="save" color="primary">{{ $ts('save') }}</UButton>
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>