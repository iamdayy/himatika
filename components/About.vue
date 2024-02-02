<script setup lang='ts'></script>
<template>
    <CoreCard title="About Us" data-accordion="collapse">
        <div class="flex flex-col-reverse md:flex-row py-8 items-center px-3 gap-2">
          <div class="md:w-1/2 dark:text-white md:px-2">
            <p>Himpunan Mahasiswa Informatika atau yang sering disebut HIMATIKA merupakan suatu organisasi yang menghimpun
              Mahasiswa Informatika untuk mengembangkan, dan mempraktekkan ilmu nya dalam bidang komputer.</p> <br />
            <p>
              HIMATIKA memiliki tujuan untuk mewujudkan mahasiswa Program Studi Informatika yang beriman dan bertakwa,
              mandiri dan jujur dalam bersikap, berwawasan global yang memiliki kompetensi strategis bagi terbentuknya
              mahasiswa yang berintelektualitas tinggi serta bertanggungjawab, mampu bekerja sama dan mengembangkan diri
              baik secara keilmuan maupun sosial.

            </p>
          </div>
          <div class="md:w-1/2">
            <NuxtImg src="/img/fobar.jpg" loading="lazy" class="rounded-tr-2xl rounded-bl-3xl shadow-md" />
          </div>
        </div>
        <div class="flex flex-col justify-center py-8 px-3">
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
            <svg data-accordion-icon class="w-3 h-3 transition-all ease-out duration-700 shrink-0" aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 10 6">
              <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M9 2 5 5 1 2" />
            </svg>
          </button>
        </div>
      </CoreCard>
</template>
<style scoped></style>