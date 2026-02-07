<template>
  <div class="flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200 p-3 pb-10">
    <div class="flex items-center gap-2">
      <!-- Browser -->
      <div class="flex flex-col items-center gap-1">
        <img src="/logo/computer-desktop.svg" class="h-10 w-10" />
        <span class="text-[10px] text-gray-500">Browser</span>
      </div>

      <carbon:arrows-horizontal class="text-gray-400 text-xl" />

      <!-- Next.js -->
      <div class="flex flex-col items-center gap-1 p-2 bg-white rounded shadow-sm border border-gray-200">
        <img src="/logo/nextjs-icon.svg" class="h-8 w-8" />
        <span class="text-[10px] font-bold">Next.js</span>
      </div>

      <carbon:arrows-horizontal class="text-gray-400 text-xl" />

      <!-- Generation Target Scope -->
      <div class="relative p-3 border-2 border-green-400 border-dashed rounded-xl bg-green-50/30 flex items-center gap-2">
        <div class="absolute -top-3 left-4 bg-green-100 text-green-700 text-[9px] font-bold px-2 py-0.5 rounded border border-green-300 shadow-sm whitespace-nowrap">エージェントの適用範囲</div>

        <!-- NestJS with Branch -->
        <div class="relative flex flex-col items-center gap-1 p-2 bg-white rounded shadow-sm border border-gray-200">
          <img src="/logo/nestjs.svg" class="h-8 w-8" />
          <span class="text-[10px] font-bold">NestJS</span>

          <!-- Prisma -->
          <div class="flex items-center gap-1 mt-1 border-t border-gray-100 pt-1">
            <img src="/logo/prisma.svg" class="h-3 w-3 object-contain" />
            <span class="text-[8px] text-gray-500 font-bold">Prisma</span>
          </div>

          <!-- Stripe Branch -->
          <div class="absolute top-full left-1/2 transform -translate-x-1/2 flex flex-col items-center pt-2 z-10">
            <div class="w-px h-3 bg-gray-300"></div>
            <div class="p-1 bg-white rounded shadow-sm border border-gray-200 flex flex-col items-center gap-0.5">
              <img src="/logo/stripe-connect.svg" class="h-4" />
              <span class="text-[8px] font-bold text-indigo-600 whitespace-nowrap px-1">Stripe Connect</span>
            </div>
          </div>
        </div>

        <carbon:arrows-horizontal class="text-gray-400 text-xl" />

        <!-- DB -->
        <div class="flex flex-col items-center gap-1 p-2 bg-white rounded shadow-sm border border-gray-200">
          <img src="/logo/postgresql.svg" class="h-8 w-8" />
          <span class="text-[10px] font-bold">PostgreSQL</span>
        </div>
      </div>
    </div>
  </div>
</template>
