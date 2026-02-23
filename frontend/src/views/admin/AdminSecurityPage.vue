<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import SenderAccess from './SenderAccess.vue'
import IpBlacklistSettings from './IpBlacklistSettings.vue'
import ApiKeyManagement from './ApiKeyManagement.vue'

const { t } = useI18n({
  messages: {
    en: { security: 'Security', access: 'Sender Access', blacklist: 'IP Blacklist', apiKeys: 'API Keys' },
    zh: { security: '安全设置', access: '发件权限', blacklist: 'IP 黑名单', apiKeys: 'API Key' }
  }
})

const tab = ref('access')
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('security') }}</h2>
    <n-tabs v-model:value="tab" type="segment" animated>
      <n-tab-pane name="access" :tab="t('access')">
        <SenderAccess />
      </n-tab-pane>
      <n-tab-pane name="blacklist" :tab="t('blacklist')">
        <IpBlacklistSettings />
      </n-tab-pane>
      <n-tab-pane name="apiKeys" :tab="t('apiKeys')">
        <ApiKeyManagement />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
