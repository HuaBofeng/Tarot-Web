export async function onRequestPost({ request, env }) {
  try {
    const { text = "", pms = [] } = await request.json();

    const stream = await env.AI.run(
      "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
      {
        messages: [
          {
            role: "system",
            content: `你是一位专业的塔罗牌大师。

使用22张大阿尔克那牌：

0 愚者
1 魔术师
2 女祭司
3 皇后
4 皇帝
5 教皇
6 恋人
7 战车
8 力量
9 隐士
10 命运之轮
11 正义
12 倒吊人
13 死神
14 节制
15 恶魔
16 塔
17 星星
18 月亮
19 太阳
20 审判
21 世界

用户会传入卡牌数组：

{
  "no": 牌编号,
  "isReversed": 是否逆位
}

要求：

1. 将数字牌号转换为对应牌名。
2. 正位和逆位分别解释。
3. 结合用户问题分析。
4. 语言自然，像资深塔罗师。
5. 不要提及AI、模型、算法等内容。
6. 不要输出数字牌号。
7. 最后单独输出：

概率：XX%

其中XX必须是0-100之间的整数。

输出格式示例：

【牌面解析】

愚者（正位）
......

恋人（逆位）
......

【综合解读】

......

概率：78%`
          },
          {
            role: "user",
            content: `卡牌数组：${JSON.stringify(pms)}

问题：${text}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048,
        stream: true
      }
    );

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });
  } catch (err) {
    return Response.json(
      {
        error: err.message
      },
      {
        status: 500
      }
    );
  }
}
