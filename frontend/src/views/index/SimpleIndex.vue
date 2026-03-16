<script setup>
import { ref, onMounted, computed, watch, onBeforeUnmount } from 'vue'
import { useI18n } from 'vue-i18n'
import { useMessage } from 'naive-ui'
import { useRouter } from 'vue-router'
import {
  ExitToAppFilled,
  ContentCopyFilled,
  RefreshFilled,
  ArrowBackIosNewFilled,
  ArrowForwardIosFilled,
  SettingsFilled,
} from '@vicons/material'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import AccountSettings from './AccountSettings.vue'
import { processItem } from '../../utils/email-parser'
import { getRouterPathWithLang } from '../../utils'
import MailContentRenderer from '../../components/MailContentRenderer.vue'
import AddressSelect from '../../components/AddressSelect.vue'

const router = useRouter()
const { settings, useSimpleIndex, openSettings, loading } = useGlobalState()
const message = useMessage()

const currentPage = ref(1)
const totalCount = ref(0)
const currentMail = ref(null)
const showAccountSettingsCard = ref(false)
const currentAutoRefreshInterval = ref(60)
const timer = ref(null)

const { locale, t } = useI18n({
  messages: {
    en: {
      simpleMode: 'Simple Mode',
      simpleSubtitle: 'A focused single-mail reading surface for distraction-free triage and quick refresh cycles.',
      exitSimpleIndex: 'Exit Simple',
      copyAddress: 'Copy',
      addressCopied: 'Address copied successfully',
      refreshMails: 'Refresh',
      noMails: 'No mails found',
      prevPage: 'Previous',
      nextPage: 'Next',
      refreshSuccess: 'Mails refreshed successfully',
      mailCount: '{current} / {total} emails',
      accountSettings: 'Account Settings',
      deleteSuccess: 'Mail deleted successfully',
      refreshAfter: 'Refresh in {msg}s',
      loginRequired: 'Please log in first',
      openLogin: 'Open Login',
      liveState: 'Single-message focus',
    },
    zh: {
      simpleMode: '极简模式',
      simpleSubtitle: '以单封邮件为中心的专注阅读界面，适合快速刷新与轻量处理。',
      exitSimpleIndex: '退出极简',
      copyAddress: '复制',
      addressCopied: '地址复制成功',
      refreshMails: '刷新',
      noMails: '暂无邮件',
      prevPage: '上一页',
      nextPage: '下一页',
      refreshSuccess: '邮件刷新成功',
      mailCount: '{current} / {total} 封邮件',
      accountSettings: '账户设置',
      deleteSuccess: '邮件删除成功',
      refreshAfter: '{msg} 秒后刷新',
      loginRequired: '请先登录',
      openLogin: '前往登录',
      liveState: '单封专注阅读',
    },
  },
})

const copyAddress = async () => {
  try {
    await navigator.clipboard.writeText(settings.value.address)
    message.success(t('addressCopied'))
  } catch {
    message.error('copy failed')
  }
}

const fetchMails = async () => {
  if (!settings.value.address) return
  try {
    const { results, count } = await api.fetch(`/api/mails?limit=1&offset=${currentPage.value - 1}`)
    totalCount.value = count > 0 ? count : totalCount.value
    const rawMail = results && results.length > 0 ? results[0] : null
    currentMail.value = rawMail ? await processItem(rawMail) : null
  } catch (error) {
    console.error('Failed to fetch mails:', error)
    message.error('获取邮件失败')
  }
}

const deleteMail = async () => {
  if (!currentMail.value) return
  try {
    await api.fetch(`/api/mails/${currentMail.value.id}`, { method: 'DELETE' })
    message.success(t('deleteSuccess'))
    currentMail.value = null
    await refreshMails()
  } catch (error) {
    console.error('Failed to delete mail:', error)
    message.error('删除邮件失败')
  }
}

const refreshMails = async () => {
  if (loading.value) return
  currentPage.value = 1
  showAccountSettingsCard.value = false
  currentAutoRefreshInterval.value = 60
  await fetchMails()
  message.success(t('refreshSuccess'))
}

const currentPageDisplay = computed(() => currentPage.value)
const totalPages = computed(() => Math.max(1, totalCount.value))
const canGoPrev = computed(() => currentPage.value > 1)
const canGoNext = computed(() => currentPage.value < totalPages.value)
const isFirstPage = computed(() => currentPage.value === 1)

const prevPage = async () => {
  if (canGoPrev.value) {
    currentPage.value--
  }
}

const nextPage = async () => {
  if (canGoNext.value) {
    currentPage.value++
  }
}

watch(currentPage, () => {
  fetchMails()
})

onMounted(async () => {
  await api.getSettings()
  await fetchMails()

  timer.value = setInterval(async () => {
    if (!isFirstPage.value) {
      currentAutoRefreshInterval.value = 60
      return
    }

    if (--currentAutoRefreshInterval.value <= 0) {
      await refreshMails()
    }
  }, 1000)
})

onBeforeUnmount(() => {
  clearInterval(timer.value)
})
</script>

<template>
  <div class="ds-page-shell simple-mode">
    <header class="ds-page-header ds-page-header--compact">
      <div class="ds-page-copy">
        <span class="ds-page-kicker">{{ t('simpleMode') }}</span>
        <h1 class="ds-page-title ds-page-title--sm">{{ t('simpleMode') }}</h1>
        <p class="ds-page-subtitle">{{ t('simpleSubtitle') }}</p>
      </div>
      <div class="ds-page-actions">
        <n-button quaternary @click="useSimpleIndex = false">
          <template #icon>
            <n-icon :component="ExitToAppFilled" />
          </template>
          {{ t('exitSimpleIndex') }}
        </n-button>
      </div>
    </header>

    <div v-if="!settings.address" class="ds-panel empty-login-panel">
      <div class="ds-panel-body">
        <n-empty :description="t('loginRequired')">
          <template #extra>
            <n-button type="primary" @click="router.push(getRouterPathWithLang('/auth/login', locale.value))">
              {{ t('openLogin') }}
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>

    <div v-else class="ds-page-grid simple-grid">
      <div class="ds-page-stack">
        <div class="ds-panel">
          <div class="ds-panel-header">
            <div class="ds-page-copy">
              <span class="ds-page-kicker">{{ t('liveState') }}</span>
              <h2 class="ds-section-title">{{ settings.address }}</h2>
            </div>
          </div>
          <div class="ds-panel-body">
            <AddressSelect :showCopy="false" size="small" />
            <div class="simple-actions">
              <n-button @click="refreshMails" :loading="loading" type="primary" tertiary size="small">
                <template #icon><n-icon :component="RefreshFilled" /></template>
                {{ t('refreshMails') }}
              </n-button>
              <n-button @click="copyAddress" tertiary size="small">
                <template #icon><n-icon :component="ContentCopyFilled" /></template>
                {{ t('copyAddress') }}
              </n-button>
              <n-button @click="showAccountSettingsCard = !showAccountSettingsCard" tertiary size="small">
                <template #icon><n-icon :component="SettingsFilled" /></template>
                {{ t('accountSettings') }}
              </n-button>
            </div>
            <div v-if="isFirstPage" class="refresh-note">
              {{ t('refreshAfter', { msg: Math.max(0, currentAutoRefreshInterval) }) }}
            </div>
          </div>
        </div>

        <div v-if="showAccountSettingsCard" class="ds-panel">
          <div class="ds-panel-header">
            <div class="ds-page-copy">
              <span class="ds-page-kicker">{{ t('accountSettings') }}</span>
              <h2 class="ds-section-title">{{ t('accountSettings') }}</h2>
            </div>
          </div>
          <div class="ds-panel-body">
            <AccountSettings />
          </div>
        </div>

        <div v-else class="ds-panel">
          <div v-if="totalCount > 1" class="ds-panel-header compact-nav">
            <n-button @click="prevPage" :disabled="!canGoPrev" text size="small">
              <template #icon><n-icon :component="ArrowBackIosNewFilled" /></template>
              {{ t('prevPage') }}
            </n-button>
            <n-text size="small">
              {{ t('mailCount', { current: currentPageDisplay, total: totalCount }) }}
            </n-text>
            <n-button @click="nextPage" :disabled="!canGoNext" text size="small" icon-placement="right">
              {{ t('nextPage') }}
              <template #icon><n-icon :component="ArrowForwardIosFilled" /></template>
            </n-button>
          </div>
          <div class="ds-panel-body mail-shell">
            <div v-if="!currentMail" class="empty-mail">
              <n-empty :description="t('noMails')" />
            </div>
            <div v-else class="mail-body">
              <h3 v-if="currentMail.subject" class="mail-title">{{ currentMail.subject }}</h3>
              <MailContentRenderer
                :mail="currentMail"
                :showEMailTo="false"
                :showReply="false"
                :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
                :showSaveS3="false"
                :onDelete="deleteMail"
              />
            </div>
          </div>
        </div>
      </div>

      <aside class="ds-page-stack side-note">
        <div class="ds-panel ds-panel--soft">
          <div class="ds-panel-header">
            <div class="ds-page-copy">
              <span class="ds-page-kicker">{{ t('simpleMode') }}</span>
              <h2 class="ds-section-title">{{ t('liveState') }}</h2>
            </div>
          </div>
          <div class="ds-panel-body ds-muted">
            {{ t('simpleSubtitle') }}
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.simple-mode {
  width: min(1180px, 100%);
}

.simple-grid {
  grid-template-columns: minmax(0, 1fr) minmax(260px, 320px);
}

.simple-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
}

.refresh-note {
  margin-top: 12px;
  color: var(--ds-text-muted);
  font-size: 12px;
  font-weight: 600;
}

.compact-nav {
  align-items: center;
}

.mail-shell {
  min-height: 320px;
}

.mail-title {
  margin: 0 0 16px;
  font-size: 24px;
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.empty-mail,
.empty-login-panel {
  width: min(760px, 100%);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .simple-grid {
    grid-template-columns: 1fr;
  }
}
</style>
