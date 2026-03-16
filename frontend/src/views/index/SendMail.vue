<script setup>
import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import { useI18n } from 'vue-i18n'
import { computed, onMounted, onBeforeUnmount, ref, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { EditRound, PreviewOutlined, SendRound, AlternateEmailRound } from '@vicons/material'
import AdminContact from '../common/AdminContact.vue'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { getRouterPathWithLang } from '../../utils'
import { sanitizeRichTextHtml } from '../../utils/safe-html'

const message = useMessage()
const router = useRouter()
const isPreview = ref(false)
const editorRef = shallowRef()
const safePreviewHtml = computed(() => sanitizeRichTextHtml(sendMailModel.value.content || ''))

const { settings, sendMailModel, userSettings, loading } = useGlobalState()

const { locale, t } = useI18n({
  messages: {
    en: {
      compose: 'Compose',
      subtitle: 'Draft outgoing mail in the same calm workspace language as the inbox, with quick preview and quota visibility.',
      successSend: 'Mail queued. Check your sendbox for delivery results.',
      requestSent: 'Access request sent.',
      fromName: 'Your name',
      fromAddress: 'From address',
      recipientName: 'Recipient name',
      recipientEmail: 'Recipient email',
      subject: 'Subject',
      options: 'Format',
      edit: 'Edit',
      preview: 'Preview',
      content: 'Content',
      send: 'Send',
      sendbox: 'Open Sent',
      requestAccess: 'Request Access',
      requestAccessTip: 'You need send permissions before this address can deliver mail. Request access first or contact the administrator.',
      send_balance: 'Remaining send quota',
      text: 'Text',
      html: 'HTML',
      'rich text': 'Rich text',
      tooLarge: 'File too large. Upload files smaller than 1MB.',
      previewCard: 'Preview',
      previewHint: 'Sanitized preview of the current message body.',
      tipsTitle: 'Compose rules',
      tipsBody: 'Use preview for final checks, then watch the sent workspace for delivery outcomes and retries.',
      needAddress: 'Bind or create an address before composing mail.',
      bindAddress: 'Create or Bind Address',
      noPreview: 'Preview updates as you type.',
    },
    zh: {
      compose: '写邮件',
      subtitle: '用与收件箱一致的工作区语言起草外发邮件，同时保留预览与额度可见性。',
      successSend: '邮件已进入发件箱，请前往发件箱查看投递结果。',
      requestSent: '已提交权限申请。',
      fromName: '你的名称',
      fromAddress: '发件地址',
      recipientName: '收件人名称',
      recipientEmail: '收件人邮箱',
      subject: '主题',
      options: '格式',
      edit: '编辑',
      preview: '预览',
      content: '内容',
      send: '发送',
      sendbox: '打开发件箱',
      requestAccess: '申请权限',
      requestAccessTip: '当前地址尚未获得发送权限。请先申请权限，或联系管理员提升额度。',
      send_balance: '剩余发送额度',
      text: '文本',
      html: 'HTML',
      'rich text': '富文本',
      tooLarge: '文件过大，请上传小于 1MB 的文件。',
      previewCard: '预览',
      previewHint: '当前正文内容的安全预览。',
      tipsTitle: '发送建议',
      tipsBody: '发送前先检查预览，发送后在发件箱中确认投递结果与重试情况。',
      needAddress: '请先创建或绑定地址，再开始写邮件。',
      bindAddress: '创建或绑定地址',
      noPreview: '开始输入后，这里会同步显示预览。',
    },
  },
})

const contentTypes = computed(() => [
  { label: t('text'), value: 'text' },
  { label: t('html'), value: 'html' },
  { label: t('rich text'), value: 'rich' },
])

const canSend = computed(() => !!settings.value.address && Number(settings.value.send_balance) > 0 && !loading.value)

const send = async () => {
  try {
    await api.fetch('/api/send_mail', {
      method: 'POST',
      body: JSON.stringify({
        from_name: sendMailModel.value.fromName,
        to_name: sendMailModel.value.toName,
        to_mail: sendMailModel.value.toMail,
        subject: sendMailModel.value.subject,
        is_html: sendMailModel.value.contentType !== 'text',
        content: sendMailModel.value.content,
      }),
    })
    sendMailModel.value = {
      fromName: '',
      toName: '',
      toMail: '',
      subject: '',
      contentType: 'text',
      content: '',
    }
    message.success(t('successSend'))
    await router.push(getRouterPathWithLang('/sent', locale.value))
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const requestAccess = async () => {
  try {
    await api.fetch('/api/requset_send_mail_access', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    message.success(t('requestSent'))
    await api.getSettings()
  } catch (error) {
    message.error(error.message || 'error')
  }
}

const toolbarConfig = {
  excludeKeys: ['uploadVideo'],
}

const editorConfig = {
  MENU_CONF: {
    uploadImage: {
      async customUpload() {
        message.error(t('tooLarge'))
      },
      maxFileSize: 1 * 1024 * 1024,
      base64LimitSize: 1 * 1024 * 1024,
    },
  },
}

onBeforeUnmount(() => {
  const editor = editorRef.value
  if (editor == null) return
  editor.destroy()
})

const handleCreated = (editor) => {
  editorRef.value = editor
}

onMounted(async () => {
  if (!userSettings.value.user_id) await api.getUserSettings(message)
  await api.getSettings()
})
</script>

<template>
  <div class="ds-page-shell compose-page">
    <header class="ds-page-header">
      <div class="ds-page-copy">
        <span class="ds-page-kicker">{{ t('compose') }}</span>
        <h1 class="ds-page-title ds-page-title--sm">{{ t('compose') }}</h1>
        <p class="ds-page-subtitle">{{ t('subtitle') }}</p>
      </div>
      <div class="ds-page-actions">
        <n-button quaternary @click="router.push(getRouterPathWithLang('/sent', locale.value))">
          {{ t('sendbox') }}
        </n-button>
        <n-button type="primary" :disabled="!canSend" @click="send">
          <template #icon>
            <n-icon :component="SendRound" />
          </template>
          {{ t('send') }}
        </n-button>
      </div>
    </header>

    <div v-if="!settings.address" class="ds-panel no-address-panel">
      <div class="ds-panel-body">
        <n-empty :description="t('needAddress')">
          <template #extra>
            <n-button type="primary" @click="router.push(getRouterPathWithLang('/addresses/new', locale.value))">
              <template #icon>
                <n-icon :component="AlternateEmailRound" />
              </template>
              {{ t('bindAddress') }}
            </n-button>
          </template>
        </n-empty>
      </div>
    </div>

    <div v-else class="ds-page-grid">
      <div class="ds-page-stack">
        <div v-if="!settings.send_balance || settings.send_balance <= 0" class="ds-panel ds-panel--soft warning-panel">
          <div class="ds-panel-header">
            <div class="ds-page-copy">
              <span class="ds-page-kicker">{{ t('requestAccess') }}</span>
              <h2 class="ds-section-title">{{ t('requestAccess') }}</h2>
              <p class="ds-page-subtitle">{{ t('requestAccessTip') }}</p>
            </div>
          </div>
          <div class="ds-panel-body warning-body">
            <n-button type="primary" @click="requestAccess" size="large">
              {{ t('requestAccess') }}
            </n-button>
            <AdminContact />
          </div>
        </div>

        <div v-else class="ds-panel">
          <div class="ds-panel-header compose-header">
            <div class="ds-page-copy">
              <span class="ds-page-kicker">{{ t('options') }}</span>
              <h2 class="ds-section-title">{{ t('compose') }}</h2>
            </div>
            <n-button quaternary @click="isPreview = !isPreview">
              <template #icon>
                <n-icon :component="isPreview ? EditRound : PreviewOutlined" />
              </template>
              {{ isPreview ? t('edit') : t('preview') }}
            </n-button>
          </div>

          <div class="ds-panel-body">
            <n-form :model="sendMailModel" label-placement="top" class="compose-form">
              <div class="compose-grid">
                <n-form-item :label="t('fromName')">
                  <n-input v-model:value="sendMailModel.fromName" />
                </n-form-item>
                <n-form-item :label="t('fromAddress')">
                  <n-input :value="settings.address" disabled />
                </n-form-item>
              </div>

              <div class="compose-grid">
                <n-form-item :label="t('recipientName')">
                  <n-input v-model:value="sendMailModel.toName" />
                </n-form-item>
                <n-form-item :label="t('recipientEmail')">
                  <n-input v-model:value="sendMailModel.toMail" />
                </n-form-item>
              </div>

              <n-form-item :label="t('subject')">
                <n-input v-model:value="sendMailModel.subject" />
              </n-form-item>

              <n-form-item :label="t('options')">
                <n-radio-group v-model:value="sendMailModel.contentType">
                  <n-radio-button
                    v-for="option in contentTypes"
                    :key="option.value"
                    :value="option.value"
                    :label="option.label"
                  />
                </n-radio-group>
              </n-form-item>

              <n-form-item :label="t('content')">
                <div class="compose-editor-shell">
                  <div v-if="isPreview" class="preview-pane">
                    <pre v-if="sendMailModel.contentType === 'text'" class="preview-text">{{ sendMailModel.content }}</pre>
                    <div
                      v-else-if="sendMailModel.content"
                      class="preview-html"
                      v-html="safePreviewHtml"
                    ></div>
                    <div v-else class="preview-empty">
                      {{ t('noPreview') }}
                    </div>
                  </div>

                  <div v-else-if="sendMailModel.contentType === 'rich'" class="editor-shell">
                    <Toolbar
                      class="editor-toolbar"
                      :defaultConfig="toolbarConfig"
                      :editor="editorRef"
                      mode="default"
                    />
                    <Editor
                      class="editor-body"
                      v-model="sendMailModel.content"
                      :defaultConfig="editorConfig"
                      mode="default"
                      @onCreated="handleCreated"
                    />
                  </div>

                  <n-input
                    v-else
                    type="textarea"
                    v-model:value="sendMailModel.content"
                    :autosize="{ minRows: 10 }"
                  />
                </div>
              </n-form-item>
            </n-form>
          </div>
        </div>
      </div>

      <aside class="ds-page-stack">
        <div class="ds-panel ds-panel--soft">
          <div class="ds-panel-header">
            <div class="ds-page-copy">
              <span class="ds-page-kicker">{{ t('send_balance') }}</span>
              <h2 class="ds-section-title">{{ settings.send_balance }}</h2>
            </div>
          </div>
          <div class="ds-panel-body side-copy">
            {{ t('tipsBody') }}
          </div>
        </div>

        <div class="ds-panel ds-panel--soft">
          <div class="ds-panel-header">
            <div class="ds-page-copy">
              <span class="ds-page-kicker">{{ t('previewCard') }}</span>
              <h2 class="ds-section-title">{{ t('previewCard') }}</h2>
              <p class="ds-page-subtitle">{{ t('previewHint') }}</p>
            </div>
          </div>
          <div class="ds-panel-body preview-card-body">
            <pre v-if="sendMailModel.contentType === 'text'" class="preview-text">{{ sendMailModel.content }}</pre>
            <div
              v-else-if="sendMailModel.content"
              class="preview-html"
              v-html="safePreviewHtml"
            ></div>
            <div v-else class="preview-empty">
              {{ t('noPreview') }}
            </div>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.compose-page {
  width: min(1240px, 100%);
}

.warning-body,
.side-copy {
  display: grid;
  gap: 14px;
}

.compose-header {
  align-items: center;
}

.compose-form {
  display: grid;
  gap: 8px;
}

.compose-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.compose-editor-shell {
  width: 100%;
}

.editor-shell,
.preview-pane {
  border: 1px solid var(--ds-border);
  border-radius: var(--ds-radius);
  overflow: hidden;
  background: color-mix(in srgb, var(--ds-surface-soft) 88%, transparent);
}

.editor-toolbar {
  border-bottom: 1px solid var(--ds-border);
  background: color-mix(in srgb, var(--ds-surface-strong) 82%, transparent);
}

.editor-body {
  min-height: 460px;
  overflow-y: hidden;
}

.preview-pane,
.preview-card-body {
  min-height: 220px;
}

.preview-text {
  margin: 0;
  padding: 18px;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--ds-text);
  font-family: inherit;
}

.preview-html {
  padding: 18px;
  color: var(--ds-text);
}

.preview-empty {
  padding: 18px;
  color: var(--ds-text-muted);
}

.no-address-panel {
  width: min(720px, 100%);
  margin: 0 auto;
}

@media (max-width: 768px) {
  .compose-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .editor-body {
    min-height: 320px;
  }
}
</style>
