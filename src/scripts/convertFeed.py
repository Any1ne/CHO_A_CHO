import os
import xmltodict
import pandas as pd
import csv

# 1️⃣ Download the feed.xml using curl
print("📥 Downloading feed.xml ...")
os.system("curl -s https://www.choacho.com.ua/api/google-feed --output feed.xml")

# 2️⃣ Parse the XML file
with open("feed.xml", "r", encoding="utf-8") as f:
    data = xmltodict.parse(f.read())

items = data["rss"]["channel"]["item"]

# 3️⃣ Normalize and flatten data
records = []
for item in items:
    record = {k.replace("g:", ""): (v or "").replace("\n", " ").strip() for k, v in item.items()}
    records.append(record)

# 4️⃣ Convert to CSV with custom delimiter
df = pd.DataFrame(records)
df.to_csv(
    "feed.csv",
    index=False,
    encoding="utf-8-sig",
    sep="|",  # custom delimiter (safe for multiline text)
    quoting=csv.QUOTE_ALL  # ensure all values are quoted
)

print("✅ feed.csv created successfully with '|' separator!")
