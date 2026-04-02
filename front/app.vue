<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors position="top-right" close-button />
</template>

<script setup lang="ts">
import { Toaster } from "vue-sonner";

useHead({
  title: "Stamped Map",
  meta: [
    {
      name: "description",
      content: "訪問済みスポットを地図で記録・可視化する個人Webアプリ",
    },
  ],
  htmlAttrs: { lang: "ja" },
});
</script>
