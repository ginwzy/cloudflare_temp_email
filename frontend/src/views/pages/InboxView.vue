<script setup>
import { ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useGlobalState } from '../../store'
import { api } from '../../api'
import MailBox from '../../components/MailBox.vue'
import SimpleIndex from '../index/SimpleIndex.vue'

const { openSettings, useSimpleIndex } = useGlobalState()
const message = useMessage()
const route = useRoute()

const mailBoxKey = ref('')
const mailIdQuery = ref('')
const showMailIdQuery = ref(false)

const fetchMailData = async (limit, offset) => {
  if (mailIdQuery.value > 0) {
    const singleMail = await api.fetch(`/api/mail/${mailIdQuery.value}`)
    if (singleMail) return { results: [singleMail], count: 1 }
    return { results: [], count: 0 }
  }
  return await api.fetch(`/api/mails?limit=${limit}&offset=${offset}`)
}

const deleteMail = async (curMailId) => {
  await api.fetch(`/api/mails/${curMailId}`, { method: 'DELETE' })
}

const saveToS3 = async (mail_id, filename, blob) => {
  try {
    const { url } = await api.fetch(`/api/attachment/put_url`, {
      method: 'POST',
      body: JSON.stringify({ key: `${mail_id}/${filename}` })
    })
    const formData = new FormData()
    formData.append(filename, blob)
    await fetch(url, { method: 'PUT', body: formData })
    message.success('save to s3 success')
  } catch (error) {
    message.error(error.message || 'save to s3 error')
  }
}

const queryMail = () => { mailBoxKey.value = Date.now() }

watch(route, () => {
  if (!route.query.mail_id) {
    showMailIdQuery.value = false
    mailIdQuery.value = ''
    queryMail()
  }
})

onMounted(() => {
  if (route.query.mail_id) {
    showMailIdQuery.value = true
    mailIdQuery.value = route.query.mail_id
    queryMail()
  }
})
</script>

<template>
  <SimpleIndex v-if="useSimpleIndex" />
  <div v-else>
    <div v-if="showMailIdQuery" style="margin-bottom: 10px;">
      <n-input-group>
        <n-input v-model:value="mailIdQuery" />
        <n-button @click="queryMail" type="primary" tertiary>Query</n-button>
      </n-input-group>
    </div>
    <MailBox :key="mailBoxKey" :showEMailTo="false" :showReply="openSettings.enableSendMail"
      :showSaveS3="openSettings.isS3Enabled" :saveToS3="saveToS3"
      :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
      :fetchMailData="fetchMailData" :deleteMail="deleteMail" :showFilterInput="true" />
  </div>
</template>
