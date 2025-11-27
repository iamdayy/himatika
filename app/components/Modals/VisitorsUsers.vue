<script setup lang='ts'>
import type { IRegistered } from '~/types';
import type { IExportSheetResponse } from '~/types/IResponse';

/**
 * Modal instance for controlling the modal visibility
 */
const modal = useModal();
const toast = useToast();

/**
 * Ref to store selected visitors users
 */
const selectedVisitors = ref<IRegistered[]>([]);
/**
 * Current page number for pagination
 */
const page = ref(1)

/**
 * Number of items per page
 */
const perPage = ref(5);



/**
 * Window size composable for responsive design
 */
const { width } = useWindowSize()

/**
 * Computed property to determine if the screen is mobile size
 */
const isMobile = computed(() => width.value < 640)

/**
 * Computed property to determine if the screen is tablet size
 */
const isTablet = computed(() => width.value >= 640 && width.value < 1024)

/**
 * Computed property for responsive table columns
 */
const columns = computed(() => [
    {
        label: "Avatar",
        key: "avatar"
    },
    {
        label: "Full Name",
        key: "fullName",
        sortable: true
    },
    {
        label: "NIM",
        key: "NIM"
    },
    {
        label: "Email",
        key: "email",
        hidden: isMobile.value
    },
    {
        label: "Class",
        key: "class",
        sortable: true,
        hidden: isMobile.value
    },
    {
        label: "Semester",
        key: "semester",
        sortable: true,
        hidden: isMobile.value || isTablet.value
    },
])

/**
 * Props definition for the component
 */
const props = defineProps({
    visitors: {
        type: Array as PropType<IRegistered[]>,
        required: true,
    },
    isCommittee: {
        type: Boolean,
        default: false
    }
});

/**
 * Emits definition for the component
 */
const emit = defineEmits(['changeCheckItem']);

/**
 * Flattens a nested object structure
 * @param {Object} obj - The object to flatten
 * @returns {Object} Flattened object
 */
const flattenData = (obj: Object): Object => {
    return Object.assign(
        {},
        Object.fromEntries(
            Object.values(obj)
                .filter((x) => typeof x === "object")
                .map((x) => Object.entries(x))
                .flat(1)
        ),
        Object.fromEntries(
            Object.entries(obj).filter(([, x]) => typeof x !== "object")
        )
    );
}

/**
 * Watch for changes in selectedVisitors and emit the change
 */
watch(selectedVisitors, () => {
    emit('changeCheckItem', selectedVisitors);
})

/**
 * Generates and downloads an XLSX file of visitors users
 */
const generateXlsx = async () => {
    try {
        if (!selectedVisitors.value?.length && !props.visitors?.length) {
            throw new Error('No visitors selected');
        }
        const response = await $fetch<IExportSheetResponse>('/api/sheet/export', {
            method: "post",
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            },
            body: {
                title: "Visitors-User",
                data: selectedVisitors.value || props.visitors
            }
        });
        if (!response.data) {
            throw new Error('Error generating XLSX: No data returned');
        }
        const title = response.data?.title || 'Visitors-User';
        const link = document.createElement('a');
        link.href = response.data.url;
        link.setAttribute('download',
            `${title}-${new Date()}.xlsx`);
        document.body.appendChild(link);
        link.click();
    } catch (error: any) {
        toast.add({
            title: 'Error',
            description: error.message,
            color: 'red',
        });
    }
}

const members = computed(() => {
    const flattenedMembers = props.visitors?.map(v => flattenData(v)) || [];
    const startIndex = (page.value - 1) * perPage.value;
    const endIndex = startIndex + perPage.value;
    return flattenedMembers.slice(startIndex, endIndex);
})

/**
 * Computed properties for pagination
 */
const pageTotal = computed(() => props.visitors?.length || 0);
const pageFrom = computed(() => (page.value - 1) * perPage.value + 1);
const pageTo = computed(() => Math.min(page.value * perPage.value, pageTotal.value));
const perPageOptions = computed(() => {
    const filteredOptions = [5, 10, pageTotal.value, 20, 50, 100];

    if (isMobile.value && filteredOptions.length > 3) {
        return filteredOptions.slice(0, 3);
    }

    return filteredOptions;
});


/**
 * Computed property for responsive UI sizes
 */
const responsiveUISizes = computed<{ [key: string]: 'xs' | 'md' }>(() => ({
    button: isMobile.value ? 'xs' : 'md',
    select: isMobile.value ? 'xs' : 'md',
    pagination: isMobile.value ? 'xs' : 'md',
}))
</script>
<template>
    <UModal :fullscreen="isMobile">
        <UCard :ui="{ background: 'bg-gray-200 dark:bg-gray-800' }">
            <template #header>
                <div class="flex items-center justify-between w-full">
                    <h2 class="text-xl font-semibold dark:text-gray-200">Visitors</h2>
                    <UButton icon="i-heroicons-x-mark" :padded="false" variant="link" color="gray" @click="modal.close"
                        :size="responsiveUISizes.button" />
                </div>
            </template>
            <div class="space-y-4">
                <UTable v-model="selectedVisitors" :columns="columns" :rows="members" responsive>
                    <template #createdAt-data="{ row }">
                        <span>{{ new Date(row.createdAt).getFullYear() }}</span>
                    </template>
                    <template #avatar-data="{ row }">
                        <UAvatar size="sm">
                            <NuxtImg provider="localProvider" :src="row.avatar || '/img/profile-blank.png'"
                                loading="lazy" />
                        </UAvatar>
                    </template>
                </UTable>
                <div class="flex flex-col items-center justify-between w-full gap-4 sm:flex-row">
                    <USelect label="per Page" :options="perPageOptions" v-model="perPage"
                        :size="responsiveUISizes.select" />
                    <div>
                        <span>
                            {{ pageFrom }} - {{ pageTo }} of {{ pageTotal }}
                        </span>
                    </div>
                    <UPagination :size="responsiveUISizes.pagination" color="gray" v-model="page" :page-count="perPage"
                        :total="pageTotal" show-last show-first />
                </div>
                <UButton v-if="isCommittee" label="Export" block @click="generateXlsx"
                    :size="responsiveUISizes.button" />
            </div>
        </UCard>
    </UModal>
</template>
<style scoped></style>