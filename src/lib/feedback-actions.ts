"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ADMIN_EMAIL = "abran.labs@gmail.com";

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.email === ADMIN_EMAIL;
}

export type FeedbackPostData = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  upvotes: number;
  createdAt: string;
  comments: FeedbackCommentData[];
  userHasVoted: boolean;
};

export type FeedbackCommentData = {
  id: string;
  content: string;
  createdAt: string;
};

export async function getFeedbackPosts(type: "suggestion" | "issue"): Promise<FeedbackPostData[]> {
  const session = await getSession();

  const rows = await prisma.feedbackPost.findMany({
    where: { type },
    include: {
      comments: { orderBy: { createdAt: "asc" } },
      votes: session ? { where: { userId: session.userId } } : false,
    },
    orderBy: [{ upvotes: "desc" }, { createdAt: "desc" }],
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    description: r.description,
    status: r.status,
    upvotes: r.upvotes,
    createdAt: r.createdAt.toISOString(),
    comments: r.comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
    })),
    userHasVoted: session ? (r.votes as { id: string }[]).length > 0 : false,
  }));
}

export async function createFeedbackPost(data: {
  type: "suggestion" | "issue";
  title: string;
  description: string;
}): Promise<FeedbackPostData> {
  const { userId } = await requireUser();

  const row = await prisma.feedbackPost.create({
    data: {
      type: data.type,
      title: data.title.trim(),
      description: data.description.trim(),
      upvotes: 1,
      votes: {
        create: { userId },
      },
    },
    include: { comments: true },
  });

  return {
    id: row.id,
    type: row.type,
    title: row.title,
    description: row.description,
    status: row.status,
    upvotes: row.upvotes,
    createdAt: row.createdAt.toISOString(),
    comments: [],
    userHasVoted: true,
  };
}

export async function upvoteFeedbackPost(postId: string): Promise<{ upvotes: number; voted: boolean }> {
  const { userId } = await requireUser();

  // Check if already voted
  const existing = await prisma.feedbackUpvote.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    // Remove vote
    await prisma.feedbackUpvote.delete({ where: { id: existing.id } });
    const updated = await prisma.feedbackPost.update({
      where: { id: postId },
      data: { upvotes: { decrement: 1 } },
    });
    return { upvotes: updated.upvotes, voted: false };
  } else {
    // Add vote
    await prisma.feedbackUpvote.create({ data: { postId, userId } });
    const updated = await prisma.feedbackPost.update({
      where: { id: postId },
      data: { upvotes: { increment: 1 } },
    });
    return { upvotes: updated.upvotes, voted: true };
  }
}

export async function addFeedbackComment(postId: string, content: string): Promise<FeedbackCommentData> {
  await requireUser();

  const row = await prisma.feedbackComment.create({
    data: {
      postId,
      content: content.trim(),
    },
  });
  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function deleteFeedbackPost(postId: string): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await prisma.feedbackPost.delete({ where: { id: postId } });
}

export async function deleteFeedbackComment(commentId: string): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await prisma.feedbackComment.delete({ where: { id: commentId } });
}

export async function updateFeedbackStatus(
  postId: string,
  status: "open" | "liked" | "in_progress" | "completed"
): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await prisma.feedbackPost.update({
    where: { id: postId },
    data: { status },
  });
}

export async function checkIsAdmin(): Promise<boolean> {
  return isAdmin();
}
