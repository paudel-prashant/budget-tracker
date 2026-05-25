import type { AssistantIntent } from "@/lib/assistant/types";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, " ");
}

export function detectAssistantIntent(question: string): AssistantIntent {
  const q = normalize(question);

  if (
    /(why|spend more|spent more|spending more|higher spend|expenses up|expense trend|overspend|overspent)/.test(
      q
    ) ||
    (q.includes("this month") && (q.includes("more") || q.includes("increase"))) ||
    /(how much did i spend|total expenses|what did i spend|expense trend|spending trend)/.test(
      q
    ) ||
    /(compare.*spend|spend.*last month|expenses.*last month|month over month.*spend)/.test(q) ||
    (/(last month|previous month|vs last)/.test(q) &&
      /(spend|expense|cost)/.test(q) &&
      !/(categor|which|what category)/.test(q))
  ) {
    return "spending_trend";
  }

  if (
    /(which category|what category|category increase|increased the most|biggest increase|spending rise|category grew|category spike|categories.*increase|rank categor)/.test(
      q
    ) ||
    /(compare.*categor|categor.*last month|categor.*month over month)/.test(q)
  ) {
    return "category_increase";
  }

  if (
    /(save more|saving|how can i save|reduce spend|cut expense|save money|improve savings|spend less|cut back|trim|tighten budget|budget pressure|daily spending pace|daily spend|per day)/.test(
      q
    ) ||
    /(savings rate|am i saving|boost savings|enough saving)/.test(q) ||
    /(over budget|budget limit|budgets i should)/.test(q)
  ) {
    return "savings_advice";
  }

  if (
    /(highest expense|top categor|most spent|biggest expense|where.*money|spend the most|largest spending|top 3 categor|rank.*expense|eating up|cash is going|biggest share)/.test(
      q
    )
  ) {
    return "top_expenses";
  }

  if (
    /(unusual|unexpected|spike|anomal|outlier|large purchase|stand out|abnormal|one off|one-off|surprise spend|suspicious|flag any)/.test(
      q
    )
  ) {
    return "unusual_spending";
  }

  if (
    /(summary|overview|how am i doing|financial health|my finances|tell me about|snapshot|income vs expense|earn vs spend|how much.*income|how much did i earn|financial overview|healthy are my finances)/.test(
      q
    ) ||
    /(savings this month|income and expense|spending more than i earn|spend more than earn)/.test(q)
  ) {
    return "general_summary";
  }

  if (q.trim().length === 0) return "unknown";

  return "unknown";
}
