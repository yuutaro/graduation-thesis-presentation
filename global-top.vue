<template>
  <footer class="fixed bottom-0 left-0 right-0 pt-1/2 flex justify-between items-center text-xs text-black z-50 pointer-events-none">
    <div class="ml-4">6322087 三笠 悠太郎</div>
    <!-- <div class="mr-4"><SlideCurrentNo /> / <SlidesTotal /></div> -->
    <div class="mr-4">{{ $slidev.nav.currentPage }} / {{ $slidev.nav.total }}</div>
  </footer>
</template>
