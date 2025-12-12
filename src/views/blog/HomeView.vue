<template>
  <div>
    <!-- 头部简介区 -->
    <n-card embedded :bordered="false" class="hero-section">
      <n-space vertical align="center" size="large">
        <n-avatar
          round
          lazy
          :size="isMobile ? 80 : 100"
          src="/avator.jpg"
        />
        <div class="intro-text">
          <n-h2 style="margin-bottom: 2px;">Crist Yang</n-h2>
          <n-h3 style="margin-top: 2px;">杨小文</n-h3>
          <n-text type="primary">全栈学习中 · 在校学生</n-text>
          <n-p class="bio">
            后端开发，物联网工程，偶尔前端，顺手设计，持续写作
          </n-p>
        </div>
      </n-space>
    </n-card>

    <!-- 主内容区 -->
    <n-grid :cols="isMobile ? 1 : 2" :x-gap="24" :y-gap="24" style="margin-top: 24px; margin-left: 24px;">
      <!-- 左侧：最新文章 + 精选文章 -->
      <n-grid-item>
        <!-- 精选文章 -->
        <n-card :bordered="false" size="medium">
          <template #header>
            <router-link to="/blog" class="featured-title">
              🔥 精选文章
            </router-link>
          </template>
          <n-list>
            <n-list-item v-for="post in featuredPosts" :key="post.id">
              <n-thing>
                <template #header>
                  <router-link :to="`/post/${post.id}`" class="post-title">
                    {{ post.title }}
                  </router-link>
                </template>
                <template #description>
                  <n-space size="small">
                    <n-tag type="info" size="small">{{ post.category }}</n-tag>
                    <n-text type="secondary">{{ post.date }}</n-text>
                  </n-space>
                </template>
                <template #footer>
                  {{ post.excerpt }}
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>

        <!-- 最新文章 -->
        <n-card title="📝 最新文章" :bordered="false" size="medium" style="margin-top: 24px;">
          <n-list>
            <n-list-item v-for="post in latestPosts" :key="post.id">
              <n-thing :title="post.title">
                <template #description>
                  <n-space size="small">
                    <n-tag type="info" size="small">{{ post.category }}</n-tag>
                    <n-text type="secondary">{{ post.date }}</n-text>
                  </n-space>
                </template>
              </n-thing>
            </n-list-item>
          </n-list>
        </n-card>
      </n-grid-item>

      <!-- 右侧（仅桌面）：关于 + 技术栈 + 社交 -->
      <n-grid-item class="right-content">
        <!-- 关于我 -->
        <n-card title="👨‍💻 关于我" :bordered="false" size="medium">
          <n-p>- 👨‍🎓 在校学生，就读于重庆邮电大学，物联网工程系。</n-p>
          <n-p>- 💻 专注后端开发，偶尔写前端、做点小设计。</n-p>
          <n-p>- 🌍 热爱开源，乐于分享，改变世界。</n-p>
          <n-p>- 🛠️ 目前主要使用Java、Go、Python进行物联网平台开发。</n-p>
          <n-p>- 📚 纸质书籍爱好者，热爱音乐，感动常在。</n-p>
        </n-card>

        <!-- 技术栈 -->
        <n-card title="🛠 技术栈" :bordered="false" size="medium" style="margin-top: 12px;">
          <n-space wrap :size="[12, 12]">
            <n-tag v-for="tech in techStack" :key="tech" type="info" size="small" round>
              <template #icon>
                <n-icon :component="getIcon(tech)" />
              </template>
              {{ tech }}
            </n-tag>
          </n-space>
          <n-space wrap :size="[12, 12]" style="margin-top: 8px;">
            <n-tag v-for="tech in techStackLanguage" :key="tech" type="warning" size="small" round>
              <template #icon>
                <n-icon :component="getIcon(tech)" />
              </template>
              {{ tech }}
            </n-tag>
          </n-space>
          <n-space wrap :size="[12, 12]" style="margin-top: 8px;">
            <n-tag v-for="tech in techStackIoT" :key="tech" type="success" size="small" round>
              <template #icon>
                <n-icon :component="getIcon(tech)" />
              </template>
              {{ tech }}
            </n-tag>
          </n-space>
        </n-card>

        <!-- 联系方式 -->
        <n-card title="📬 联系我" :bordered="false" size="medium" style="margin-top: 6px; margin-bottom: 24px;">
          <n-space vertical>
            <n-button text tag="a" href="mailto:cr1st4ever@outlook.com">
              📧 cr1st4ever@outlook.com
            </n-button>
            <n-button text tag="a" href="https://github.com/Cr1istY" target="_blank">
              🐙 GitHub (@Cr1istY)
            </n-button>
            <n-button text tag="a" href="https://steamcommunity.com/profiles/76561199027120002" target="_blank">
              🎮 Steam (@CristY)
            </n-button>
          </n-space>
        </n-card>
      </n-grid-item>

    </n-grid>
  </div>
</template>

<script setup lang="ts">
import {
  LogoVue,
  Code,
  HardwareChip,
  LogoDocker
} from '@vicons/ionicons5'

import { LogoPython } from '@vicons/carbon'
import { BrandJavascript } from '@vicons/tabler'
import { Java } from '@vicons/fa'
import type { Component } from 'vue'
import { defineComponent } from 'vue'
import { Icon } from '@iconify/vue'


const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

// 模拟数据
const featuredPosts = [
  {
    id: 1,
    title: '如何用 Naive UI 构建响应式博客',
    category: 'Vue',
    date: '2024-11-15',
    excerpt: '从零开始搭建一个支持桌面和手机访问的个人博客系统...'
  },
  {
    id: 2,
    title: 'Vue 3 性能优化的 10 个技巧',
    category: '性能',
    date: '2024-10-22',
    excerpt: '涵盖组件懒加载、响应式数据优化、编译时优化等实战方案...'
  }
]

const latestPosts = [
  { id: 3, title: 'Vite 插件开发入门', category: '工具链', date: '2024-12-08' },
  { id: 4, title: 'TypeScript 泛型实战', category: 'TypeScript', date: '2024-12-05' },
  { id: 5, title: '部署个人网站到 Vercel', category: 'DevOps', date: '2024-12-01' }
]

const GoIcon = defineComponent({
  render() {
    return h(Icon, { icon: 'simple-icons:jaeger' })
  }
})

const TsIcon = defineComponent({
  render() {
    return h(Icon, { icon: 'simple-icons:typescript' })
  }
})

const CppIcon = defineComponent({
  render() {
    return h(Icon, { icon: 'simple-icons:cplusplus' })
  }
})

const EspIcon = defineComponent({
  render() {
    return h(Icon, { icon: 'simple-icons:espressif' })
  }
})

const MqttIcon = defineComponent({
  render() {
    return h(Icon, { icon: 'simple-icons:mqtt' })
  }
})

const StmIcon = defineComponent({
  render() {
    return h(Icon, { icon: 'simple-icons:stmicroelectronics' })
  }
})

const techStack: TechType[] = ['Vue 3', 'TypeScript', 'JavaScript', 'Docker']
const techStackLanguage: TechType[] = ['Java', 'Go', 'Python', 'C/C++']
const techStackIoT: TechType[] = ['Arduino', 'ESP32', 'Mqtt', 'STM32']

type TechType = 'Vue 3' | 'TypeScript' | 'JavaScript' | 'Docker' | 'Java' | 'Go' | 'Python' | 'C/C++' | 'Arduino' | 'ESP32' | 'Mqtt' | 'STM32'

const iconMap: Record<TechType, Component> = {
  // Web技术栈
  'Vue 3': LogoVue,
  'TypeScript': TsIcon,
  'JavaScript': BrandJavascript,
  'Docker': LogoDocker,

  // 编程语言
  'Java': Java,
  'Go': GoIcon,
  'Python': LogoPython,
  'C/C++': CppIcon,

  // IoT相关
  'Arduino': HardwareChip,
  'ESP32': EspIcon,
  'Mqtt': MqttIcon,
  'STM32': StmIcon
}

const getIcon = (tech: TechType) => {
  return iconMap[tech] ?? Code
}

</script>

<style scoped>
.hero-section {
  text-align: center;
  padding: 32px 16px;
}
.intro-text {
  max-width: 600px;
}
.bio {
  margin-top: 8px;
  color: var(--n-text-color);
  line-height: 1.6;
}
.right-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.right-content :deep(.n-card) {
  flex: 1;
  margin-top: 24px;
}

.right-content :deep(.n-card:first-child) {
  margin-top: 0px;
}

.featured-title {
  color: inherit;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}

.featured-title:hover {
  color: #f0a020;
}

.post-title {
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.post-title:hover {
  color: #18a058;
  text-decoration: underline;
}

</style>
