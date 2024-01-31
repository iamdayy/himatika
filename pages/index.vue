<template>
  <HomeLayout>
    <div class="relative isolate mt-10 mx-6 lg:px-8 mb-8">
      <div class="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
        <div
          class="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
          style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
      <div class="mx-auto max-w-2xl py-12 sm:py-16 lg:py-36">
        <div class="text-center">
          <h1 class="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">Himpunan Mahasiswa Informatika</h1>
          <p class="mt-6 text-lg leading-8 text-gray-600">Himpunan Mahasiswa Informatika atau yang sering disebut HIMATIKA
            merupakan suatu organisasi yang menghimpun Mahasiswa Informatika untuk mengembangkan, dan mempraktekkan ilmu
            nya dalam bidang komputer.</p>
          <div class="mt-10 flex items-center justify-center gap-x-6">
            <a href="#about" class="text-sm font-semibold leading-6 text-gray-900">Learn more <span
                aria-hidden="true">→</span></a>
          </div>
        </div>
      </div>
      <div
        class="absolute inset-x-0 top-[calc(100%-24rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        aria-hidden="true">
        <div
          class="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
          style="clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" />
      </div>
    </div>
    <section class="min-h-screen py-8" id="about" data-accordion="collapse">
      <CoreCard title="Himatika">
        <div class="flex py-4 items-center">
          <div class="w-1/2 dark:text-white px-2">
            <p>Himpunan Mahasiswa Informatika atau yang sering disebut HIMATIKA merupakan suatu organisasi yang menghimpun
              Mahasiswa Informatika untuk mengembangkan, dan mempraktekkan ilmu nya dalam bidang komputer.</p> <br />
            <p>
              HIMATIKA memiliki tujuan untuk mewujudkan mahasiswa Program Studi Informatika yang beriman dan bertakwa,
              mandiri dan jujur dalam bersikap, berwawasan global yang memiliki kompetensi strategis bagi terbentuknya
              mahasiswa yang berintelektualitas tinggi serta bertanggungjawab, mampu bekerja sama dan mengembangkan diri
              baik secara keilmuan maupun sosial.

            </p>
          </div>
          <div class="w-1/2">
            <NuxtImg src="/img/fobar.jpg" loading="lazy" class="rounded-tr-2xl rounded-bl-3xl shadow-md" />
          </div>
        </div>
        <div class="flex flex-col justify-center">
          <div id="about-expand" class="hidden" aria-labelledby="about">
            <div class="w-full flex flex-col justify-center items-center">
              <div>
                <ul class="flex flex-wrap text-sm font-medium text-center text-gray-500 dark:text-gray-400" id="about-tab"
                  data-tabs-toggle="#tab-content" role="tablist">
                  <li class="me-2" role="presentation">
                    <button class="inline-block px-4 py-3 rounded-lg" id="visi-tab" data-tabs-target="#visi" type="button"
                      role="tab" aria-controls="misi" aria-selected="false">Visi</button>
                  </li>
                  <li class="me-2" role="presentation">
                    <button class="inline-block px-4 py-3 rounded-lg" id="misi-tab" data-tabs-target="#misi" type="button"
                      role="tab" aria-controls="misi" aria-selected="false">Misi</button>
                  </li>
                </ul>
              </div>
              <div id="tab-content">
                <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800 max-w-2xl" id="visi" role="tabpanel"
                  aria-labelledby="visi-tab">
                  <p class="text-gray-500 dark:text-gray-400 text-center">Dengan Semangat kekeluargaan, HIMATIKA menjadi
                    poros aktivitas kemahasiswaan Mahasiswa Informatika yang memberikan Kemanfaatan bagi mahasiswa
                    Teknologi Komputer</p>
                </div>
                <div class="hidden p-4 rounded-lg bg-gray-50 dark:bg-gray-800 max-w-2xl" id="misi" role="tabpanel"
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
              </div>
            </div>
          </div>
          <button class="mt-4 flex items-center justify-center gap-3 p-5 text-lg font-medium text-gray-400 bg-transparent"
            data-accordion-target="#about-expand" aria-controls="about expand">
            <span>
              Expand
            </span>
            <svg data-accordion-icon class="w-3 h-3 rotate-180 shrink-0" aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 5 5 1 1 5" />
            </svg>
          </button>
        </div>
      </CoreCard>
    </section>
  </HomeLayout>
</template>
<script setup lang='ts'>
import Fobar from "~/assets/image/fobar.jpg";
definePageMeta({
  layout: false
});
useHead({
  title: "Himatika"
});
</script>
<style scoped></style>