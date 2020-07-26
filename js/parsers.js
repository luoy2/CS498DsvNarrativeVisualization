var date_parser = d3.utcParse("%Y-%m-%d"),
    datetime_parser = d3.utcParse("%Y-%m-%dT%H:%M:%S"),
    dayFormatter = d3.timeFormat("%w"),
    weekNameFormatter = d3.timeFormat("%U"),
    monthNameFormatter = d3.timeFormat("%B")

