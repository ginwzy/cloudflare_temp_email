<script setup>
import { useI18n } from 'vue-i18n'
import Appearance from '../common/Appearance.vue'

const { t } = useI18n({
  messages: {
    en: { appearance: 'Appearance' },
    zh: { appearance: '外观' }
  }
})
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('appearance') }}</h2>
    <Appearance />
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
