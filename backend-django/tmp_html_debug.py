import requests 
from bs4 import BeautifulSoup 
query = 'site:geeksforgeeks.org DSA stands for Data Structures and Algorithms' 
headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'} 
resp = requests.get('https://www.bing.com/search', params={'q': query}, headers=headers, timeout=10) 
html = resp.text 
print('status', resp.status_code) 
soup = BeautifulSoup(html, 'html.parser') 
print('total a', len(soup.find_all('a'))) 
for sel in ['li.b_algo h2 a', 'li.b_algo', 'div.b_algo h2 a', 'div.b_algo', 'li.b_algo h2', 'div.b_title a', 'div.b_title']:: 
    els = soup.select(sel); print(sel, len(els)) 
for a in soup.select('li.b_algo h2 a')[:10]: print('b_algo href', a.get('href')) 
for a in soup.select('a')[:20]: print('a', a.get('href'), a.text.strip()) 
