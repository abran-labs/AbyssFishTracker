"use server";

import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!;

async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("Not authenticated");
  return session;
}

async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.email === ADMIN_EMAIL;
}

export type FeedbackCommentData = {
  id: string;
  content: string;
  createdAt: string;
  authorEmail: string | null;
  isAuthorAdmin: boolean;
  deleted: boolean;
  deletedByModerator: boolean;
  replies: FeedbackCommentData[];
};

export type FeedbackPostData = {
  id: string;
  type: string;
  title: string;
  description: string;
  status: string;
  upvotes: number;
  createdAt: string;
  authorEmail: string | null;
  isAuthorAdmin: boolean;
  comments: FeedbackCommentData[];
  userHasVoted: boolean;
};

type FlatComment = {
  id: string;
  content: string;
  createdAt: Date;
  authorEmail: string | null;
  deleted: boolean;
  deletedByModerator: boolean;
  parentId: string | null;
};

function buildCommentTree(all: FlatComment[], parentId: string | null): FeedbackCommentData[] {
  return all
    .filter((c) => c.parentId === parentId)
    .map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      authorEmail: c.authorEmail,
      isAuthorAdmin: c.authorEmail === ADMIN_EMAIL,
      deleted: c.deleted,
      deletedByModerator: c.deletedByModerator,
      replies: buildCommentTree(all, c.id),
    }));
}

/** Returns true if this comment is soft-deleted AND its entire subtree contains
 *  no live content (every descendant is also soft-deleted). */
async function isSubtreeAllDeleted(commentId: string): Promise<boolean> {
  const comment = await prisma.feedbackComment.findUnique({
    where: { id: commentId },
    include: { replies: true },
  });
  if (!comment || !comment.deleted) return false;
  for (const reply of comment.replies) {
    if (!(await isSubtreeAllDeleted(reply.id))) return false;
  }
  return true;
}

/** After a hard-delete, check if the given soft-deleted ancestor is now fully
 *  cleanable (all remaining children are soft-deleted with no live descendants).
 *  If so, hard-delete it (DB cascade kills its soft-deleted children) and recurse
 *  up the chain. Returns the IDs of every ancestor that was hard-deleted. */
async function cleanupAncestors(parentId: string): Promise<string[]> {
  const parent = await prisma.feedbackComment.findUnique({
    where: { id: parentId },
    include: { replies: true },
  });
  if (!parent || !parent.deleted) return [];

  for (const reply of parent.replies) {
    if (!(await isSubtreeAllDeleted(reply.id))) return []; // still has live content
  }

  // All remaining children are soft-deleted with no live descendants — clean up.
  // DB cascade automatically removes all soft-deleted children.
  const grandparentId = parent.parentId;
  await prisma.feedbackComment.delete({ where: { id: parentId } });
  const further = grandparentId ? await cleanupAncestors(grandparentId) : [];
  return [parentId, ...further];
}

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
    authorEmail: r.authorEmail,
    isAuthorAdmin: r.authorEmail === ADMIN_EMAIL,
    comments: buildCommentTree(r.comments, null),
    userHasVoted: session ? (r.votes as { id: string }[]).length > 0 : false,
  }));
}

export async function createFeedbackPost(data: {
  type: "suggestion" | "issue";
  title: string;
  description: string;
}): Promise<FeedbackPostData> {
  const session = await requireUser();

  const row = await prisma.feedbackPost.create({
    data: {
      type: data.type,
      title: data.title.trim(),
      description: data.description.trim(),
      upvotes: 1,
      authorId: session.userId,
      authorEmail: session.email,
      votes: { create: { userId: session.userId } },
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
    authorEmail: row.authorEmail,
    isAuthorAdmin: row.authorEmail === ADMIN_EMAIL,
    comments: [],
    userHasVoted: true,
  };
}

export async function upvoteFeedbackPost(postId: string): Promise<{ upvotes: number; voted: boolean }> {
  const { userId } = await requireUser();

  const existing = await prisma.feedbackUpvote.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  if (existing) {
    await prisma.feedbackUpvote.delete({ where: { id: existing.id } });
    const updated = await prisma.feedbackPost.update({
      where: { id: postId },
      data: { upvotes: { decrement: 1 } },
    });
    return { upvotes: updated.upvotes, voted: false };
  } else {
    await prisma.feedbackUpvote.create({ data: { postId, userId } });
    const updated = await prisma.feedbackPost.update({
      where: { id: postId },
      data: { upvotes: { increment: 1 } },
    });
    return { upvotes: updated.upvotes, voted: true };
  }
}

export async function addFeedbackComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<FeedbackCommentData> {
  const session = await requireUser();

  const row = await prisma.feedbackComment.create({
    data: {
      postId,
      content: content.trim(),
      authorId: session.userId,
      authorEmail: session.email,
      parentId: parentId ?? null,
    },
  });

  return {
    id: row.id,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    authorEmail: row.authorEmail,
    isAuthorAdmin: row.authorEmail === ADMIN_EMAIL,
    deleted: false,
    deletedByModerator: false,
    replies: [],
  };
}

export async function editFeedbackPost(
  postId: string,
  data: { title: string; description: string }
): Promise<void> {
  const session = await requireUser();
  const post = await prisma.feedbackPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  const admin = session.email === ADMIN_EMAIL;
  if (!admin && post.authorId !== session.userId) throw new Error("Unauthorized");
  if (!admin && post.status === "completed") throw new Error("Post is locked");
  await prisma.feedbackPost.update({
    where: { id: postId },
    data: { title: data.title.trim(), description: data.description.trim() },
  });
}

export async function editFeedbackComment(commentId: string, content: string): Promise<void> {
  const session = await requireUser();
  const comment = await prisma.feedbackComment.findUnique({
    where: { id: commentId },
    include: { post: { select: { status: true } } },
  });
  if (!comment) throw new Error("Comment not found");
  const admin = session.email === ADMIN_EMAIL;
  if (!admin && comment.authorId !== session.userId) throw new Error("Unauthorized");
  if (!admin && comment.post.status === "completed") throw new Error("Post is locked");
  await prisma.feedbackComment.update({
    where: { id: commentId },
    data: { content: content.trim() },
  });
}

export async function deleteFeedbackPost(postId: string): Promise<void> {
  const session = await requireUser();
  const post = await prisma.feedbackPost.findUnique({ where: { id: postId } });
  if (!post) throw new Error("Post not found");
  const admin = session.email === ADMIN_EMAIL;
  if (!admin && post.authorId !== session.userId) throw new Error("Unauthorized");
  await prisma.feedbackPost.delete({ where: { id: postId } });
}

export async function deleteFeedbackComment(
  commentId: string
): Promise<{ softDeleted: boolean; deletedByModerator: boolean; cleanedAncestorIds: string[] }> {
  const session = await requireUser();
  const admin = session.email === ADMIN_EMAIL;

  const comment = await prisma.feedbackComment.findUnique({
    where: { id: commentId },
    include: { replies: true },
  });
  if (!comment) throw new Error("Comment not found");
  if (!admin && comment.authorId !== session.userId) throw new Error("Unauthorized");

  const hasReplies = comment.replies.length > 0;
  const deletedByModerator = admin && comment.authorId !== session.userId;

  if (hasReplies) {
    await prisma.feedbackComment.update({
      where: { id: commentId },
      data: { deleted: true, deletedByModerator },
    });
    return { softDeleted: true, deletedByModerator, cleanedAncestorIds: [] };
  } else {
    const parentId = comment.parentId;
    await prisma.feedbackComment.delete({ where: { id: commentId } });
    // Clean up any soft-deleted ancestors that are now empty
    const cleanedAncestorIds = parentId ? await cleanupAncestors(parentId) : [];
    return { softDeleted: false, deletedByModerator: false, cleanedAncestorIds };
  }
}

export async function updateFeedbackStatus(
  postId: string,
  status: "open" | "liked" | "in_progress" | "planned" | "completed" | "laughing"
): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  await prisma.feedbackPost.update({
    where: { id: postId },
    data: { status },
  });
}

export async function banUser(authorEmail: string): Promise<void> {
  if (!(await isAdmin())) throw new Error("Unauthorized");
  if (authorEmail === ADMIN_EMAIL) throw new Error("Cannot ban admin");

  const user = await prisma.user.findUnique({
    where: { email: authorEmail },
    select: { id: true, lastKnownIp: true },
  });
  if (!user) throw new Error("User not found");

  // Mark account as banned
  await prisma.user.update({ where: { id: user.id }, data: { banned: true } });

  // Ban their last known IP
  if (user.lastKnownIp) {
    await prisma.bannedIp.upsert({
      where: { ip: user.lastKnownIp },
      create: { ip: user.lastKnownIp },
      update: {},
    });
  }

  // Delete all their posts (cascade removes comments/votes on those posts)
  await prisma.feedbackPost.deleteMany({ where: { authorId: user.id } });
  // Delete their comments on other people's posts
  await prisma.feedbackComment.deleteMany({ where: { authorId: user.id } });
  // Remove their upvotes
  await prisma.feedbackUpvote.deleteMany({ where: { userId: user.id } });
}

export async function checkIsAdmin(): Promise<boolean> {
  return isAdmin();
}

export async function getCurrentUserEmail(): Promise<string | null> {
  const session = await getSession();
  return session?.email ?? null;
}
