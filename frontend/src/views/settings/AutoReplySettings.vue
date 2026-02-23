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
  <div class="auto-reply-settings">
    <h3 class="section-title">{{ t('autoReply') }}</h3>
    <n-card size="small">
      <AutoReply />
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
