<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import Telegram from './Telegram.vue'
import Webhook from './Webhook.vue'
import AiExtractSettings from './AiExtractSettings.vue'

const { t } = useI18n({
  messages: {
    en: { integrations: 'Integrations', telegram: 'Telegram', webhook: 'Webhook', ai: 'AI Extract' },
    zh: { integrations: '集成', telegram: 'Telegram', webhook: 'Webhook', ai: 'AI 提取' }
  }
})

const tab = ref('telegram')
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('integrations') }}</h2>
    <n-tabs v-model:value="tab" type="segment" animated>
      <n-tab-pane name="telegram" :tab="t('telegram')">
        <Telegram />
      </n-tab-pane>
      <n-tab-pane name="webhook" :tab="t('webhook')">
        <Webhook />
      </n-tab-pane>
      <n-tab-pane name="ai" :tab="t('ai')">
        <AiExtractSettings />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
