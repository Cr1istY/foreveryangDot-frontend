import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/blog/HomeView.vue'
import NotFound from '@/views/NotFound.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { title: 'Home' },
    },
    // 404
    {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: NotFound
    }
  ],
})

export default router
