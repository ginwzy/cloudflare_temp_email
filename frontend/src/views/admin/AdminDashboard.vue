<script setup>
import { useI18n } from 'vue-i18n'
import Statistics from './Statistics.vue'

const { t } = useI18n({
  messages: {
    en: { dashboard: 'Dashboard' },
    zh: { dashboard: '仪表盘' }
  }
})
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('dashboard') }}</h2>
    <Statistics />
  </div>
</template>

<style scoped>
.page-title {
  margin: 0 0 16px;
  font-size: 20px;
  font-weight: 600;
}
</style>
