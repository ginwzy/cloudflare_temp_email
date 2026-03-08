<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../../store'
import MailWebhook from './MailWebhook.vue'
import Mails from './Mails.vue'
import MailsUnknow from './MailsUnknow.vue'
import SendBox from './SendBox.vue'
import SendMail from './SendMail.vue'

const { adminSendBoxTabAddress } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: {
      emails: 'Emails',
      mails: 'Mails',
      unknown: 'Unknown',
      sent: 'Sent',
      send: 'Send',
      webhook: 'Webhook',
      description: 'View inbound and unknown mails, sent history, and webhook delivery logs.'
    },
    zh: {
      emails: '邮件管理',
      mails: '邮件',
      unknown: '未知',
      sent: '发件箱',
      send: '发送',
      webhook: 'Webhook',
      description: '统一查看收件、未知邮件、发件历史和 Webhook 投递记录。'
    }
  }
})

const tab = ref(adminSendBoxTabAddress.value ? 'sent' : 'mails')
</script>

<template>
  <section class="emails-page">
    <header class="emails-header">
      <div>
        <h2 class="page-title">{{ t('emails') }}</h2>
        <p class="page-subtitle">{{ t('description') }}</p>
      </div>
      <n-space>
        <n-button :type="tab === 'mails' ? 'primary' : 'default'" :secondary="tab === 'mails'" @click="tab = 'mails'">
          {{ t('mails') }}
        </n-button>
        <n-button :type="tab === 'unknown' ? 'primary' : 'default'" :secondary="tab === 'unknown'" @click="tab = 'unknown'">
          {{ t('unknown') }}
        </n-button>
        <n-button :type="tab === 'sent' ? 'primary' : 'default'" :secondary="tab === 'sent'" @click="tab = 'sent'">
          {{ t('sent') }}
        </n-button>
        <n-button :type="tab === 'send' ? 'primary' : 'default'" :secondary="tab === 'send'" @click="tab = 'send'">
          {{ t('send') }}
        </n-button>
        <n-button :type="tab === 'webhook' ? 'primary' : 'default'" :secondary="tab === 'webhook'" @click="tab = 'webhook'">
          {{ t('webhook') }}
        </n-button>
      </n-space>
    </header>

    <main class="emails-content">
      <Mails v-if="tab === 'mails'" />
      <MailsUnknow v-else-if="tab === 'unknown'" />
      <SendBox v-else-if="tab === 'sent'" />
      <SendMail v-else-if="tab === 'send'" />
      <MailWebhook v-else />
    </main>
  </section>
</template>

<style scoped>
.emails-page {
  display: grid;
  gap: 12px;
}

.emails-header {
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

.emails-content {
  min-width: 0;
}
</style>
