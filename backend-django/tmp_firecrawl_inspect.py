import firecrawl 
import inspect 
client = firecrawl.Firecrawl(api_key='fc-038b47b287ad49e598514d988b793d67', timeout=10) 
print('client', client) 
print('client type', type(client)) 
print('callable members') 
for name, member in inspect.getmembers(client, callable): 
    if not name.startswith('_'): 
        print(name, member) 
print('dir_client', [x for x in dir(client) if not x.startswith(" "_)]) ; echo print('help search') ; echo print(getattr(client, 'search', None)) ; env\Scripts\python.exe tmp_firecrawl_inspect.py ; del tmp_firecrawl_inspect.py
