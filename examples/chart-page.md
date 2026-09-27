# API performance report

Response time has improved in every release since 1.0. The chart below is part
of this Markdown document—there is no image URL or chart component in the
source.

```chart
type: line
title: Response time
x: Release
y: Milliseconds

| Release | API | Worker |
| --- | ---: | ---: |
| 1.0 | 182 | 240 |
| 1.1 | 151 | 205 |
| 1.2 | 127 | 176 |
| 1.3 | 118 | 149 |
| 1.4 | 96 | 123 |
```

## What changed

- API response time fell from **182 ms** to **96 ms**.
- Worker response time fell from **240 ms** to **123 ms**.
- The engine assigns purple and blue automatically, while headings, labels,
  and guides follow the document theme.

Open the source below to change the data or add another numeric column.
