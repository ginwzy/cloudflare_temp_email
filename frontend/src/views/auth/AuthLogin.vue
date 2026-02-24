<script setup>
import { onMounted } from 'vue'
import { useGlobalState } from '../../store'
import { api } from '../../api'
import UserLogin from '../user/UserLogin.vue'

const message = useMessage()
const { openSettings } = useGlobalState()

onMounted(async () => {
  await api.getUserOpenSettings(message)
})
</script>

<template>
  <div class="auth-login">
    <UserLogin />
  </div>
</template>

<style scoped>
.auth-login {
  text-align: left;
}
</style>
