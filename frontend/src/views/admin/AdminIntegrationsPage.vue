<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import AiExtractSettings from './AiExtractSettings.vue'
import Telegram from './Telegram.vue'
import Webhook from './Webhook.vue'

const { t } = useI18n({
  messages: {
    en: {
      integrations: 'Integrations',
      telegram: 'Telegram',
      webhook: 'Webhook',
      ai: 'AI Extract',
      description: 'Configure third-party channels and AI extraction pipelines in one place.'
    },
    zh: {
      integrations: '集成',
      telegram: 'Telegram',
      webhook: 'Webhook',
      ai: 'AI 提取',
      description: '统一配置第三方渠道与 AI 邮件提取能力。'
    }
  }
})

const tab = ref('telegram')
</script>

<template>
  <section class="integrations-page">
    <header class="integrations-header">
      <div>
        <h2 class="page-title">{{ t('integrations') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
      <n-space>
        <n-button :type="tab === 'telegram' ? 'primary' : 'default'" :secondary="tab === 'telegram'" @click="tab = 'telegram'">
          {{ t('telegram') }}
        </n-button>
        <n-button :type="tab === 'webhook' ? 'primary' : 'default'" :secondary="tab === 'webhook'" @click="tab = 'webhook'">
          {{ t('webhook') }}
        </n-button>
        <n-button :type="tab === 'ai' ? 'primary' : 'default'" :secondary="tab === 'ai'" @click="tab = 'ai'">
          {{ t('ai') }}
        </n-button>
      </n-space>
    </header>

    <main class="integrations-content">
      <Telegram v-if="tab === 'telegram'" />
      <Webhook v-else-if="tab === 'webhook'" />
      <AiExtractSettings v-else />
    </main>
  </section>
</template>

<style scoped>
.integrations-page {
  display: grid;
  gap: 12px;
}

.integrations-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
  color: var(--ds-text);
}

.page-subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--ds-text-secondary);
}

.integrations-content {
  min-width: 0;
}
</style>
