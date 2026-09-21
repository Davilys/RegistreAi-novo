import { db } from "./db.js";

type DeadlineRule = {
  event_type: string;
  legal_window_days: number;
  start_rule: "FIRST_BUSINESS_DAY_AFTER_PUBLICATION" | "PUBLICATION_DATE";
  continuous_days: boolean;
  extend_due_if_non_working: boolean;
  source_name: string;
  source_url: string;
};

function parseIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_ISO_DATE:" + value);
  const date = new Date(value + "T12:00:00Z");
  if (Number.isNaN(date.getTime())) throw new Error("INVALID_DATE:" + value);
  return date;
}

function iso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function yearsBetween(start: Date, end: Date) {
  const years: number[] = [];
  for (let year = start.getUTCFullYear(); year <= end.getUTCFullYear(); year += 1) {
    years.push(year);
  }
  return years;
}

function weekend(date: Date) {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

async function loadCalendar(start: Date, end: Date) {
  const years = yearsBetween(start, addDays(end, 10));

  const { data: yearRows, error: yearError } = await db.from("inpi_calendar_years")
    .select("year,verified,source_name,source_url")
    .in("year", years);

  if (yearError) throw yearError;

  const verifiedYears = new Set(
    (yearRows ?? []).filter((row) => row.verified).map((row) => row.year)
  );

  const missingYears = years.filter((year) => !verifiedYears.has(year));
  if (missingYears.length) {
    throw new Error("INPI_CALENDAR_UNVERIFIED:" + missingYears.join(","));
  }

  const { data: holidays, error: holidaysError } = await db.from("inpi_non_working_days")
    .select("day,name,scope,verified")
    .gte("day", iso(start))
    .lte("day", iso(addDays(end, 10)))
    .eq("verified", true);

  if (holidaysError) throw holidaysError;

  return {
    years: yearRows ?? [],
    holidays: new Set((holidays ?? []).map((row) => row.day))
  };
}

function isBusinessDay(date: Date, holidays: Set<string>) {
  return !weekend(date) && !holidays.has(iso(date));
}

function firstBusinessDayAfter(publication: Date, holidays: Set<string>) {
  let cursor = addDays(publication, 1);
  for (let i = 0; i < 20; i += 1) {
    if (isBusinessDay(cursor, holidays)) return cursor;
    cursor = addDays(cursor, 1);
  }
  throw new Error("BUSINESS_DAY_LOOKUP_EXHAUSTED");
}

function extendToBusinessDay(date: Date, holidays: Set<string>) {
  let cursor = new Date(date);
  for (let i = 0; i < 20; i += 1) {
    if (isBusinessDay(cursor, holidays)) return cursor;
    cursor = addDays(cursor, 1);
  }
  throw new Error("DUE_DATE_EXTENSION_EXHAUSTED");
}

export async function calculateLegalDeadline(eventType: string, publicationDate: string) {
  const { data: rule, error: ruleError } = await db.from("deadline_rules")
    .select("*")
    .eq("event_type", eventType)
    .eq("active", true)
    .single();

  if (ruleError) throw new Error("DEADLINE_RULE_NOT_FOUND:" + eventType);

  const typedRule = rule as DeadlineRule;
  const publication = parseIsoDate(publicationDate);

  const roughEnd = addDays(publication, typedRule.legal_window_days + 20);
  const calendar = await loadCalendar(publication, roughEnd);

  const start =
    typedRule.start_rule === "FIRST_BUSINESS_DAY_AFTER_PUBLICATION"
      ? firstBusinessDayAfter(publication, calendar.holidays)
      : publication;

  // INPI manual: the count starts on the first applicable day and proceeds in continuous days.
  // Therefore, a 60-day window whose day 1 is the start date has an initial due date at start + 59 days.
  let due = typedRule.continuous_days
    ? addDays(start, typedRule.legal_window_days - 1)
    : start;

  if (!typedRule.continuous_days) {
    let remaining = typedRule.legal_window_days - 1;
    let cursor = new Date(start);
    while (remaining > 0) {
      cursor = addDays(cursor, 1);
      if (isBusinessDay(cursor, calendar.holidays)) remaining -= 1;
    }
    due = cursor;
  }

  const originalDue = new Date(due);

  if (typedRule.extend_due_if_non_working) {
    due = extendToBusinessDay(due, calendar.holidays);
  }

  return {
    publicationDate,
    startDate: iso(start),
    initialDueDate: iso(originalDue),
    dueDate: iso(due),
    dueAt: iso(due) + "T23:59:59-03:00",
    legalWindowDays: typedRule.legal_window_days,
    calendarVerified: true,
    calculationBasis:
      typedRule.source_name +
      " | start=" + typedRule.start_rule +
      " | continuous=" + typedRule.continuous_days +
      " | extended=" + (iso(due) !== iso(originalDue)),
    sourceUrl: typedRule.source_url
  };
}
