"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { Dropdown } from "@/components/common/dropdown";
import { RadioGroup } from "@/components/common/radio-group";
import { METRIC_RANGES, type MetricRange } from "@/features/metrics/range";

type MetricsFiltersProps = {
  range: MetricRange;
  project: string | null;
  projects: { id: string; name: string; color: string; archived: boolean }[];
};

const ALL = "all";

/**
 * The one filter row: every chart below re-renders against the same range and
 * project (dataviz rule: never per-chart filters). Filters live in the URL, so
 * a view can be shared and survives a reload.
 */
export function MetricsFilters({ range, project, projects }: MetricsFiltersProps) {
  const t = useTranslations("metrics.filters");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function go(next: { range?: MetricRange; project?: string | null }) {
    const params = new URLSearchParams();
    params.set("range", next.range ?? range);
    const nextProject = next.project === undefined ? project : next.project;
    if (nextProject) params.set("project", nextProject);
    startTransition(() => router.push(`/metrics?${params.toString()}`));
  }

  return (
    <div aria-busy={pending} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <RadioGroup
        label={t("range")}
        value={range}
        options={METRIC_RANGES.map((value) => ({ value, label: t(`ranges.${value}`) }))}
        onChange={(value) => go({ range: value })}
        className="inline-flex w-fit gap-1 rounded-tile bg-surface p-1"
        optionClassName={(checked) =>
          `rounded-[6px] px-3 py-1.5 font-display text-sm transition-colors duration-150 ease-signature motion-reduce:transition-none ${
            checked ? "bg-tile text-ink" : "text-ink-muted hover:text-ink"
          }`
        }
        renderOption={(option) => option.label}
      />
      <Dropdown
        label={t("project")}
        value={project ?? ALL}
        onChange={(value) => go({ project: value === ALL ? null : value })}
        options={[
          { value: ALL, label: t("allProjects") },
          ...projects.map((item) => ({
            value: item.id,
            label: item.archived ? t("archived", { name: item.name }) : item.name,
            icon: (
              <span
                aria-hidden
                className="size-2.5 flex-none rounded-full"
                style={{ backgroundColor: `var(--color-project-${item.color})` }}
              />
            ),
          })),
        ]}
        className="sm:w-64"
      />
    </div>
  );
}
