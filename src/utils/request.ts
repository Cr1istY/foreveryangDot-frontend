import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import { message } from '@/utils/naiveDiscrete'
import router from '@/router'

interface RefreshResponse {
  access_token: string
}

interface FailedQueueCallback {
  resolve: (value?: string) => void
  reject: (error?: Error) => void
}

interface AxiosRetryConfig extends AxiosRequestConfig {
  _retry?: boolean
}

const service: AxiosInstance = axios.create({
    baseURL: '/api',
    timeout: 5000,
    withCredentials: true
})

service.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let isRefreshing = false
let failedQueue: FailedQueueCallback[] = []

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach(callback => {
    if (error) {
      callback.reject(error)
    } else {
      callback.resolve(token || undefined)
    }
  })
  failedQueue = []
}


service.interceptors.response.use(
  (response) => response,
  async (error) => {
    const oringnalRequest = error.config as AxiosRetryConfig
    if (error.response.status === 401 && !oringnalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          if (oringnalRequest.headers) {
          oringnalRequest.headers.Authorization = `Bearer ${token}`
          return service(oringnalRequest)
          }
        }).catch(error => {
          return Promise.reject(error)
        })
      }
      oringnalRequest._retry = true
      isRefreshing = true
      try {
        const { data: { access_token } } = await service.post<RefreshResponse>('/auth/refresh')
        localStorage.setItem('access_token', access_token)
        if (oringnalRequest.headers) {
          oringnalRequest.headers.Authorization = `Bearer ${access_token}`
        }
        processQueue(null, access_token)
        return service(oringnalRequest)
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        message.error('登录已过期，请重新登录')
        router.push({ name: 'login'})
        if (refreshError instanceof Error) {
          processQueue(refreshError, null)
        } else {
          processQueue(new Error(String(refreshError)), null)
        }
        isRefreshing = false
        return Promise.reject(refreshError)
      }
    }
    message.error(error.response?.data?.message || '请求失败')
    return Promise.reject(error)
  }
)




export default service



