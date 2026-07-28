import re 
from bs4 import BeautifulSoup 
html = open('tmp_bing_html.txt', 'r', encoding='utf-8').read() 
soup = BeautifulSoup(html, 'html.parser') 
print('len html', len(html)) 
for sel in ['li.b_algo h2 a', 'div.b_algo h2 a', 'li.b_algo', 'div.b_algo', 'div.b_title a', 'div.b_title', 'li.b_algo h2', 'div.b_algo h2', 'li.b_algo .b_title', 'nav.b_scope']:: 
els = soup.select(sel) 
print(sel, len(els)) 
for a in els[:10]: print('  href', repr(a.get('href')), repr(a.get_text(strip=True))) 
print('---') 
anchors = soup.find_all('a') 
print('total anchors', len(anchors)) 
for a in anchors[:40]: print(repr(a.get('href')), repr(a.get_text(strip=True))) 
