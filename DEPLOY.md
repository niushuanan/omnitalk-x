# OmniTalk X 部署说明

本文档面向在 GitHub 上直接部署体验的用户。

## 1. 环境要求
- Python >= 3.9
- Node.js >= 16
- OpenRouter API Key

## 2. 本地运行（开发模式）
```bash
# 后端
cd omnitalkx
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python main.py
```

```bash
# 前端
cd omnitalkx/frontend
npm install
npm run dev
```

启动后访问：
- 前端：http://localhost:5173/
- 后端：http://localhost:8000/

## 3. 生产部署（静态前端 + 后端）
```bash
# 构建前端
cd omnitalkx/frontend
npm install
npm run build

# 启动后端（会自动加载 frontend/dist）
cd ../..
python omnitalkx/main.py
```

访问：http://localhost:8000/

## 4. 反向代理（必须）
前端请求路径都是 `/api`，生产部署时需要反向代理到后端。

**Nginx 示例**
```nginx
server {
    listen 80;
    server_name example.com;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location / {
        root /path/to/omnitalkx/frontend/dist;
        try_files $uri /index.html;
    }
}
```

**最小可用片段**
```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8000/api/;
}

location / {
    root /path/to/omnitalkx/frontend/dist;
    try_files $uri /index.html;
}
```

## 5. 配置 OpenRouter Key
进入页面右侧设置输入 Key 即可。Key 会保存于浏览器本地。

## 6. 模型版本覆盖（可选）
如果需要替换模型版本，可以创建文件：
```
omnitalkx/backend/config/models_override.json
```
内容参考：
```
omnitalkx/backend/config/models_override.example.json
```

## 7. 常见问题
1. **模型无法回复 / 请求失败**  
   - 请检查 OpenRouter 额度或该模型权限
2. **前端请求 404**  
   - 检查 `/api` 反代是否正确
3. **想清空本地数据**  
   - 浏览器清理站点数据或使用页面内“清除聊天记录”
