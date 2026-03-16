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
  <div class="ds-settings-section attachment-settings">
    <div>
      <h3 class="section-title">{{ t('attachments') }}</h3>
    </div>
    <div class="ds-panel">
      <div class="ds-panel-body">
        <Attachment />
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
