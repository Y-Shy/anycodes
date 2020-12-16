# Qpython 3, Android
# 复习单词：基本原理 spaced repetition 根据你对单词的熟悉程度调整下次复习时间      
# 可以手动向数据文件添加新词，添加时可只写word，不记录时间
#

from androidhelper import Android  # Qpython提供SL4A服务
droid = Android()

from random import shuffle
from random import randint
from urllib.request import urlopen
import datetime
from time import sleep
import re
import math

import os
os.system('clear')  # 清屏


path = r'/sdcard/资料/复习单词.txt'    # 数据文件位置
mp3_path = r'/sdcard/qpython/word mp3/'      # mp3存放路径



# 有时候会出重复的单词，运行这个函数去重
def initing(path):
    # 当音频文件夹不存在时，创建
    if not os.path.exists(mp3_path):
        os.makedirs(mp3_path)
        
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # 去重时保留把之前的记录移到文件后面以便再次复习
    keys, unique_lines = [], []
    for line in lines:
        res = line.split(', ')
        
        # 如果只有word没有时间间隔或时间, 设定一个过去时间使这次能复习
        if len(res)<3:
            line = res[0].replace('\n', '') + ', 2h' + ', 2020-01-01 01:01:01\n'
            
        word = res[0]    
        if word in keys:
            # print('重复：', line)
            word_i = keys.index(word)
            line = unique_lines[word_i]
            del unique_lines[word_i]
            del keys[word_i]
            
        keys.append(word)
        unique_lines.append(line)
            
            
    if not lines == unique_lines:
        with open(path, 'w', encoding='utf-8') as f:
            lines = f.writelines(unique_lines)
    
    # 音量设置
    ctime_h = datetime.datetime.now().hour  # 当前小时数(24制), int
    if ctime_h >= 9 and ctime_h < 22:
        droid.setMediaVolume(0)  #6
    else:
        droid.setMediaVolume(0)  #4
    
    return [i.replace('\n', '') for i in unique_lines]    
    
# initing(path)  #文件去重
# exit()
    
    
class Spaced_Repetition:
    def __init__(self, lines):  # 类的初始化, li代表实例化类的时候需要传入的变量
        self.lines = lines
        # self.cycles = ['2h', '5h', '12h', '24h', '2d', '5d', '12d', '21d', '30d', '2m', '3m', '4m', '6m', '8m', '1y', '2y', '3y']
        # 可以随便删除、添加、修改间隔
        self.cycles = ['5h', '24h', '2d', '5d', '12d', '21d', '30d', '2m', '3m', '4m', '6m', '8m', '1y', '2y', '3y']
        
        self.cycle_seconds = []
        for i in self.cycles:
            self.cycle_seconds.append(self.cal_seconds(i))
            
        self.eachday = 100  # 每天复习多少单词
        self.todaywords = 0  # 统计 今天已经复习过且今天不需要再复习 的单词数
        
    def repete(self):
        ctime = datetime.datetime.now().replace(microsecond=0)
        # print(ctime.day), exit()
        
        # 计算各单词下次应开始复习时间
        lines2review = []
        for line in self.lines:
            line = line.split(', ')   # line结构 [word, '2h', time]
            
            # 如果时间间隔不存在于self.cycles
            if line[1] not in self.cycles:
                line[1] = self.current_cycle(line[1])
                
            last_time = datetime.datetime.strptime(line[2], '%Y-%m-%d %H:%M:%S')
            word_cycle = self.cal_seconds(line[1])
            next_time = last_time + datetime.timedelta(seconds=word_cycle)
            
            
            if ctime > next_time:   # 可以比较大小
                lines2review.append(line)
            elif ctime.day == last_time.day:
                self.todaywords += 1
            
        # print(self.todaywords), exit()
        
        # 如果还有就接着复习
        if len(lines2review) > 0:
            self.review(lines2review)   
        else:
            print(screen_width('无更多待复习单词，做点别的吧！'))
        
        
    def review(self, lines):
        n = 1
        flag = False   #是否已经启动mdict
        toomany = len(lines) - self.eachday + self.todaywords
        print(screen_width('今天有{}个待复习单词'.format(len(lines)-toomany)) + '\n')
        
        # 把到时间的待复习单词循环完
        while len(lines):
            line = lines.pop()  #['hate', '5min', '2020-02-27 11:30:50.159']
            word, cycle = line[0], line[1]
            
            print('    {: <24} {}'.format(str(n)+'. '+word, '>>>'), end='', flush=True)
            speak_it(word)
            x = input()  #这句+上面的print = 下句
            # x = input('{: <24} {}'.format(str(n)+'. '+word, '>>>'))

            ctime = datetime.datetime.now().replace(microsecond=0)
            rand_min = randint(-120, 120)  # 防止一次复习很多时，下次一窝蜂很多又一起复习
            ctime += datetime.timedelta(minutes=rand_min)
            
            if x == '0':
                print('\n' + screen_width('共{}个待复习单词'.format(len(lines)+1)) + '\n')
                exit(0)
                
            elif x in ['C', 'c', 'check']:
                if not flag:
                    # 启动APP 根据包名
                    droid.launch('cn.mdict.SplashScreen')
                    sleep(1.5)
                    flag = True
                
                #print('已启动')
                droid.setClipboard(word)  # 设置剪贴板
                #print('copied')
                
                if line not in lines:
                    new_cycle = cycle
                    self.update(word, new_cycle, ctime)
                
                if n<10:
                    xx = input('{}'.format(''))
                else:
                    xx = input('{}'.format(''))
            
            elif x in ['H', 'h', 'help']:
                if not flag:
                    # 启动APP 根据包名
                    droid.launch('cn.mdict.SplashScreen')
                    sleep(1.5)
                    flag = True
                
                droid.setClipboard(word)  # 设置剪贴板
                
                lines.insert(-4, line)  #4个单词后再次复习该词
                lines.insert(-14, line)  #14个单词后再次复习该词
                #n -= 3
            
                new_cycle = self.cycles[0]
                self.update(word, new_cycle, ctime)
                
                xx = input('{}'.format(''))
                
            else:  #认识
                if line not in lines:
                    new_cycle = self.next_cycle(cycle)
                    self.update(word, new_cycle, ctime)
            
            n += 1
            if (n-1)%15 == 0:
                x = input('\n' + screen_width('共{}个待复习单词'.format(len(lines)+1)))
                if x == 0:
                    exit()
                    
                os.system('clear')  # 清屏
                print(screen_width('已复习{}个，今天还要复习{}个'.format(n-1, len(lines)-toomany)) + '\n')
                
         
        # 开始随机复习
        print('\n' + screen_width('无更多待复习单词，做点别的吧！'))
        
        
    def update(self, word, cycle, ctime):
        """替换word开头的某行
        /^{}/   匹配Word开头的某行
        c       表示 取代
        c{}中的{}是换成的内容
        """
        
        newline = '{}, {}, {}'.format(word, cycle, ctime)
        os.system("sed -i '/^{}/c{}' {}".format(word, newline, path))
        # print('已更新')
        
        
    def cal_seconds(self, cycle):
        num = float(re.findall('\d+', cycle)[0])
        
        if 'h' in cycle:
            return num * 3600
        elif 'd' in cycle:
            return num * 3600 * 24
        elif 'm' in cycle:
            return num * 3600 * 24 * 30
        elif 'min' in cycle:
            return num * 60
        elif 'y' in cycle:   # 'y' in cycle
            return num * 3600 * 24 * 365
        else:
            print('非法的时间间隔：{}'.format(cycle))
            exit()
            
            
    def current_cycle(self, period):
        if period not in self.cycles:
            period_sec = self.cal_seconds(period)
            
            period_diffs = []
            for i in self.cycle_seconds:
                period_diffs.append(abs(period_sec - i))
                
            min_index = period_diffs.index(min(period_diffs))
            c_period = self.cycles[min_index]
        else:
            c_period = period
            
        return c_period
        
        
    def next_cycle(self, period):
        c_index = self.cycles.index(period)
        if c_index == len(self.cycles) - 1:
            return self.cycles[c_index]
        else:
            return self.cycles[c_index + 1]
        

def speak_it(word):
    #return
    # 'off+season' 不把空格换成+会bad request
    if ' ' in word:
        word = word.replace(' ', '+')
    
    path = os.path.join(mp3_path, '{}.mp3'.format(word))
    
    # 根据链接播放在线媒体 https://www.qpython.org/en/guide_androidhelpers.html#mediaplayerfacade
    url1 = 'http://fanyi.baidu.com/gettts?lan=uk&text={}&spd=3&source=web'.format(word)  #uk英音，en美音
    url2 = 'http://media.shanbay.com/audio/uk/{}.mp3'.format(word)  #uk英音, us美音
    url3 = 'http://dict.youdao.com/dictvoice?type=1&audio={}'.format(word)  #type0美音, type1英音
    url4 = 'https://ssl.gstatic.com/dictionary/static/sounds/oxford/{}--_gb_1.mp3'.format(word.lower())  #牛津词典英音, gb英音，us美音    
    # url5 = 'https://lex-audio.useremarkable.com/mp3/{}_gb_1.mp3'.format(word.lower())  #牛津词典英音, gb英音，us美音  这个发音少，比如enthusiasm就么得      
    # droid.mediaPlay(url)
    
    # 不存在时下载音频
    if not os.path.exists(path):
        try:
            res = urlopen(url4)
            # page_status = res.getcode()
            # print(page_status)
        except:
            try:
                res = urlopen(url2)
            except:
                res = urlopen(url1)  #获取tts发音
            
        with open(path, 'wb') as f:
            f.write(res.read())
            f.flush()
        
    droid.mediaPlay(path)
        

def screen_width(text):
    # 43个英文字符宽度-刚好是屏幕1080px宽
    # 37是字体14pt时，41是16pt
    # 3pt = 4px，但还有字符间距
    # 每个中文汉字、字符为2-
    # 计算text两侧各多少个-时刚好居中
    
    count_num = len(re.findall('\d', text))
    hanzi_width = (len(text) - count_num)*2
    each_side = (37 - count_num - hanzi_width) / 2
    
    return '{}{}{}'.format('-'*math.ceil(each_side), text, '-'*math.floor(each_side))
    
    
if __name__ == '__main__':
    lines = initing(path)
    
    ## Spaced Repetition  间隔复习法，根据你对单词的熟悉程度调整下次复习时间
    spaced_repe = Spaced_Repetition(lines)
    spaced_repe.repete()
    
    