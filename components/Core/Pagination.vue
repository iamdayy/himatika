<script setup lang='ts'>
const props = defineProps({
    maxVisibleButtons: {
        type: Number,
        required: false,
        default: 3
    },
    total: {
      type: Number,
      required: true
    },
    currentPage: {
      type: Number,
      required: true
    }
});
const perPage = defineModel<number>()
const emits = defineEmits(['pagechanged']);
const totalPages = computed(() => {
return Math.ceil(props.total / perPage.value!)
});
const startPage = computed(() => {
    // jika halaman pertama
    if (props.currentPage === 1) {
        return 1;
    }

    // jika halaman terakhir
    if (props.currentPage === totalPages.value) {
        if (totalPages.value <= props.maxVisibleButtons) {
            return 1
        }
        return totalPages.value - props.maxVisibleButtons; 
    }

    // jika diantaranya
    return props.currentPage - 1;
});
const pages = computed(() => {
    const range = [];
    for (let i = startPage.value; i <= Math.min(startPage.value + props.maxVisibleButtons - 1, totalPages.value); i++)
    {
        range.push({
            name: i,
            isDisabled: i === props.currentPage,
        });
    }
    return range;
});
const isFirstPage = computed(() => {
    return props.currentPage === 1;
});
const isLastPage = computed(() => {
    return props.currentPage === totalPages.value;
});
const onClickPreviousPage = () => {
    emits('pagechanged', props.currentPage - 1);
}
const onClickNextPage = () => {
    console.log(totalPages.value)
    emits('pagechanged', props.currentPage + 1);
}
const onClickPage = (page: number) => {
    emits('pagechanged', page);
}
</script>
<template>
    <div class="flex items-center justify-between w-full px-3 py-2">
        <FormSelect :options="[5,10,15,20]" v-model="perPage" @update:model-value="$emit('pagechanged', currentPage)" />
        <ul class="flex items-center -space-x-px text-sm">
            <li>
                <button @click="onClickPreviousPage" :disabled="isFirstPage"
                    class="flex items-center justify-center h-8 px-3 leading-tight text-gray-500 bg-white border border-gray-300 ms-0 border-e-0 rounded-s-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                    <span class="sr-only">Previous</span>
                    <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                        fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="M5 1 1 5l4 4" />
                    </svg>
                </button>
            </li>
            <li v-for="page, i in  pages" :key="i">
                <button :disabled="page.isDisabled" @click="onClickPage(page.name)"
                    class="flex items-center justify-center h-8 px-3 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                {{ page.name }}
                </button>
            </li>
            <li>
                <button @click="onClickNextPage" :disabled="isLastPage"
                    class="flex items-center justify-center h-8 px-3 leading-tight text-gray-500 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white">
                    <span class="sr-only">Next</span>
                    <svg class="w-2.5 h-2.5 rtl:rotate-180" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
                        fill="none" viewBox="0 0 6 10">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                            d="m1 9 4-4-4-4" />
                    </svg>
                </button>
            </li>
        </ul>
    </div>
</template>
<style scoped></style>