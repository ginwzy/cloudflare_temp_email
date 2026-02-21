<script setup>
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import AccountSettings from './index/AccountSettings.vue'
import Appearance from './common/Appearance.vue'
import AutoReply from './index/AutoReply.vue'
import Webhook from './index/Webhook.vue'
import Attachment from './index/Attachment.vue'
import About from './common/About.vue'

const { openSettings } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: {
      accountSettings: 'Account Settings', appearance: 'Appearance',
      autoReply: 'Auto Reply', webhook: 'Webhook Settings',
      s3Attachment: 'S3 Attachment', about: 'About',
    },
    zh: {
      accountSettings: '账户设置', appearance: '外观',
      autoReply: '自动回复', webhook: 'Webhook 设置',
      s3Attachment: 'S3附件', about: '关于',
    }
  }
})
</script>

<template>
  <div class="settings-page">
    <n-card :title="t('accountSettings')" size="small">
      <AccountSettings />
    </n-card>
    <n-card :title="t('appearance')" size="small">
      <Appearance :showUseSimpleIndex="true" />
    </n-card>
    <n-card v-if="openSettings.enableAutoReply" :title="t('autoReply')" size="small">
      <AutoReply />
    </n-card>
    <n-card v-if="openSettings.enableWebhook" :title="t('webhook')" size="small">
      <Webhook />
    </n-card>
    <n-card v-if="openSettings.isS3Enabled" :title="t('s3Attachment')" size="small">
      <Attachment />
    </n-card>
    <n-card v-if="openSettings.enableIndexAbout" :title="t('about')" size="small">
      <About />
    </n-card>
  </div>
</template>

<style scoped>
.settings-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 800px;
}
</style>
