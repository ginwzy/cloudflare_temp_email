<script setup>
import { ref, defineAsyncComponent } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
import Mails from './Mails.vue'
import MailsUnknow from './MailsUnknow.vue'
import SendBox from './SendBox.vue'
import MailWebhook from './MailWebhook.vue'

const { loading } = useGlobalState()

const SendMail = defineAsyncComponent(() => {
  loading.value = true
  return import('./SendMail.vue').finally(() => loading.value = false)
})

const { t } = useI18n({
  messages: {
    en: { emails: 'Emails', mails: 'Mails', unknown: 'Unknown', sent: 'Sent', send: 'Send', webhook: 'Webhook' },
    zh: { emails: '邮件管理', mails: '邮件', unknown: '未知', sent: '发件箱', send: '发送', webhook: 'Webhook' }
  }
})

const tab = ref('mails')
</script>

<template>
  <div>
    <h2 class="page-title">{{ t('emails') }}</h2>
    <n-tabs v-model:value="tab" type="segment" animated>
      <n-tab-pane name="mails" :tab="t('mails')">
        <Mails />
      </n-tab-pane>
      <n-tab-pane name="unknown" :tab="t('unknown')">
        <MailsUnknow />
      </n-tab-pane>
      <n-tab-pane name="sent" :tab="t('sent')">
        <SendBox />
      </n-tab-pane>
      <n-tab-pane name="send" :tab="t('send')">
        <SendMail />
      </n-tab-pane>
      <n-tab-pane name="webhook" :tab="t('webhook')">
        <MailWebhook />
      </n-tab-pane>
    </n-tabs>
  </div>
</template>

<style scoped>
.page-title { margin: 0 0 16px; font-size: 20px; font-weight: 600; }
</style>
