# README

[toc]

## 程序功能：复习单词

运行之后，程序将读取数据文件 复习单词.txt，并去除重复的单词（保留后者）。

读取之后，将数据文件中的单词从后向前一个一个显示在终端上，显示的同时可播放单词的网络发音或本地音频文件：

* 如果认识，回车显示下一个，将数据文件中该单词的 time_interval 修改为更长的间隔；
* 如果对该单词感到模糊，或想进一步学习（比如查看单词用法），输入 c(check) 将单词复制到剪贴板，保持数据文件中该单词的 time_interval 不变；
* 如果不认识，输入 h (help) 将单词复制到剪贴板，将数据文件中该单词的 time_interval 修改为最短间隔（2h），并在接下来的第5、15个单词处再次显示检验学习效果。复制到剪贴板后，如果你的手机上安装了Mdict等词典，可设置为自动查询进行学习；如果没有安装，也可到浏览器搜索释义；

此外，每个单词显示之后，都将修改数据文件中该单词的 time 字段，修改为当前时间。

每复习20个单词之后，将在终端显示当前已复习过的单词数和剩余待复习的单词数。

输入数字 0 可随时结束程序。如图：

![程序屏幕截图](https://github.com/Y-Shy/anycodes/blob/master/%E5%A4%8D%E4%B9%A0%E5%8D%95%E8%AF%8D/ScreenRecord.mp4.jpg)



## 数据文件说明

文件中的数据结构：

> word, time_interval, time

time_interval是一系列的时间间隔 [2h, 5h, 12h, 24h, 2d, 5d ...]; time是该单词上次复习的日期和时间。例如：

> study, 2h, 2020-03-12 13:43:26

可随时向数据文件添加新的单词，手动或通过其他程序写入，并且可以只写入word，不需要保证数据结构完整。



## 运行平台 & 使用说明

* 必备：Android + Qpython 3 (若换用其他平台，需更改剪贴板、音频播放等功能的代码)

* 可选：Mdict词典 or 其他支持监听剪贴板查询的词典

* 可选：其他脚本 + 背单词APP。首先在背单词APP中学习新单词，学习的同时用脚本从屏幕中读取单词写入数据文件，然后用本Python程序复习。

首先在你的安卓手机上安装Qpython 3, 然后将此程序、数据文件放到对应位置。运行之后即可开始复习单词。



## 其他说明

这个程序的作用有点类似 Anki，也有点像以前写在小卡片上背单词的过程。

如果你只是为了背单词，并且你在用的背单词APP具有不错的复习功能，那么这个程序对你帮助不大。如果你对APP的复习功能不满，或者需要增加一些额外的单词进行复习，那么这个程序还是有些用处的。

如果对你有些帮助，请star.