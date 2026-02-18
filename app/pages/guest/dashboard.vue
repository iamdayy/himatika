<template>
    <div>
        <UBreadcrumb :items="[{ label: 'Dashboard', icon: 'i-heroicons-home' }]" class="ms-4 mb-6" />

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <!-- Profile Column -->
            <div class="lg:col-span-1 space-y-6">
                <UCard>
                    <template #header>
                        <h2 class="text-xl font-semibold dark:text-gray-200">Profile</h2>
                    </template>
                    <div class="flex flex-col items-center text-center">
                        <NuxtImg :src="guest?.avatar || '/img/profile-blank.png'"
                            class="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-100 dark:border-gray-800"
                            provider="localProvider" />
                        <h3 class="text-xl font-bold">{{ guest?.fullName }}</h3>
                        <p class="text-gray-500 dark:text-gray-400 text-sm">{{ guest?.email }}</p>

                        <div class="mt-6 w-full space-y-3 text-left">
                            <div
                                class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                <span class="text-gray-500 text-sm">Instance</span>
                                <span class="font-medium">{{ guest?.instance }}</span>
                            </div>
                            <div
                                class="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-800">
                                <span class="text-gray-500 text-sm">Phone</span>
                                <span class="font-medium">{{ guest?.phone }}</span>
                            </div>
                        </div>

                        <div class="mt-8 w-full flex gap-2">
                            <UButton block color="neutral" variant="solid" @click="handleLogout">
                                Logout
                            </UButton>
                        </div>
                    </div>
                </UCard>
            </div>

            <!-- Main Content Column -->
            <div class="lg:col-span-3 space-y-6">
                <!-- Welcome Card -->
                <UCard class="bg-linear-to-r from-primary-500 to-primary-600 text-white">
                    <div class="flex items-center justify-between">
                        <div>
                            <h2 class="text-2xl font-bold mb-2">Welcome back, {{ guest?.fullName?.split(' ')[0] }}!</h2>
                            <p class="text-primary-100">Ready to participate in our agendas?</p>
                        </div>
                        <UIcon name="i-heroicons-sparkles" class="text-6xl text-primary-300 opacity-50" />
                    </div>
                </UCard>

                <!-- Registered Agendas -->
                <UCard>
                    <template #header>
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold dark:text-gray-200">My Agendas</h2>
                            <UButton to="/agendas" variant="ghost" color="primary">Browse All Agendas</UButton>
                        </div>
                    </template>

                    <div v-if="registeredAgendas.length > 0" class="space-y-4">
                        <div v-for="agenda in registeredAgendas" :key="(agenda._id as string)"
                            class="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer"
                            @click="navigateTo(`/agendas/${agenda._id}`)">
                            <div class="flex items-center gap-4">
                                <div class="bg-primary-100 dark:bg-primary-900/50 p-3 rounded-lg">
                                    <UIcon name="i-heroicons-calendar" class="w-6 h-6 text-primary-500" />
                                </div>
                                <div>
                                    <h4 class="font-semibold">{{ agenda.title }}</h4>
                                    <p class="text-sm text-gray-500">
                                        {{ new Date(agenda.date.start).toLocaleDateString() }} • {{ agenda.at }}
                                    </p>
                                </div>
                            </div>
                            <UBadge color="success" variant="subtle">Registered</UBadge>
                        </div>
                    </div>
                    <div v-else class="text-center py-12 text-gray-400">
                        <UIcon name="i-heroicons-calendar" class="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>You haven't registered for any agendas yet.</p>
                        <UButton to="/agendas" class="mt-4" variant="outline">Find Agendas</UButton>
                    </div>
                </UCard>
            </div>
        </div>

        <!-- Scan Button -->
        <div class="fixed z-90 bottom-6 left-4">
            <UTooltip text="Scan to Presence!" placement="left"
                :popper="{ strategy: 'absolute', scroll: true, arrow: true }">
                <UButton
                    class="flex items-center justify-center w-20 h-20 text-4xl text-white duration-300 bg-blue-600 rounded-full drop-shadow-lg hover:bg-blue-700 hover:drop-shadow-2xl hover:animate-bounce"
                    to="/agendas/scan" id="maido">
                    <UIcon name="i-heroicons-qr-code" class="w-16 h-16 text-white" />
                </UButton>
            </UTooltip>
        </div>
    </div>
</template>

<script setup lang="ts">
import type { IGuest } from '~~/types';
import type { IAgendaResponse } from '~~/types/IResponse';

definePageMeta({
    layout: "dashboard",
    middleware: ["sidebase-auth"],
});

useHead({
    title: 'Guest Dashboard'
});

const { data: session, signOut } = useAuth();
// Helper to type-guard/cast session data
const guest = computed(() => (session.value as any)?.guest as IGuest | undefined);

const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
};

// Fetch Agendas to show registered ones
const { data: agendas } = await useAsyncData('guest-agendas', () => $fetch<IAgendaResponse>('/api/agenda'), {
    lazy: true,
    transform: (data) => {
        if (data.data) {
            return data.data.agendas;
        }
        return [];
    }
});

const registeredAgendas = computed(() => {
    if (!agendas.value) return [];
    if (!guest.value) return [];

    return agendas.value.filter(agenda => {
        // Check if guest is in participants
        // Need to handle populated or unpopulated cases if possible, but mainly relying on the fact that we might just check IDs if structure allows
        // Step 1004 showed useAgendas logic for `isRegistered`.
        // Let's manually check participants array using the guest ID/Email

        return agenda.participants?.some(p => {
            const pGuest = p.guest as any; // Could be object or ID
            const pGuestId = pGuest?._id || pGuest;
            const pGuestEmail = pGuest?.email;

            return (pGuestId && pGuestId.toString() === guest.value?._id?.toString()) ||
                (pGuestEmail && pGuestEmail === guest.value?.email);
        });
    });
});

</script>
