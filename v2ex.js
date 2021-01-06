const axios = require("axios");
const cookie = process.env.V2EXCK;
const fs = require("fs");
const qmsgapi = process.env.QMSGAPI;
const sckey = process.env.sckey;
const tgapi = process.env.tgapi;
once = null;
ckstatus = 1;
result_md = ""
signstatus = 0;
time = new Date();
tmpHours = time.getHours();
time.setHours(tmpHours + 8);
notice = time.toLocaleString() + "\n";
const header = {
    headers: {
        Referer: "https://www.v2ex.com/mission",
        Host: "www.v2ex.com",
        "user-agent": "Mozilla/5.0 (Linux; Android 10; Redmi K30) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.83 Mobile Safari/537.36",
        cookie: `'${cookie}'`,
    },
};

//获取once检查是否已签到

function check() {
    return new Promise(async (resolve) => {
        try {
            let url = "https://www.v2ex.com/mission/daily";
            let res = await axios.get(url, header);
            reg1 = /需要先登录/;
            if (reg1.test(res.data)) {
                console.log("cookie失效");
                ckstatus = 0;
                notice += "cookie失效";
            } else {
                reg = /每日登录奖励已领取/;
                if (reg.test(res.data)) {
                    notice += "今天已经签到过啦\n";
                    signstatus = 1;
                } else {
                    reg = /redeem\?once=(.*?)'/;
                    once = res.data.match(reg)[1];
                    console.log(`获取成功 once:${once}`);
                }
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}

//每日签到

function daily() {
    return new Promise(async (resolve) => {
        try {
            let url = `https://www.v2ex.com/mission/daily/redeem?once=${once}`;
            let res = await axios.get(url, header);
            reg = /已成功领取每日登录奖励/;
            if (reg.test(res.data)) {
                notice += "签到成功\n";
                signstatus = 1;
            } else {
                notice += "签到失败\n";
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}

//查询余额

function balance() {
    return new Promise(async (resolve) => {
        try {
            let url = "https://www.v2ex.com/balance";
            let res = await axios.get(url, header);
            reg = /\d+?\s的每日登录奖励\s\d+\s铜币/;
            let cc = res.data.match(/<td class=\"d\" style=\"text-align: right;\">(\d+).0<\/td>/)
            let bb = res.data.match(reg)[0].match(/\d+/g)
            result_md = `| ${bb[0]} |${bb[1]}  | ${cc[1]} |`
            console.log(res.data.match(reg)[0]);
            console.log(result_md)
            notice += res.data.match(reg)[0];
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}
//推送结果

function qmsg(msg) {
    return new Promise(async (resolve) => {
        try {
            let url = `${qmsgapi}?msg=${encodeURI(msg)}`;
            let res = await axios.get(url);
            if (res.data.code == 0) {
                console.log("Qmsg酱：发送成功");
            } else {
                console.log("Qmsg酱：发送失败!" + res.data.reason);
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}

function server(msg) {
    return new Promise(async (resolve) => {
        try {
            let url = `https://sc.ftqq.com/${sckey}.send`
            let res = await axios.post(url, `text=v2ex签到(づ ●─● )づ${msg}&desp=${msg}`)
            if (res.data.errmsg == 'success') {
                console.log('server酱:发送成功')
            } else {
                console.log('server酱:发送失败')
                console.log(res.data)
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
    });
}


//@Windyskr  https://github.com/Windyskr/V2ex-Auto-Sign
function tgbot(msg) {
    return new Promise(async (resolve) => {
        try {
            let url = `${tgapi}&text=${encodeURI(msg)}`;
            let res = await axios.get(url);
            if (res.data.ok) {
                console.log("Tg：发送成功");
            } else {
                console.log("Tg：发送失败!");
                console.log(res.data);
            }
        } catch (err) {
            console.log(err);
        }
        resolve();
       });
}


function sign() {
    return new Promise(async (resolve) => {
        try {

            if (!cookie) {
                console.log("你的cookie呢！！！");
                qmsg("你的cookie呢！！！");
                return;
            }
            await check();
            if (ckstatus == 1) {
                if (once && signstatus == 0) {
                    await daily();
                    await balance();
                    if (signstatus == 0) {
                        console.log("签到失败")
                    } else if (signstatus == 1 && result_md != "") {
                        fs.writeFile("./balance.md", result_md + `\n`, {
                                flag: "a",
                            },
                            (err) => {
                                if (err) {
                                    throw err;
                                } else {
                                    console.log("success");
                                }
                            }
                        );
                    }
                }
            } else {}
            console.log(notice);            
            await qmsg(notice);
            await server(notice)
            await tgbot(notice)
        } catch (err) {
            console.log(err);
        }
            resolve();
    });
}



sign();