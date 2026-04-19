import re

with open(r"c:\laragon\www\laravel\datn\HostechBackEnd\backend\database\schema\mysql-schema.sql", "r", encoding="utf-8") as f:
    text = f.read()

# find all CREATE TABLE statements (just the table name)
tables = re.findall(r"CREATE TABLE `([^`]+)`", text)
print("TABLES:")
for t in tables:
    print(t)

# find specifically rooms, services, room_templates
for t in ['rooms', 'services', 'room_templates']:
    match = re.search(f"CREATE TABLE `{t}` \((.+?)\) ENGINE=", text, re.DOTALL)
    if match:
        print(f"\nSCHEMA FOR {t}:")
        fields = match.group(1).strip().split('\n')
        for f in fields:
            print(f.strip())
