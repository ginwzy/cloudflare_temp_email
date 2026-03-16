<script setup>
import { useRoute } from 'vue-router'

import { useGlobalState } from '../../store'
import { api } from '../../api'
import { computed, onMounted, ref, watch } from 'vue'
import { processItem } from '../../utils/email-parser'
import { utcToLocalDate } from '../../utils'
import MailContentRenderer from '../../components/MailContentRenderer.vue'

const { telegramApp, loading, useUTCDate } = useGlobalState()
const route = useRoute()

const curMail = ref(null)

watch(telegramApp, async () => {
  if (telegramApp.value.initData) {
    curMail.value = await fetchMailData()
  }
})

const fetchMailData = async () => {
  try {
    loading.value = true
    const res = await api.fetch('/telegram/get_mail', {
      method: 'POST',
      body: JSON.stringify({
        initData: telegramApp.value.initData,
        mailId: route.query.mail_id,
      }),
    })
    return await processItem(res)
  } catch (error) {
    console.error(error)
    return null
  } finally {
    loading.value = false
  }
}

const mailMeta = computed(() => {
  if (!curMail.value) return []
  return [
    `ID: ${curMail.value.id}`,
    utcToLocalDate(curMail.value.created_at, useUTCDate),
    `FROM: ${curMail.value.source}`,
  ]
})

onMounted(async () => {
  curMail.value = await fetchMailData()
})
</script>

<template>
  <div class="ds-page-shell telegram-mail">
    <div class="ds-panel">
      <div v-if="curMail" class="ds-panel-header">
        <div class="ds-page-copy">
          <span class="ds-page-kicker">Telegram Mail</span>
          <h1 class="ds-page-title ds-page-title--sm">{{ curMail.subject || '(no subject)' }}</h1>
          <p class="ds-page-subtitle">
            <span v-for="item in mailMeta" :key="item" class="meta-item">{{ item }}</span>
          </p>
        </div>
      </div>
      <div class="ds-panel-body">
        <div v-if="!curMail" class="mail-empty">
          <n-spin size="small" />
        </div>
        <MailContentRenderer
          v-else
          :mail="curMail"
          :showEMailTo="false"
          :showReply="false"
          :enableUserDeleteEmail="false"
          :showSaveS3="false"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
.telegram-mail {
  width: min(960px, 100%);
  padding-top: 24px;
}

.meta-item + .meta-item::before {
  content: "·";
  margin: 0 8px;
}

.mail-empty {
  min-height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
