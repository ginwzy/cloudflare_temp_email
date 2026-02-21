<script setup>
import { defineAsyncComponent } from 'vue'
import { useGlobalState } from '../../store'

const { loading } = useGlobalState()

const SendMail = defineAsyncComponent(() => {
  loading.value = true
  return import('../index/SendMail.vue').finally(() => loading.value = false)
})
</script>

<template>
  <SendMail />
</template>
