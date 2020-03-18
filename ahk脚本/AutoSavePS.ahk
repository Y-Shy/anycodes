; 功能：当处于Photoshop内时，鼠标左键每动7次，自动 ctrl+S 保存

count := 0

~LButton Up::   ; LButton 表示按下鼠标左键
    if WinActive("ahk_class Photoshop")   ; 把Photoshop换成你想应用的窗口类名，
        count := count + 1
        if (count>6) {
            Send ^s
            count := 0

        }