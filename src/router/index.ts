import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/blog/HomeView.vue'
import NotFound from '@/views/NotFound.vue'
import BlogList from '@/views/blog/BlogList.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' },
    },
    {
      path: '/blog',
      name: 'blog',
      component: BlogList,
      meta: { title: 'Blog' },
    },
    // 404
    {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound,
    meta: { title: '页面走丢了' },
    }
  ],
})

export default router
