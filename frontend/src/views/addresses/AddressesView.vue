<script setup>
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGlobalState } from '../../store'
import { getRouterPathWithLang } from '../../utils'
import AddressManagement from '../user/AddressManagement.vue'
import TelegramAddress from '../index/TelegramAddress.vue'

const router = useRouter()
const { userJwt, isTelegram, userSettings } = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      addresses: 'Addresses',
      subtitle: 'Manage active inbox identities, bind existing addresses, and switch between them without leaving the workspace.',
      loginRequired: 'Please log in to manage addresses',
      createOrBind: 'Create or Bind',
    },
    zh: {
      addresses: '地址管理',
      subtitle: '管理当前收件地址、绑定已有地址，并在不离开工作区的情况下快速切换身份。',
      loginRequired: '请登录以管理地址',
      createOrBind: '创建或绑定',
    }
  }
})
</script>

<template>
  <div class="ds-page-shell addresses-page">
    <header class="ds-page-header ds-page-header--compact">
      <div class="ds-page-copy">
        <span class="ds-page-kicker">{{ t('addresses') }}</span>
        <h1 class="ds-page-title ds-page-title--sm">{{ t('addresses') }}</h1>
        <p class="ds-page-subtitle">{{ t('subtitle') }}</p>
      </div>
      <div class="ds-page-actions">
        <n-button type="primary" @click="router.push(getRouterPathWithLang('/addresses/new', locale.value))">
          {{ t('createOrBind') }}
        </n-button>
      </div>
    </header>

    <div v-if="isTelegram">
      <div class="ds-panel">
        <div class="ds-panel-body">
          <TelegramAddress />
        </div>
      </div>
    </div>
    <div v-else-if="userJwt && userSettings.user_email">
      <div class="ds-panel">
        <div class="ds-panel-body">
          <AddressManagement />
        </div>
      </div>
    </div>
    <div v-else class="login-prompt">
      <div class="ds-panel login-panel">
        <n-empty :description="t('loginRequired')">
          <template #extra>
            <n-button type="primary" @click="router.push(getRouterPathWithLang('/auth/login', locale.value))">
              {{ t('loginRequired') }}
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>
  </div>
</template>

<style scoped>
.addresses-page {
}
.login-prompt {
  display: grid;
}

.login-panel {
  max-width: 640px;
  margin: 0 auto;
  padding: 28px;
  text-align: center;
}
</style>
