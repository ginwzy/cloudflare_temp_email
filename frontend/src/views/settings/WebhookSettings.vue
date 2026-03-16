<script setup>
import { useI18n } from 'vue-i18n'
import Webhook from '../index/Webhook.vue'

const { t } = useI18n({
  messages: {
    en: { webhook: 'Webhook Settings' },
    zh: { webhook: 'Webhook 设置' }
  }
})
</script>

<template>
  <div class="webhook-settings">
    <h3 class="section-title">{{ t('webhook') }}</h3>
    <n-card size="small">
      <Webhook />
    </n-card>
  </div>
</template>

<style scoped>
.section-title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 600;
}
</style>
