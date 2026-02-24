<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ContentCopyFilled } from '@vicons/material'
import { ExchangeAlt } from '@vicons/fa'
import { useGlobalState } from '../store'
import TelegramAddress from '../views/index/TelegramAddress.vue'
import AddressManagement from '../views/user/AddressManagement.vue'

const message = useMessage()
const { settings, userJwt, isTelegram } = useGlobalState()

const { t } = useI18n({
  messages: {
    en: { noAddress: 'No address', copied: 'Address copied', manage: 'Manage' },
    zh: { noAddress: '无地址', copied: '地址已复制', manage: '管理' }
  }
})

const showManage = ref(false)

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(settings.value.address)
    message.success(t('copied'))
  } catch { message.error('Copy failed') }
}
</script>

<template>
  <div v-if="settings.address" class="address-switcher">
    <div class="address-info">
      <div class="address-dot"></div>
      <n-ellipsis class="address-text">{{ settings.address }}</n-ellipsis>
    </div>
    <div class="address-actions">
      <n-button text size="tiny" @click="copyAddress">
        <template #icon><n-icon :component="ContentCopyFilled" :size="14" /></template>
      </n-button>
      <n-button text size="tiny" @click="showManage = true">
        <template #icon><n-icon :component="ExchangeAlt" :size="14" /></template>
      </n-button>
    </div>
  </div>
  <div v-else class="address-switcher empty">
    <n-text depth="3" style="font-size: 12px;">{{ t('noAddress') }}</n-text>
  </div>

  <n-modal v-model:show="showManage" preset="card" :title="t('manage')">
    <TelegramAddress v-if="isTelegram" />
    <AddressManagement v-else-if="userJwt" />
  </n-modal>
</template>

<style scoped>
.address-switcher {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 12px;
  border-radius: var(--ds-radius-sm);
  background: var(--ds-bg);
  font-size: 12px;
  color: var(--ds-text-secondary);
  overflow: hidden;
}
.address-switcher.empty {
  text-align: center;
  padding: 8px;
}
.address-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.address-actions {
  display: flex;
  gap: 4px;
  margin-left: 16px;
}
.address-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22C55E;
  flex-shrink: 0;
}
.address-text { flex: 1; min-width: 0; }
</style>
