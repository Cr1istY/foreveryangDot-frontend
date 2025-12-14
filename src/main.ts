import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import naive from 'naive-ui'

const app = createApp(App)

router.afterEach((to) => {
  // 如果 meta.title 存在且非空，直接使用
  if (to.meta.title) {
    document.title = to.meta.title as string
  } else {
    // 否则保留默认标题（或从其他地方获取，如组件内）
    document.title = 'foreveryang.cn'
  }
})

app.use(createPinia())
app.use(router)
app.use(naive)
app.mount('#app')
