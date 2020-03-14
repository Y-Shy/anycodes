# Qpython 3, Android
# 复习单词：基本原理 spaced repetition 根据你对单词的熟悉程度调整下次复习时间      
# 可以手动向数据文件添加新词，添加时可只写word，不记录时间


from androidhelper import Android  # Qpython提供SL4A服务
droid = Android()

from random import shuffle
from urllib.request import urlopen
import datetime
import re
import math

import os
os.system('clear')  # 清屏


path = r'/sdcard/啊学习资料/复习单词.txt'    # 数据文件位置
mp3_path = r'/sdcard/qpython/word mp3/'      # mp3存放路径

droid.setMediaVolume(6)  #设置媒体音量


def read_file(path):
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
        # if len(lines) % 40 != 0:
            # os.system("sed -i '$d' {}".format(path))
            # print('已删除最后一个未学过的单词')
        
        lines = [i.replace('\n', '') for i in lines]
        
    return lines
    

# 有时候会出重复的单词，运行这个函数去重
def read_file(path):
    # 当音频文件夹不存在时，创建
    if not os.path.exists(mp3_path):
        os.makedirs(mp3_path)
        
    with open(path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
        
    keys, unique_lines = [], []
    for line in lines:
        word = line.split(', ', 1)[0]
        
        if word not in keys:
            keys.append(word)
            unique_lines.append(line)
        else:
            pass
            # print('重复：', line)
            
    if not lines == unique_lines:
        with open(path, 'w', encoding='utf-8') as f:
            lines = f.writelines(unique_lines)
    
    return [i.replace('\n', '') for i in unique_lines]    
    
# read_file(path)  #文件去重
# exit()

    
# 打乱列表复习，方便重复不认识的
# 如果不认识，则在后面第5、15个单词处再次复习
def shuffle2review(li0):
    li = li0[:]
    shuffle(li)
    
    global n
    while len(li):
        word = li.pop()
        print('{: <24} {}'.format(str(n)+'. '+word, '>>>'), end='', flush=True)
        speak_it(word)
        
        x = input()  #这句+上面的print = 下句
        # x = input('{: <24} {}'.format(str(n)+'. '+word, '>>>'))
        
        try:
            if x == '0':
                exit(0)
            elif x in ['C', 'c', 'check']:
                droid.setClipboard(word)  # 设置剪贴板
                if n<10:
                    xx = input('{}'.format('   已复制'))
                else:
                    xx = input('{}'.format('    已复制'))
            
            elif x in ['H', 'h', 'help']:
                droid.setClipboard(word)  # 设置剪贴板
                li.insert(-4, word)  #4个单词后再次复习该词
                li.insert(-14, word)  #14个单词后再次复习该词
                if n<10:
                    xx = input('{}'.format('   已复制'))
                else:
                    xx = input('{}'.format('    已复制'))
                
            else:
                pass
        except:
            if x == '0':  #没有这两句, 当输入'0'时会报错
                exit(0)
        
        n += 1
    
    
class Spaced_Repetition:
    def __init__(self, lines):  # 类的初始化, li代表实例化类的时候需要传入的变量
        self.lines = lines
        self.cycles = ['2h', '5h', '12h', '24h', '2d', '5d', '12d', '21d', '30d', '2m', '3m', '4m', '6m', '1y', '2y', '3y']
        
        
    def repete(self):
        lines2review = []
        ctime = datetime.datetime.now().replace(microsecond=0)
        
        # 计算各单词下次应开始复习时间
        for line in self.lines:
            line = line.split(', ')   # line结构 [word, '2h', time]，后两个元素可能缺失
            
            # 如果只有word没有时间间隔或时间, 设定一个过去时间使这次能复习
            if len(line)<3:
                line = [line[0], '2h', '2020-01-01 01:01:01']
                
            # 如果时间间隔不存在于self.cycles
            if line[1] not in self.cycles:
                line[1] = self.cycles[1]
                
            last_time = datetime.datetime.strptime(line[2], '%Y-%m-%d %H:%M:%S')
            word_cycle = self.cal_seconds(line[1])
            next_time = last_time + datetime.timedelta(seconds=word_cycle)
            
            if ctime > next_time:   # 可以比较大小
                lines2review.append(line)
        
        self.review(lines2review)    
        
        
    def review(self, lines):
        n = 1
        print(screen_width('共{}个待复习单词'.format(len(lines))) + '\n')
        
        while len(lines):
            ctime = datetime.datetime.now().replace(microsecond=0)
            line = lines.pop()  #['hate', '5min', '2020-02-27 11:30:50.159']
            word, cycle = line[0], line[1]
            
            print('{: <24} {}'.format(str(n)+'. '+word, '>>>'), end='', flush=True)
            speak_it(word)
            x = input()  #这句+上面的print = 下句
            # x = input('{: <24} {}'.format(str(n)+'. '+word, '>>>'))

            try:
                if x == '0':
                    print('\n' + screen_width('共{}个待复习单词'.format(len(lines)+1)) + '\n')
                    exit(0)
                    
                elif x in ['C', 'c', 'check']:
                    droid.setClipboard(word)  # 设置剪贴板
                    
                    if line not in lines:
                        new_cycle = self.cycles[self.cycles.index(cycle)]
                        self.update(word, new_cycle, ctime)
                    
                    if n<10:
                        xx = input('{}'.format(''))
                    else:
                        xx = input('{}'.format(''))
                
                elif x in ['H', 'h', 'help']:
                    droid.setClipboard(word)  # 设置剪贴板
                    
                    lines.insert(-4, line)  #4个单词后再次复习该词
                    lines.insert(-14, line)  #14个单词后再次复习该词
                    
                    new_cycle = self.cycles[0]
                    self.update(word, new_cycle, ctime)
                    
                    xx = input('{}'.format(''))
                    
                else:
                    if line not in lines:
                        try:
                            new_cycle = self.cycles[self.cycles.index(cycle)+1]
                        except:
                            new_cycle = self.cycles[-1]
                        self.update(word, new_cycle, ctime)
            except:
                if x == '0':  #没有这两句, 当输入'0'时会报错
                    exit(0)
            
            n += 1
            if (n-1)%20 == 0:
                print('\n' + screen_width('已复习{}个，剩余{}个'.format(n-1, len(lines))) + '\n')
                
        
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
            

def speak_it(word):
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
    
    return '{}{}{}'.format('-'*math.floor(each_side), text, '-'*math.ceil(each_side))
    
    
if __name__ == '__main__':
    lines = read_file(path)
    
    ## Spaced Repetition  间隔复习法，根据你对单词的熟悉程度调整下次复习时间
    spaced_repe = Spaced_Repetition(lines)
    spaced_repe.repete()
    
    exit(0)
    
    
    ## 下面的功能没有spaced repetition, 每次重新运行遇到的单词都是一样的
    # 先复习新学的40个, 此时限定不重复
    # 然后整体随机复习，可重复出现
    latest = lines[-40:]  #上次背的
    latest2 = lines[-80:-40] #上上次背的

    xxx = input('复习新学的(new) or 复习全部(all)>>>')
    os.system('clear')  # 清屏
    n = 1

    # 复习新学的
    if xxx in ['n', 'new', 'New', 'NEW']:
        print('-'*16 + '复习昨日生词' + '-'*15)
        shuffle2review(latest)
        print('\n' + '-'*13 + '已复习完新学的单词' + '-'*12 + '\n')
    elif xxx in ['n2', 'new2', 'New2', 'NEW2']:
        print('-'*16 + '复习前日生词' + '-'*15)
        shuffle2review(latest2)
        print('\n' + '-'*13 + '已复习完新学的单词' + '-'*12 + '\n')
    
    else:
        print('-'*16 + '复习全部单词' + '-'*15)
        
    # 复习全部
    while True:
        shuffle2review(lines)  #接着复习全部
    
    
    
    
    
    
    
    