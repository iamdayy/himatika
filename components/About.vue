<script setup lang='ts'>
import { initCollapses, initTabs } from 'flowbite';
import type { IAdministrator, IProfile } from '~/types';
const { data: administrators, refresh } = await useAsyncData(() => $fetch<IAdministrator[]>("/api/administrator"));
const administrator = ref<IAdministrator | undefined>(administrators.value?.find((admin) => new Date(admin.period.start).getFullYear() >= new Date(Date.now()).getFullYear() && new Date(admin.period.end).getFullYear() <= new Date(Date.now()).getFullYear()));
onMounted(() => {
  initTabs();
  initCollapses()
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
            <div class="hidden max-w-2xl p-4 mx-auto rounded-lg bg-gray-50 dark:bg-gray-800" id="visi" role="tabpanel"
              aria-labelledby="visi-tab">
              <p class="text-center text-gray-500 dark:text-gray-400">Dengan Semangat kekeluargaan, HIMATIKA menjadi
                poros aktivitas kemahasiswaan Mahasiswa Informatika yang memberikan Kemanfaatan bagi mahasiswa
                Teknologi Komputer</p>
            </div>
            <div class="hidden max-w-2xl p-4 mx-auto rounded-lg bg-gray-50 dark:bg-gray-800" id="misi" role="tabpanel"
              aria-labelledby="misi-tab">
              <ul class="max-w-md space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                <li>Mewujudkan HIMATIKA yang bersahabat dan profesional.</li>
                <li>Menjadikan sebuah wadah aspirasi mahasiswa Informatika.</li>
                <li>Meningkatkan kualitas dibidang pendidikan,keilmuan teknologi dan keorganisasian.</li>
                <li>Menjalin hubungan kerjasama yang baik dengan pihak internal maupun eksternal HIMATIKA.</li>
                <li>Mengadakan kegiatan-kegiatan yang dapat meningkatkan pengetahuan keilmuan dan pengalaman mahasiswa
                  Informatika.</li>
              </ul>
            </div>
            <div class="hidden w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="kepengurusan" role="tabpanel"
              aria-labelledby="kepengurusan-tab">
              <div class="grid grid-cols-2 py-8 space-y-16 justify-items-center" v-if="administrator">
                <CoreProfileCard :profile="administrator?.chairman as IProfile" subtitle="Chairman" />
                <CoreProfileCard :profile="administrator?.viceChairman as IProfile" subtitle="Vice Chairman" />
                <CoreProfileCard :profile="administrator?.secretary as IProfile" subtitle="Secretary" />
                <CoreProfileCard :profile="administrator?.viceSecretary as IProfile" subtitle="Vice Secretary" />
                <CoreProfileCard :profile="administrator?.treasurer as IProfile" subtitle="Treasurer" />
                <CoreProfileCard :profile="administrator?.viceTreasurer as IProfile" subtitle="Vice Treasurer" />
              </div>
            </div>
            <div class="hidden w-full p-4 rounded-lg bg-gray-50 dark:bg-gray-800" id="departemen" role="tabpanel"
              aria-labelledby="departemen-tab">
              <!-- <div class="grid grid-cols-2 py-8 space-y-16 justify-items-center" v-if="administrator">
                <CoreProfileCard :profile="administrator?.chairman as IProfile" subtitle="Chairman" />
                <CoreProfileCard :profile="administrator?.viceChairman as IProfile" subtitle="Vice Chairman" />
                <CoreProfileCard :profile="administrator?.secretary as IProfile" subtitle="Secretary" />
                <CoreProfileCard :profile="administrator?.viceSecretary as IProfile" subtitle="Vice Secretary" />
                <CoreProfileCard :profile="administrator?.treasurer as IProfile" subtitle="Treasurer" />
                <CoreProfileCard :profile="administrator?.viceTreasurer as IProfile" subtitle="Vice Treasurer" />
              </div> -->
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