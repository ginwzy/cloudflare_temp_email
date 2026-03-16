<script setup>
import { useI18n } from 'vue-i18n'
import AutoReply from '../index/AutoReply.vue'

const { t } = useI18n({
  messages: {
    en: { autoReply: 'Auto Reply' },
    zh: { autoReply: '自动回复' }
  }
})
</script>

<template>
  <div class="ds-settings-section auto-reply-settings">
    <div>
      <h3 class="section-title">{{ t('autoReply') }}</h3>
    </div>
    <div class="ds-panel">
      <div class="ds-panel-body">
        <AutoReply />
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
