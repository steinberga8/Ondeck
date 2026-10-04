"use client";

import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { DownloadIcon, EyeIcon } from "@/components/icons";
import { cvPreviewTarget, hasCv } from "@/components/files/FileParts";
import { usePreview } from "@/components/files/FilePreview";
import { fileUrl } from "@/lib/uploads";
import { computeAtsBuckets, computeCvStats, decorateApp, computeFunnel, computeRefStats, computeRejStats, computeStatCards, computeTimeStats } from "@/lib/app-logic";
import { useAppData, type InitialAppData } from "@/lib/useAppData";

function Card({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "20px 22px" }}>
      <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 3 }}>{title}</div>
      <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 18 }}>{sub}</div>
      {children}
    </div>
  );
}

function EmptyNote({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: "30px 0", textAlign: "center", fontSize: 12, color: "var(--text-faint)" }}>{children}</div>;
}

export function AnalyticsView({ initial }: { initial: InitialAppData }) {
  const { apps, stages, loading, error, pickAndAttachCv } = useAppData(initial);
  const router = useRouter();
  const openPreview = usePreview();

  const hasApps = (apps?.length ?? 0) > 0;
  const funnel = useMemo(() => (apps && stages ? computeFunnel(apps, stages) : []), [apps, stages]);
  const cvStats = useMemo(() => (apps ? computeCvStats(apps) : []), [apps]);
  const atsBuckets = useMemo(() => (apps ? computeAtsBuckets(apps) : []), [apps]);
  const refStats = useMemo(() => (apps && stages ? computeRefStats(apps, stages) : []), [apps, stages]);
  const timeStats = useMemo(() => (apps && stages ? computeTimeStats(apps, stages) : []), [apps, stages]);
  const rejStats = useMemo(() => (apps && stages ? computeRejStats(apps, stages) : []), [apps, stages]);
  const statCards = useMemo(() => computeStatCards(apps ?? []), [apps]);
  const appRows = useMemo(() => {
    const stageMap = new Map((stages ?? []).map((s) => [s.key, s]));
    return (apps ?? []).map((a) => decorateApp(a, stageMap));
  }, [apps, stages]);

  if (loading || !apps || !stages) {
    return <div style={{ padding: 40, color: "var(--text-dim)", fontSize: 13 }}>Loading analytics…</div>;
  }
  if (error) {
    return <div style={{ padding: 40, color: "oklch(0.68 0.19 25)", fontSize: 13 }}>{error}</div>;
  }

  const atsScored = atsBuckets.reduce((sum, b) => sum + b.count, 0);
  const hasAtsScored = atsScored > 0;
  const totalRejected = rejStats.reduce((sum, r) => sum + r.count, 0);
  const hasRejections = totalRejected > 0;
  const hasCvStats = cvStats.length > 0;
  const hasRefStats = refStats.some((r) => r.hasApps);
  const hasTimeStats = timeStats.some((t) => t.hasData);

  return (
    <div style={{ padding: "22px 28px 50px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(140px, 1fr))", gap: 14, marginBottom: 22 }}>
        {statCards.map((stat) => (
          <div key={stat.label} style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontSize: 11, color: "var(--text-faint)", fontWeight: 600, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, fontWeight: 600, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 18 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Card title="Applications & CVs" sub="The exact CV you sent to each company — preview or download in one click">
            {!hasApps ? (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12, color: "var(--text-faint)" }}>No applications yet.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", maxHeight: 360, overflowY: "auto" }}>
                {appRows.map((app) => (
                  <div
                    key={app.id}
                    onClick={() => router.push(`/app/applications/${app.id}`)}
                    className="row-hover"
                    style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.3fr) minmax(0, 0.9fr) minmax(0, 1.5fr) auto", gap: 14, alignItems: "center", padding: "9px 6px", borderBottom: "1px solid var(--border-soft)", borderRadius: 6, cursor: "pointer" }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.company}</div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{app.role}</div>
                    </div>
                    <div>
                      <span style={{ display: "inline-block", fontSize: 10.5, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: app.stageBg, color: app.stageColor, whiteSpace: "nowrap" }}>{app.stageLabel}</span>
                    </div>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-dim)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{hasCv(app) ? (app.cvFile?.name ?? app.cvFileName) : "No CV attached"}</div>
                    <div onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: 2, justifyContent: "flex-end", minWidth: 76 }}>
                      {hasCv(app) ? (
                        <>
                          <button type="button" className="icon-btn" title="Preview CV" onClick={() => openPreview(cvPreviewTarget(app, () => pickAndAttachCv(app.id)))}>
                            <EyeIcon />
                          </button>
                          {app.cvFile && (
                            <a className="icon-btn" title="Download CV" href={fileUrl(app.cvFile.id, true)} download={app.cvFile.name}>
                              <DownloadIcon />
                            </a>
                          )}
                        </>
                      ) : (
                        <div onClick={() => pickAndAttachCv(app.id)} style={{ fontSize: 10.5, fontWeight: 700, color: "var(--accent)", cursor: "pointer", padding: "4px 6px" }}>
                          Attach CV
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <Card title="Pipeline Conversion Funnel" sub="Share of total applications reaching each stage">
          {!hasApps ? (
            <EmptyNote>No data yet — your funnel builds as applications move through stages.</EmptyNote>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {funnel.map((f) => (
                <div key={f.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 5 }}>
                    <span style={{ fontWeight: 600 }}>{f.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-dim)" }}>
                      {f.count} · {f.pct}%
                    </span>
                  </div>
                  <div style={{ height: 9, background: "var(--surface2)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 5, background: f.color, width: `${f.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Response Rate by CV Version" sub="Which resume gets you replies">
          {!hasCvStats ? (
            <EmptyNote>No data yet — attach a CV version to your applications to compare them.</EmptyNote>
          ) : (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 22, height: 150, padding: "0 6px", overflowX: "auto" }}>
              {cvStats.map((cv) => (
                <div key={cv.version} style={{ flex: 1, minWidth: 56, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end", gap: 8 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, fontWeight: 700, color: cv.color }}>{cv.rate}%</div>
                  <div style={{ width: 34, borderRadius: "6px 6px 0 0", background: cv.color, height: cv.barHeight }} />
                  <div style={{ fontSize: 11, color: "var(--text-dim)", fontWeight: 600, textAlign: "center" }}>{cv.version}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)" }}>
                    {cv.responded}/{cv.count}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card
          title="ATS Score vs Response Rate"
          sub={`Do higher keyword matches actually get replies? · ${atsScored} scored`}
        >
          {!hasAtsScored ? (
            <EmptyNote>No scored applications yet — add a job description to an application and ATS Match will score the CV you sent.</EmptyNote>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {atsBuckets.map((b) => (
                <div key={b.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                    <span style={{ fontSize: 12, fontWeight: 700 }}>ATS {b.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 14, fontWeight: 600, color: b.color }}>{b.rate}</span>
                  </div>
                  <div style={{ height: 9, background: "var(--surface2)", borderRadius: 5, overflow: "hidden", marginBottom: 4 }}>
                    <div style={{ height: "100%", borderRadius: 5, background: b.color, width: `${b.pct}%` }} />
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)" }}>{b.detail}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Referral vs Cold Apply" sub="Which route actually gets you responses">
          {!hasRefStats ? (
            <EmptyNote>No applications yet.</EmptyNote>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {refStats.map((r) => (
                <div key={r.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700 }}>{r.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 15, fontWeight: 600, color: r.color }}>{r.rate}%</span>
                  </div>
                  <div style={{ height: 10, background: "var(--surface2)", borderRadius: 5, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ height: "100%", borderRadius: 5, background: r.color, width: `${r.rate}%` }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--text-faint)" }}>
                    <span>{r.respondedLabel}</span>
                    <span>{r.advancedLabel}</span>
                    <span>{r.offersLabel}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Time per Stage" sub="Average days applications sit in each stage — long bars are your bottlenecks">
          {!hasTimeStats ? (
            <EmptyNote>No data yet — timing builds as applications move through your pipeline.</EmptyNote>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {timeStats.map((t) => (
                <div key={t.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 110, flex: "none", fontSize: 11.5, fontWeight: 600, color: "var(--text-dim)" }}>{t.label}</div>
                  <div style={{ flex: 1, height: 9, background: "var(--surface2)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 5, background: t.color, width: `${t.pct}%` }} />
                  </div>
                  <div style={{ width: 32, flex: "none", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)" }}>{t.days}</div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border-soft)", borderRadius: 12, padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
            <div style={{ fontSize: 13.5, fontWeight: 800, marginBottom: 3 }}>Rejections per Stage</div>
            {hasRejections && <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "oklch(0.62 0.19 25)" }}>{totalRejected} total</div>}
          </div>
          <div style={{ fontSize: 11.5, color: "var(--text-faint)", marginBottom: 18 }}>Where your applications drop out</div>
          {!hasRejections ? (
            <EmptyNote>No rejections logged yet — use the reject button on any application to track drop-outs.</EmptyNote>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {rejStats.map((r) => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 110, flex: "none", fontSize: 11.5, fontWeight: 600, color: "var(--text-dim)" }}>{r.label}</div>
                  <div style={{ flex: 1, height: 9, background: "var(--surface2)", borderRadius: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", borderRadius: 5, background: "oklch(0.62 0.19 25)", width: `${r.pct}%` }} />
                  </div>
                  <div style={{ width: 22, flex: "none", textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-dim)" }}>{r.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
