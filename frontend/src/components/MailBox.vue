<script setup>
import { watch, onMounted, ref, onBeforeUnmount, computed } from 'vue'
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import {
  CloudDownloadRound,
  ArrowBackIosNewFilled,
  ArrowForwardIosFilled,
  InboxRound,
  RefreshRound,
} from '@vicons/material'
import { useGlobalState } from '../store'
import { useIsMobile } from '../utils/composables'
import { processItem, revokeMailObjectUrls } from '../utils/email-parser'
import { getRouterPathWithLang, utcToLocalDate } from '../utils'
import MailContentRenderer from './MailContentRenderer.vue'
import AiExtractInfo from './AiExtractInfo.vue'

const message = useMessage()
const isMobile = useIsMobile()
const router = useRouter()

const props = defineProps({
  enableUserDeleteEmail: {
    type: Boolean,
    default: false,
    required: false,
  },
  showEMailTo: {
    type: Boolean,
    default: true,
    required: false,
  },
  fetchMailData: {
    type: Function,
    default: () => {},
    required: true,
  },
  fetchMailDetail: {
    type: Function,
    default: null,
    required: false,
  },
  deleteMail: {
    type: Function,
    default: () => {},
    required: false,
  },
  showReply: {
    type: Boolean,
    default: false,
    required: false,
  },
  showSaveS3: {
    type: Boolean,
    default: false,
    required: false,
  },
  saveToS3: {
    type: Function,
    default: () => {},
    required: false,
  },
  showFilterInput: {
    type: Boolean,
    default: false,
    required: false,
  },
})

const localFilterKeyword = ref('')

const {
  mailboxSplitSize,
  loading,
  useUTCDate,
  autoRefresh,
  configAutoRefreshInterval,
  sendMailModel,
} = useGlobalState()
const autoRefreshInterval = ref(configAutoRefreshInterval.value)
const rawData = ref([])
const timer = ref(null)
const selectedMailId = ref(null)
const detailLoading = ref(false)
let detailRequestSerial = 0

const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

const data = computed(() => {
  if (!localFilterKeyword.value || localFilterKeyword.value.trim() === '') {
    return rawData.value
  }
  const keyword = localFilterKeyword.value.toLowerCase()
  return rawData.value.filter((mail) => {
    const searchFields = [
      mail.subject || '',
      mail.source || '',
      mail.address || '',
      mail.text || '',
      mail.message || '',
    ].map((field) => field.toLowerCase())
    return searchFields.some((field) => field.includes(keyword))
  })
})

const selectedCount = computed(() => data.value.filter((item) => item.checked).length)

const canGoPrevMail = computed(() => {
  if (!selectedMailId.value) return false
  const currentIndex = data.value.findIndex((mail) => mail.id === selectedMailId.value)
  return currentIndex > 0 || page.value > 1
})

const canGoNextMail = computed(() => {
  if (!selectedMailId.value) return false
  const currentIndex = data.value.findIndex((mail) => mail.id === selectedMailId.value)
  return currentIndex < data.value.length - 1 || count.value > page.value * pageSize.value
})

const curMail = ref(null)
const showMobileMailDrawer = computed({
  get: () => !!curMail.value,
  set: (show) => {
    if (!show) {
      setCurrentMail(null)
    }
  },
})

const multiActionMode = ref(false)
const showMultiActionDownload = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDownloadZip = ref({})
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })

const { locale, t } = useI18n({
  messages: {
    en: {
      success: 'Success',
      autoRefresh: 'Auto refresh',
      refreshAfter: 'Refresh in {msg}s',
      refresh: 'Refresh',
      attachments: 'Show Attachments',
      downloadMail: 'Download Mail',
      pleaseSelectMail: 'Select a mail to read',
      emptyInbox: 'Your inbox is empty',
      delete: 'Delete',
      deleteMailTip: 'Are you sure you want to delete mail?',
      reply: 'Reply',
      forwardMail: 'Forward',
      showTextMail: 'Show Text Mail',
      showHtmlMail: 'Show Html Mail',
      saveToS3: 'Save to S3',
      multiAction: 'Multi-select',
      cancelMultiAction: 'Done',
      selectAll: 'Select page',
      unselectAll: 'Clear',
      prevMail: 'Previous',
      nextMail: 'Next',
      keywordQueryTip: 'Filter current page',
      query: 'Query',
      mailbox: 'Inbox workspace',
      ready: 'List and detail stay in sync',
      inboxCount: '{count} mails available',
      filteredResults: '{visible}/{total} visible on this page',
      selectedCount: '{count} selected',
      previewUnavailable: 'No preview available',
    },
    zh: {
      success: '成功',
      autoRefresh: '自动刷新',
      refreshAfter: '{msg} 秒后刷新',
      refresh: '刷新',
      downloadMail: '下载邮件',
      attachments: '查看附件',
      pleaseSelectMail: '选择一封邮件开始阅读',
      emptyInbox: '收件箱为空',
      delete: '删除',
      deleteMailTip: '确定要删除邮件吗?',
      reply: '回复',
      forwardMail: '转发',
      showTextMail: '显示纯文本邮件',
      showHtmlMail: '显示 HTML 邮件',
      saveToS3: '保存到 S3',
      multiAction: '多选',
      cancelMultiAction: '完成',
      selectAll: '全选本页',
      unselectAll: '取消全选',
      prevMail: '上一封',
      nextMail: '下一封',
      keywordQueryTip: '过滤当前页',
      query: '查询',
      mailbox: '收件箱工作区',
      ready: '列表与详情保持同步',
      inboxCount: '共 {count} 封邮件',
      filteredResults: '当前页显示 {visible}/{total}',
      selectedCount: '已选择 {count} 封',
      previewUnavailable: '暂无预览内容',
    },
  },
})

const desktopListWidth = computed(() => {
  const rawPercent = Number(mailboxSplitSize.value || 0.36) * 100
  const percent = Math.min(Math.max(Math.round(rawPercent), 34), 40)
  return `clamp(360px, ${percent}%, 420px)`
})

const headerSummary = computed(() => {
  if (localFilterKeyword.value.trim()) {
    return t('filteredResults', { visible: data.value.length, total: rawData.value.length })
  }
  if (count.value > 0) {
    return t('inboxCount', { count: count.value })
  }
  return t('ready')
})

const detailTimestamp = computed(() => {
  if (!curMail.value?.created_at) return ''
  return utcToLocalDate(curMail.value.created_at, useUTCDate.value)
})

const setCurrentMail = (mail) => {
  if (curMail.value) {
    revokeMailObjectUrls(curMail.value)
  }
  curMail.value = mail
}

const getMailDetailById = async (id, fallback) => {
  if (typeof props.fetchMailDetail === 'function') {
    return await props.fetchMailDetail(id)
  }
  return fallback?.raw ? fallback : null
}

const openMail = async (row) => {
  if (!row?.id) return
  selectedMailId.value = row.id
  detailLoading.value = true
  const requestId = ++detailRequestSerial
  try {
    const mailDetail = await getMailDetailById(row.id, row)
    if (!mailDetail) {
      if (requestId === detailRequestSerial) {
        setCurrentMail(null)
      }
      return
    }
    const parsedMail = mailDetail.raw
      ? await processItem({ ...mailDetail, checked: row.checked })
      : { ...mailDetail, checked: row.checked }
    if (requestId !== detailRequestSerial) {
      revokeMailObjectUrls(parsedMail)
      return
    }
    setCurrentMail(parsedMail)
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    if (requestId === detailRequestSerial) {
      detailLoading.value = false
    }
  }
}

const prevMail = async () => {
  if (!canGoPrevMail.value) return
  const currentIndex = data.value.findIndex((mail) => mail.id === selectedMailId.value)

  if (currentIndex > 0) {
    await openMail(data.value[currentIndex - 1])
  } else if (page.value > 1) {
    page.value--
    await refresh()
    if (data.value.length > 0) {
      await openMail(data.value[data.value.length - 1])
    }
  }
}

const nextMail = async () => {
  if (!canGoNextMail.value) return
  const currentIndex = data.value.findIndex((mail) => mail.id === selectedMailId.value)

  if (currentIndex < data.value.length - 1) {
    await openMail(data.value[currentIndex + 1])
  } else if (count.value > page.value * pageSize.value) {
    page.value++
    await refresh()
    if (data.value.length > 0) {
      await openMail(data.value[0])
    }
  }
}

const getAvatarColor = (name) => {
  const colors = ['#2F6FED', '#4F46E5', '#EC4899', '#F59E0B', '#10B981', '#0891B2', '#F97316', '#6366F1']
  if (!name) return colors[0]
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

const getSenderInitial = (source) => {
  if (!source) return '?'
  const name = source.split('<')[0].trim().split('@')[0]
  return (name[0] || '?').toUpperCase()
}

const getSenderName = (source) => {
  if (!source) return ''
  const match = source.match(/^(.+?)\s*</)
  if (match) return match[1].trim()
  return source.split('@')[0]
}

const getRowPreview = (row) => {
  const content = `${row.text || row.message || ''}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!content) return t('previewUnavailable')
  return content.length > 110 ? `${content.slice(0, 110)}...` : content
}

const setupAutoRefresh = (enabled) => {
  autoRefreshInterval.value = configAutoRefreshInterval.value
  if (enabled) {
    clearInterval(timer.value)
    timer.value = setInterval(async () => {
      if (loading.value) return
      autoRefreshInterval.value--
      if (autoRefreshInterval.value <= 0) {
        autoRefreshInterval.value = configAutoRefreshInterval.value
        await backFirstPageAndRefresh()
      }
    }, 1000)
  } else {
    clearInterval(timer.value)
    timer.value = null
  }
}

watch(autoRefresh, (enabled) => {
  setupAutoRefresh(enabled)
}, { immediate: true })

watch([page, pageSize], async ([currentPage, currentPageSize], [oldPage, oldPageSize]) => {
  if (currentPage !== oldPage || currentPageSize !== oldPageSize) {
    await refresh()
  }
})

watch(localFilterKeyword, async () => {
  if (selectedMailId.value && data.value.some((mail) => mail.id === selectedMailId.value)) {
    return
  }
  selectedMailId.value = null
  setCurrentMail(null)
  if (!isMobile.value && data.value.length > 0) {
    await openMail(data.value[0])
  }
})

const refresh = async () => {
  detailRequestSerial += 1
  detailLoading.value = false
  loading.value = true
  try {
    const { results, count: totalCount } = await props.fetchMailData(
      pageSize.value,
      (page.value - 1) * pageSize.value,
    )
    rawData.value = results.map((item) => ({
      ...item,
      checked: false,
    }))
    if (typeof totalCount === 'number') {
      count.value = totalCount
    }
    selectedMailId.value = null
    setCurrentMail(null)
    if (!isMobile.value && data.value.length > 0) {
      await openMail(data.value[0])
    }
  } catch (error) {
    message.error(error.message || 'error')
    console.error(error)
  } finally {
    loading.value = false
  }
}

const backFirstPageAndRefresh = async () => {
  page.value = 1
  await refresh()
}

const clickRow = async (row) => {
  if (multiActionMode.value) {
    row.checked = !row.checked
    return
  }
  await openMail(row)
}

const deleteMail = async () => {
  try {
    await props.deleteMail(curMail.value.id)
    message.success(t('success'))
    selectedMailId.value = null
    setCurrentMail(null)
    await refresh()
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const replyMail = async () => {
  const emailRegex = /(.+?) <(.+?)>/
  let toMail = curMail.value.originalSource
  let toName = ''
  const match = emailRegex.exec(curMail.value.source)
  if (match) {
    toName = match[1]
    toMail = match[2]
  }
  Object.assign(sendMailModel.value, {
    toName,
    toMail,
    subject: `${t('reply')}: ${curMail.value.subject}`,
    contentType: 'rich',
    content: curMail.value.text ? `<p><br></p><blockquote>${curMail.value.text}</blockquote><p><br></p>` : '',
  })
  await router.push(getRouterPathWithLang('/compose', locale.value))
}

const forwardMail = async () => {
  Object.assign(sendMailModel.value, {
    subject: `${t('forwardMail')}: ${curMail.value.subject}`,
    contentType: curMail.value.message ? 'html' : 'text',
    content: curMail.value.message || curMail.value.text,
  })
  await router.push(getRouterPathWithLang('/compose', locale.value))
}

const saveToS3Proxy = async (filename, blob) => {
  await props.saveToS3(curMail.value.id, filename, blob)
}

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

const getMailRawForDownload = async (mail) => {
  if (mail?.raw) {
    return mail.raw
  }
  if (typeof props.fetchMailDetail !== 'function') {
    throw new Error('Mail detail is unavailable')
  }
  const detail = await props.fetchMailDetail(mail.id)
  if (!detail?.raw) {
    throw new Error('Mail raw data is unavailable')
  }
  return detail.raw
}

const multiActionDownload = async () => {
  try {
    loading.value = true
    const selectedMails = data.value.filter((item) => item.checked)
    if (selectedMails.length === 0) {
      message.error(t('pleaseSelectMail'))
      return
    }
    const JSZipModule = await import('jszip')
    const JSZip = JSZipModule.default
    const zip = new JSZip()
    for (const mail of selectedMails) {
      const raw = await getMailRawForDownload(mail)
      zip.file(`${mail.id}.eml`, raw)
    }
    if (multiActionDownloadZip.value.url) {
      try {
        URL.revokeObjectURL(multiActionDownloadZip.value.url)
      } catch {
        // Ignore invalid URL errors.
      }
    }
    multiActionDownloadZip.value = {
      url: URL.createObjectURL(await zip.generateAsync({ type: 'blob' })),
      filename: `mails-${new Date().toISOString().replace(/:/g, '-')}.zip`,
    }
    showMultiActionDownload.value = true
  } catch (error) {
    message.error(error.message || 'error')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await refresh()
})

onBeforeUnmount(() => {
  detailRequestSerial += 1
  clearInterval(timer.value)
  setCurrentMail(null)
  if (multiActionDownloadZip.value.url) {
    try {
      URL.revokeObjectURL(multiActionDownloadZip.value.url)
    } catch {
      // Ignore invalid URL errors.
    }
  }
})
</script>

<template>
  <div class="mailbox-shell">
    <div v-if="!isMobile" class="mailbox-desktop">
      <section class="mail-list-panel" :style="{ flex: `0 0 ${desktopListWidth}` }">
        <div class="panel-header">
          <div class="toolbar-copy">
            <span class="toolbar-kicker">{{ t('mailbox') }}</span>
            <strong>{{ headerSummary }}</strong>
          </div>
          <div class="toolbar-actions">
            <n-button round quaternary size="small" @click="multiActionModeClick(!multiActionMode)">
              {{ multiActionMode ? t('cancelMultiAction') : t('multiAction') }}
            </n-button>
            <n-button circle quaternary size="small" :aria-label="t('refresh')" @click="backFirstPageAndRefresh">
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
            <n-button size="small" tertiary type="info" @click="multiActionDownload">
              <template #icon>
                <n-icon :component="CloudDownloadRound" />
              </template>
              {{ t('downloadMail') }}
            </n-button>
          </div>
        </div>

        <div v-else class="panel-controls">
          <n-input
            v-if="showFilterInput"
            v-model:value="localFilterKeyword"
            clearable
            class="filter-input"
            :placeholder="t('keywordQueryTip')"
          />
          <div class="panel-status">
            <n-pagination
              v-model:page="page"
              v-model:page-size="pageSize"
              :item-count="count"
              :page-sizes="[20, 50, 100]"
              simple
              show-size-picker
            />
            <button
              type="button"
              class="status-pill"
              :class="{ active: autoRefresh }"
              @click="autoRefresh = !autoRefresh; backFirstPageAndRefresh()"
            >
              <n-icon :component="RefreshRound" />
              <span>{{ autoRefresh ? t('refreshAfter', { msg: autoRefreshInterval }) : t('autoRefresh') }}</span>
            </button>
          </div>
        </div>

        <div class="mail-list-scroll">
          <div class="mail-list">
            <div
              v-for="row in data"
              :key="row.id"
              class="mail-row-shell"
              :class="{ selected: selectedMailId && row.id === selectedMailId }"
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
                <div class="mail-avatar" :style="{ background: getAvatarColor(row.source) }">
                  {{ getSenderInitial(row.source) }}
                </div>
                <div class="mail-row-content">
                  <div class="mail-row-header">
                    <span class="mail-row-sender">{{ getSenderName(row.source) }}</span>
                    <span class="mail-row-time">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
                  </div>
                  <div class="mail-row-subject">{{ row.subject || '(no subject)' }}</div>
                  <div class="mail-row-preview">{{ getRowPreview(row) }}</div>
                  <AiExtractInfo :metadata="row.metadata" compact class="mail-row-meta" />
                </div>
              </div>
            </div>

            <div v-if="data.length === 0" class="mail-empty">
              <n-icon :component="InboxRound" :size="52" color="var(--ds-text-secondary)" />
              <n-text depth="3">{{ t('emptyInbox') }}</n-text>
            </div>
          </div>
        </div>
      </section>

      <section class="mail-detail-panel">
        <div v-if="curMail" class="detail-header">
          <div class="detail-copy">
            <span class="toolbar-kicker">{{ getSenderName(curMail.source) }}</span>
            <h2>{{ curMail.subject || '(no subject)' }}</h2>
            <div class="detail-meta">
              <span>{{ detailTimestamp }}</span>
              <span v-if="showEMailTo && curMail.address">{{ curMail.address }}</span>
            </div>
          </div>
          <div class="detail-nav">
            <n-button round quaternary size="small" :disabled="!canGoPrevMail" @click="prevMail">
              <template #icon>
                <n-icon :component="ArrowBackIosNewFilled" />
              </template>
              {{ t('prevMail') }}
            </n-button>
            <n-button round quaternary size="small" :disabled="!canGoNextMail" @click="nextMail">
              {{ t('nextMail') }}
              <template #icon>
                <n-icon :component="ArrowForwardIosFilled" />
              </template>
            </n-button>
          </div>
        </div>

        <Transition name="detail-fade" mode="out-in">
          <div v-if="detailLoading" key="loading" class="mail-empty detail-state">
            <n-spin size="small" />
          </div>
          <div v-else-if="curMail" key="mail" class="mail-detail-scroll">
            <MailContentRenderer
              :mail="curMail"
              :showEMailTo="showEMailTo"
              :enableUserDeleteEmail="enableUserDeleteEmail"
              :showReply="showReply"
              :showSaveS3="showSaveS3"
              :onDelete="deleteMail"
              :onReply="replyMail"
              :onForward="forwardMail"
              :onSaveToS3="saveToS3Proxy"
            />
          </div>
          <div v-else key="empty" class="mail-empty detail-state">
            <n-icon :component="InboxRound" :size="64" color="var(--ds-text-secondary)" />
            <n-text depth="3">{{ count === 0 ? t('emptyInbox') : t('pleaseSelectMail') }}</n-text>
          </div>
        </Transition>
      </section>
    </div>

    <div v-else class="mailbox-mobile">
      <div class="mobile-toolbar">
        <div class="toolbar-copy">
          <span class="toolbar-kicker">{{ t('mailbox') }}</span>
          <strong>{{ headerSummary }}</strong>
        </div>
        <n-button circle quaternary size="small" :aria-label="t('refresh')" @click="backFirstPageAndRefresh">
          <template #icon>
            <n-icon :component="RefreshRound" />
          </template>
        </n-button>
      </div>

      <div v-if="showFilterInput" class="panel-controls mobile-controls">
        <n-input
          v-model:value="localFilterKeyword"
          clearable
          class="filter-input"
          :placeholder="t('keywordQueryTip')"
        />
      </div>

      <div class="mobile-status-row">
        <n-pagination
          v-model:page="page"
          v-model:page-size="pageSize"
          :item-count="count"
          simple
          size="small"
        />
        <button
          type="button"
          class="status-pill"
          :class="{ active: autoRefresh }"
          @click="autoRefresh = !autoRefresh; backFirstPageAndRefresh()"
        >
          <n-icon :component="RefreshRound" />
          <span>{{ autoRefresh ? t('refreshAfter', { msg: autoRefreshInterval }) : t('autoRefresh') }}</span>
        </button>
      </div>

      <div class="mobile-list">
        <div
          v-for="row in data"
          :key="row.id"
          class="mail-row mobile-row"
          :class="{ selected: selectedMailId && row.id === selectedMailId }"
          role="button"
          tabindex="0"
          @click="() => clickRow(row)"
          @keydown.enter.prevent="clickRow(row)"
          @keydown.space.prevent="clickRow(row)"
        >
          <div class="mail-avatar" :style="{ background: getAvatarColor(row.source) }">
            {{ getSenderInitial(row.source) }}
          </div>
          <div class="mail-row-content">
            <div class="mail-row-header">
              <span class="mail-row-sender">{{ getSenderName(row.source) }}</span>
              <span class="mail-row-time">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
            </div>
            <div class="mail-row-subject">{{ row.subject || '(no subject)' }}</div>
            <div class="mail-row-preview">{{ getRowPreview(row) }}</div>
            <AiExtractInfo :metadata="row.metadata" compact class="mail-row-meta" />
          </div>
        </div>

        <div v-if="data.length === 0" class="mail-empty mobile-empty">
          <n-icon :component="InboxRound" :size="48" color="var(--ds-text-secondary)" />
          <n-text depth="3">{{ t('emptyInbox') }}</n-text>
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
              <span>{{ detailTimestamp }}</span>
              <span v-if="showEMailTo && curMail.address">{{ curMail.address }}</span>
            </div>
            <MailContentRenderer
              :mail="curMail"
              :showEMailTo="showEMailTo"
              :enableUserDeleteEmail="enableUserDeleteEmail"
              :showReply="showReply"
              :showSaveS3="showSaveS3"
              :onDelete="deleteMail"
              :onReply="replyMail"
              :onForward="forwardMail"
              :onSaveToS3="saveToS3Proxy"
            />
          </div>
        </n-drawer-content>
      </n-drawer>
    </div>

    <n-modal v-model:show="showMultiActionDownload" preset="dialog" :title="t('downloadMail')">
      <n-tag type="info">
        {{ multiActionDownloadZip.filename }}
      </n-tag>
      <n-button
        tag="a"
        target="_blank"
        tertiary
        type="info"
        size="small"
        :download="multiActionDownloadZip.filename"
        :href="multiActionDownloadZip.url"
      >
        <n-icon :component="CloudDownloadRound" />
        {{ `${t('downloadMail')} zip` }}
      </n-button>
    </n-modal>

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
.mailbox-shell {
  min-width: 0;
}

.mailbox-desktop {
  display: flex;
  gap: 18px;
  height: min(840px, calc(100vh - 188px));
  min-height: 620px;
}

.mail-list-panel,
.mail-detail-panel,
.mobile-toolbar,
.mobile-status-row,
.mobile-controls {
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius-xl);
  background: var(--ds-surface-overlay);
  backdrop-filter: blur(18px);
  box-shadow: var(--ds-shadow-md);
}

.mail-list-panel,
.mail-detail-panel {
  overflow: hidden;
}

.mail-detail-panel {
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
.panel-status,
.detail-nav {
  display: flex;
  align-items: center;
  gap: 10px;
}

.filter-input {
  flex: 1;
  min-width: 0;
}

.selection-copy {
  color: var(--ds-text-secondary);
  font-size: 13px;
  font-weight: 700;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  padding: 0 14px;
  border: 1px solid var(--ds-border);
  border-radius: 999px;
  background: var(--ds-surface-strong);
  color: var(--ds-text-secondary);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform var(--ds-motion-fast) var(--ds-ease-standard),
    border-color var(--ds-motion-fast) var(--ds-ease-standard),
    background-color var(--ds-motion-fast) var(--ds-ease-standard),
    color var(--ds-motion-fast) var(--ds-ease-standard),
    box-shadow var(--ds-motion-fast) var(--ds-ease-standard);
}

.status-pill.active {
  border-color: color-mix(in srgb, var(--ds-primary) 20%, var(--ds-border));
  background: color-mix(in srgb, var(--ds-primary-soft) 78%, var(--ds-surface-strong));
  color: var(--ds-primary);
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

.mail-row-meta {
  min-width: 0;
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

.mailbox-mobile {
  display: grid;
  gap: 12px;
}

.mobile-toolbar,
.mobile-status-row,
.mobile-controls {
  padding: 16px;
}

.mobile-toolbar,
.mobile-status-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.mobile-status-row {
  flex-wrap: wrap;
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

.detail-fade-enter-active,
.detail-fade-leave-active {
  transition:
    opacity var(--ds-motion-base) var(--ds-ease-standard),
    transform var(--ds-motion-base) var(--ds-ease-emphasized);
}

.detail-fade-enter-from,
.detail-fade-leave-to {
  opacity: 0;
  transform: translateX(10px);
}

@media (hover: hover) and (pointer: fine) {
  .mail-row:hover,
  .mail-row:focus-visible,
  .status-pill:hover,
  .status-pill:focus-visible {
    transform: translateY(-1px);
    box-shadow: var(--ds-shadow-sm);
  }

  .mail-row:hover,
  .mail-row:focus-visible {
    background: color-mix(in srgb, var(--ds-surface-soft) 92%, transparent);
    border-color: var(--ds-border);
  }

  .status-pill:hover,
  .status-pill:focus-visible {
    border-color: color-mix(in srgb, var(--ds-primary) 18%, var(--ds-border));
  }
}

@media (max-width: 1024px) {
  .mailbox-desktop {
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
