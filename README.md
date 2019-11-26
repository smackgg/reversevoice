# ReverseVoice (微信小程序版)

# 项目运行 - 后端

## 准备
需要提前安装:
- Install [Node.js](https://nodejs.org/en/)
- Install [MongoDB](https://docs.mongodb.com/manual/installation/)

## 开始
- 克隆项目并进入后端目录
```
cd server
```
- 安装依赖
```
npm install
```
- 设置 mongoDB
```bash
# create the db directory
sudo mkdir -p /data/db
# give the db correct read/write permissions
sudo chmod 777 /data/db

# starting from macOS 10.15 even the admin cannot create directory at root
# so lets create the db diretory under the home directory.
mkdir -p ~/data/db
# user account has automatically read and write permissions for ~/data/db.
```
- 启动 mongoDB (Start your mongoDB server (you'll probably want another command prompt)
```bash
mongod

# on macOS 10.15 or above the db directory is under home directory
mongod --dbpath ~/data/db
```
-  打包并运行项目
```
npm run build
npm start
```

# 项目运行 - 小程序端
## 准备
需要提前安装:
- Install [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

## 开始
- 克隆项目并进入小程序目录
```
cd wechatapp
```
- 安装依赖
```
npm install
```

- 新建 .env 文件
```
在 wechatapp/src/utils 目录下克隆 env.example.ts 文件至同目录命名为 .env.ts 文件
此文件两个参数分别代表本地开发和线上部署的请求地址
```

-  运行项目
```
npm run dev:weapp // development mode
或者 npm run build:weapp // production mode
```

- 打开微信开发者工具
```
选择导入项目，并选择 wechatapp/dist 目录
若本地开发，需要在开发者工具中设置开启“不校验合法域名“
```
