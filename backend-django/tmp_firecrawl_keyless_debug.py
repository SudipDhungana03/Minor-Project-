import firecrawl 
import os 
client = firecrawl.Firecrawl(timeout=10) 
print('api_key', client.api_key) 
print('client', client) 
query = 'site:geeksforgeeks.org DSA stands for Data Structures and Algorithms' 
try: 
    response = client.search(query, sources=['web'], include_domains=['geeksforgeeks.org'], limit=1, timeout=30000) 
    print('ok', response) 
except Exception as e: 
    print('error', type(e).__name__, e) 
