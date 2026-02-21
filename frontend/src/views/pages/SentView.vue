<script setup>
import { useGlobalState } from '../../store'
import { api } from '../../api'
import SendBox from '../../components/SendBox.vue'

const { openSettings } = useGlobalState()

const fetchSenboxData = async (limit, offset) => {
  return await api.fetch(`/api/sendbox?limit=${limit}&offset=${offset}`)
}

const deleteSenboxMail = async (curMailId) => {
  await api.fetch(`/api/sendbox/${curMailId}`, { method: 'DELETE' })
}
</script>

<template>
  <SendBox :fetchMailData="fetchSenboxData"
    :enableUserDeleteEmail="openSettings.enableUserDeleteEmail"
    :deleteMail="deleteSenboxMail" />
</template>
