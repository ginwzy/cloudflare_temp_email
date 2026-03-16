<script setup>
import { h, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { startRegistration } from '@simplewebauthn/browser'
import { NButton, NPopconfirm } from 'naive-ui'

import { useGlobalState } from '../../store'
import { api } from '../../api'

const { userJwt, jwt, userSettings, loading } = useGlobalState()
const message = useMessage()

const showLogout = ref(false)
const showCreatePasskey = ref(false)
const passkeyName = ref('')
const showPasskeyList = ref(false)
const showRenamePasskey = ref(false)
const currentPasskeyId = ref(null)
const currentPasskeyName = ref('')

const { t } = useI18n({
  messages: {
    en: {
      logout: 'Logout',
      logoutConfirm: 'Are you sure you want to logout?',
      passordTip: 'The server only receives the password hash, never the plaintext password. If email verification is enabled, you can recover access from an incognito session.',
      createPasskey: 'Create Passkey',
      showPasskeyList: 'Show Passkey List',
      passkeyCreated: 'Passkey created successfully',
      passkeyNamePlaceholder: 'Enter a passkey name or leave it empty to auto-generate one',
      renamePasskey: 'Rename Passkey',
      deletePasskey: 'Delete Passkey',
      passkey_name: 'Passkey Name',
      created_at: 'Created At',
      updated_at: 'Updated At',
      actions: 'Actions',
      renamePasskeyNamePlaceholder: 'Enter the new passkey name',
      identity: 'Identity',
      security: 'Passkeys',
      email: 'User Email',
    },
    zh: {
      logout: '退出登录',
      logoutConfirm: '确定要退出登录吗？',
      passordTip: '服务器只会接收密码哈希，不会接收明文密码。如果管理员启用了邮件验证，你可以在无痕模式中恢复访问。',
      createPasskey: '创建 Passkey',
      showPasskeyList: '查看 Passkey 列表',
      passkeyCreated: 'Passkey 创建成功',
      passkeyNamePlaceholder: '请输入 Passkey 名称，或留空自动生成',
      renamePasskey: '重命名 Passkey',
      deletePasskey: '删除 Passkey',
      passkey_name: 'Passkey 名称',
      created_at: '创建时间',
      updated_at: '更新时间',
      actions: '操作',
      renamePasskeyNamePlaceholder: '请输入新的 Passkey 名称',
      identity: '身份信息',
      security: 'Passkey',
      email: '用户邮箱',
    },
  },
})

const logout = async () => {
  userJwt.value = ''
  jwt.value = ''
  location.reload()
}

const createPasskey = async () => {
  try {
    const options = await api.fetch('/user_api/passkey/register_request', {
      method: 'POST',
      body: JSON.stringify({
        domain: location.hostname,
      }),
    })
    const credential = await startRegistration(options)

    await api.fetch('/user_api/passkey/register_response', {
      method: 'POST',
      body: JSON.stringify({
        origin: location.origin,
        passkey_name: passkeyName.value || (
          (window.navigator.userAgentData?.platform || 'Unknown')
          + ': ' + Math.random().toString(36).substring(7)
        ),
        credential,
      }),
    })
    message.success(t('passkeyCreated'))
  } catch (e) {
    console.error(e)
    message.error(e.message)
  } finally {
    passkeyName.value = ''
    showCreatePasskey.value = false
  }
}

const passkeyColumns = [
  {
    title: 'Passkey ID',
    key: 'passkey_id',
  },
  {
    title: t('passkey_name'),
    key: 'passkey_name',
  },
  {
    title: t('created_at'),
    key: 'created_at',
  },
  {
    title: t('updated_at'),
    key: 'updated_at',
  },
  {
    title: t('actions'),
    key: 'actions',
    render(row) {
      return h('div', { style: 'display: flex; gap: 8px; flex-wrap: wrap' }, [
        h(NButton, {
          tertiary: true,
          type: 'primary',
          onClick: () => {
            showRenamePasskey.value = true
            currentPasskeyId.value = row.passkey_id
          },
        }, { default: () => t('renamePasskey') }),
        h(NPopconfirm, {
          onPositiveClick: async () => {
            try {
              await api.fetch(`/user_api/passkey/${row.passkey_id}`, {
                method: 'DELETE',
              })
              await fetchPasskeyList()
            } catch (e) {
              console.error(e)
              message.error(e.message)
            }
          },
        }, {
          trigger: () => h(NButton, {
            tertiary: true,
            type: 'error',
          }, { default: () => t('deletePasskey') }),
          default: () => `${t('deletePasskey')}?`,
        }),
      ])
    },
  },
]

const passkeyData = ref([])

const fetchPasskeyList = async () => {
  try {
    const data = await api.fetch('/user_api/passkey')
    passkeyData.value = data
  } catch (e) {
    console.error(e)
    message.error(e.message)
  }
}

const renamePasskey = async () => {
  try {
    await api.fetch('/user_api/passkey/rename', {
      method: 'POST',
      body: JSON.stringify({
        passkey_name: currentPasskeyName.value,
        passkey_id: currentPasskeyId.value,
      }),
    })
    await fetchPasskeyList()
  } catch (e) {
    console.error(e)
    message.error(e.message)
  } finally {
    currentPasskeyName.value = ''
    showRenamePasskey.value = false
  }
}
</script>

<template>
  <div v-if="userSettings.user_email" class="user-settings ds-settings-stack">
    <section class="setting-card ds-settings-section">
      <div class="group-copy">
        <span class="group-kicker">{{ t('identity') }}</span>
        <h4 class="group-title">{{ t('email') }}</h4>
        <p class="group-description">{{ userSettings.user_email }}</p>
      </div>
      <n-alert :show-icon="false" :bordered="false">
        <span>{{ t('passordTip') }}</span>
      </n-alert>
      <div class="ds-actions-stack">
        <n-button secondary block strong @click="showPasskeyList = true; fetchPasskeyList()">
          {{ t('showPasskeyList') }}
        </n-button>
        <n-button type="primary" secondary block strong @click="showCreatePasskey = true">
          {{ t('createPasskey') }}
        </n-button>
        <n-button secondary block strong @click="showLogout = true">
          {{ t('logout') }}
        </n-button>
      </div>
    </section>

    <n-modal v-model:show="showCreatePasskey" preset="dialog" :title="t('createPasskey')">
      <n-input v-model:value="passkeyName" :placeholder="t('passkeyNamePlaceholder')" />
      <template #action>
        <n-button :loading="loading" @click="createPasskey" size="small" tertiary type="primary">
          {{ t('createPasskey') }}
        </n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showRenamePasskey" preset="dialog" :title="t('renamePasskey')">
      <n-input v-model:value="currentPasskeyName" :placeholder="t('renamePasskeyNamePlaceholder')" />
      <template #action>
        <n-button :loading="loading" @click="renamePasskey" size="small" tertiary type="primary">
          {{ t('renamePasskey') }}
        </n-button>
      </template>
    </n-modal>

    <n-modal v-model:show="showPasskeyList" preset="card" :title="t('showPasskeyList')" style="max-width: 900px; width: 95%;">
      <div class="ds-table-shell">
        <n-data-table :columns="passkeyColumns" :data="passkeyData" :bordered="false" embedded />
      </div>
    </n-modal>

    <n-modal v-model:show="showLogout" preset="dialog" :title="t('logout')">
      <p>{{ t('logoutConfirm') }}</p>
      <template #action>
        <n-button :loading="loading" @click="logout" size="small" tertiary type="warning">
          {{ t('logout') }}
        </n-button>
      </template>
    </n-modal>
  </div>
</template>

<style scoped>
.user-settings {
  width: 100%;
}

.setting-card {
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
</style>
