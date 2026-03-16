<script setup>
import { useI18n } from 'vue-i18n'

import { useIsMobile } from '../../utils/composables'
import { useGlobalState } from '../../store'

const props = defineProps({
  showUseSimpleIndex: {
    type: Boolean,
    default: false,
  },
})

const {
  mailboxSplitSize,
  useIframeShowMail,
  preferShowTextMail,
  configAutoRefreshInterval,
  useUTCDate,
  useSimpleIndex,
} = useGlobalState()
const isMobile = useIsMobile()

const { t } = useI18n({
  messages: {
    en: {
      useSimpleIndex: 'Use Simple Index',
      mailboxSplitSize: 'Mailbox Split Size',
      useIframeShowMail: 'Use iframe for HTML mail',
      preferShowTextMail: 'Display text mail by default',
      useUTCDate: 'Use UTC Date',
      autoRefreshInterval: 'Auto Refresh Interval (sec)',
    },
    zh: {
      useSimpleIndex: '使用极简主页',
      mailboxSplitSize: '邮箱界面分栏大小',
      preferShowTextMail: '默认以文本显示邮件',
      useIframeShowMail: '使用 iframe 显示 HTML 邮件',
      useUTCDate: '使用 UTC 时间',
      autoRefreshInterval: '自动刷新间隔（秒）',
    },
  },
})
</script>

<template>
  <div class="appearance-settings">
    <n-form label-placement="left">
      <n-form-item-row v-if="!isMobile" :label="t('mailboxSplitSize')">
        <n-slider
          v-model:value="mailboxSplitSize"
          :min="0.25"
          :max="0.75"
          :step="0.01"
          :marks="{ 0.25: '0.25', 0.5: '0.5', 0.75: '0.75' }"
        />
      </n-form-item-row>
      <n-form-item-row :label="t('autoRefreshInterval')">
        <n-slider
          v-model:value="configAutoRefreshInterval"
          :min="30"
          :max="300"
          :step="1"
          :marks="{ 60: '60', 120: '120', 180: '180', 240: '240' }"
        />
      </n-form-item-row>
      <n-form-item-row v-if="props.showUseSimpleIndex" :label="t('useSimpleIndex')">
        <n-switch v-model:value="useSimpleIndex" :round="false" />
      </n-form-item-row>
      <n-form-item-row :label="t('preferShowTextMail')">
        <n-switch v-model:value="preferShowTextMail" :round="false" />
      </n-form-item-row>
      <n-form-item-row :label="t('useIframeShowMail')">
        <n-switch v-model:value="useIframeShowMail" :round="false" />
      </n-form-item-row>
      <n-form-item-row :label="t('useUTCDate')">
        <n-switch v-model:value="useUTCDate" :round="false" />
      </n-form-item-row>
    </n-form>
  </div>
</template>

<style scoped>
.appearance-settings {
  width: 100%;
}
</style>
