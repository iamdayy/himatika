<script setup lang='ts'>
import type { ICategory } from '~~/types';
import type { IResponse } from '~~/types/IResponse';

const { $api } = useNuxtApp();
const toast = useToast();


const props = defineProps<{
    title: string;
}>();

const emit = defineEmits<{
    (e: 'triggerRefresh'): void;
    (e: 'close'): void;
}>();

const category = reactive<ICategory>({
    title: props.title || '',
    description: '',
    slug: '',
});
const save = async () => {
    try {
        const data: ICategory = {
            title: category.title,
            description: category.description,
            slug: category.title.replace(/\s+/g, '-').toLowerCase()
        }
        const res = await $api<IResponse>('/api/category', {
            method: 'POST',
            body: data
        });
        if (res.statusCode === 200) {
            toast.add({ title: 'Berhasil!', description: 'Success To Add Category' });
            emit('triggerRefresh');
        } else {
            toast.add({ title: 'Failed', description: 'Failed To Add Category', color: 'error' });
        }
    } catch (error) {
        console.error(error);
        toast.add({ title: 'Failed', description: 'Failed To Add Category', color: 'error' });
    }
}
</script>
<template>
    <UModal :title="'Tambah Kategori'">
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