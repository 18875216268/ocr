// api/ocr.js
const axios = require('axios');

// 获取百度OCR访问令牌
async function getAccessToken(apiKey, secretKey) {
  try {
    const response = await axios.get(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${apiKey}&client_secret=${secretKey}`
    );
    return response.data.access_token;
  } catch (error) {
    console.error('获取访问令牌失败:', error);
    throw new Error('获取百度OCR访问令牌失败');
  }
}

// 处理OCR请求
module.exports = async (req, res) => {
  // 启用CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只支持POST请求' });
  }

  try {
    const { imageBase64, ocrType = 'general_basic' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: '缺少图片数据' });
    }

    // 从环境变量中获取API密钥
    const apiKey = process.env.BAIDU_OCR_API_KEY;
    const secretKey = process.env.BAIDU_OCR_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return res.status(500).json({ error: '缺少百度OCR API凭证' });
    }

    // 获取访问令牌
    const accessToken = await getAccessToken(apiKey, secretKey);

    // OCR接口映射
    const ocrEndpoints = {
      general_basic: 'https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic',
      accurate_basic: 'https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic',
      handwriting: 'https://aip.baidubce.com/rest/2.0/ocr/v1/handwriting',
      webimage: 'https://aip.baidubce.com/rest/2.0/ocr/v1/webimage',
      idcard: 'https://aip.baidubce.com/rest/2.0/ocr/v1/idcard',
      bankcard: 'https://aip.baidubce.com/rest/2.0/ocr/v1/bankcard',
      driving_license: 'https://aip.baidubce.com/rest/2.0/ocr/v1/driving_license',
      vehicle_license: 'https://aip.baidubce.com/rest/2.0/ocr/v1/vehicle_license',
      license_plate: 'https://aip.baidubce.com/rest/2.0/ocr/v1/license_plate',
      business_license: 'https://aip.baidubce.com/rest/2.0/ocr/v1/business_license',
      receipt: 'https://aip.baidubce.com/rest/2.0/ocr/v1/receipt'
    };

    const ocrUrl = ocrEndpoints[ocrType] || ocrEndpoints.general_basic;

    // 准备请求数据
    const data = `image=${encodeURIComponent(imageBase64)}`;

    // 发送OCR请求
    const ocrResponse = await axios({
      method: 'post',
      url: `${ocrUrl}?access_token=${accessToken}`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      data: data
    });

    // 返回OCR结果
    return res.status(200).json(ocrResponse.data);
  } catch (error) {
    console.error('OCR处理错误:', error);
    return res.status(500).json({ 
      error: '处理OCR请求时出错', 
      message: error.message 
    });
  }
};