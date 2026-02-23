<script setup>
import { onMounted } from 'vue'
import { useGlobalState } from '../../store'
import { api } from '../../api'
import UserLogin from '../user/UserLogin.vue'

const message = useMessage()
const { userOpenSettings } = useGlobalState()

onMounted(async () => {
  await api.getUserOpenSettings(message)
})
</script>

<template>
  <UserLogin />
</template>
