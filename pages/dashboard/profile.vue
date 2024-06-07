<script setup lang='ts'>

const { user } = useAuth();
const { role, period } = useRole();
const { isDept, period: DeptPeriod } = useDept();
const { upload, remove } = useS3Object();
const file = ref<File | null>();
const avatar = ref<string | null>(null)
const onFileChange = async ($event: Event) => {
    const target = $event.target as HTMLInputElement;
    if (target && target.files) {
        if (user.value.profile.avatar) {
            remove(user.value.profile.avatar);
        }
        file.value = target.files[0];
        const uploaded = await upload(target.files[0], {
            prefix: "avatar/",
            meta: {
                nim: user.value.profile.nim
            }
        });
        user.value.profile.avatar = uploaded;
        const profile = await $api("/api/profile", {
            method: "put",
            query: {
                NIM: user.value.profile.NIM
            },
            body: { ...user.value.profile, avatar: uploaded }
        });
    }
}
useHead({
    title: "Profile | Himatika"
});
definePageMeta({
    middleware: "auth"
});
</script>
<template>
    <div class="px-4 pb-24">
        <div class="w-full p-3 shadow-md bg-slate-200 rounded-xl" v-if="user">
            <div class="max-w-sm py-1">
                <div class="relative overflow-hidden rounded-full group w-44 h-44">
                    <img :src="user?.profile.avatar || '/img/profile-blank.png'"
                        class="absolute object-cover h-full shadow-md" />
                    <div
                        class="absolute top-0 left-0 flex items-center justify-center w-full h-0 gap-2 duration-500 bg-orange-400 rounded-full opacity-0 bg-opacity-95 group-hover:h-full group-hover:opacity-100">
                        <label for="inputAvatar" class="cursor-pointer">
                            <Icon name="solar:upload-minimalistic-outline"
                                class="w-8 h-8 text-white hover:text-gray-300" />
                            <input id="inputAvatar" type="file" class="hidden" @change="onFileChange" />
                        </label>
                        <button>
                            <Icon name="solar:eye-outline" class="w-8 h-8 text-white hover:text-gray-300" />
                        </button>
                    </div>
                </div>
            </div>
            <div class="flex flex-col py-1 mb-2">
                <dd class="text-2xl font-semibold text-gray-600 dark:text-gray-200">{{ user.username }}</dd>
            </div>
            <div class="flex flex-col gap-2 md:flex-row">
                <dl class="w-full md:w-1/3">
                    <div class="flex flex-col py-1">
                        <dd class="text-xl font-semibold text-gray-400">Profile</dd>
                        <hr class="w-2/3 h-px mb-2 bg-gray-400 border-0 rounded">
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="email" id="email" v-model="user.profile.email"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.email ? true : false" />
                        <label for="email"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Email</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="tel" id="phone" v-model="user.profile.phone"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.phone ? true : false" />
                        <label for="phone"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Phone</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="number" id="NIM" v-model="user.profile.NIM"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.NIM ? true : false" />
                        <label for="NIM"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">NIM</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="class" v-model="user.profile.class"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.class ? true : false" />
                        <label for="class"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Class</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="number" id="semester" v-model="user.profile.semester"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.semester ? true : false" />
                        <label for="semester"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Semester</label>
                    </div>
                </dl>
                <dl class="w-full text-gray-900 md:w-1/3 dark:text-white">
                    <div class="flex flex-col py-1">
                        <dd class="text-xl font-semibold text-gray-400">Personal</dd>
                        <hr class="w-2/3 h-px mb-2 bg-gray-400 border-0 rounded">
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="fullName" v-model="user.profile.fullName"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.fullName ? true : false" />
                        <label for="fullName"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Full
                            Name</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="birth" v-model="user.profile.birth.place"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.birth.place ? true : false" />
                        <label for="birth"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Birth</label>
                        <div class="flex items-center gap-2 py-2 ps-2.5">
                            <VDatePicker id="birth" v-model="user.profile.birth.date" mode="date">
                                <template #default="{ togglePopover }">
                                    <button @click="togglePopover" :disabled="user.profile.birth.date ? true : false"
                                        class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700">
                                        <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                    </button>
                                </template>
                            </VDatePicker>
                            <dd class="font-semibold text-gray-400 text-md">{{
                                new Date(user.profile.birth.date).toLocaleDateString('id-ID', {
                                    year: 'numeric', month: 'long', day:
                                        'numeric'
                                }) }}
                            </dd>
                        </div>
                    </div>
                    <div class="relative py-1 mb-2">
                        <select id="sex"
                            class="block px-2.5 pt-3 pb-1.5 w-fit text-sm font-semibold text-gray-500 bg-transparent border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            v-model="user.profile.sex" :disabled="user.profile.sex ? true : false">
                            <option value="Laki-Laki">Laki-Laki</option>
                            <option value="Perempuan">Perempuan</option>
                        </select>
                        <label for="sex"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Sex</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <select id="religion"
                            class="block px-2.5 pt-3 pb-1.5 w-fit text-sm font-semibold text-gray-500 bg-transparent border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            v-model="user.profile.religion" :disabled="user.profile.religion ? true : false">
                            <option value="Islam">Islam</option>
                            <option value="Kristen">Kristen</option>
                            <option value="Buddha">Buddha</option>
                            <option value="Hindu">Hindu</option>
                            <option value="Konghucu">Konghucu</option>
                            <option value="Katolik">Katolik</option>
                        </select>
                        <label for="religion"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Religion</label>
                    </div>
                    <div class="relative py-1 mb-2">
                        <input type="text" id="citizen" v-model="user.profile.citizen"
                            class="block px-2.5 pb-1.5 pt-3 w-fit text-sm font-semibold text-gray-500 bg-transparent  border-0 border-b border-gray-400 appearance-none focus:outline-none focus:ring-0 peer"
                            :disabled="user.profile.citizen ? true : false" />
                        <label for="citizen"
                            class="absolute text-sm text-gray-400 bg-slate-200 duration-300 transform -translate-y-3 scale-75 top-1 z-10 origin-[0] px-2 peer-focus:px-2 peer-focus:text-blue-600 peer-focus:dark:text-blue-500 peer-placeholder-shown:scale-100 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:top-1/2 peer-focus:top-1 peer-focus:scale-75 peer-focus:-translate-y-3 start-2">Citizen</label>
                    </div>
                </dl>
                <dl class="w-full text-gray-900 md:w-1/3 dark:text-white" v-if="role || isDept">
                    <div class="w-full" v-if="role">
                        <div class="flex flex-col py-1">
                            <dd class="text-xl font-semibold text-gray-400">Administrator</dd>
                            <hr class="w-2/3 h-px mb-2 bg-gray-400 border-0 rounded">
                        </div>
                        <div class="relative py-1 mb-2">
                            <input type="text" id="division" v-model="role" disabled
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
                                                class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700"
                                                disabled>
                                                <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                            </button>
                                        </template>
                                    </VDatePicker>
                                    <dd class="font-semibold text-gray-400 text-md">{{
                                        new Date(period?.start!).toLocaleDateString('id-ID', {
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
                                                class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700"
                                                disabled>
                                                <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                            </button>
                                        </template>
                                    </VDatePicker>
                                    <dd class="font-semibold text-gray-400 text-md">{{
                                        new Date(period?.end!).toLocaleDateString('id-ID', {
                                            year: 'numeric', month: 'long', day:
                                                'numeric'
                                        }) }}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="w-full" v-if="isDept">
                        <div class="flex flex-col py-1">
                            <dd class="text-xl font-semibold text-gray-400">Departement</dd>
                            <hr class="w-2/3 h-px mb-2 bg-gray-400 border-0 rounded">
                        </div>
                        <div class="relative py-1 mb-2">
                            <input type="text" id="division" v-model="isDept" disabled
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
                                                class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700"
                                                disabled>
                                                <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                            </button>
                                        </template>
                                    </VDatePicker>
                                    <dd class="font-semibold text-gray-400 text-md">{{
                                        new Date(DeptPeriod?.start!).toLocaleDateString('id-ID', {
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
                                                class="text-sm font-medium text-gray-500 bg-transparent hover:text-blue-700"
                                                disabled>
                                                <Icon name="solar:calendar-outline" class="w-5 h-5" />
                                            </button>
                                        </template>
                                    </VDatePicker>
                                    <dd class="font-semibold text-gray-400 text-md">{{
                                        new Date(DeptPeriod?.end!).toLocaleDateString('id-ID', {
                                            year: 'numeric', month: 'long', day:
                                                'numeric'
                                        }) }}
                                    </dd>
                                </div>
                            </div>
                        </div>
                    </div>
                </dl>
            </div>
        </div>
    </div>
</template>
<style scoped></style>