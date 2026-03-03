<script setup>
import typescriptLogo from '/typescript.svg';
import viteLogo from '/vite.svg';
import vueLogo from '/vue.svg';
import { ref } from 'vue';
import { increment } from './counter.js';

const counter = ref(0);
const countUp = () => {
	counter.value = increment(counter.value);
};
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank" rel="noopener noreferrer">
      <img :src="viteLogo" class="logo" alt="Vite logo" />
    </a>
    <a
      href="https://www.typescriptlang.org/"
      target="_blank"
      rel="noopener noreferrer"
    >
      <img :src="typescriptLogo" class="logo vanilla" alt="TypeScript logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank" rel="noopener noreferrer">
      <img :src="vueLogo" class="logo vue" alt="Vue logo" />
    </a>
    <h1>Vite + TypeScript + Vue</h1>
    <p>Wow, look at this!</p>
    <div class="card">
      <button id="counter" type="button" @click="countUp">
        count is {{ counter }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.logo.vue:hover {
	filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
