
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { GEMINI_MODEL_FAST } from "../constants";
import { ProductData, FilterConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Define the schema for structured extraction of Product Data
const productExtractionSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      productName: { type: Type.STRING, description: "商品名称/标题" },
      price: { type: Type.STRING, description: "商品价格 (保留货币符号, 如 $15.99, ¥29.9)" },
      salesVolume: { type: Type.STRING, description: "销量数据 (如 10k+, 500)" },
      productLink: { type: Type.STRING, description: "商品详情页链接 URL" },
      shopName: { type: Type.STRING, description: "店铺/商家名称" },
      shopLink: { type: Type.STRING, description: "店铺主页链接 URL" },
      rawContent: { type: Type.STRING, description: "原始文本片段或来源标记" },
      category: { type: Type.STRING, description: "推断的商品类目" }
    },
    required: ["productName", "price", "shopName", "rawContent"]
  }
};

const enrichProducts = (rawProducts: any[], source: string): ProductData[] => {
   return rawProducts.map((prod: any) => ({
      ...prod,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      rawContent: prod.rawContent || source,
      // Simple logic to parse a sortable revenue number for charts (heuristic)
      revenue: parseFloat(prod.price?.replace(/[^0-9.]/g, '') || "0") * 
               (prod.salesVolume?.toLowerCase().includes('k') ? parseFloat(prod.salesVolume) * 1000 : parseFloat(prod.salesVolume) || 1)
    }));
}

export const extractProductsFromText = async (
  text: string, 
  categoryContext: string
): Promise<ProductData[]> => {
  try {
    const prompt = `
      你是一个专业的电商数据采集助手。
      请分析以下从 TikTok/抖音 抓取的非结构化文本数据。
      你的目标是提取结构化的商品信息。
      
      类目/上下文: ${categoryContext || "通用电商"}
      
      输入数据:
      """
      ${text}
      """
      
      提取规则:
      1. 尽可能提取准确的【商品名称】、【价格】、【销量】。
      2. 识别文本中的 URL 作为商品链接或店铺链接。
      3. 如果价格有区间，提取最低价或显示范围。
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: productExtractionSchema,
        temperature: 0.1, 
      }
    });

    const rawProducts = JSON.parse(response.text || "[]");
    return enrichProducts(rawProducts, "文本导入");

  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    throw new Error("AI 数据采集服务连接失败，请检查网络或 API Key。");
  }
};

// Simulate crawling by asking Gemini to hallucinate/predict data based on the URL context and FILTERS
export const simulateUrlExtraction = async (
  url: string,
  filters?: FilterConfig
): Promise<ProductData[]> => {
  try {
    let filterInstruction = "";
    if (filters) {
      const parts = [];
      if (filters.category && filters.category !== "所有类目") parts.push(`商品类目必须属于: ${filters.category}`);
      if (filters.minPrice) parts.push(`价格最低: $${filters.minPrice}`);
      if (filters.maxPrice) parts.push(`价格最高: $${filters.maxPrice}`);
      if (filters.minSales) parts.push(`销量至少: ${filters.minSales}`);
      
      if (parts.length > 0) {
        filterInstruction = `
        用户设置了严格的筛选条件，请只生成符合以下条件的数据:
        ${parts.join('\n')}
        `;
      }
    }

    const prompt = `
      你正在模拟一个针对 TikTok/Douyin 的网络爬虫。
      用户提供了以下目标 URL: "${url}"
      
      由于这是一个模拟请求，请根据 URL 中的关键词（例如 'dress', 'phone', 'beauty', 具体的店铺名等），
      生成 3 到 6 个看起来非常真实的、该页面可能包含的商品数据。
      
      ${filterInstruction}

      生成要求：
      1. 商品名称必须符合 TikTok 爆款风格（使用 emoji，吸引人的标题）。
      2. 价格和销量要多样化（有的热销，有的刚上架），但必须符合上述筛选条件（如果有）。
      3. 店铺名称如果 URL 里有则用 URL 里的，没有则根据类目编造一个真实的店铺名。
      4. 链接可以使用虚拟的 tiktok.com 链接。
      
      请直接返回提取到的数据 JSON。
    `;

    const response = await ai.models.generateContent({
      model: GEMINI_MODEL_FAST,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: productExtractionSchema,
        temperature: 0.7, // Higher temperature for creative simulation
      }
    });

    const rawProducts = JSON.parse(response.text || "[]");
    return enrichProducts(rawProducts, `爬取自: ${url}`);
  } catch (error) {
    console.error("Crawler Simulation Error:", error);
    throw new Error("云端爬虫节点响应超时，请重试。");
  }
};
