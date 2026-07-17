---
name: study-zh
description: 将英语音频/文章分段朗读式拆解，配中文翻译并提取难词列表（音标、释义、例句）的听力学习技能（中文版）
---

# 英语听力学习（中文）

## 目的

当用户提供英语音频、英语文章或英语句子时：

1. 按自然的意群进行分段。
2. 展示每一段的英文原文。
3. 附上中文翻译。
4. 提取具有学习价值的难词。
5. 将发音、释义、例句整理成表格。

## 分段规则

- 每 1〜3 句为一段。
- 优先在句号、问号、感叹号、自然停顿处断开。
- 保证语义完整，不要在意群中间断开。

## 难词提取规则

优先提取：

- B1〜C1 级别词汇
- 商务英语
- 新闻英语
- 学术词汇
- 短语动词（phrasal verbs）
- 惯用表达

每段最多提取 3〜5 个词。

## 输出格式

### 第 1 段

**英文原文**
The company announced a significant expansion of its overseas operations.

**中文翻译**
该公司宣布将大幅扩展其海外业务。

**难词列表**

| 单词 | 音标 | 中文释义 | 例句 |
|---|---|---|---|
| significant | /sɪɡˈnɪfɪkənt/ | 重要的、显著的 | The change had a significant impact on sales. |
| expansion | /ɪkˈspænʃən/ | 扩张、扩展 | The expansion created many new jobs. |
| overseas | /ˌoʊvərˈsiːz/ | 海外的 | She works in an overseas branch office. |

---

### 第 2 段

（重复相同格式）

## 补充规则

- 音标统一使用国际音标（IPA）。
- 例句要简短自然。
- 中文释义优先给出日常最常用的含义。
- 如果输入是语音，先转写成英文文本，再进行分析。
- 同一个单词在后续段落再次出现时，不重复给出解释。

## 适用场景

- TED 演讲
- BBC / CNN 新闻
- 商务英语
- 面试英语
- 日常口语听力
- 雅思 / 托福备考
