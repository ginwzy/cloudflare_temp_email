<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ApiKeyManagement from './ApiKeyManagement.vue'
import IpBlacklistSettings from './IpBlacklistSettings.vue'
import SenderAccess from './SenderAccess.vue'

const { t } = useI18n({
  messages: {
    en: {
      security: 'Security',
      access: 'Sender Access',
      blacklist: 'IP Blacklist',
      apiKeys: 'API Keys',
      description: 'Control sender permissions, block malicious IPs, and manage API keys.'
    },
    zh: {
      security: '安全设置',
      access: '发件权限',
      blacklist: 'IP 黑名单',
      apiKeys: 'API Key',
      description: '统一管理发件权限、IP 风险拦截和 API Key。'
    }
  }
})

const tab = ref('access')
</script>

<template>
  <section class="security-page">
    <header class="security-header">
      <div>
        <h2 class="page-title">{{ t('security') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
      <n-space>
        <n-button :type="tab === 'access' ? 'primary' : 'default'" :secondary="tab === 'access'" @click="tab = 'access'">
          {{ t('access') }}
        </n-button>
        <n-button :type="tab === 'blacklist' ? 'primary' : 'default'" :secondary="tab === 'blacklist'" @click="tab = 'blacklist'">
          {{ t('blacklist') }}
        </n-button>
        <n-button :type="tab === 'apiKeys' ? 'primary' : 'default'" :secondary="tab === 'apiKeys'" @click="tab = 'apiKeys'">
          {{ t('apiKeys') }}
        </n-button>
      </n-space>
    </header>

    <main class="security-content">
      <SenderAccess v-if="tab === 'access'" />
      <IpBlacklistSettings v-else-if="tab === 'blacklist'" />
      <ApiKeyManagement v-else />
    </main>
  </section>
</template>

<style scoped>
.security-page {
  display: grid;
  gap: 12px;
}

.security-header {
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

.security-content {
  min-width: 0;
}
</style>
