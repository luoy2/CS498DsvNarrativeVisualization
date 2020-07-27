import pandas as pd
import random
import faker
import json
import datetime
from json import JSONEncoder

# subclass JSONEncoder
class DateTimeEncoder(JSONEncoder):
        #Override the default method
        def default(self, obj):
            if isinstance(obj, (datetime.date, datetime.datetime)):
                return obj.isoformat()


dates = pd.date_range("2020-01-01", "2020-08-01")
worktype = ["meeting", "bug fix", "new features", "deployment"]
fake = faker.Faker()  # English

results = []
for i in dates:
    weekday = i.to_pydatetime().weekday()
    start_time = datetime.datetime(i.year, i.month, i.day, 19, 0, 0)
    if weekday in (5, 6):
        weekminute = random.randint(8*60, 10*60)
        start_time = datetime.datetime(i.year, i.month, i.day, 7, 0, 0)
        end_time = datetime.datetime(i.year, i.month, i.day, 13, 0, 0)

    else:
        weekminute = random.randint(60, 2*60)
        start_time = datetime.datetime(i.year, i.month, i.day, 19, 0, 0)
        end_time = datetime.datetime(i.year, i.month, i.day, 22, 0, 0)
    fake_time_start = fake.date_time_between_dates(datetime_start=start_time, datetime_end=end_time)
    fake_time_end = fake_time_start + datetime.timedelta(minutes=weekminute)
    work_have_done = fake.paragraphs(nb=random.randint(1,5))
    results.append({"date":datetime.date(i.year, i.month, i.day),
    "start_time":fake_time_start,
    "end_time":fake_time_end,
    "minutes":weekminute,
    "work_have_done":work_have_done,
    "tags_have_done":random.sample(worktype, random.randint(1, 4))})
    print(results)

with open ("data/time.json", 'w') as f:
    json.dump(results, f, ensure_ascii=False, cls=DateTimeEncoder)

# pd.DataFrame(results, columns=['date', 'start_time', 'end_time', 'week_minutes', 'details', 'tags']).to_csv("data/timesheet.csv")

