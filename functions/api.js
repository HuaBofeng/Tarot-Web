export async function onRequestPost({ request, env }) {
  try {
    // 1. 获取前端传来的占卜数据
    const { text, pms } = await request.json();

    // 2. 调用 GLM-4.7-Flash 模型
    // 注意：这里使用官方路径 @cf/zai-org/glm-4.7-flash
    const result = await env.AI.run("@cf/zai-org/glm-4.7-flash", {
      messages: [
        {
          role: "system",
          content: `现在你是塔罗牌大师，根据我所选的牌去根据问题去解析，使用的是22张大阿尔克那牌，{"0": "愚者","1": "魔术师","2": "女祭司","3": "皇后","4": "皇帝","5": "教皇","6": "恋人","7": "战车","8": "力量","9": "隐士","10": "命运之轮","11": "正义","12": "倒吊人","13": "死神","14": "节制","15": "恶魔","16": "塔","17": "星星","18": "月亮","19": "太阳","20": "审判","21": "世界"}，下面我将以数组的形式给你卡牌，其中isReversed代表是否为逆位，no为从 0 到 21 对应的22张大阿尔克那牌，你在解析的时候，需要把0-21用22张大阿尔克那牌对应的名称回答，你只需要解释卡牌的含义及解析，最后结尾用百分比表示问题的概率，不用回答多余的话`
        },
        {
          role: "user",
          content: `卡牌数组是：${JSON.stringify(pms)}，问题是：'${text}？'，请帮我解析`
        }
      ],
      temperature: 0,
      presence_penalty: 0,
      frequency_penalty: 0,
      top_p: 1
    });

    // 3. 根据该模型的 Output 架构解析返回结果
    // 根据文档，该模型返回标准 OpenAI 格式，内容在 choices[0].message.content 中
    if (result && result.choices && result.choices[0] && result.choices[0].message) {
      return new Response(result.choices[0].message.content);
    } else {
      return new Response("AI 未能生成有效回复，请检查后台绑定或额度", { status: 500 });
    }

  } catch (err) {
    // 捕获所有异常，彻底告别 1101 错误页
    return new Response(`Worker 内部错误: ${err.message}`, { status: 500 });
  }
}
