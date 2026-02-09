<script setup lang='ts'>
import type { ICategory } from '~~/types';
import type { IResponse } from '~~/types/IResponse';

const { $api } = useNuxtApp();
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
            toast.add({ title: 'Berhasil!', description: 'Success To Edit Category' });
            emit('triggerRefresh');
        } else {
            toast.add({ title: 'Failed', description: 'Failed To Edit Category', color: 'error' });
        }
    } catch (error) {
        console.error(error);
        toast.add({ title: 'Failed', description: 'Failed To Edit Category', color: 'error' });
    }
}
</script>
<template>
    <UModal :title="'Edit Kategori {title}' /* params: { title: category.title } */">
        <template #body>
            <div class="flex flex-col gap-4">
                <UFormField :label="'Judul'">
                    <UInput v-model="category.title" :placeholder="'Judul'" />
                </UFormField>
                <UFormField :label="'Deskripsi'">
                    <UTextarea v-model="category.description" :placeholder="'Deskripsi'" />
                </UFormField>
            </div>
        </template>
        <template #footer>
            <div class="flex flex-row justify-between w-full gap-2">
                <UButton @click="emit('close')" color="neutral">{{ 'Batal' }}</UButton>
                <UButton @click="save" color="primary">{{ 'Simpan' }}</UButton>
            </div>
        </template>
    </UModal>
</template>
<style scoped></style>