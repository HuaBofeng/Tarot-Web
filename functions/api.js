export async function onRequestPost({ request, env }) {
  try {
    const { text = "", pms = [] } = await request.json();

    const messages = [
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

用户会提供卡牌数组：

{
  "no": 牌编号,
  "isReversed": 是否逆位
}

要求：

1. 将数字转换为对应牌名。
2. 说明正位或逆位含义。
3. 结合用户问题综合分析。
4. 使用自然、专业、神秘的塔罗师语气。
5. 不要显示数字编号。
6. 不要提及AI。
7. 最后单独输出：

概率：XX%

XX必须为0-100整数。

除了解析内容外不要输出其它说明。`
      },
      {
        role: "user",
        content: `卡牌数组：${JSON.stringify(pms)}

问题：${text}`
      }
    ];

    const stream = await env.AI.run(
      "@cf/meta/llama-4-scout-17b-16e-instruct",
      {
        messages,
        temperature: 0.7,
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
        success: false,
        error: err.message
      },
      {
        status: 500
      }
    );
  }
}
