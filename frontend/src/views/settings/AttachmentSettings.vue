<script setup>
import { useI18n } from 'vue-i18n'
import Attachment from '../index/Attachment.vue'

const { t } = useI18n({
  messages: {
    en: { attachments: 'S3 Attachments' },
    zh: { attachments: 'S3 附件' }
  }
})
</script>

<template>
  <div class="attachment-settings">
    <h3 class="section-title">{{ t('attachments') }}</h3>
    <n-card size="small">
      <Attachment />
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
