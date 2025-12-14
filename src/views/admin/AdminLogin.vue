<template>
  <div class="login-container">
    <n-card class="login-card" :bordered="false" size="large">
      <template #header>
        <h2 class="text-center">欢迎登录</h2>
      </template>

      <n-form
        ref="formRef"
        :model="formValue"
        :rules="rules"
        label-placement="left"
      >
        <n-form-item path="username" label="用户名">
          <n-input
            v-model:value="formValue.username"
            placeholder="请输入用户名"
            clearable
          />
        </n-form-item>

        <n-form-item path="password" label="密码">
          <n-input
            v-model:value="formValue.password"
            type="password"
            show-password-on="click"
            placeholder="请输入密码"
            clearable
          />
        </n-form-item>

        <n-space vertical :size="16" style="width: 100%">
          <n-button
            type="primary"
            block
            :loading="loading"
            @click="handleSubmit"
          >
            登录
          </n-button>
          <n-button text @click="handleForgotPassword">
            忘记密码？
          </n-button>
        </n-space>
      </n-form>
    </n-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { FormInst, FormRules } from 'naive-ui'
import { useMessage } from 'naive-ui'
import request from '@/utils/request'
// 类型定义
interface LoginForm {
  username: string
  password: string
}

// Refs
const formRef = ref<FormInst | null>(null)
const loading = ref<boolean>(false)
const message = useMessage()

// 表单数据
const formValue = ref<LoginForm>({
  username: '',
  password: ''
})

interface LoginResponse {
  access_token: string
}

// 表单验证规则
const rules: FormRules = {
  username: {
    required: true,
    message: '请输入用户名',
    trigger: 'blur'
  },
  password: {
    required: true,
    message: '请输入密码',
    trigger: 'blur',
    validator(rule, value) {
      if (value && value.length < 6) {
        return new Error('密码至少6位')
      }
      return true
    }
  }
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
    const res = await request.post<LoginResponse>('/login', formValue.value)
    const token = res.data.access_token
    if (token) {
      localStorage.setItem('access_token', token)
      message.success('登录成功')
      
    } else {
      message.error('登录失败，请检查用户名和密码')
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : '登录失败，请检查用户名和密码'
    message.error(errorMessage)
    }
}

// 忘记密码
const handleForgotPassword = () => {
  message.info('请联系管理员重置密码')
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 16px;
  background-color: var(--n-color-body);
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.text-center {
  text-align: center;
  margin: 0;
}
</style>
