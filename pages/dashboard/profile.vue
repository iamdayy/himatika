<script setup lang='ts'>
import type { IUser } from "~/types";

const me = useState<IUser>('me');

useHead({
    title: "Profile | Himatika"
});
definePageMeta({
  middleware: "auth"
});
</script>
<template>
    <div class="px-4 pb-24">
        <div class="w-full p-3 shadow-md bg-slate-200 rounded-xl">
            <div class="max-w-sm py-1">
                <NuxtImg :src="me.profile.avatar" sizes="350px" class="rounded-md" />
            </div>
            <div class="flex flex-col py-1 mb-2">
                <dd class="text-2xl font-semibold text-gray-600">{{ me.username }}</dd>
            </div>
            <div class="flex flex-col gap-2 md:flex-row">
                <dl class="w-full md:w-1/3">
                    <div class="flex flex-col py-1">
                        <dd class="text-xl font-semibold text-gray-400">Profile</dd>
                        <hr class="w-2/3 h-px mb-2 bg-gray-400 border-0 rounded">
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="email" id="email" v-model="me.profile.email"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.email ? true : false" />
                        <label for="email"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Email</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="tel" id="phone" v-model="me.profile.phone"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.phone ? true : false" />
                        <label for="phone"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Phone</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="number" id="NIM" v-model="me.profile.NIM"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.NIM ? true : false" />
                        <label for="NIM"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">NIM</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="class" v-model="me.profile.class"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.class ? true : false" />
                        <label for="class"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Class</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="number" id="semester" v-model="me.profile.semester"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.semester ? true : false" />
                        <label for="semester"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Semester</label>
                    </div>
                </dl>
                <dl class="w-full text-gray-900 divide-y divide-gray-200 md:w-1/3 dark:text-white dark:divide-gray-700">
                    <div class="flex flex-col py-1">
                        <dd class="text-xl font-semibold text-gray-400">Personal</dd>
                        <hr class="w-2/3 h-px mb-2 bg-gray-400 border-0 rounded">
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="fullName" v-model="me.profile.fullName"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.fullName ? true : false" />
                        <label for="fullName"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Full
                            Name</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="birth" v-model="me.profile.birth.place"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.birth.place ? true : false" />
                        <label for="birth"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Birth</label>
                        <div class="flex items-center gap-2 py-2 ps-2.5">
                            <VDatePicker id="birth" v-model="me.profile.birth.date" mode="date">
                                <template #default="{ togglePopover }">
                                    <button @click="togglePopover" :disabled="me.profile.birth.date ? true : false"
                                        class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700">
                                        <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                    </button>
                                </template>
                            </VDatePicker>
                            <dd class="font-semibold text-gray-400 text-md">{{
                                me.profile.birth.date.toLocaleDateString('id-ID', {
                                    year: 'numeric', month: 'long', day:
                                        'numeric'
                                }) }}
                            </dd>
                        </div>
                    </div>
                    <div class="relative py-1 mb-2">
                        <select id="sex"
                            class="block px-2.5 pt-3 pb-1.5 w-fit text-sm font-semibold text-gray-500 bg-transparent border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            v-model="me.profile.sex" :disabled="me.profile.sex ? true : false">
                            <option value="Laki-Laki">Laki-Laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                        <label for="sex"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Sex</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <select id="religion"
                            class="block px-2.5 pt-3 pb-1.5 w-fit text-sm font-semibold text-gray-500 bg-transparent border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            v-model="me.profile.religion" :disabled="me.profile.religion ? true : false">
                            <option value="Moslem">Moslem</option>
                            <option value="Christ">Christ</option>
                            <option value="Budhist">Budhist</option>
                        </select>
                        <label for="religion"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Religion</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="citizen" v-model="me.profile.citizen"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="me.profile.citizen ? true : false" />
                        <label for="citizen"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Citizen</label>
                    </div>
                </dl>
                <dl class="w-full text-gray-900 divide-y divide-gray-200 md:w-1/3 dark:text-white dark:divide-gray-700">
                    <div class="flex flex-col py-1">
                        <dd class="text-xl font-semibold text-gray-400">Administrator</dd>
                        <hr class="w-2/3 h-px mb-2 bg-gray-400 border-0 rounded">
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="division"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer" />
                        <label for="division"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Division</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <label for="period"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Period</label>
                        <div class="flex flex-row items-center py-2 ps-2.5" id="period">
                            <div class="flex gap-2">
                                <VDatePicker id="birth" mode="date">
                                    <template #default="{ togglePopover }">
                                        <button @click="togglePopover"
                                            class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700" disabled>
                                            <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                        </button>
                                    </template>
                                </VDatePicker>
                                <dd class="font-semibold text-gray-400 text-md">{{
                                    new Date().toLocaleDateString('id-ID', {
                                        year: 'numeric', month: 'long', day:
                                            'numeric'
                                    }) }}
                                </dd>
                            </div>
                            <hr class="w-2 h-1 mx-3 bg-gray-500 border-0 rounded">
                            <div class="flex gap-2">
                                <VDatePicker id="birth" mode="date">
                                    <template #default="{ togglePopover }">
                                        <button @click="togglePopover"
                                            class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700" disabled>
                                            <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                        </button>
                                    </template>
                                </VDatePicker>
                                <dd class="font-semibold text-gray-400 text-md">{{
                                    new Date().toLocaleDateString('id-ID', {
                                        year: 'numeric', month: 'long', day:
                                            'numeric'
                                    }) }}
                                </dd>
                            </div>
                        </div>
                    </div>
                </dl>
            </div>
        </div>
</div></template>
<style scoped></style>