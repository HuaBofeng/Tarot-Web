<template>
  <section class="Home">
    <div class="text">
      <h3>深呼吸，屏除雜念，開始你的塔羅占卜之旅</h3>
      <Textarea v-model.trim="textValue" placeholder="你要占卜的问题（必须）" :disabled="loadingStatus" />
    </div>
    <template v-if="!loadingStatus">
      <h3 class="text nb">选3张卡牌（必须）</h3>
      <div class="card-list" :class="{ active: selectCardArr.length }">
        <div class="card" :class="{ active: selectCardArr.includes(i) }" v-for="i in randomCard" :key="i" @click="selectCard(i)"></div>
      </div>
      <div class="btn">
        <Button class="mt-4 w-full" :disabled="selectCardArr.length < 3 || !textValue" @click="getRes">开始占卜</Button>
      </div>
    </template>
    <div class="card-jx" v-else>
      <div class="show-card">
        <img :class="{ rever: i.isReversed }" :src="renderIMG(`${i.no}.jpg`)" v-for="i in selectCardArr" :key="i" />
      </div>
      <Alert class="mt-4" v-if="resStatus">
        <AlertTitle>塔罗牌解析：</AlertTitle>
        <AlertDescription>
          <div class="[&>p]:indent-8 [&>p]:pt-2" v-html="renderedHTML"></div>
        </AlertDescription>
      </Alert>
      <Button class="mt-4 ml-auto block w-max" :disabled="isStreaming" @click="resetFn">重新开始</Button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import vh from 'vh-plugin'
import { marked } from 'marked'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

const randomCard = ref<number[]>(Array.from({ length: 22 }, (_, i) => i))
const selectCardArr = ref<Array<any>>([])
const textValue = ref<string>('')
const loadingStatus = ref<boolean>(false)
const resStatus = ref<boolean>(false)
const isStreaming = ref<boolean>(false) // 是否正在流式传输

// 响应式存储 AI 返回的纯文本
const rawText = ref<string>('')
// 计算属性：将纯文本实时转为 HTML
const renderedHTML = computed(() => marked.parse(rawText.value))

const selectCard = (id: number) => {
  if (selectCardArr.value.includes(id)) {
    selectCardArr.value = selectCardArr.value.filter((i) => i !== id)
    return
  }
  if (selectCardArr.value.length > 2) return
  selectCardArr.value.push(id)
}

const getRes = async () => {
  loadingStatus.value = true
  resStatus.value = true
  rawText.value = "" // 重置内容
  
  // 记录选中的牌并随机正逆位
  selectCardArr.value = selectCardArr.value.map((no) => ({ 
    no, 
    isReversed: Math.random() > 0.5 
  }))

  try {
    const response = await fetch('/api', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: textValue.value, pms: selectCardArr.value }) 
    })

    if (!response.ok) throw new Error('网络请求失败')

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) return

    isStreaming.value = true
    
    // 循环读取流数据
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split("\n")

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.slice(6).trim()
          if (dataStr === "[DONE]") break
          
          try {
            const json = JSON.parse(dataStr)
            // Cloudflare Workers AI GLM 流模式返回内容在 response 字段
            if (json.response) {
              rawText.value += json.response
            }
          } catch (e) {
            // 忽略碎片化的 JSON
          }
        }
      }
    }
  } catch (err: any) {
    rawText.value = "解析出错：" + err.message
  } finally {
    isStreaming.value = false
  }
}

const resetFn = async () => {
  vh.showLoading()
  await new Promise((resolve) => setTimeout(resolve, 666))
  selectCardArr.value = []
  textValue.value = ''
  resStatus.value = false
  loadingStatus.value = false
  rawText.value = ""
  // 洗牌
  for (let i = randomCard.value.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[randomCard.value[i], randomCard.value[j]] = [randomCard.value[j], randomCard.value[i]]
  }
  vh.hideLoading()
}

const renderIMG = (url: string) => new URL(`../../assets/images/card/${url}`, import.meta.url).href
</script>
