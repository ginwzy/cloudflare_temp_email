<script setup>
import { watch, onMounted, ref, onBeforeUnmount, computed } from "vue";
import { useMessage } from 'naive-ui'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useGlobalState } from '../store'
import { CloudDownloadRound, ArrowBackIosNewFilled, ArrowForwardIosFilled, InboxRound, RefreshRound } from '@vicons/material'
import { useIsMobile } from '../utils/composables'
import { processItem } from '../utils/email-parser'
import { utcToLocalDate } from '../utils';
import MailContentRenderer from "./MailContentRenderer.vue";
import AiExtractInfo from "./AiExtractInfo.vue";

const message = useMessage()
const isMobile = useIsMobile()
const router = useRouter()

const props = defineProps({
  enableUserDeleteEmail: {
    type: Boolean,
    default: false,
    required: false
  },
  showEMailTo: {
    type: Boolean,
    default: true,
    required: false
  },
  fetchMailData: {
    type: Function,
    default: () => { },
    required: true
  },
  deleteMail: {
    type: Function,
    default: () => { },
    required: false
  },
  showReply: {
    type: Boolean,
    default: false,
    required: false
  },
  showSaveS3: {
    type: Boolean,
    default: false,
    required: false
  },
  saveToS3: {
    type: Function,
    default: (mail_id, filename, blob) => { },
    required: false
  },
  showFilterInput: {
    type: Boolean,
    default: false,
    required: false
  },
})

const localFilterKeyword = ref('')

const {
  isDark, mailboxSplitSize, loading, useUTCDate,
  autoRefresh, configAutoRefreshInterval, sendMailModel
} = useGlobalState()
const autoRefreshInterval = ref(configAutoRefreshInterval.value)
const rawData = ref([])
const timer = ref(null)

const count = ref(0)
const page = ref(1)
const pageSize = ref(20)

// Computed property for filtered data (only filter current page)
const data = computed(() => {
  if (!localFilterKeyword.value || localFilterKeyword.value.trim() === '') {
    return rawData.value;
  }
  const keyword = localFilterKeyword.value.toLowerCase();
  return rawData.value.filter(mail => {
    // Search in subject, text, message fields
    const searchFields = [
      mail.subject || '',
      mail.text || '',
      mail.message || ''
    ].map(field => field.toLowerCase());
    return searchFields.some(field => field.includes(keyword));
  });
})

const canGoPrevMail = computed(() => {
  if (!curMail.value) return false
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  return currentIndex > 0 || page.value > 1
})

const canGoNextMail = computed(() => {
  if (!curMail.value) return false
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)
  return currentIndex < data.value.length - 1 || count.value > page.value * pageSize.value
})

const prevMail = async () => {
  if (!canGoPrevMail.value) return
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)

  if (currentIndex > 0) {
    curMail.value = data.value[currentIndex - 1]
  } else if (page.value > 1) {
    page.value--
    await refresh()
    if (data.value.length > 0) {
      curMail.value = data.value[data.value.length - 1]
    }
  }
}

const nextMail = async () => {
  if (!canGoNextMail.value) return
  const currentIndex = data.value.findIndex(mail => mail.id === curMail.value.id)

  if (currentIndex < data.value.length - 1) {
    curMail.value = data.value[currentIndex + 1]
  } else if (count.value > page.value * pageSize.value) {
    page.value++
    await refresh()
    if (data.value.length > 0) {
      curMail.value = data.value[0]
    }
  }
}

const curMail = ref(null);

const multiActionMode = ref(false)
const showMultiActionDownload = ref(false)
const showMultiActionDelete = ref(false)
const multiActionDownloadZip = ref({})
const multiActionDeleteProgress = ref({ percentage: 0, tip: '0/0' })

const { t } = useI18n({
  messages: {
    en: {
      success: 'Success',
      autoRefresh: 'Auto Refresh',
      refreshAfter: 'Refresh After {msg} Seconds',
      refresh: 'Refresh',
      attachments: 'Show Attachments',
      downloadMail: 'Download Mail',
      pleaseSelectMail: "Please select mail",
      emptyInbox: "Your inbox is empty",
      delete: 'Delete',
      deleteMailTip: 'Are you sure you want to delete mail?',
      reply: 'Reply',
      forwardMail: 'Forward',
      showTextMail: 'Show Text Mail',
      showHtmlMail: 'Show Html Mail',
      saveToS3: 'Save to S3',
      multiAction: 'Multi Action',
      cancelMultiAction: 'Cancel Multi Action',
      selectAll: 'Select All of This Page',
      unselectAll: 'Unselect All',
      prevMail: 'Previous',
      nextMail: 'Next',
      keywordQueryTip: 'Filter current page',
      query: 'Query',
    },
    zh: {
      success: '成功',
      autoRefresh: '自动刷新',
      refreshAfter: '{msg}秒后刷新',
      refresh: '刷新',
      downloadMail: '下载邮件',
      attachments: '查看附件',
      pleaseSelectMail: "请选择邮件",
      emptyInbox: "收件箱为空",
      delete: '删除',
      deleteMailTip: '确定要删除邮件吗?',
      reply: '回复',
      forwardMail: '转发',
      showTextMail: '显示纯文本邮件',
      showHtmlMail: '显示HTML邮件',
      saveToS3: '保存到S3',
      multiAction: '多选',
      cancelMultiAction: '取消多选',
      selectAll: '全选本页',
      unselectAll: '取消全选',
      prevMail: '上一封',
      nextMail: '下一封',
      keywordQueryTip: '过滤当前页',
      query: '查询',
    }
  }
});

const getAvatarColor = (name) => {
  const colors = ['#3B82F6','#8B5CF6','#EC4899','#F59E0B','#10B981','#06B6D4','#F97316','#6366F1']
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

const setupAutoRefresh = async (autoRefresh) => {
  // auto refresh every configAutoRefreshInterval seconds
  autoRefreshInterval.value = configAutoRefreshInterval.value;
  if (autoRefresh) {
    clearInterval(timer.value);
    timer.value = setInterval(async () => {
      if (loading.value) return;
      autoRefreshInterval.value--;
      if (autoRefreshInterval.value <= 0) {
        autoRefreshInterval.value = configAutoRefreshInterval.value;
        await backFirstPageAndRefresh();
      }
    }, 1000)
  } else {
    clearInterval(timer.value)
    timer.value = null
  }
}

watch(autoRefresh, async (autoRefresh, old) => {
  setupAutoRefresh(autoRefresh)
}, { immediate: true })

watch([page, pageSize], async ([page, pageSize], [oldPage, oldPageSize]) => {
  if (page !== oldPage || pageSize !== oldPageSize) {
    await refresh();
  }
})

const refresh = async () => {
  try {
    const { results, count: totalCount } = await props.fetchMailData(
      pageSize.value, (page.value - 1) * pageSize.value
    );
    loading.value = true;
    rawData.value = await Promise.all(results.map(async (item) => {
      item.checked = false;
      return await processItem(item);
    }));
    if (totalCount > 0) {
      count.value = totalCount;
    }
    curMail.value = null;
    if (!isMobile.value && data.value.length > 0) {
      curMail.value = data.value[0];
    }
  } catch (error) {
    message.error(error.message || "error");
    console.error(error);
  } finally {
    loading.value = false;
  }
};

const backFirstPageAndRefresh = async () => {
  page.value = 1;
  await refresh();
}

const clickRow = async (row) => {
  if (multiActionMode.value) {
    row.checked = !row.checked;
    return;
  }
  curMail.value = row;
};


const mailItemClass = (row) => {
  return curMail.value && row.id == curMail.value.id ? (isDark.value ? 'overlay overlay-dark-backgroud' : 'overlay overlay-light-backgroud') : '';
};

const deleteMail = async () => {
  try {
    await props.deleteMail(curMail.value.id);
    message.success(t("success"));
    curMail.value = null;
    await refresh();
  } catch (error) {
    message.error(error.message || "error");
  }
};

const replyMail = async () => {
  const emailRegex = /(.+?) <(.+?)>/;
  let toMail = curMail.value.originalSource;
  let toName = ""
  const match = emailRegex.exec(curMail.value.source);
  if (match) {
    toName = match[1];
    toMail = match[2];
  }
  Object.assign(sendMailModel.value, {
    toName: toName,
    toMail: toMail,
    subject: `${t('reply')}: ${curMail.value.subject}`,
    contentType: 'rich',
    content: curMail.value.text ? `<p><br></p><blockquote>${curMail.value.text}</blockquote><p><br></p>` : '',
  });
  router.push('/compose');
};

const forwardMail = async () => {
  Object.assign(sendMailModel.value, {
    subject: `${t('forwardMail')}: ${curMail.value.subject}`,
    contentType: curMail.value.message ? 'html' : 'text',
    content: curMail.value.message || curMail.value.text,
  });
  router.push('/compose');
};

const onSpiltSizeChange = (size) => {
  mailboxSplitSize.value = size;
}

const saveToS3Proxy = async (filename, blob) => {
  await props.saveToS3(curMail.value.id, filename, blob);
}

const multiActionModeClick = (enableMulti) => {
  if (enableMulti) {
    data.value.forEach((item) => {
      item.checked = false;
    });
    multiActionMode.value = true;
  } else {
    multiActionMode.value = false;
    data.value.forEach((item) => {
      item.checked = false;
    });
  }
}

const multiActionSelectAll = (checked) => {
  data.value.forEach((item) => {
    item.checked = checked;
  });
}

const multiActionDeleteMail = async () => {
  try {
    loading.value = true;
    const selectedMails = data.value.filter((item) => item.checked);
    if (selectedMails.length === 0) {
      message.error(t('pleaseSelectMail'));
      return;
    }
    multiActionDeleteProgress.value = {
      percentage: 0,
      tip: `0/${selectedMails.length}`
    };
    for (const [index, mail] of selectedMails.entries()) {
      await props.deleteMail(mail.id);
      showMultiActionDelete.value = true;
      multiActionDeleteProgress.value = {
        percentage: Math.floor((index + 1) / selectedMails.length * 100),
        tip: `${index + 1}/${selectedMails.length}`
      };
    }
    message.success(t("success"));
    await refresh();
  } catch (error) {
    message.error(error.message || "error");
  } finally {
    loading.value = false;
    showMultiActionDelete.value = true;
  }
}

const multiActionDownload = async () => {
  try {
    loading.value = true;
    const selectedMails = data.value.filter((item) => item.checked);
    if (selectedMails.length === 0) {
      message.error(t('pleaseSelectMail'));
      return;
    }
    const JSZipModlue = await import('jszip');
    const JSZip = JSZipModlue.default;
    const zip = new JSZip();
    for (const mail of selectedMails) {
      zip.file(`${mail.id}.eml`, mail.raw);
    }
    multiActionDownloadZip.value = {
      url: URL.createObjectURL(await zip.generateAsync({ type: "blob" })),
      filename: `mails-${new Date().toISOString().replace(/:/g, '-')}.zip`
    }
    showMultiActionDownload.value = true;
  } catch (error) {
    message.error(error.message || "error");
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  await refresh();
});

onBeforeUnmount(() => {
  clearInterval(timer.value)
})
</script>

<template>
  <div>
    <div v-if="!isMobile" class="left">
      <div style="margin-bottom: 10px;">
        <div v-if="multiActionMode" class="toolbar">
          <div class="toolbar-left">
            <n-button text size="small" @click="multiActionModeClick(false)">
              {{ t('cancelMultiAction') }}
            </n-button>
            <n-button text size="small" @click="multiActionSelectAll(true)">
              {{ t('selectAll') }}
            </n-button>
            <n-button text size="small" @click="multiActionSelectAll(false)">
              {{ t('unselectAll') }}
            </n-button>
          </div>
          <div class="toolbar-right">
            <n-popconfirm v-if="enableUserDeleteEmail" @positive-click="multiActionDeleteMail">
              <template #trigger>
                <n-button text size="small" type="error">{{ t('delete') }}</n-button>
              </template>
              {{ t('deleteMailTip') }}
            </n-popconfirm>
            <n-button text size="small" type="info" @click="multiActionDownload">
              <template #icon><n-icon :component="CloudDownloadRound" /></template>
              {{ t('downloadMail') }}
            </n-button>
          </div>
        </div>
        <div v-else class="toolbar">
          <div class="toolbar-left">
            <n-button text size="small" @click="multiActionModeClick(true)">
              {{ t('multiAction') }}
            </n-button>
          </div>
          <div class="toolbar-right">
            <n-input v-if="showFilterInput" v-model:value="localFilterKeyword"
              :placeholder="t('keywordQueryTip')" size="small" clearable
              style="width: 160px;" />
            <n-pagination v-model:page="page" v-model:page-size="pageSize"
              :item-count="count" :page-sizes="[20, 50, 100]" simple show-size-picker />
            <n-button text size="small" @click="autoRefresh = !autoRefresh; backFirstPageAndRefresh()"
              :type="autoRefresh ? 'primary' : 'default'">
              <template #icon><n-icon :component="RefreshRound" /></template>
            </n-button>
            <span v-if="autoRefresh" class="refresh-countdown">{{ autoRefreshInterval }}s</span>
          </div>
        </div>
      </div>
      <div class="mail-panels">
        <div class="mail-list-panel" :style="{ flex: `0 0 ${mailboxSplitSize * 100}%` }">
          <div class="mail-list-scroll">
            <div v-for="row in data" :key="row.id" @click="() => clickRow(row)"
              class="mail-row" :class="{ 'mail-row-active': curMail && row.id === curMail.id }">
              <n-checkbox v-if="multiActionMode" v-model:checked="row.checked" style="margin-right: 8px;" />
              <div class="mail-avatar" :style="{ background: getAvatarColor(row.source) }">
                {{ getSenderInitial(row.source) }}
              </div>
              <div class="mail-row-content">
                <div class="mail-row-header">
                  <span class="mail-row-sender">{{ getSenderName(row.source) }}</span>
                  <span class="mail-row-time">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
                </div>
                <div class="mail-row-subject">{{ row.subject || '(no subject)' }}</div>
                <AiExtractInfo :metadata="row.metadata" compact />
              </div>
            </div>
            <div v-if="data.length === 0" class="mail-empty">
              <n-icon :component="InboxRound" :size="48" color="var(--ds-text-secondary)" />
              <n-text depth="3">{{ t('emptyInbox') }}</n-text>
            </div>
          </div>
        </div>
        <div class="mail-detail-panel">
          <div v-if="curMail" style="padding: 6px 12px;">
            <n-flex justify="space-between">
              <n-button @click="prevMail" :disabled="!canGoPrevMail" text size="tiny">
                <template #icon><n-icon><ArrowBackIosNewFilled /></n-icon></template>
                {{ t('prevMail') }}
              </n-button>
              <n-button @click="nextMail" :disabled="!canGoNextMail" text size="tiny" icon-placement="right">
                <template #icon><n-icon><ArrowForwardIosFilled /></n-icon></template>
                {{ t('nextMail') }}
              </n-button>
            </n-flex>
          </div>
          <div v-if="curMail" class="mail-detail-scroll">
            <h3 style="margin: 0 0 12px 0;">{{ curMail.subject }}</h3>
            <MailContentRenderer :mail="curMail" :showEMailTo="showEMailTo"
              :enableUserDeleteEmail="enableUserDeleteEmail" :showReply="showReply" :showSaveS3="showSaveS3"
              :onDelete="deleteMail" :onReply="replyMail" :onForward="forwardMail" :onSaveToS3="saveToS3Proxy" />
          </div>
          <div v-else class="mail-empty">
            <n-icon :component="InboxRound" :size="64" color="var(--ds-text-secondary)" />
            <n-text depth="3">{{ count === 0 ? t('emptyInbox') : t('pleaseSelectMail') }}</n-text>
          </div>
        </div>
      </div>
    </div>
    <div class="left" v-else>
      <n-space justify="space-around" align="center" :wrap="false" style="display: flex; align-items: center;">
        <n-pagination v-model:page="page" v-model:page-size="pageSize" :item-count="count" simple size="small" />
        <n-switch v-model:value="autoRefresh" size="small" :round="false">
          <template #checked>
            {{ t('refreshAfter', { msg: autoRefreshInterval }) }}
          </template>
          <template #unchecked>
            {{ t('autoRefresh') }}
          </template>
        </n-switch>
        <n-button @click="backFirstPageAndRefresh" tertiary size="small" type="primary">
          {{ t('refresh') }}
        </n-button>
      </n-space>
      <div v-if="showFilterInput" style="padding: 0 10px; margin-top: 8px; margin-bottom: 10px;">
        <n-input v-model:value="localFilterKeyword"
          :placeholder="t('keywordQueryTip')" size="small" clearable />
      </div>
      <div style="overflow: auto; min-height: 60vh; max-height: 100vh;">
        <div v-for="row in data" :key="row.id" @click="() => clickRow(row)" class="mail-row">
          <div class="mail-avatar" :style="{ background: getAvatarColor(row.source) }">
            {{ getSenderInitial(row.source) }}
          </div>
          <div class="mail-row-content">
            <div class="mail-row-header">
              <span class="mail-row-sender">{{ getSenderName(row.source) }}</span>
              <span class="mail-row-time">{{ utcToLocalDate(row.created_at, useUTCDate) }}</span>
            </div>
            <div class="mail-row-subject">{{ row.subject || '(no subject)' }}</div>
          </div>
        </div>
      </div>
      <n-drawer v-model:show="curMail" width="100%" placement="bottom" :trap-focus="false" :block-scroll="false"
        style="height: 80vh;">
        <n-drawer-content :title="curMail ? curMail.subject : ''" closable>
          <n-card :bordered="false" embedded style="overflow: auto;">
            <MailContentRenderer :mail="curMail" :showEMailTo="showEMailTo"
              :enableUserDeleteEmail="enableUserDeleteEmail" :showReply="showReply" :showSaveS3="showSaveS3"
              :useUTCDate="useUTCDate" :onDelete="deleteMail" :onReply="replyMail" :onForward="forwardMail"
              :onSaveToS3="saveToS3Proxy" />
          </n-card>
        </n-drawer-content>
      </n-drawer>
    </div>
    <n-modal v-model:show="showMultiActionDownload" preset="dialog" :title="t('downloadMail')">
      <n-tag type="info">
        {{ multiActionDownloadZip.filename }}
      </n-tag>
      <n-button tag="a" target="_blank" tertiary type="info" size="small" :download="multiActionDownloadZip.filename"
        :href="multiActionDownloadZip.url">
        <n-icon :component="CloudDownloadRound" />
        {{ t('downloadMail') + " zip" }}
      </n-button>
    </n-modal>
    <n-modal v-model:show="showMultiActionDelete" preset="dialog" :title="t('delete') + t('success')"
      negative-text="OK">
      <n-space justify="center">
        <n-progress type="circle" status="error" :percentage="multiActionDeleteProgress.percentage">
          <span style="text-align: center">
            {{ multiActionDeleteProgress.tip }}
          </span>
        </n-progress>
      </n-space>
    </n-modal>
  </div>
</template>

<style scoped>
.left { text-align: left; }

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 8px;
}
.toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}
.refresh-countdown {
  font-size: 11px;
  color: var(--ds-primary);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.mail-panels {
  display: flex;
  gap: 12px;
  height: calc(100vh - 140px);
}

.mail-list-panel {
  background: var(--ds-surface, #fff);
  border-radius: var(--ds-radius, 12px);
  box-shadow: var(--ds-shadow);
  overflow: hidden;
  min-width: 300px;
}

.mail-detail-panel {
  flex: 1;
  background: var(--ds-surface, #fff);
  border-radius: var(--ds-radius, 12px);
  box-shadow: var(--ds-shadow);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.mail-list-scroll {
  overflow-y: auto;
  height: 100%;
}

.mail-detail-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.mail-row {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--ds-border, #E2E8F0);
  transition: background var(--ds-transition, 0.2s ease);
}
.mail-row:hover { background: var(--ds-bg, #F1F5F9); }
.mail-row-active {
  background: color-mix(in srgb, var(--ds-primary, #2563EB) 8%, transparent);
  border-left: 3px solid var(--ds-primary, #2563EB);
  padding-left: 13px;
}

.mail-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
  margin-top: 2px;
}

.mail-row-content { flex: 1; min-width: 0; }

.mail-row-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 2px;
}

.mail-row-sender {
  font-weight: 600;
  font-size: 13px;
  color: var(--ds-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mail-row-subject {
  font-size: 12px;
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--ds-text-secondary);
}

.mail-row-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--ds-text-secondary);
  opacity: 0.7;
}

.mail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 20px;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
}
</style>
