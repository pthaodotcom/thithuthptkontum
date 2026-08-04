import pandas as pd

df = pd.read_csv(r'd:\Download\notebooklm-mcp-main\skill-for-ba-final\du-an-thi-thu-thpt\webapp\CauHoiToanHoc.csv', encoding='utf-8-sig')
df.to_excel(r'd:\Download\notebooklm-mcp-main\skill-for-ba-final\du-an-thi-thu-thpt\webapp\CauHoiToanHoc.xlsx', index=False)
