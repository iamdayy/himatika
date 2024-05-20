<script setup lang='ts'>
import { initCollapses, initTabs } from 'flowbite';
import type { IAdministrator, IDepartement, IProfile, IPeriod } from '~/types';
const { data: administrators } = await useAsyncData(() => $fetch<IAdministrator[]>("/api/administrator"));
const { data: departementsData } = await useAsyncData(() => $fetch<IDepartement[]>("/api/departement"));
const administrator = ref<IAdministrator | undefined>();
const departements = ref<IDepartement[] | undefined>();
const departementPeriod = ref<IPeriod | undefined>()
onMounted(async () => {
  initTabs();
  initCollapses();
  if (administrators.value) {
    administrator.value = administrators.value?.find((admin) => new Date(admin.period.start).getFullYear() >= new Date(Date.now()).getFullYear() && new Date(admin.period.end).getFullYear() <= new Date(Date.now()).getFullYear());
  }
  if (departementsData.value) {
    departementsData.value?.filter((departement) => new Date(departement.period.start).getFullYear() >= new Date(Date.now()).getFullYear() && new Date(departement.period.end).getFullYear() <= new Date(Date.now()).getFullYear())
  }
  if (departements.value) {
    departementPeriod.value = departements?.value![0].period;
  }
})
</script>
<template>
  <CoreCard title="About Us" data-accordion="open">
    <div class="flex flex-col-reverse items-center gap-2 px-3 py-8 lg:flex-row">
      <div class="lg:w-1/2 dark:text-white md:px-2" data-aos="fade-right" data-aos-easing="ease-in-out"
        data-aos-duration="1000" data-aos-anchor=".about">
        <p>Himpunan Mahasiswa Informatika atau yang sering disebut HIMATIKA merupakan suatu organisasi yang menghimpun
          Mahasiswa Informatika untuk mengembangkan, dan mempraktekkan ilmu nya dalam bidang komputer.</p> <br />
        <p>
          HIMATIKA memiliki tujuan untuk mewujudkan mahasiswa Program Studi Informatika yang beriman dan bertakwa,
          mandiri dan jujur dalam bersikap, berwawasan global yang memiliki kompetensi strategis bagi terbentuknya
          mahasiswa yang berintelektualitas tinggi serta bertanggungjawab, mampu bekerja sama dan mengembangkan diri
          baik secara keilmuan maupun sosial.

        </p>
      </div>
      <div class="overflow-hidden shadow-md lg:w-1/2 rounded-tr-2xl rounded-bl-3xl" data-aos="fade-left"
        data-aos-easing="ease-in-out" data-aos-duration="800" data-aos-anchor=".about">
        <NuxtImg src="/img/fobar.jpg" loading="lazy"
          class="transition duration-500 ease-out cursor-pointer hover:scale-125" />
      </div>
    </div>
    <div class="flex flex-col justify-center px-3 py-8">
      <div id="about-expand" class="hidden" aria-labelledby="about">
        <div class="flex flex-col items-center justify-center w-full">
          <div>
            <ul class="flex flex-wrap text-sm font-medium text-center text-gray-500 dark:text-gray-400" id="about-tab"
              data-tabs-toggle="#tab-content" role="tablist">
              <li class="me-2" role="presentation">
                <button class="inline-block px-4 py-3 rounded-lg" id="visi-tab" data-tabs-target="#visi" type="button"
                  role="tab" aria-controls="visi" aria-selected="false">Visi</button>
              </li>
              <li class="me-2" role="presentation">
                <button class="inline-block px-4 py-3 rounded-lg" id="misi-tab" data-tabs-target="#misi" type="button"
                  role="tab" aria-controls="misi" aria-selected="false">Misi</button>
              </li>
              <li class="me-2" role="presentation">
                <button class="inline-block px-4 py-3 rounded-lg" id="kepengurusan-tab" data-tabs-target="#kepengurusan"
                  type="button" role="tab" aria-controls="kepengurusan" aria-selected="false">Kepengurusan</button>
              </li>
              <li class="me-2" role="presentation">
                <button class="inline-block px-4 py-3 rounded-lg" id="departemen-tab" data-tabs-target="#departemen"
                  type="button" role="tab" aria-controls="departemen" aria-selected="false">Departemen</button>
              </li>
            </ul>
          </div>
          <div id="tab-content" class="w-full">
            <div class="hidden max-w-4xl p-4 mx-auto rounded-lg bg-gray-50 dark:bg-gray-800" id="visi" role="tabpanel"
              aria-labelledby="visi-tab">
              <h1 class="mb-4 text-3xl font-bold text-center">VISI</h1>
              <p class="text-2xl text-center text-gray-800 dark:text-gray-400">Dengan Semangat kekeluargaan, HIMATIKA menjadi
                poros aktivitas kemahasiswaan Mahasiswa Informatika yang memberikan Kemanfaatan bagi mahasiswa
                Teknologi Komputer</p>
            </div>
            <div class="hidden max-w-4xl p-4 mx-auto rounded-lg bg-gray-50 dark:bg-gray-800" id="misi" role="tabpanel"
              aria-labelledby="misi-tab">
              <h1 class="mb-4 text-3xl font-bold text-center">MISI</h1>
              <ul class="flex flex-col justify-center space-y-1 text-2xl text-center text-gray-800 dark:text-gray-400">
                <li>Mewujudkan HIMATIKA yang bersahabat dan profesional.</li>
                <li>Menjadikan sebuah wadah aspirasi mahasiswa Informatika.</li>
                <li>Meningkatkan kualitas dibidang pendidikan,keilmuan teknologi dan keorganisasian.</li>
                <li>Menjalin hubungan kerjasama yang baik dengan pihak internal maupun eksternal HIMATIKA.</li>
                <li>Mengadakan kegiatan-kegiatan yang dapat meningkatkan pengetahuan keilmuan dan pengalaman mahasiswa
                  Informatika.</li>
              </ul>
            </div>
            <div class="hidden w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="kepengurusan" role="tabpanel" v-if="administrator"
              aria-labelledby="kepengurusan-tab">
              <h1 class="mb-2 text-3xl font-bold text-center">Kepengurusan</h1>
              <h1 class="mb-4 text-xl font-bold text-center text-gray-400"><span>{{ new Date(administrator?.period.start!).getFullYear() }}</span> - <span>{{ new Date(administrator?.period.end!).getFullYear() }}</span> </h1>
              <div class="grid max-w-4xl grid-cols-2 py-8 mx-auto justify-items-center" v-if="administrator">
                <CoreProfileCard v-for="member, i in administrator.AdministratorMembers" class="mb-8" :profile="member.profile as IProfile" :subtitle="member.role" />
              </div>
            </div>
            <div class="hidden w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="departemen" role="tabpanel" v-if="departements"
              aria-labelledby="departemen-tab">
              <h1 class="mb-2 text-3xl font-bold text-center">Departemen</h1>
              <h1 class="mb-4 text-xl font-bold text-center text-gray-400"><span>{{ new Date(departementPeriod?.start!).getFullYear() }}</span> - <span>{{ new Date(departementPeriod?.end!).getFullYear() }}</span> </h1>
              <div class="grid max-w-4xl grid-cols-2 py-8 mx-auto justify-items-center" v-if="departements">
                <CoreProfileCard v-for="member, i in departements" class="mb-8" :profile="member.profile as IProfile" :subtitle="member.departement" />
              </div>
            </div>
          </div>
        </div>
      </div>
      <button class="flex items-center justify-center gap-3 p-5 mt-4 text-lg font-medium text-gray-400 -rotate-180 bg-transparent"
        data-accordion-target="#about-expand" active-class="rotate-180" aria-expanded aria-controls="about expand">
        <Icon name="solar:alt-arrow-down-bold" data-accordion-icon class="w-12 h-12 transition-all duration-700 ease-out rotate-180" aria-hidden="true"></Icon>
      </button>
    </div>
  </CoreCard>
</template>
<style scoped></style>