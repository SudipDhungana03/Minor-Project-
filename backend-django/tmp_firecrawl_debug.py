import sys 
import os 
sys.path.insert(0, os.getcwd()) 
from apps.analysis_engine.ml_adapters.firecrawl_service import _get_firecrawl_client 
client = _get_firecrawl_client() 
print('client', client) 
if client is None: 
    raise SystemExit('no client') 
query = 'site:geeksforgeeks.org DSA stands for Data Structures and Algorithms' 
response = client.search(query, sources=['web'], include_domains=['geeksforgeeks.org'], limit=5, timeout=30000) 
print('response type', type(response)) 
print('response repr', repr(response)[:2000]) 
print('response dir', [x for x in dir(response) if not x.startswith('_')]) 
import json 
from dataclasses import asdict 
try: 
    print('asdict', asdict(response)) 
except Exception as e: 
    print('asdict failed', type(e).__name__, e) 
print('web attr', getattr(response, 'web', None)) 
print('results attr', getattr(response, 'results', None)) 
print('hasattr web', hasattr(response, 'web')) 
print('hasattr results', hasattr(response, 'results')) 
