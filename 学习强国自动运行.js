// 学习强国自动运行，包括：
// 1. 自动订阅两个号
// 2. 自动浏览文章，7篇，每篇2分钟，前两篇进行 收藏、评论、分享
//      评论内容：随机选择诗词
//      分享到：学习强国 ***
// 3. 自动回答问题，包括：
//      每日答题，每周答题，专项答题，挑战答题
// 4. 自动收听广播，7个台，每个台3分钟

// 注意：开发此脚本仅仅是为了使学习过程更专注、高效，不是为了刷分，因为：
// 1. 自动运行能迫使人跟上节奏，以免学着学着分心被手机上的其他消息干扰
// 2. 自动运行能强制开始学习，以免当其他事情很多的时候给自己找理由不开始学习

// 严禁将此脚本用于刷分或其它非法用途，违者后果自负，与开发者无关。


// 为实现功能所需的全局变量
var rTimeTotal = 120;    //文章共阅读120秒
var vTimeTotal = 180;    //视频、广播 共观看180秒
var today = formatDate();  //当天"2019-08-26";
var challenge_path = "/sdcard/脚本/xuexi/挑战答题 题库.txt"
var poem_path = "/sdcard/脚本/xuexi/每日诗词.txt"
var share_to_whom = "李华"


auto(); // 自动打开无障碍服务
var config = files.isFile("config.js") ? require("config.js") : {};
if (typeof config !== "object") {
    config = {};
}
var options = Object.assign({
    password: "",
    pattern_size: 3
}, config); // 用户配置合并

// 所有操作都是竖屏
const WIDTH = Math.min(device.width, device.height);
const HEIGHT = Math.max(device.width, device.height);
setScreenMetrics(WIDTH, HEIGHT);

start(options);
function start(options) {
    checkModule();

    var Robot = require("Robot.js");
    var robot = new Robot(options.max_retry_times);
    
    // 若是息屏状态, 则自动亮屏 上滑
    while (!device.isScreenOn()) {
        device.wakeUp();    // 点亮
        sleep(1000);        // 等待屏幕亮起
        gesture(500,[WIDTH/2,HEIGHT*0.8],[WIDTH/2,HEIGHT*0.2]);  // 向上滑动, 显示解锁界面
        sleep(2000);
    }
    
    // 连续运行处理
    var taskManager = new TaskManager();
    taskManager.init();
    taskManager.listen();
    taskManager.waitFor();

    if (files.exists("Secure.js")) {
        var Secure = require("Secure.js");
        var secure = new Secure(robot, options.max_retry_times);
        secure.openLock(options.password, options.pattern_size);
    }

    
    //音量
    var volume0 = device.getMusicVolume();
    device.setMusicVolume(0);
    
    ////////////////////////////////
    // 你的功能
    initScript();
    newsStudy();  //  阅读文章
    subscribeTwo()  //订阅2个号
    answerQuestion()  //回答问题
    musicStudy();  //播放音乐
    //videoStudy();  //播放视频 需连WIFI
    
    device.setMusicVolume(volume0);  //音量

    toastLog("学习全部完成");    //今日增加积分
    toSDelay(3);
    
    //清后台，防止一直播放音乐
    swipe(130,HEIGHT-10, 130,HEIGHT-400, 500)
    sleep(2000)
    id("stack_clear_all").findOne().click()  //清全部APP
    toastLog("已清除后台程序")
    
    ////////////////////////////////
    
    
    // 退出
    exit();
    throw new Error("强制退出");
}


//当天日期的格式化样式
function formatDate() {
    // dateStr = "2019-08-26";
    date = new Date;
    var y = date.getFullYear();
    var m = date.getMonth() + 1;
    var d = date.getDate();  //-1为昨天
    var h = date.getHours(); //24小时制
    
    if (h<15) {  //15点之前则d-1查看昨天的
        if (d>1) {
            d = d - 1
        } else {  //d=1, 每月1号, 则获取上月的最后一天
            m = m - 1
            var date = new Date(y, m, 0)
            var d = date.getDate()
        }
    }
    
    m = m < 10 ? '0' + m : m;  
    d = d < 10 ? ('0' + d) : d; //小于10的时候前面补0
    
    return y + '-' + m + '-' + d
}


// [a, b)之间的随机数, 防止被检测到
function randAB(a, b) {
    // random()为[0,1]随机数
    // random(x, y)为[x,y]间的随机整数
    return a + b*random()
}


function toSDelay(params) {
    sleep(params * 1000)
}

function back2main() {
    //返回主界面
    while (!desc("学习").exists()) {
        back();
        sleep(300 + randAB(0,300));
    }
}

function initScript() {
    toastLog('学习强国启动中……');
    var initState = launchApp("学习强国");
    
    toSDelay(4 + randAB(1, 3) );
    back2main()  //返回主界面
    
    if (initState == false) {
        toast("启动失败\n找不到该应用")
    }
    return true
};


// 订阅两个
function subscribeTwo() {
    back2main()  //返回主界面
    toastLog("进入订阅函数")
    
    // 需要在 学习-推荐 界面才能找到
    for (i=0; i<2; i++) {
        text("订阅").click();
        toastLog("已订阅")
        sleep(1000)
    }
}


// desc() 是控件的文字描述信息
function newsStudy() {
    back2main()  //返回主界面
    articalRead();
}


function articalRead() {
    //阅读6篇"综合"，每篇阅读rTimeTotal=120s
    i = 1;
    stop_flag = 0;
    while (i <= 7) {  //多一个确保完成时长
        if (click(today) == true) {
            toSDelay(2 + randAB(1,3))
            // 有时点进去发现是个视频，则退出
            if(className("android.widget.SeekBar").exists()){
                toastLog("文章是视频，退出")
                back();        
                toSDelay(2 + randAB(0,random(0,5)));
                
                back2main()  //返回主界面
                
                //把已经阅读的这个文章的日期拉到上面，使看不见
                var dateAlready = text(today).findOne().bounds();
                var y1 = dateAlready.centerY();
                var x1 = WIDTH/2 - 200 + random(0,400);
                gesture(500+randAB(0,0.3), [x1,y1],[x1,220]);  // 向上滑动, 显示解锁界面
                toSDelay(1 + randAB(0,0.5));
            } else {
                toastLog("开始阅读第" + i + "篇推荐文章……");
                toSDelay(3 + randAB(0,3))
                
                //阅读一定时长 rTimeTotal 秒
                if (watchTimerArtical(rTimeTotal) == true) {
                    toSDelay(2 + randAB(0,0.5));
                    
                    if (i<=2) {
                        // 点击 收藏
                        depth(10).clickable(true).indexInParent(2).drawingOrder(3).className("android.widget.ImageView").click()
                        log("已收藏")
                        toSDelay(0.5 + randAB(0,0.3))
                        
                        // 发表观点: "学习强国 学习使我快乐"
                        // 读取题库的 每行作为数组中的每个元素
                        f_poem = open(poem_path, mode = "r", encoding = "utf-8")
                        lines = f_poem.readlines()
                        f_poem.close()
                        poem = lines[random(0, lines.length-1)]

                        className("android.widget.TextView").text("欢迎发表你的观点").findOne().click()
                        className("android.widget.EditText").findOne().setText(poem)
                        className("android.widget.TextView").text("发布").findOne().click()
                        log("已发表观点：" + poem)
                        toSDelay(1 + randAB(0,0.3))
                        
                        // 分享给 学习强国
                        depth(10).clickable(true).indexInParent(3).drawingOrder(4).className("android.widget.ImageView").click()
                        toSDelay(0.5 + randAB(0,0.3))

                        depth(9).drawingOrder(1).indexInParent(0).clickable(true).className("android.widget.RelativeLayout").findOne().click()
                        log("分享到学习强国")
                        toSDelay(2 + randAB(0,0.5))
                        
                        id("view_search").text("搜索").findOne().click()
                        toSDelay(2 + randAB(0,0.5))
                        text("搜索").setText(share_to_whom)
                        toSDelay(2 + randAB(0,0.5))
                        
                        click(WIDTH/2 + randAB(-111,121), 580 + randAB(-5.6,5.6))  //点击查找到的人
                        toSDelay(0.5 + randAB(0,0.3))
                        text("发送").findOne().click()
                        toSDelay(0.5 + randAB(0,0.3))
                        log("已分享给" + share_to_whom)
                        toSDelay(0.5 + randAB(0,0.3))
                    }
                
                    // 阅读完成 从文章界面返回主界面
                    back();        
                    toSDelay(3 + randAB(0,0.5));
                    
                    //把已经阅读的这个文章的日期拉到上面，使看不见
                    var dateAlready = text(today).findOne().bounds();
                    var y1 = dateAlready.centerY();
                    var x1 = WIDTH/2 - 200 + random(0,400);
                    gesture(500+randAB(0,300),[x1,y1],[x1,220]);  // 向上滑动, 显示解锁界面
                    toSDelay(1);
                }
                
                i = i+1;
            }

        } else {
            //防止当天的文章不够6个，一直往下翻也找不齐
            if (stop_flag > 15) {
                toastLog("找不到更多今天的文章了");
                break;
            }
            
            var x1 = WIDTH/2 - 200 + random(0,400);
            var y1 = random(HEIGHT*0.7, HEIGHT*0.8);
            var y2 = random(469,500);
            gesture(500+randAB(0,300),[x1,y1],[x1,y2]);  // 向上滑动, 显示解锁界面
            toSDelay(1 + randAB(0,1.5));
            
            stop_flag = stop_flag + 1;
        }
     
    }
    
    toastLog("阅读时长已全部完成");
    toSDelay(5+randAB(0,3));
    
}


// 文章阅读一定时长，并不断向下滑动
function watchTimerArtical(time) {
    for (var timer = 0; timer < time;) {
        var x1 = WIDTH/2 - 200 + random(0,400);
        var y1 = random(HEIGHT*0.4, HEIGHT*0.6);
        var y2 = y1-random(150,200);
        gesture(500+randAB(0,300),[x1,y1],[x1,y2]);  // 向上滑动
        
        toSDelay(4.5+randAB(0,1));
        timer += 5
        if (timer <= 60) {
            toast("已学习" + timer + "秒")
        } else {
            var timerM = parseInt(timer / 60);
            var timerS = timer - timerM * 60;
            toast("已学习" + timerM + "分" + timerS + "秒")
        }
    }
    toastLog("阅读" + time + "秒完成");
    return true
}



//听音乐
function musicStudy() {
    back2main()  // 返回主界面
    
    if (click("视听学习") == true) {
        toastLog("开始视听学习")
    }
    toSDelay(2 + randAB(0,2));
    
    //进入 广播 视频列表
    if (click("听广播") == true) {
        toastLog("进入广播列表")
    }
    toSDelay(3 + randAB(0,3));
    
    //选择 国家广播电台  各地新闻广播
    musicListen();    //播放视频
    return true
}


// 每个电台听一定时间，切换
function musicListen() {
    for (var i = 1; i <= 7; i++ ) {
        click(814+randAB(-3.5,3.2), 581+randAB(-3,4));
        toastLog("开始听第" + i + "个广播" );
        toSDelay(1+randAB(0,0.35));
        
        //听一定时长 rTimeTotal 秒
        if (watchTimer(vTimeTotal) == true) {
            toSDelay(2+randAB(0,0.5));
        }
    }
    
    //点击暂停播放
    id("lay_state_icon").findOne().click();
    
    toastLog("播放时长已完成");
    toSDelay(3+randAB(0,2));
    
    return true
}


// 阅读、观看一定时长
function watchTimer(time) {
    for (var timer = 0; timer < time;) {
        toSDelay(5);
        timer += 5
        if (timer <= 60) {
            toast("已学习" + timer + "秒")
        } else {
            var timerM = parseInt(timer / 60);
            var timerS = timer - timerM * 60;
            toast("已学习" + timerM + "分" + timerS + "秒")
        }
    }
    log("停留时长：" + time + "秒");
    return true
}


// 回答全部问题，也可仅选择一个运行
// 每个问题都会先回到主界面，然后逐步进入各自答题界面
function answerQuestion() {
    challengeQuestion() //挑战答题
    dailyQuestion()     //每日答题
    weeklyQuestion()    //每周答题
    specialQuestion()   //专项答题
    
}


// 每日答题
function dailyQuestion() {
    back2main()  //返回主界面
    
    if (desc("工作").click() == true) {
        toastLog("进入 我的");
        toSDelay(2+randAB(0,0.4))
        
        desc("我要答题").click()
        toastLog("进入 我要答题");
        toSDelay(3+randAB(0,0.8));
        
        // 每日答题
        n = 5
        d1blank = 23
        d2blank = 22
        d1select = 25
        d2select = 22
        desc("每日答题").click()
        toastLog("进入 每日答题");
        toSDelay(2+randAB(0,0.7));
        for (dailyi=0; dailyi<7; dailyi++) {
            dailyAnswer(n, d1blank,d2blank, d1select,d2select);  //每日答题
            toSDelay(5+randAB(3,5));
            
            if (desc("领取奖励已达今日上限").exists()) {
                toastLog("领取奖励已达今日上限")
                break
            } else {
                desc("再来一组").click()
                toSDelay(2+randAB(0,0.8));
            }
        }
        log("\n\n")
    }
}


// 每周答题
function weeklyQuestion() {
    back2main()  //返回主界面
    
    if (desc("工作").click() == true) {
        toastLog("进入 我的");
        toSDelay(2+randAB(0,0.4))
        
        desc("我要答题").click()
        toastLog("进入 我要答题");
        toSDelay(3+randAB(0,0.8));
        
        // 每周答题
        n = 5
        d1blank = 23
        d2blank = 22
        d1select = 25
        d2select = 22
        desc("每周答题").click()
        toastLog("进入 每周答题");
        toSDelay(1.5+randAB(0,0.7));
        
        // 向下翻 找到 未作答 进入；底线停止
        while (!desc("未作答").exists()) {
            toastLog("每周答题 往下翻")
            var x1 = WIDTH/2 - 200 + random(0,400);
            var y = randAB(0.02, 0.05)
            gesture(500+randAB(3,17), [x1,HEIGHT*(0.8+y)],[x1,HEIGHT*(0.2+y)]);  // 向上滑动
            toSDelay(1 + randAB(0,0.5));
            
            if (desc("未作答").exists()) {
                desc("未作答").click()
                toSDelay(1+randAB(0,0.7));
                dailyAnswer(n, d1blank,d2blank, d1select,d2select);  //每日答题
                toSDelay(5+randAB(0.3,0.5));
                
                desc("返回").click()
                break
            }
            if (desc("您已经看到了我的底线").exists()) {
                back()
                log("暂无未答的每周答题")
                break
            }
        }
        
        toSDelay(1+randAB(0,0.7));
        log("\n\n")
        
    }
}


// 专项答题
function specialQuestion() {
    back2main()  //返回主界面
    
    if (desc("工作").click() == true) {
        toastLog("进入 我的");
        toSDelay(2+randAB(0,0.4))
        
        desc("我要答题").click()
        toastLog("进入 我要答题");
        toSDelay(3+randAB(0,0.8));
        
        // 专项答题
        n = 10
        d1blank = 23
        d2blank = 21
        d1select = 25
        d2select = 21
        desc("专项答题").click()
        toastLog("进入 专项答题");
        toSDelay(6.5+randAB(0,0.7));
        //question_type = "开始答题"
        question_type = "继续答题"
        //question_type = "重新答题"
        if (desc(question_type).exists()) {
            desc(question_type).click()
            toSDelay(1.5+randAB(0,0.7));
            dailyAnswer(n, d1blank,d2blank, d1select,d2select);  //每日答题
            toSDelay(5+randAB(3,5));
        }
        back()
        toSDelay(1.5+randAB(0,0.7));
        log("\n\n")
    }
}


// 挑战答题
function challengeQuestion() {
    back2main()  //返回主界面
    
    if (desc("工作").click() == true) {
        toastLog("进入 我的");
        toSDelay(2+randAB(0,0.4))
        
        desc("我要答题").click()
        toastLog("进入 我要答题");
        toSDelay(3+randAB(0,0.8));
        
        //挑战答题(没有提示, 从题库搜索)
        //  首先 返回主界面
        desc("挑战答题").click()
        toastLog("进入 挑战答题");
        toSDelay(6.5+randAB(0,2));
        challengeAnswer()
        log("\n\n")
    }
    
}


//挑战答题
function challengeAnswer() {
    // 读取题库的 每行作为数组中的每个元素
    f_challenge = open(challenge_path, mode = "r", encoding = "utf-8")
    lines = f_challenge.readlines()
    f_challenge.close()
    
    var ci = 0  //统计回答了多少题
    while (!desc("结束本局").exists()) {
        ci = ci + 1
        if (ci <= 11) {
            //获取题干文本
            //匹配题干 (可能除了题干之外也包含其它乱七八糟 没关系)
            var quess = depth(24).indexInParent(0).drawingOrder(0).className("android.view.View").untilFind();
            
            //精炼得到准确题干文本
            for(j = 0; j < quess.length; j++) {
                var ques = quess[j]
                if (ques.desc()) {
                    var question = ques.desc()   // 题干的一部分
                    log(question)
                    break
                }
            }
                
            var abcd = ["A", "B", "C", "D"]

            //在题库中查找该题干
            for (li=0; li<lines.length; li++) {
                if (lines[li].indexOf(question) != -1) {
                    var ans = lines[li]  //ans = 【B】题干...
                    log(lines[li])
                    toSDelay(1, randAB(0,2))
                    break
                } //当找不到时，ans在下文match时将未定义出错
                
            }
            log("查找结束")
            
            toSDelay(2, randAB(0,2))

            // 匹配答案 ques_abcd为题目中的四个选项
            var ans_abcd = ans.match(/【(\S*)】/)[1];  //题库中，该题干最前面【B】中的 B
            toastLog(ans_abcd)
            
            //答题界面的4个选项控件
            var ques_abcd = depth(27).clickable(true).className("android.widget.RadioButton").untilFind()
            for (j=0; j<abcd.length; j++) {
                // 若匹配到的 ans_abcd 中有abcd中的某个，则点击答题界面中的某个选项
                if (ans_abcd.indexOf(abcd[j]) != -1) {
                    ques_abcd[j].click()
                    toSDelay(2, randAB(0,1))
                }
            }
            
            log('\n')  //此题回答完成
        } else {   // 连续回答正确11题以后 随机选择
            //答题界面的4个选项控件
            var ques_abcd = depth(27).clickable(true).className("android.widget.RadioButton").untilFind()
            ques_abcd[random(0, ques_abcd.length)].click()
            toSDelay(2, randAB(0,1))
        }
        toSDelay(5+randAB(3,5));
    }
    
    if (desc("结束本局").exists()) {
        desc("结束本局").click()  //点击之后返回答题主界面：每日 每周 专项 挑战
        toastLog("挑战答题结束")
        toSDelay(2, randAB(0,2))
    }
}


// 每日答题：视频题无法做
function dailyAnswer(n, d1blank,d2blank, d1select,d2select) {
    toastLog("进入答题")
    for (quesi=0; quesi<n; quesi++) {
            // 填空题 点击空格后输入答案
        if (desc("填空题").exists() || desc("填空题 (10分)").exists()) {
            toastLog("填空题");
            
            var answer = getAnswerFillBlank(d1blank,d2blank)
            if(className("android.widget.EditText").findOne().parent().click()){
                setText(answer);
                toSDelay(2.5, randAB(0,0.5))
                //className("android.widget.Button").findOne().click();
                click(920, 240)  //点击 下一题 确定
                toastLog("此题回答完成")
                toSDelay(2, randAB(0,1))
                
                // 有些题不是挖空, 需要理解，所以会错
                if (desc("下一题").exists()) {
                    toastLog("  回答错误")
                    desc("下一题").click()
                    toSDelay(2, randAB(0,0.5))
                }
                click(920+randAB(-5,5), 240+randAB(-5,5))  // 多点击一次，防止异常停顿
                toSDelay(0.5, randAB(0,1))
                click(920+randAB(-3,5), 240+randAB(-5,3))  // 多点击一次，防止异常停顿
                toSDelay(1, randAB(0,1))
            }
        }

        // 选择题 
        if (desc("单选题").exists() || desc("多选题").exists() || desc("单选题 (10分)").exists() || desc("多选题 (10分)").exists()) {
            toastLog("选择题");
            
            var answers = getAnswerSelection(d1select,d2select)
            if (answers.length) {
                for(j = 0; j < answers.length; j++) {
                    depth(25).desc(answers[j]).click()
                    toSDelay(0.5, randAB(0,0.3))
                }
            } else { //若答案为空, 则随机选1个
                var abcd = ['A.', 'B.', 'C.', 'D.']
                depth(25).desc(abcd[random(0,3)]).click()
                toSDelay(0.5, randAB(0.3,0.5))
            }
            
            toSDelay(2.5, randAB(0,0.4))
            click(920, 240)  //点击 下一题 确定;
            toastLog("此题回答完成")
            toSDelay(2, randAB(0,0.5))
            
            // 有些题不是挖空, 需要理解，所以会错
            if (desc("下一题").exists()) {
                toastLog("  回答错误")
                desc("下一题").click()
                toSDelay(2, randAB(0,0.5))
            }
            click(920+randAB(-5,5), 240+randAB(-5,5))  // 多点击一次，防止异常停顿
            toSDelay(0.5, randAB(0,1))
            click(920+randAB(-3,5), 240+randAB(-5,3))  // 多点击一次，防止异常停顿
            toSDelay(1, randAB(0,1))
        }
        
        log("\n")
        toSDelay(randAB(3,8))
    }
    
    
}


// 点击提示，获取答案 选择：单选题 多选题
function getAnswerSelection(d1select, d2select) {
    //根据选项文本是否在提示文本中判断是否为答案
    
    //获取选项
    var options = depth(d1select).indexInParent(2).untilFind();
    
    if(desc("查看提示").click()){
        toastLog("进入提示")
        toSDelay(0.5, randAB(0.3,0.5))
        
        //提取答案句子
        var anss = depth(d2select).clickable(true).untilFind();
        //toastLog(anss)
        for(j = 0; j < anss.length; j++) {
            var ans = anss[j]
            if (ans.desc()) {
                //toastLog(ans.desc())
                toastLog("已获取提示文本")
                var real_ans = ans.desc()
            } else {
                toastLog("没有找到提示文本")
                var real_ans = "没有找到提示文本"
            }
        }
    
        //精炼句子得到准确答案
        var option_ans = []
        for(j = 0; j < options.length; j++) {
            var op = options[j]  //各选项文本的控件
            
            // 包含时，不等于-1
            if (real_ans.indexOf(op.desc()) != -1) {
                option_ans.push(op.desc())
            }
        }
    }
    
    click(500, 100)  // 点击上面，退出提示
    toastLog('答案：' + option_ans)
    toSDelay(2, randAB(0.3,0.5))
    
    return option_ans
}


// 点击提示，获取答案 填空
function getAnswerFillBlank(d1blank, d2blank) {
    // 最好是能根据文字颜色得到答案，但是我不知道怎么做
    // 现在：将提示文字中的题干部分去除，得到答案。可能错误
    
    //匹配题干 (可能除了题干之外也包含其它乱七八糟 没关系)
    var quess = depth(d1blank).clickable(false).untilFind();

    if(desc("查看提示").click()){
        toastLog("进入提示")
        toSDelay(0.5, randAB(0.3,0.5))
        
        //提取答案句子
        var anss = depth(d2blank).clickable(true).untilFind();
        //toastLog(anss)
        for(j = 0; j < anss.length; j++) {
            var ans = anss[j]
            if (ans.desc()) {
                // toastLog(ans.desc())
                toastLog("已获取提示文本")
                var real_ans = ans.desc()
            } else {
                toastLog("没有找到提示文本")
                var real_ans = "没有找到提示文本"
            }
        }
        
        //精炼句子得到准确答案
        for(j = 0; j < quess.length; j++) {
            var ques = quess[j]
            if (ques.desc()) {
                var ques_str = ques.desc()   // 题干的一部分
                
                // 将题干从答案句子中去掉
                var reg = new RegExp(ques_str, "g");
                var real_ans = real_ans.replace(reg, "");
                
                // 将“”从答案句子中去掉
                var reg = new RegExp("”", "g");
                var real_ans = real_ans.replace(reg, "");
                
            }
        }
    }
    
    click(500, 100)  // 点击上面，退出提示
    toastLog('答案：' + real_ans)
    toSDelay(2, randAB(0.3,0.5))
    
    return real_ans
}





// 不想听广播的话，也可以视频
// 不过视频费流量，而且视频时长不一定足够3min
function videoStudy() {
    back2main()  //返回主界面
    if (click("视听学习") == true) {
        toastLog("开始视听学习")
    }
    toSDelay(2);
    
    //进入 联播频道 视频列表
    if (click("联播频道") == true) {
        toastLog("进入联播频道")
    }
    toSDelay(5);
    
    videoWatch();    //播放视频
    
}


function videoWatch() {
    //观看6篇"新闻联播"，每篇阅读 vTimeTotal=120s
    i = 1;
    stop_flag = 0;
    while (i <= 7) {  //为了防止达不到时长，多一个
        if (click('央视网') == true) {
            toastLog("开始观看第" + i + "个视频……");
            toSDelay(5)
            
            popupDeal();    //确认流量播放等
            
            //观看一定时长 vTimeTotal 秒
            if (watchTimer(vTimeTotal) == true) {
                toastLog("观看完成")
                toSDelay(2);
                
                back();
                toSDelay(3);
                
                //把已经观看的这个视频拉到上面，使看不见
                var videoAlready = text('央视网').findOne().bounds();
                var y1 = videoAlready.centerY();
                var x1 = WIDTH/2 - 200 + random(0,400);
                gesture(500,[x1,y1],[x1,220]);  // 向上滑动, 显示解锁界面
                toSDelay(1);
                
            }
            
            i = i+1;
            
        } else {
            //防止当天的文章不够6个，一直往下翻也找不齐
            if (stop_flag > 15) {
                toastLog("找不到更多今天的视频了");
                break;
            }
            
            var x1 = WIDTH/2 - 200 + random(0,400);
            var y1 = random(HEIGHT*0.7, HEIGHT*0.8);
            var y2 = random(469,500);
            gesture(500,[x1,y1],[x1,y2]);  // 向上滑动
            toSDelay(1);
            
            stop_flag = stop_flag + 1;
        }
    }
    
    toastLog("视频时长已全部完成");
    toSDelay(5);
    
}


// 流量时，确定播放视频
function popupDeal(params) {
    while (text("我知道了").exists()) {
        text("我知道了").click()
    }
    while (text("继续播放").exists()) {
        text("继续播放").click()
    }
    while (text("重新播放").exists()) {
        text("重新播放").click()
    }
    return true
}


function videoLike() {
    var starIcon = classNameContains("ImageView").depth(2).findOnce(1);
    if (starIcon.click() == true) {
        popupDeal();
        toast("收藏成功");
        toSDelay(5)
    }
    return true
}











// 下面是解锁屏所需的函数
/**
 * 检查必要模块
 */
function checkModule() {
    if (!files.exists("Robot.js")) {
        throw new Error("缺少Robot.js文件，请核对第一条");
    }

    if (!files.exists("Secure.js") && context.getSystemService(context.KEYGUARD_SERVICE).inKeyguardRestrictedInputMode()) {
        throw new Error("缺少Secure.js文件，请核对第一条");
    }
}

function TaskManager() {
    this.task_no = 0;
    this.time_tag = "start_time";
    this.wait_time = 15000;

    this.init = function () {
        engines.myEngine().setTag(this.time_tag, (new Date()).getTime());

        var task_list = this.getTaskList();
        this.task_no = this.findIndex(engines.myEngine(), task_list);
        log(Object.keys(task_list));
    };

    this.getTaskList = function () {
        return engines.all().sort(function(e1, e2) {
            return e1.getTag(this.time_tag) - e2.getTag(this.time_tag);
        }.bind(this));
    };
    
    this.findIndex = function (engine, list) {
        var engine_id = engine.id;
        var id_list = list.map(function (o) {
            return o.id;
        });
        
        return id_list.indexOf(engine_id);
    };

    this.listen = function() {
        // 子线程
        threads.start(function () {
            // 监听音量上键
            events.observeKey();
            events.onceKeyDown("volume_up", function (event) {
                engines.stopAll();
                exit();
            });
        });
    };

    this.waitFor = function () {
        while (1) {
            device.wakeUpIfNeeded();
            
            var task_no = this.findIndex(engines.myEngine(), this.getTaskList());
            if (task_no > 0) {
                log("任务" + this.task_no + "排队中，前面有" + task_no + "个任务");
                sleep(this.wait_time);
            } else {
                log("任务" + this.task_no + "开始运行");
                break;
            }
        }
    };
}

