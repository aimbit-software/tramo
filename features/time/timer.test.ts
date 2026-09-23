import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { recentDescriptions, startTimer, stopTimer } from "@/features/time/timer";
import { createTestDb, createUser, type TestDb } from "@/lib/testing/db";

let db: TestDb;
let workspaceId: string;
let userId: string;
let projectA: string;
let projectB: string;

const at = (iso: string) => new Date(iso);

beforeAll(async () => {
  db = await createTestDb();
});

afterAll(async () => {
  await db.close();
});

beforeEach(async () => {
  await db.reset();
  const user = await createUser(db, "ana@test.dev");
  userId = user.id;
  const workspace = await db.prisma.workspace.create({
    data: { name: "Test", members: { create: { userId, role: "MEMBER", status: "ACTIVE" } } },
  });
  workspaceId = workspace.id;
  const a = await db.prisma.project.create({
    data: { workspaceId, name: "A", color: "blue", members: { create: { userId, role: "TRACKER" } } },
  });
  const b = await db.prisma.project.create({
    data: { workspaceId, name: "B", color: "orange", members: { create: { userId, role: "TRACKER" } } },
  });
  projectA = a.id;
  projectB = b.id;
});

const running = () => db.prisma.timeEntry.findFirst({ where: { userId, endedAt: null } });

describe("startTimer", () => {
  it("starts a running entry", async () => {
    const result = await startTimer(db.prisma, {
      userId,
      workspaceId,
      projectId: projectA,
      description: "Landing",
      now: at("2026-09-23T12:00:00Z"),
    });

    expect(result.ok).toBe(true);
    expect(await running()).toMatchObject({ projectId: projectA, description: "Landing", source: "TIMER" });
  });

  it("stops the previous timer when another one starts", async () => {
    await startTimer(db.prisma, { userId, workspaceId, projectId: projectA, description: "", now: at("2026-09-23T12:00:00Z") });
    await startTimer(db.prisma, { userId, workspaceId, projectId: projectB, description: "", now: at("2026-09-23T12:30:00Z") });

    const entries = await db.prisma.timeEntry.findMany({ where: { userId }, orderBy: { startedAt: "asc" } });
    expect(entries).toHaveLength(2);
    expect(entries[0]?.endedAt).toEqual(at("2026-09-23T12:30:00Z"));
    expect(entries[1]).toMatchObject({ projectId: projectB, endedAt: null });
  });

  it("does nothing when the same timer is already running", async () => {
    await startTimer(db.prisma, { userId, workspaceId, projectId: projectA, description: "X", now: at("2026-09-23T12:00:00Z") });
    await startTimer(db.prisma, { userId, workspaceId, projectId: projectA, description: "X", now: at("2026-09-23T12:05:00Z") });

    expect(await db.prisma.timeEntry.count({ where: { userId } })).toBe(1);
  });

  it("drops a zero-length entry instead of breaking the end-after-start rule", async () => {
    const now = at("2026-09-23T12:00:00Z");
    await startTimer(db.prisma, { userId, workspaceId, projectId: projectA, description: "", now });
    await startTimer(db.prisma, { userId, workspaceId, projectId: projectB, description: "", now });

    const entries = await db.prisma.timeEntry.findMany({ where: { userId } });
    expect(entries).toEqual([expect.objectContaining({ projectId: projectB, endedAt: null })]);
  });

  it("refuses projects where the person is only a viewer", async () => {
    await db.prisma.projectMember.update({
      where: { projectId_userId: { projectId: projectA, userId } },
      data: { role: "VIEWER" },
    });

    const result = await startTimer(db.prisma, {
      userId,
      workspaceId,
      projectId: projectA,
      description: "",
      now: at("2026-09-23T12:00:00Z"),
    });
    expect(result).toEqual({ ok: false, reason: "cannotTrack" });
  });

  it("refuses archived projects", async () => {
    await db.prisma.project.update({ where: { id: projectA }, data: { archivedAt: new Date() } });

    const result = await startTimer(db.prisma, {
      userId,
      workspaceId,
      projectId: projectA,
      description: "",
      now: at("2026-09-23T12:00:00Z"),
    });
    expect(result).toEqual({ ok: false, reason: "cannotTrack" });
  });
});

describe("stopTimer", () => {
  it("closes the running entry", async () => {
    await startTimer(db.prisma, { userId, workspaceId, projectId: projectA, description: "", now: at("2026-09-23T12:00:00Z") });

    await stopTimer(db.prisma, { userId, now: at("2026-09-23T13:15:00Z") });

    expect(await running()).toBeNull();
    const entry = await db.prisma.timeEntry.findFirstOrThrow({ where: { userId } });
    expect(entry.endedAt).toEqual(at("2026-09-23T13:15:00Z"));
  });

  it("is a no-op without a running timer", async () => {
    expect(await stopTimer(db.prisma, { userId, now: at("2026-09-23T12:00:00Z") })).toEqual({ ok: true });
  });
});

describe("recentDescriptions", () => {
  it("lists each project's past descriptions, most recent first, without repeats or blanks", async () => {
    await db.prisma.timeEntry.createMany({
      data: [
        { userId, projectId: projectA, description: "Landing", startedAt: at("2026-09-20T10:00:00Z"), endedAt: at("2026-09-20T11:00:00Z") },
        { userId, projectId: projectA, description: "Deploy", startedAt: at("2026-09-21T10:00:00Z"), endedAt: at("2026-09-21T11:00:00Z") },
        { userId, projectId: projectA, description: "Landing", startedAt: at("2026-09-22T10:00:00Z"), endedAt: at("2026-09-22T11:00:00Z") },
        { userId, projectId: projectA, description: "", startedAt: at("2026-09-22T12:00:00Z"), endedAt: at("2026-09-22T13:00:00Z") },
        { userId, projectId: projectB, description: "Diseño", startedAt: at("2026-09-22T14:00:00Z"), endedAt: at("2026-09-22T15:00:00Z") },
      ],
    });

    expect(await recentDescriptions(db.prisma, userId, [projectA, projectB])).toEqual({
      [projectA]: ["Landing", "Deploy"],
      [projectB]: ["Diseño"],
    });
  });
});
