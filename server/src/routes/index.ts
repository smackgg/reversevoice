import Router from "koa-router";
import { getWxacode } from "../controllers/wechat";
import { config } from "./config";
const hasha = require("hasha");
const axios = require("axios");
// const express = require('express');

// const app = express();

// 全局缓存变量
const SIGNATURE = {
  timestamp: 0,
  signature: "",
  noncestr: config.nonceStr,
};

// 获取当前时间
function currentMoment() {
  return Math.floor(new Date().valueOf() / 1000);
}

// 是否过期
function isAlive() {
  if (currentMoment() - SIGNATURE.timestamp < 7200) {
    return true;
  } else {
    return false;
  }
}

// 获取access token
function getAccessToken(appid: any, appsecret: any) {
  return axios
    .get("https://api.weixin.qq.com/cgi-bin/token", {
      params: {
        grant_type: "client_credential",
        appid: config.appid,
        secret: config.appsecret,
      },
    })
    .then(function (response: any) {
      console.log(response, 111);
      // callback(response.data);
      return response.data;
    })
    .catch(function (error: any) {
      // callback(error);
    });
}

// 获取ticket
function getTicket(accessToken: any) {
  return axios
    .get("https://api.weixin.qq.com/cgi-bin/ticket/getticket", {
      params: {
        access_token: accessToken,
        type: "jsapi",
      },
    })
    .then(function (response: any) {
      // callback(response.data);
      return response.data;
    })
    .catch(function (error: any) {
      // callback(error);
    });
}

// 获取签名
function getHash(jsapi_ticket: any, noncestr: any, timestamp: any, url: any) {
  let str =
    "jsapi_ticket=" +
    jsapi_ticket +
    "&noncestr=" +
    noncestr +
    "&timestamp=" +
    timestamp +
    "&url=" +
    url;
  return hasha(str, { algorithm: "sha1" });
}

// app.get('/', function (req, res, next) {
// 	if (isAlive()) {
// 		res.json({
// 			timestamp: SIGNATURE.timestamp,
// 			signature: SIGNATURE.signature,
// 			nonceStr: SIGNATURE.noncestr
// 		})
// 	} else {
// 		SIGNATURE.timestamp = currentMoment();
// 		getAccessToken(config.appid, config.appsecret, function(data){
// 			getTicket(data.access_token, function(data2){
// 				let ticket = data2.ticket;
// 				let signature = getHash(ticket, SIGNATURE.noncestr, SIGNATURE.timestamp, config.url);
// 				SIGNATURE.signature = signature;
// 				res.json({
// 					signature: signature,
// 					noncestr: SIGNATURE.noncestr,
// 					timestamp: SIGNATURE.timestamp
// 				})
// 			})
// 		})
// 	}
// });
const router = new Router<null, { needWechatLogin(): void }>();

router.get("/", async (ctx) => {
  console.log(ctx);
  if (isAlive()) {
    ctx.body = {
      timestamp: SIGNATURE.timestamp,
      signature: SIGNATURE.signature,
      nonceStr: SIGNATURE.noncestr,
    };
  } else {
    SIGNATURE.timestamp = currentMoment();
    console.log(config.appid, config.appsecret);
    const data = await getAccessToken(config.appid, config.appsecret);
    console.log(data, "data");
    const data2 = await getTicket(data.access_token);
    let ticket = data2.ticket;
    let signature = getHash(
      ticket,
      SIGNATURE.noncestr,
      SIGNATURE.timestamp,
      config.url
    );
    SIGNATURE.signature = signature;
    ctx.body = {
      signature: signature,
      noncestr: SIGNATURE.noncestr,
      timestamp: SIGNATURE.timestamp,
    };
  }
  // ctx.body = {
  //     data: 1
  // }
  // https://reverse-voice.smackgg.cn
});

module.exports = router;
