<script setup>
import Header from './Header.vue'
import Footer from './Footer.vue'
</script>

<template>
  <div class="classic-layout">
    <Header />
    <router-view />
    <Footer />
  </div>
</template>

<style scoped>
.classic-layout {
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
