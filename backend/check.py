import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import pyreadstat

path = "/Users/jean/Outputs/FLE-016/2025-07-22-DBL/SDTM/tv.xpt"
pathta = "/Users/jean/dev/FLE-016/Outputs/FLE-016/2025-07-22-DBL/SDTM/ta.xpt"
sas = pd.read_sas(path, format='xport')

print(sas.head())
print(sas.columns)


import rpy2.robjects as ro
from rpy2.robjects.packages import importr
from rpy2.robjects import pandas2ri

pandas2ri.activate()
# ro.r.source("read_xpt <- function(path){print(path); return(haven::read_xpt(path))}")
# read_xpt = ro.globalenv['read_xpt']
# result_r_dataframe = read_xpt(pathta)
# result_pandas_df = pandas2ri.ri2py(result_r_dataframe)

# print(result_pandas_df.head())
# print(result_pandas_df.columns)

import rpy2.robjects as robjects

robjects.r('''
    read_xpt <- function(path){print(path); return(haven::read_xpt(path))}

    add_two_numbers <- function(first_num, sec_num) {
        return(first_num + sec_num)
    }
    
    print(add_two_numbers(11, 10))
    print(add_two_numbers(8, 20))
''')


add_two_numbers = robjects.r['add_two_numbers']
read_xpt = robjects.r['read_xpt']
print(add_two_numbers(11, 10))
print(read_xpt(pathta))



from rpy2.robjects import pandas2ri
import rpy2.robjects as robjects
pandas2ri.activate()
robjects.r('read_xpt <- function(path){haven::read_xpt(path)}')
read_xpt = robjects.r['read_xpt']
print(read_xpt(pathta))
