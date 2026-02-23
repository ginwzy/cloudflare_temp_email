<script setup>
import { defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'

const { loading } = useGlobalState()

const Statistics = defineAsyncComponent(() => {
  loading.value = true
  return import('./Statistics.vue').finally(() => loading.value = false)
})

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
