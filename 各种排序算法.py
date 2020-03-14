# 各种排序算法
# Python 3


def main():
    test = [30,13,25, 16,47,26, 19,10,9]
    
    # test_sorted = bubble_sort(test)
    test_sorted = bubble_sort_my(test)
    
    print(test_sorted)
    
def bubble_sort(lst):
    ''' 正宗冒泡排序——裘宗燕 数据结构与算法 
    1. 最多比较n-1遍, n为待排序数字个数
    2. 每遍排序的比较次数n-(i+1), i=0,1,2,... i+1为当前排序遍数
    3. 最坏情况出现在当：正序排列最小数位于最后，逆序排列最大数位于最后
    '''
    
    for i in range(len(lst)-1):  # 比较n-1遍即可
        for j in range(len(lst)-1-i):
            if lst[j] > lst[j+1]:
                lst[j], lst[j+1] = lst[j+1], lst[j]
                
    return lst
    
def bubble_sort_my(lst):
    '''实际上我不是特别理解写排序算法的时候为什么要先分析需要比较多少遍、多少次
    如果这是我在工程中第一次想到的，会这样：
        重复一遍一遍地两两比较、调换，直到某遍不发生调换为止
    '''
    
    while True:
        change = 0
        for i in range(len(lst)-1):
            if lst[i] > lst[i+1]:
                lst[i], lst[i+1] = lst[i+1], lst[i]
                change += 1
                
        if change == 0:
            break
            
    return lst
    
def bubble_sort_imporve(lst):
    '''正宗排序算法的改进
    
    '''
    
    
    
if __name__ == '__main__':
    main()