<template>
    <div class="max-w-4xl p-4 mx-auto space-y-6">
        <!-- <UCard class="p-6 text-white bg-cyan-400">
            <div class="grid grid-cols-1 gap-6 md:grid-cols-3">
                <div v-for="(feature, index) in features" :key="index"
                    class="flex flex-col items-center space-y-2 text-center">
                    <UIcon :name="feature.icon" class="w-12 h-12" />
                    <h3 class="text-xl font-bold">{{ feature.title }}</h3>
                    <p class="text-sm">{{ feature.description }}</p>
                </div>
            </div>
        </UCard> -->

        <UCard class="p-6">
            <div class="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div v-for="(stat, index) in stats" :key="index" class="space-y-1 text-center">
                    <p class="text-xs font-medium">{{ stat.title }}</p>
                    <p class="text-3xl font-bold">{{ stat.value }}</p>
                </div>
            </div>
        </UCard>
    </div>
</template>

<script setup lang="ts">

const features = [
    {
        icon: 'i-heroicons-pie-chart',
        title: 'Bisa Pajang Karya',
        description: 'Kamu (Mahasiswa TP UNY) bisa berkontribusi dengan memajang karya portfolio terbaik kamu agar karyamu berupa desain atau video bisa dilihat oleh orang yang mengakses Website HIMA TP UNY'
    },
    {
        icon: 'i-heroicons-file-text',
        title: 'Bisa Nulis Artikel',
        description: 'Kamu (Mahasiswa TP UNY) bisa berkontribusi dengan menulis atau mengirimkan artikel bisa dilihat oleh orang yang mengakses Website HIMA TP UNY'
    },
    {
        icon: 'i-heroicons-users',
        title: 'Bisa Masuk Komunitas dan Belajar Bareng',
        description: 'Kamu (Mahasiswa TP UNY) bisa ikut komunitas edukatif yang ada di HIMA TP UNY, di komunitas kamu bisa belajar bareng sesuai dengan passion dan minat kamu'
    }
]

const stats = [
    { title: 'FOLLOWERS', value: '2000+' },
    { title: 'PROJECTS DONE', value: '29+' },
    { title: 'PENGURUS', value: '49+' },
    { title: 'COMMUNITY', value: '10+' }
]
</script>
