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
  <div class="ds-settings-section webhook-settings">
    <div>
      <h3 class="section-title">{{ t('webhook') }}</h3>
    </div>
    <div class="ds-panel">
      <div class="ds-panel-body">
        <Webhook />
      </div>
    </div>
  </div>
</template>

<style scoped>
.section-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
}
</style>
