<script setup>
import { watch, onMounted, ref, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { utcToLocalDate } from '../utils'
import { SendRound, RefreshRound, CodeRound } from '@vicons/material'
import { sanitizeRichTextHtml } from '../utils/safe-html'

const message = useMessage()
const isMobile = useIsMobile()

const props = defineProps({
  enableUserDeleteEmail: {
    type: Boolean,
    default: false,
    required: false,
  },
  showEMailFrom: {
    type: Boolean,
    default: false,
  },
  fetchMailData: {
    type: Function,
    default: () => {},
    required: true,
  },
  deleteMail: {
    type: Function,
    default: () => {},
    required: false,
  },
})

const { mailboxSplitSize, loading, useUTCDate } = useGlobalState()
const data = ref([])
const count = ref(0)
const page = ref(1)
const pageSize = ref(20)
const curMail = ref(null)
const showCode = ref(false)
const safeCurMailHtml = computed(() => sanitizeRichTextHtml(curMail.value?.content || ''))

const multiActionMode = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })

const { t } = useI18n({
  messages: {
    en: {
      success: 'Success',
      refresh: 'Refresh',
      originalCode: 'Original JSON',
      renderedMessage: 'Rendered content',
      pleaseSelectMail: 'Select a sent mail to read.',
      emptySent: 'No sent emails yet',
      delete: 'Delete',
      deleteMailTip: 'Are you sure you want to delete mail?',
      multiAction: 'Multi-select',
      cancelMultiAction: 'Done',
      selectAll: 'Select page',
      unselectAll: 'Clear',
      sendbox: 'Sent workspace',
      sentCount: '{count} sent mails',
      ready: 'Outgoing mail and delivery payloads stay in sync here.',
      selectedCount: '{count} selected',
      noPreview: 'No preview available',
      toLabel: 'To',
      fromLabel: 'From',
    },
    zh: {
      success: '成功',
      refresh: '刷新',
      originalCode: '原始 JSON',
      renderedMessage: '渲染内容',
      pleaseSelectMail: '选择一封已发送邮件查看。',
      emptySent: '发件箱为空',
      delete: '删除',
      deleteMailTip: '确定要删除邮件吗?',
      multiAction: '多选',
      cancelMultiAction: '完成',
      selectAll: '全选本页',
      unselectAll: '取消全选',
      sendbox: '发件工作区',
      sentCount: '共 {count} 封已发送邮件',
      ready: '这里统一查看外发邮件和投递载荷。',
      selectedCount: '已选择 {count} 封',
      noPreview: '暂无预览内容',
      toLabel: '收件人',
      fromLabel: '发件人',
    },
  },
})

const showMobileMailDrawer = computed({
  get: () => !!curMail.value,
  set: (show) => {
    if (!show) {
      curMail.value = null
    }
  },
})

const selectedCount = computed(() => data.value.filter((item) => item.checked).length)

const desktopListWidth = computed(() => {
  const rawPercent = Number(mailboxSplitSize.value || 0.36) * 100
  const percent = Math.min(Math.max(Math.round(rawPercent), 34), 40)
  return `clamp(360px, ${percent}%, 420px)`
})

const headerSummary = computed(() => {
  if (count.value > 0) {
    return t('sentCount', { count: count.value })
  }
  return t('ready')
})

const normalizeMailItem = (item) => {
  const nextItem = {
    ...item,
    checked: false,
  }
  try {
    const parsed = JSON.parse(item.raw)
    if (parsed.version === 'v2') {
      nextItem.to_mail = parsed.to_name ? `${parsed.to_name} <${parsed.to_mail}>` : parsed.to_mail
      nextItem.subject = parsed.subject
      nextItem.is_html = parsed.is_html
      nextItem.content = parsed.content
      nextItem.raw = JSON.stringify(parsed, null, 2)
    } else {
      nextItem.to_mail = parsed?.personalizations?.map(
        (personalization) => personalization.to?.map((to) => to.email).join(','),
      ).join(';')
      nextItem.subject = parsed.subject
      nextItem.is_html = parsed.content?.[0]?.type !== 'text/plain'
      nextItem.content = parsed.content?.[0]?.value
      nextItem.raw = JSON.stringify(parsed, null, 2)
    }
  } catch (error) {
    console.log(error)
  }
  return nextItem
}

const getPrimaryRecipient = (row) => row.to_mail || row.address || '-'

const getAvatarColor = (name) => {
  const colors = ['#2F6FED', '#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#0891B2', '#F97316', '#6366F1']
  if (!name) return colors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const getSenderInitial = (value) => {
  if (!value) return '?'
  return value.trim()[0]?.toUpperCase() || '?'
}

const getRowPreview = (row) => {
  const content = `${row.content || ''}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!content) return t('noPreview')
  return content.length > 120 ? `${content.slice(0, 120)}...` : content
}

watch([page, pageSize], async ([currentPage, currentPageSize], [oldPage, oldPageSize]) => {
  if (currentPage !== oldPage || currentPageSize !== oldPageSize) {
    await refresh()
  }
})

const refresh = async () => {
  try {
    const previousSelectedId = curMail.value?.id
    const { results, count: totalCount } = await props.fetchMailData(
      pageSize.value,
      (page.value - 1) * pageSize.value,
    )
    data.value = results.map(normalizeMailItem)
    if (typeof totalCount === 'number') {
      count.value = totalCount
    }
    const nextSelected = data.value.find((item) => item.id === previousSelectedId) || null
    if (nextSelected) {
      curMail.value = nextSelected
    } else if (!data.value.length) {
      curMail.value = null
    } else if (!isMobile.value) {
      curMail.value = data.value[0]
    } else {
      curMail.value = null
    }
  } catch (error) {
    message.error(error.message || 'error')
    console.error(error)
  }
}

const clickRow = async (row) => {
  if (multiActionMode.value) {
    row.checked = !row.checked
    return
  }
  if (curMail.value?.id !== row.id) {
    showCode.value = false
  }
  curMail.value = row
}

const deleteMail = async () => {
  try {
    await props.deleteMail(curMail.value.id)
    message.success(t('success'))
    curMail.value = null
    await refresh()
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const showMultiActionMode = computed(() => props.enableUserDeleteEmail)

const multiActionModeClick = (enableMulti) => {
  data.value.forEach((item) => {
    item.checked = false
  })
  multiActionMode.value = enableMulti
}

const multiActionSelectAll = (checked) => {
  data.value.forEach((item) => {
    item.checked = checked
  })
}

const multiActionDeleteMail = async () => {
  try {
    loading.value = true
    const selectedMails = data.value.filter((item) => item.checked)
    if (selectedMails.length === 0) {
      message.error(t('pleaseSelectMail'))
      return
    }
    multiActionDeleteProgress.value = {
      percentage: 0,
      tip: `0/${selectedMails.length}`,
    }
    showMultiActionDelete.value = true
    for (const [index, mail] of selectedMails.entries()) {
      await props.deleteMail(mail.id)
      multiActionDeleteProgress.value = {
        percentage: Math.floor(((index + 1) / selectedMails.length) * 100),
        tip: `${index + 1}/${selectedMails.length}`,
      }
    }
    message.success(t('success'))
    await refresh()
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await refresh()
})
</script>

<template>
  <div class="sendbox-shell">
    <div v-if="!isMobile" class="sendbox-desktop">
      <section class="send-list-panel" :style="{ flex: `0 0 ${desktopListWidth}` }">
        <div class="panel-header">
          <div class="toolbar-copy">
            <span class="toolbar-kicker">{{ t('sendbox') }}</span>
            <strong>{{ headerSummary }}</strong>
          </div>
          <div class="toolbar-actions">
            <n-button
              v-if="showMultiActionMode"
              round
              quaternary
              size="small"
              @click="multiActionModeClick(!multiActionMode)"
            >
              {{ multiActionMode ? t('cancelMultiAction') : t('multiAction') }}
            </n-button>
            <n-button circle quaternary size="small" :aria-label="t('refresh')" @click="refresh">
              <template #icon>
                <n-icon :component="RefreshRound" />
              </template>
            </n-button>
          </div>
        </div>

        <div v-if="multiActionMode" class="selection-bar">
          <span class="selection-copy">{{ t('selectedCount', { count: selectedCount }) }}</span>
          <div class="selection-actions">
            <n-button size="small" secondary @click="multiActionSelectAll(true)">
              {{ t('selectAll') }}
            </n-button>
            <n-button size="small" secondary @click="multiActionSelectAll(false)">
              {{ t('unselectAll') }}
            </n-button>
            <n-popconfirm v-if="enableUserDeleteEmail" @positive-click="multiActionDeleteMail">
              <template #trigger>
                <n-button size="small" tertiary type="error">
                  {{ t('delete') }}
                </n-button>
              </template>
              {{ t('deleteMailTip') }}
            </n-popconfirm>
          </div>
        </div>

        <div v-else class="panel-controls">
          <n-pagination
            v-model:page="page"
            v-model:page-size="pageSize"
            :item-count="count"
            :page-sizes="[20, 50, 100]"
            simple
            show-size-picker
          />
        </div>

        <div class="mail-list-scroll">
          <div class="mail-list">
            <div
              v-for="row in data"
              :key="row.id"
              class="mail-row-shell"
              :class="{ selected: curMail && row.id === curMail.id }"
            >
              <n-checkbox v-if="multiActionMode" v-model:checked="row.checked" class="row-checkbox" />
              <div
                class="mail-row"
                role="button"
                tabindex="0"
                @click="() => clickRow(row)"
                @keydown.enter.prevent="clickRow(row)"
                @keydown.space.prevent="clickRow(row)"
              >
                <div class="mail-avatar" :style="{ background: getAvatarColor(getPrimaryRecipient(row)) }">
                  {{ getSenderInitial(getPrimaryRecipient(row)) }}
                </div>
                <div class="mail-row-content">
                  <div class="mail-row-header">
                    <span class="mail-row-sender">{{ getPrimaryRecipient(row) }}</span>
                    <span class="mail-row-time">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
                  </div>
                  <div class="mail-row-subject">{{ row.subject || '(no subject)' }}</div>
                  <div class="mail-row-preview">{{ getRowPreview(row) }}</div>
                </div>
              </div>
            </div>

            <div v-if="data.length === 0" class="mail-empty">
              <n-icon :component="SendRound" :size="52" color="var(--ds-text-secondary)" />
              <n-text depth="3">{{ t('emptySent') }}</n-text>
            </div>
          </div>
        </div>
      </section>

      <section class="send-detail-panel">
        <div v-if="curMail" class="detail-header">
          <div class="detail-copy">
            <span class="toolbar-kicker">{{ t('toLabel') }}</span>
            <h2>{{ curMail.subject || '(no subject)' }}</h2>
            <div class="detail-meta">
              <span>{{ utcToLocalDate(curMail.created_at, useUTCDate) }}</span>
              <span>{{ `${t('toLabel')}: ${curMail.to_mail || '-'}` }}</span>
              <span v-if="showEMailFrom">{{ `${t('fromLabel')}: ${curMail.address}` }}</span>
            </div>
          </div>
          <div class="detail-actions">
            <n-button quaternary size="small" @click="showCode = !showCode">
              <template #icon>
                <n-icon :component="CodeRound" />
              </template>
              {{ showCode ? t('renderedMessage') : t('originalCode') }}
            </n-button>
            <n-popconfirm v-if="enableUserDeleteEmail" @positive-click="deleteMail">
              <template #trigger>
                <n-button tertiary type="error" size="small">{{ t('delete') }}</n-button>
              </template>
              {{ t('deleteMailTip') }}
            </n-popconfirm>
          </div>
        </div>

        <div v-if="curMail" class="mail-detail-scroll">
          <pre v-if="showCode" class="detail-pre">{{ curMail.raw }}</pre>
          <pre v-else-if="!curMail.is_html" class="detail-pre">{{ curMail.content }}</pre>
          <div v-else class="detail-html" v-html="safeCurMailHtml"></div>
        </div>
        <div v-else class="mail-empty detail-state">
          <n-icon :component="SendRound" :size="64" color="var(--ds-text-secondary)" />
          <n-text depth="3">{{ count === 0 ? t('emptySent') : t('pleaseSelectMail') }}</n-text>
        </div>
      </section>
    </div>

    <div v-else class="sendbox-mobile">
      <div class="mobile-toolbar">
        <div class="toolbar-copy">
          <span class="toolbar-kicker">{{ t('sendbox') }}</span>
          <strong>{{ headerSummary }}</strong>
        </div>
        <n-button circle quaternary size="small" :aria-label="t('refresh')" @click="refresh">
          <template #icon>
            <n-icon :component="RefreshRound" />
          </template>
        </n-button>
      </div>

      <div class="mobile-status-row">
        <n-pagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="count"
          simple
          size="small"
        />
      </div>

      <div class="mobile-list">
        <div
          v-for="row in data"
          :key="row.id"
          class="mail-row mobile-row"
          :class="{ selected: curMail && row.id === curMail.id }"
          role="button"
          tabindex="0"
          @click="() => clickRow(row)"
          @keydown.enter.prevent="clickRow(row)"
          @keydown.space.prevent="clickRow(row)"
        >
          <div class="mail-avatar" :style="{ background: getAvatarColor(getPrimaryRecipient(row)) }">
            {{ getSenderInitial(getPrimaryRecipient(row)) }}
          </div>
          <div class="mail-row-content">
            <div class="mail-row-header">
              <span class="mail-row-sender">{{ getPrimaryRecipient(row) }}</span>
              <span class="mail-row-time">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
            </div>
            <div class="mail-row-subject">{{ row.subject || '(no subject)' }}</div>
            <div class="mail-row-preview">{{ getRowPreview(row) }}</div>
          </div>
        </div>

        <div v-if="data.length === 0" class="mail-empty mobile-empty">
          <n-icon :component="SendRound" :size="48" color="var(--ds-text-secondary)" />
          <n-text depth="3">{{ t('emptySent') }}</n-text>
        </div>
      </div>

      <n-drawer
        v-model:show="showMobileMailDrawer"
        width="100%"
        placement="bottom"
        :trap-focus="false"
        :block-scroll="false"
        style="height: min(88vh, 760px);"
      >
        <n-drawer-content :title="curMail ? curMail.subject : ''" closable>
          <div v-if="curMail" class="mobile-detail-sheet">
            <div class="detail-meta mobile-detail-meta">
              <span>{{ utcToLocalDate(curMail.created_at, useUTCDate) }}</span>
              <span>{{ `${t('toLabel')}: ${curMail.to_mail || '-'}` }}</span>
              <span v-if="showEMailFrom">{{ `${t('fromLabel')}: ${curMail.address}` }}</span>
            </div>
            <div class="detail-actions">
              <n-button quaternary size="small" @click="showCode = !showCode">
                <template #icon>
                  <n-icon :component="CodeRound" />
                </template>
                {{ showCode ? t('renderedMessage') : t('originalCode') }}
              </n-button>
              <n-popconfirm v-if="enableUserDeleteEmail" @positive-click="deleteMail">
                <template #trigger>
                  <n-button tertiary type="error" size="small">{{ t('delete') }}</n-button>
                </template>
                {{ t('deleteMailTip') }}
              </n-popconfirm>
            </div>
            <pre v-if="showCode" class="detail-pre">{{ curMail.raw }}</pre>
            <pre v-else-if="!curMail.is_html" class="detail-pre">{{ curMail.content }}</pre>
            <div v-else class="detail-html" v-html="safeCurMailHtml"></div>
          </div>
        </n-drawer-content>
      </n-drawer>
    </div>

    <n-modal
      v-model:show="showMultiActionDelete"
      preset="dialog"
      :title="`${t('delete')}${t('success')}`"
      negative-text="OK"
    >
      <n-space justify="center">
        <n-progress type="circle" status="error" :percentage="multiActionDeleteProgress.percentage">
          <span style="text-align: center;">
            {{ multiActionDeleteProgress.tip }}
          </span>
        </n-progress>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.sendbox-shell {
  min-width: 0;
}

.sendbox-desktop {
  display: flex;
  gap: 18px;
  height: min(840px, calc(100vh - 188px));
  min-height: 620px;
}

.send-list-panel,
.send-detail-panel,
.mobile-toolbar,
.mobile-status-row {
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(18px);
  box-shadow: var(--ds-shadow-md);
}

.send-list-panel,
.send-detail-panel {
  overflow: hidden;
}

.send-detail-panel {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel-header,
.panel-controls,
.selection-bar,
.detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  border-bottom: 1px solid var(--ds-border);
  background: color-mix(in srgb, var(--ds-surface-soft) 84%, transparent);
}

.panel-controls,
.selection-bar {
  padding-top: 14px;
  padding-bottom: 14px;
}

.toolbar-copy {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.toolbar-kicker {
  color: var(--ds-primary);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.toolbar-copy strong {
  font-size: 15px;
  letter-spacing: -0.02em;
}

.toolbar-actions,
.selection-actions,
.detail-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.selection-copy {
  color: var(--ds-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.mail-list-scroll,
.mail-detail-scroll {
  overflow-y: auto;
}

.mail-list-scroll {
  flex: 1;
  padding: 10px;
}

.mail-list {
  display: grid;
  gap: 8px;
}

.mail-row-shell {
  display: flex;
  align-items: stretch;
  gap: 10px;
}

.row-checkbox {
  align-self: center;
  padding-left: 6px;
}

.mail-row {
  width: 100%;
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 14px 14px 13px;
  border: 1px solid transparent;
  border-radius: 18px;
  background: transparent;
  cursor: pointer;
  transition:
    transform var(--ds-motion-fast) var(--ds-ease-standard),
    background-color var(--ds-motion-fast) var(--ds-ease-standard),
    border-color var(--ds-motion-fast) var(--ds-ease-standard),
    box-shadow var(--ds-motion-fast) var(--ds-ease-standard);
}

.mail-row-shell.selected .mail-row,
.mail-row.selected {
  background: color-mix(in srgb, var(--ds-surface-active) 88%, var(--ds-surface-strong) 12%);
  border-color: color-mix(in srgb, var(--ds-primary) 20%, var(--ds-border));
  box-shadow: var(--ds-shadow-sm);
}

.mail-avatar {
  width: 40px;
  height: 40px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  flex-shrink: 0;
  box-shadow: inset 0 -8px 18px rgba(15, 23, 42, 0.12);
}

.mail-row-content {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.mail-row-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.mail-row-sender {
  font-weight: 700;
  font-size: 14px;
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-row-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--ds-text-muted);
}

.mail-row-subject {
  font-size: 13px;
  font-weight: 600;
  color: var(--ds-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-row-preview {
  color: var(--ds-text-muted);
  font-size: 12px;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.detail-header {
  position: relative;
  z-index: 1;
}

.detail-copy {
  min-width: 0;
  display: grid;
  gap: 6px;
}

.detail-copy h2 {
  margin: 0;
  font-size: clamp(22px, 2vw, 28px);
  line-height: 1.1;
  letter-spacing: -0.03em;
}

.detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  color: var(--ds-text-secondary);
  font-size: 12px;
  font-weight: 600;
}

.mail-detail-scroll {
  flex: 1;
  padding: 20px 24px 24px;
}

.detail-pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--ds-text);
  font-family: inherit;
}

.detail-html {
  color: var(--ds-text);
}

.mail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  min-height: 220px;
  padding: 60px 20px;
}

.detail-state {
  flex: 1;
}

.sendbox-mobile {
  display: grid;
  gap: 12px;
}

.mobile-toolbar,
.mobile-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
}

.mobile-list {
  display: grid;
  gap: 8px;
}

.mobile-row {
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(16px);
  box-shadow: var(--ds-shadow-sm);
}

.mobile-empty {
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-lg);
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(16px);
}

.mobile-detail-sheet {
  display: grid;
  gap: 16px;
}

.mobile-detail-meta {
  padding-bottom: 4px;
}

@media (hover: hover) and (pointer: fine) {
  .mail-row:hover,
  .mail-row:focus-visible {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--ds-surface-soft) 92%, transparent);
    border-color: var(--ds-border);
    box-shadow: var(--ds-shadow-sm);
  }
}

@media (max-width: 1024px) {
  .sendbox-desktop {
    gap: 14px;
    height: calc(100vh - 176px);
  }

  .panel-header,
  .panel-controls,
  .selection-bar,
  .detail-header {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
