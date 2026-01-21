<script setup lang="ts">
import type { TableColumn } from "#ui/types";
import type { IAuditLog, IMember } from "~~/types";
definePageMeta({
    layout: 'dashboard',
    middleware: 'sidebase-auth'
});

useHead({
    title: "Audit Logs"
});
const { $api } = useNuxtApp();

const columns: TableColumn<IAuditLog>[] = [
    {
        accessorKey: 'createdAt',
        header: 'Date',
    },
    {
        accessorKey: 'action',
        header: 'Action',
    },
    {
        accessorKey: 'target',
        header: 'Target',
    },
    {
        accessorKey: 'user',
        header: 'User',
        cell(props) {
            return h('div', undefined, [
                h('span', undefined, (props.row.original.user as IMember)?.fullName || '-'),
                h('span', undefined, (props.row.original.user as IMember)?.email || '-')
            ])
        }
    },
    {
        accessorKey: 'ip',
        header: 'IP Address',
    },
    {
        accessorKey: 'details',
        header: 'Details',
        cell(props) {
            return h('pre', undefined, JSON.stringify(props.row.original.details, null, 2));
        },
    }
];

const page = ref(1);
const pageCount = ref(20);

// Use useAsyncData to fetch audit logs with pagination
const { data, pending, refresh } = useAsyncData(() => $api('/api/audit', {
    query: {
        page: page,
        limit: pageCount
    },
    watch: [page]
}));

const formatDate = (date: string) => {
    return new Date(date).toLocaleString('id-ID');
};
</script>

<template>
    <UContainer class="py-8">
        <div class="flex justify-between items-center mb-6">
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Audit Logs</h1>
            <UButton icon="i-heroicons-arrow-path" variant="ghost" @click="refresh()" :loading="pending" />
        </div>

        <UCard>
            <div v-if="pending && !data" class="py-8 flex justify-center">
                <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
            </div>
            <div v-else>
                <UTable :data="data?.data || []" :columns="columns" :loading="pending">
                    <template #createdAt-data="{ row }">
                        <span class="text-sm">{{ formatDate(row.original.createdAt) }}</span>
                    </template>
                    <template #user-data="{ row }">
                        <div v-if="row.original.user && typeof row.original.user === 'object'" class="flex flex-col">
                            <span class="font-medium text-sm">{{ row.original.user.fullName }}</span>
                            <span class="text-xs text-gray-500">{{ row.original.user.email }}</span>
                        </div>
                        <div v-else>
                            <span class="text-sm italic text-gray-400">System/Guest</span>
                        </div>
                    </template>
                    <template #details-data="{ row }">
                        <UPopover v-if="row.original.details && Object.keys(row.original.details || {}).length > 0">
                            <UButton color="neutral" variant="ghost" icon="i-heroicons-eye" size="xs" label="View" />
                            <div class="p-4 max-w-xs overflow-auto text-xs">
                                <pre>{{ JSON.stringify(row.original.details, null, 2) }}</pre>
                            </div>
                        </UPopover>
                        <span v-else class="text-gray-400">-</span>
                    </template>
                    <template #action-data="{ row }">
                        <UBadge
                            :color="row.original.action === 'LOGIN' ? 'secondary' : row.original.action === 'LOGOUT' ? 'neutral' : row.original.action === 'CREATE' ? 'success' : 'primary'"
                            variant="subtle">
                            {{ row.original.action }}
                        </UBadge>
                    </template>
                </UTable>

                <div class="flex justify-end px-3 py-3.5 border-t border-gray-200 dark:border-gray-700"
                    v-if="data && data.meta">
                    <UPagination v-model="page" :page-count="data.meta.limit" :total="data.meta.total" />
                </div>
            </div>
        </UCard>
    </UContainer>
</template>
