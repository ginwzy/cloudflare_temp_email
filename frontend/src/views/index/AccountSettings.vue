<script setup>
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { hashPassword } from '../../utils'
import { getRouterPathWithLang } from '../../utils'

const {
  jwt,
  settings,
  loading,
  openSettings,
} = useGlobalState()
const router = useRouter()
const message = useMessage()

const showDeleteAccount = ref(false)
const showClearInbox = ref(false)
const showClearSentItems = ref(false)
const showChangePassword = ref(false)
const newPassword = ref('')
const confirmPassword = ref('')
const { locale, t } = useI18n({
  messages: {
    en: {
      deleteAccount: 'Delete Account',
      deleteAccountConfirm: 'Delete this address and every mail attached to it?',
      clearInbox: 'Clear Inbox',
      clearSentItems: 'Clear Sent Items',
      clearInboxConfirm: 'Clear every message in this inbox?',
      clearSentItemsConfirm: 'Clear every message in sent items?',
      success: 'Success',
      changePassword: 'Change Password',
      newPassword: 'New Password',
      confirmPassword: 'Confirm Password',
      passwordMismatch: 'Passwords do not match',
      passwordChanged: 'Password changed successfully',
      security: 'Security',
      maintenance: 'Maintenance',
      securityHint: 'Protect access to the current address and rotate credentials when needed.',
      maintenanceHint: 'Use destructive actions carefully. These operations cannot be undone.',
    },
    zh: {
      deleteAccount: '删除账户',
      deleteAccountConfirm: '确定要删除当前地址和其中的所有邮件吗？',
      clearInbox: '清空收件箱',
      clearSentItems: '清空发件箱',
      clearInboxConfirm: '确定要清空当前收件箱中的所有邮件吗？',
      clearSentItemsConfirm: '确定要清空当前发件箱中的所有邮件吗？',
      success: '成功',
      changePassword: '修改密码',
      newPassword: '新密码',
      confirmPassword: '确认密码',
      passwordMismatch: '密码不匹配',
      passwordChanged: '密码修改成功',
      security: '安全',
      maintenance: '维护',
      securityHint: '保护当前地址的访问安全，并在需要时轮换凭据。',
      maintenanceHint: '破坏性操作无法撤销，请谨慎执行。',
    },
  },
})

const deleteAccount = async () => {
  try {
    await api.fetch('/api/delete_address', {
      method: 'DELETE',
    })
    jwt.value = ''
    await router.push(getRouterPathWithLang('/', locale.value))
    location.reload()
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const clearInbox = async () => {
  try {
    await api.fetch('/api/clear_inbox', {
      method: 'DELETE',
    })
    message.success(t('success'))
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    showClearInbox.value = false
  }
}

const clearSentItems = async () => {
  try {
    await api.fetch('/api/clear_sent_items', {
      method: 'DELETE',
    })
    message.success(t('success'))
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    showClearSentItems.value = false
  }
}

const changePassword = async () => {
  if (newPassword.value !== confirmPassword.value) {
    message.error(t('passwordMismatch'))
    return
  }
  try {
    await api.fetch('/api/address_change_password', {
      method: 'POST',
      body: JSON.stringify({
        new_password: await hashPassword(newPassword.value),
      }),
    })
    message.success(t('passwordChanged'))
    newPassword.value = ''
    confirmPassword.value = ''
    showChangePassword.value = false
  } catch (error) {
    message.error(error.message || 'error')
  }
}
</script>

<template>
  <div v-if="settings.address" class="account-tools ds-settings-stack">
    <section class="tool-group ds-settings-section">
      <div class="group-copy">
        <span class="group-kicker">{{ t('security') }}</span>
        <h4 class="group-title">{{ t('security') }}</h4>
        <p class="group-description">{{ t('securityHint') }}</p>
      </div>
      <div class="tool-actions ds-actions-stack">
        <n-button
          v-if="openSettings?.enableAddressPassword"
          type="info"
          secondary
          block
          strong
          @click="showChangePassword = true"
        >
          {{ t('changePassword') }}
        </n-button>
      </div>
    </section>

    <section class="tool-group ds-settings-section">
      <div class="group-copy">
        <span class="group-kicker danger">{{ t('maintenance') }}</span>
        <h4 class="group-title">{{ t('maintenance') }}</h4>
        <p class="group-description">{{ t('maintenanceHint') }}</p>
      </div>
      <div class="tool-actions ds-actions-stack">
        <n-button
          v-if="openSettings.enableUserDeleteEmail"
          type="warning"
          secondary
          block
          strong
          @click="showClearInbox = true"
        >
          {{ t('clearInbox') }}
        </n-button>
        <n-button
          v-if="openSettings.enableUserDeleteEmail"
          type="warning"
          secondary
          block
          strong
          @click="showClearSentItems = true"
        >
          {{ t('clearSentItems') }}
        </n-button>
        <n-button
          v-if="openSettings.enableUserDeleteEmail"
          type="error"
          secondary
          block
          strong
          @click="showDeleteAccount = true"
        >
          {{ t('deleteAccount') }}
        </n-button>
      </div>
    </section>

    <n-modal v-model:show="showDeleteAccount" preset="dialog" :title="t('deleteAccount')">
      <p>{{ t('deleteAccountConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="deleteAccount" size="small" tertiary type="error">
          {{ t('deleteAccount') }}
        </n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showClearInbox" preset="dialog" :title="t('clearInbox')">
      <p>{{ t('clearInboxConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="clearInbox" size="small" tertiary type="warning">
          {{ t('clearInbox') }}
        </n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showClearSentItems" preset="dialog" :title="t('clearSentItems')">
      <p>{{ t('clearSentItemsConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="clearSentItems" size="small" tertiary type="warning">
          {{ t('clearSentItems') }}
        </n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showChangePassword" preset="dialog" :title="t('changePassword')">
      <n-form :model="{ newPassword, confirmPassword }">
        <n-form-item :label="t('newPassword')">
          <n-input v-model:value="newPassword" type="password" show-password-on="click" />
        </n-form-item>
        <n-form-item :label="t('confirmPassword')">
          <n-input v-model:value="confirmPassword" type="password" show-password-on="click" />
        </n-form-item>
      </n-form>
      <template #action>
        <n-button :loading="loading" @click="changePassword" size="small" tertiary type="info">
          {{ t('changePassword') }}
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.account-tools {
  width: 100%;
}

.tool-group {
  padding: 18px;
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius);
  background: color-mix(in srgb, var(--ds-surface-soft) 88%, transparent);
}

.group-copy {
  display: grid;
  gap: 6px;
}

.group-kicker {
  color: var(--ds-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.group-kicker.danger {
  color: var(--ds-danger);
}

.group-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.group-description {
  margin: 0;
  color: var(--ds-text-secondary);
  font-size: 13px;
  line-height: 1.6;
}

.tool-actions {
  margin-top: 2px;
}
</style>
