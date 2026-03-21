"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  IconChevronUp,
  IconTrash,
  IconChevronDown,
  IconChevronRight,
  IconEdit,
  IconCornerDownRight,
  IconHeart,
  IconTool,
  IconCalendar,
  IconCheck,
  IconSettingsFilled,
  IconGavel,
  IconPin,
  IconPinnedFilled,
  IconLock,
  IconLockOpen,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getFeedbackPosts,
  createFeedbackPost,
  upvoteFeedbackPost,
  addFeedbackComment,
  editFeedbackPost,
  editFeedbackComment,
  deleteFeedbackPost,
  deleteFeedbackComment,
  updateFeedbackStatus,
  banUser,
  togglePinFeedbackPost,
  toggleLockFeedbackPost,
  checkIsAdmin,
  getCurrentUserEmail,
  type FeedbackPostData,
  type FeedbackCommentData,
} from "@/lib/feedback-actions";

const SUBTAB_KEY = "feedbackSubTab";

type IconComponent = React.ComponentType<{ className?: string }>;

type StatusConfig = {
  label: string;
  issueLabel?: string;
  color: string;
  icon?: IconComponent;
  emoji?: string;
};

const STATUS_LABELS: Record<string, StatusConfig> = {
  open: { label: "Open", color: "bg-zinc-700 text-zinc-300" },
  laughing: { label: "LOL", color: "bg-yellow-900/60 text-yellow-300", emoji: "😂" },
  liked: { label: "Liked", color: "bg-pink-900/60 text-pink-300", icon: IconHeart },
  planned: { label: "Planned", color: "bg-indigo-900/60 text-indigo-300", icon: IconCalendar },
  in_progress: { label: "In Progress", color: "bg-blue-900/60 text-blue-300", icon: IconTool },
  completed: { label: "Completed", issueLabel: "Fixed", color: "bg-green-900/60 text-green-300", icon: IconCheck },
};

const STATUS_OPTIONS: { value: string; label: string; issueLabel?: string }[] = [
  { value: "open", label: "Open" },
  { value: "laughing", label: "LOL" },
  { value: "liked", label: "Liked" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed", issueLabel: "Fixed" },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addReplyToTree(
  comments: FeedbackCommentData[],
  parentId: string,
  reply: FeedbackCommentData
): FeedbackCommentData[] {
  return comments.map((c) => {
    if (c.id === parentId) return { ...c, replies: [...c.replies, reply] };
    if (c.replies.length > 0) return { ...c, replies: addReplyToTree(c.replies, parentId, reply) };
    return c;
  });
}

function updateCommentInTree(
  comments: FeedbackCommentData[],
  commentId: string,
  update: Partial<FeedbackCommentData>
): FeedbackCommentData[] {
  return comments.map((c) => {
    if (c.id === commentId) return { ...c, ...update };
    if (c.replies.length > 0)
      return { ...c, replies: updateCommentInTree(c.replies, commentId, update) };
    return c;
  });
}

function removeCommentFromTree(
  comments: FeedbackCommentData[],
  commentId: string
): FeedbackCommentData[] {
  return comments
    .filter((c) => c.id !== commentId)
    .map((c) => ({ ...c, replies: removeCommentFromTree(c.replies, commentId) }));
}

function countComments(comments: FeedbackCommentData[]): number {
  return comments.reduce((acc, c) => acc + 1 + countComments(c.replies), 0);
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function StatusBadge({ status, postType }: { status: string; postType: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  const label = postType === "issue" && s.issueLabel ? s.issueLabel : s.label;
  const Icon = s.icon;
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
      {Icon && <Icon className="h-3 w-3" />}
      {s.emoji && <span className="leading-none text-[11px]">{s.emoji}</span>}
      {label}
    </span>
  );
}

function DevBadge() {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded font-medium bg-purple-900/60 text-purple-300 shrink-0">
      Dev
    </span>
  );
}

function OPBadge() {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded font-medium bg-zinc-700/60 text-zinc-300 shrink-0">
      OP
    </span>
  );
}

// ─── Comment Item ─────────────────────────────────────────────────────────────

function CommentItem({
  comment,
  postId,
  postAuthorEmail,
  admin,
  loggedIn,
  currentUserEmail,
  isCompleted,
  isLocked,
  onDelete,
  onEdit,
  onReply,
  onBan,
}: {
  comment: FeedbackCommentData;
  postId: string;
  postAuthorEmail: string | null;
  admin: boolean;
  loggedIn: boolean;
  currentUserEmail: string | null;
  isCompleted: boolean;
  isLocked: boolean;
  onDelete: (postId: string, commentId: string) => void;
  onEdit: (postId: string, commentId: string, content: string) => void;
  onReply: (postId: string, parentCommentId: string, content: string) => void;
  onBan: (authorEmail: string) => void;
}) {
  const [editMode, setEditMode] = React.useState(false);
  const [editContent, setEditContent] = React.useState(comment.content);
  const [showReply, setShowReply] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [submittingEdit, setSubmittingEdit] = React.useState(false);
  const [submittingReply, setSubmittingReply] = React.useState(false);

  const isOwn = !!currentUserEmail && comment.authorEmail === currentUserEmail;
  const isOP = !!postAuthorEmail && comment.authorEmail === postAuthorEmail;
  const canEdit = (isOwn && !isCompleted && !isLocked || admin) && !comment.deleted;
  const canDelete = (isOwn || admin) && !comment.deleted;
  const canReply = loggedIn && !isCompleted && (!isLocked || admin) && !comment.deleted;
  const canBan = admin && !!comment.authorEmail && !comment.isAuthorAdmin;

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSubmittingEdit(true);
    await onEdit(postId, comment.id, editContent);
    setEditMode(false);
    setSubmittingEdit(false);
  };

  const handleReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    await onReply(postId, comment.id, replyText);
    setReplyText("");
    setShowReply(false);
    setSubmittingReply(false);
  };

  return (
    <div className="group/comment">
      {comment.deleted ? (
        <div className="px-2 py-1.5">
          <p className="text-xs text-muted-foreground/35 italic">
            {comment.deletedByModerator ? "Deleted by moderator" : "Deleted"}
          </p>
        </div>
      ) : (
        <div
          className={`flex gap-2 rounded-md px-2 py-1.5 transition-colors ${isOwn ? "bg-blue-950/20 ring-1 ring-blue-500/15" : ""
            }`}
        >
          <div className="flex-1 min-w-0">
            {editMode ? (
              <div className="space-y-1.5">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  autoFocus
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
                />
                <div className="flex gap-1.5">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={submittingEdit || !editContent.trim()}
                  >
                    {submittingEdit ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditMode(false);
                      setEditContent(comment.content);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground prose prose-invert prose-sm max-w-none prose-p:my-0.5">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{comment.content}</ReactMarkdown>
              </div>
            )}

            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-xs text-muted-foreground/50">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
              {comment.isAuthorAdmin && <DevBadge />}
              {isOP && <OPBadge />}
              {!editMode && (
                <div className="flex items-center gap-1 opacity-0 group-hover/comment:opacity-100 transition-opacity">
                  {canReply && (
                    <button
                      onClick={() => setShowReply(!showReply)}
                      className="text-xs text-muted-foreground/60 hover:text-muted-foreground flex items-center gap-0.5 transition-colors"
                    >
                      <IconCornerDownRight className="h-3 w-3" />
                      Reply
                    </button>
                  )}
                  {canEdit && (
                    <button
                      onClick={() => setEditMode(true)}
                      className="text-muted-foreground/40 hover:text-muted-foreground p-0.5 rounded transition-colors"
                      title="Edit"
                    >
                      <IconEdit className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => onDelete(postId, comment.id)}
                      className="text-muted-foreground/40 hover:text-destructive p-0.5 rounded transition-colors"
                      title="Delete"
                    >
                      <IconTrash className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canBan && (
                    <button
                      onClick={() => onBan(comment.authorEmail!)}
                      className="text-muted-foreground/40 hover:text-orange-400 p-0.5 rounded transition-colors"
                      title={`Ban ${comment.authorEmail}`}
                    >
                      <IconGavel className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reply input */}
      {showReply && (
        <div className="mt-1.5 ml-4 flex gap-2">
          <input
            type="text"
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleReply();
              }
              if (e.key === "Escape") setShowReply(false);
            }}
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button size="sm" onClick={handleReply} disabled={submittingReply || !replyText.trim()}>
            {submittingReply ? "..." : "Reply"}
          </Button>
        </div>
      )}

      {/* Nested replies — infinite depth */}
      {comment.replies.length > 0 && (
        <div className="mt-1.5 ml-4 pl-3 border-l border-border/40 space-y-1">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              postAuthorEmail={postAuthorEmail}
              admin={admin}
              loggedIn={loggedIn}
              currentUserEmail={currentUserEmail}
              isCompleted={isCompleted}
              isLocked={isLocked}
              onDelete={onDelete}
              onEdit={onEdit}
              onReply={onReply}
              onBan={onBan}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  admin,
  loggedIn,
  currentUserEmail,
  onUpvote,
  onDelete,
  onStatusChange,
  onAddComment,
  onDeleteComment,
  onEditPost,
  onEditComment,
  onAddReply,
  onBan,
  onTogglePin,
  onToggleLock,
}: {
  post: FeedbackPostData;
  admin: boolean;
  loggedIn: boolean;
  currentUserEmail: string | null;
  onUpvote: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
  onEditPost: (postId: string, title: string, description: string) => void;
  onEditComment: (postId: string, commentId: string, content: string) => void;
  onAddReply: (postId: string, parentCommentId: string, content: string) => void;
  onBan: (authorEmail: string) => void;
  onTogglePin: (id: string) => void;
  onToggleLock: (id: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [showEdit, setShowEdit] = React.useState(false);

  const isCompleted = post.status === "completed";
  const isLocked = post.locked;
  const isOwn = !!currentUserEmail && post.authorEmail === currentUserEmail;
  const canEditPost = (isOwn && !isCompleted && !isLocked) || admin;
  const canDeletePost = isOwn || admin;
  const canBanPost = admin && !!post.authorEmail && !post.isAuthorAdmin;
  const totalComments = countComments(post.comments);

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    await onAddComment(post.id, commentText);
    setCommentText("");
    setSubmitting(false);
  };

  return (
    <>
      <div
        className={`border rounded-lg transition-colors ${isCompleted
          ? "border-green-800/50 bg-green-950/20"
          : isLocked
            ? "border-red-800/30 bg-red-950/10"
            : isOwn
              ? "border-blue-500/20 bg-blue-950/10"
              : "border-border/60"
          }`}
      >
        <div className="flex gap-3 p-4">
          {/* Upvote */}
          <div className="flex flex-col items-center gap-0.5 pt-0.5">
            <button
              onClick={() => onUpvote(post.id)}
              disabled={!loggedIn}
              title={!loggedIn ? "Log in to upvote" : post.userHasVoted ? "Remove upvote" : "Upvote"}
              className={`flex flex-col items-center gap-0 rounded-md px-2 py-1 transition-colors ${post.userHasVoted
                ? "text-pink-400"
                : loggedIn
                  ? "text-muted-foreground hover:text-pink-400 hover:bg-accent"
                  : "text-muted-foreground/40 cursor-not-allowed"
                }`}
            >
              <IconChevronUp className="h-5 w-5" />
              <span className="text-sm font-semibold leading-none">{post.upvotes}</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {post.pinned && (
                  <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-medium bg-amber-900/60 text-amber-300 shrink-0">
                    <IconPinnedFilled className="h-3 w-3" />
                    Pinned
                  </span>
                )}
                {post.locked && (
                  <span className="inline-flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded font-medium bg-red-900/60 text-red-300 shrink-0">
                    <IconLock className="h-3 w-3" />
                    Locked
                  </span>
                )}
                <h3 className="font-medium text-sm">{post.title}</h3>
                {post.isAuthorAdmin && <DevBadge />}
                {post.status !== "open" && (
                  <StatusBadge status={post.status} postType={post.type} />
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {admin && (
                  <select
                    value={post.status}
                    onChange={(e) => onStatusChange(post.id, e.target.value)}
                    className="text-xs bg-secondary border border-border rounded px-1.5 py-0.5 text-muted-foreground"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {post.type === "issue" && o.issueLabel ? o.issueLabel : o.label}
                      </option>
                    ))}
                  </select>
                )}
                {canEditPost && (
                  <button
                    onClick={() => setShowEdit(true)}
                    className="text-muted-foreground/50 hover:text-muted-foreground p-1 rounded transition-colors"
                    title="Edit post"
                  >
                    <IconEdit className="h-4 w-4" />
                  </button>
                )}
                {canDeletePost && (
                  <button
                    onClick={() => onDelete(post.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Delete post"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                )}
                {admin && (
                  <button
                    onClick={() => onTogglePin(post.id)}
                    className={`p-1 rounded transition-colors ${post.pinned ? "text-amber-400 hover:text-amber-300" : "text-muted-foreground/50 hover:text-amber-400"}`}
                    title={post.pinned ? "Unpin post" : "Pin post"}
                  >
                    {post.pinned ? <IconPinnedFilled className="h-4 w-4" /> : <IconPin className="h-4 w-4" />}
                  </button>
                )}
                {admin && (
                  <button
                    onClick={() => onToggleLock(post.id)}
                    className={`p-1 rounded transition-colors ${post.locked ? "text-red-400 hover:text-red-300" : "text-muted-foreground/50 hover:text-red-400"}`}
                    title={post.locked ? "Unlock post" : "Lock post"}
                  >
                    {post.locked ? <IconLock className="h-4 w-4" /> : <IconLockOpen className="h-4 w-4" />}
                  </button>
                )}
                {canBanPost && (
                  <button
                    onClick={() => onBan(post.authorEmail!)}
                    className="text-muted-foreground/50 hover:text-orange-400 p-1 rounded transition-colors"
                    title={`Ban ${post.authorEmail}`}
                  >
                    <IconGavel className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="mt-1.5 text-sm text-muted-foreground prose prose-invert prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-headings:my-2">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.description}</ReactMarkdown>
            </div>

            <div className="mt-2 flex items-center gap-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
              >
                {expanded ? (
                  <IconChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <IconChevronRight className="h-3.5 w-3.5" />
                )}
                {totalComments} {totalComments === 1 ? "comment" : "comments"}
              </button>
              <span className="text-xs text-muted-foreground/60">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {expanded && (
          <div className="border-t border-border/40 px-4 py-3 space-y-2">
            {post.comments.map((c) => (
              <CommentItem
                key={c.id}
                comment={c}
                postId={post.id}
                postAuthorEmail={post.authorEmail}
                admin={admin}
                loggedIn={loggedIn}
                currentUserEmail={currentUserEmail}
                isCompleted={isCompleted}
                isLocked={isLocked}
                onDelete={onDeleteComment}
                onEdit={onEditComment}
                onReply={onAddReply}
                onBan={onBan}
              />
            ))}

            {isCompleted ? (
              <p className="text-xs text-muted-foreground/50">Comments are closed</p>
            ) : isLocked && !admin ? (
              <p className="text-xs text-muted-foreground/50">This post is locked</p>
            ) : loggedIn ? (
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Add a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                  className="flex-1 h-8 rounded-md border border-input bg-background px-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
                <Button size="sm" onClick={handleComment} disabled={submitting || !commentText.trim()}>
                  {submitting ? "..." : "Post"}
                </Button>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/60">Log in to comment</p>
            )}
          </div>
        )}
      </div>

      {showEdit && (
        <EditPostModal
          post={post}
          onClose={() => setShowEdit(false)}
          onSubmit={async (title, description) => {
            await onEditPost(post.id, title, description);
            setShowEdit(false);
          }}
        />
      )}
    </>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────

function CreatePostModal({
  type,
  onClose,
  onSubmit,
}: {
  type: "suggestion" | "issue";
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    await onSubmit(title, description);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full max-w-lg shadow-none flex flex-col gap-4 p-5 md:p-8 border-border/60">
        <h2 className="text-lg font-medium">
          {type === "suggestion" ? "Add Suggestion" : "Report Issue"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Title</label>
              <span className={`text-xs ${title.length >= 100 ? "text-destructive" : "text-muted-foreground/60"}`}>
                {title.length}/100
              </span>
            </div>
            <input
              type="text"
              placeholder={type === "suggestion" ? "Feature idea..." : "Bug or issue..."}
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              autoFocus
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              placeholder="Describe in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <p className="text-xs text-muted-foreground">Markdown is supported</p>
          </div>
          <p className="text-xs text-yellow-500">
            You will be permanently banned for any inappropriate feedback
          </p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting || !title.trim() || !description.trim()}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

function EditPostModal({
  post,
  onClose,
  onSubmit,
}: {
  post: FeedbackPostData;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
}) {
  const [title, setTitle] = React.useState(post.title);
  const [description, setDescription] = React.useState(post.description);
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSubmitting(true);
    await onSubmit(title, description);
    setSubmitting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Card className="w-full max-w-lg shadow-none flex flex-col gap-4 p-5 md:p-8 border-border/60">
        <h2 className="text-lg font-medium">Edit Post</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Title</label>
              <span className={`text-xs ${title.length >= 100 ? "text-destructive" : "text-muted-foreground/60"}`}>
                {title.length}/100
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, 100))}
              autoFocus
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-y"
            />
            <p className="text-xs text-muted-foreground">Markdown is supported</p>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting || !title.trim() || !description.trim()}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// ─── Main Tab ─────────────────────────────────────────────────────────────────

export function FeedbackTab({ loggedIn, onLoginClick }: { loggedIn: boolean; onLoginClick: () => void }) {
  const [subTab, setSubTab] = React.useState<"suggestion" | "issue">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(SUBTAB_KEY);
      if (saved === "suggestion" || saved === "issue") return saved;
    }
    return "suggestion";
  });
  const [posts, setPosts] = React.useState<FeedbackPostData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [admin, setAdmin] = React.useState(false);
  const [currentUserEmail, setCurrentUserEmail] = React.useState<string | null>(null);
  const [showCreate, setShowCreate] = React.useState(false);

  const loadPosts = React.useCallback(async (type: "suggestion" | "issue", silent = false) => {
    if (!silent) setLoading(true);
    const data = await getFeedbackPosts(type);
    setPosts(data);
    if (!silent) setLoading(false);
  }, []);

  React.useEffect(() => {
    if (loggedIn) {
      checkIsAdmin().then(setAdmin);
      getCurrentUserEmail().then(setCurrentUserEmail);
    } else {
      setAdmin(false);
      setCurrentUserEmail(null);
    }
  }, [loggedIn]);

  React.useEffect(() => {
    loadPosts(subTab);
  }, [subTab, loadPosts]);

  React.useEffect(() => {
    const interval = setInterval(() => loadPosts(subTab, true), 30000);
    return () => clearInterval(interval);
  }, [subTab, loadPosts]);

  const handleSubTabChange = (tab: "suggestion" | "issue") => {
    setSubTab(tab);
    localStorage.setItem(SUBTAB_KEY, tab);
  };

  const handleUpvote = async (postId: string) => {
    if (!loggedIn) return;
    const result = await upvoteFeedbackPost(postId);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, upvotes: result.upvotes, userHasVoted: result.voted } : p))
    );
  };

  const handleCreate = async (title: string, description: string) => {
    await createFeedbackPost({ type: subTab, title, description });
    setShowCreate(false);
    await loadPosts(subTab, true); // silent reload to get correct sort order
  };

  const handleDelete = async (postId: string) => {
    await deleteFeedbackPost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleStatusChange = async (postId: string, status: string) => {
    await updateFeedbackStatus(
      postId,
      status as "open" | "liked" | "in_progress" | "planned" | "completed" | "laughing"
    );
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, status } : p)));
  };

  const handleAddComment = async (postId: string, content: string) => {
    const comment = await addFeedbackComment(postId, content);
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, comment] } : p))
    );
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    const result = await deleteFeedbackComment(commentId);
    if (result.softDeleted) {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          return {
            ...p,
            comments: updateCommentInTree(p.comments, commentId, {
              deleted: true,
              deletedByModerator: result.deletedByModerator,
            }),
          };
        })
      );
    } else {
      setPosts((prev) =>
        prev.map((p) => {
          if (p.id !== postId) return p;
          const idsToRemove = [commentId, ...result.cleanedAncestorIds];
          const updated = idsToRemove.reduce(
            (comments, id) => removeCommentFromTree(comments, id),
            p.comments
          );
          return { ...p, comments: updated };
        })
      );
    }
  };

  const handleEditPost = async (postId: string, title: string, description: string) => {
    await editFeedbackPost(postId, { title, description });
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, title, description } : p)));
  };

  const handleEditComment = async (postId: string, commentId: string, content: string) => {
    await editFeedbackComment(commentId, content);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, comments: updateCommentInTree(p.comments, commentId, { content }) };
      })
    );
  };

  const handleTogglePin = async (postId: string) => {
    const pinned = await togglePinFeedbackPost(postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, pinned } : p)));
    // Re-sort so pinned posts move to top
    await loadPosts(subTab, true);
  };

  const handleToggleLock = async (postId: string) => {
    const locked = await toggleLockFeedbackPost(postId);
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, locked } : p)));
  };

  const handleBan = async (authorEmail: string) => {
    if (!confirm(`Permanently ban ${authorEmail}?\n\nThis will delete all their posts and comments and block their account and IP.`)) return;
    await banUser(authorEmail);
    await loadPosts(subTab, true);
  };

  const handleAddReply = async (postId: string, parentCommentId: string, content: string) => {
    const reply = await addFeedbackComment(postId, content, parentCommentId);
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        return { ...p, comments: addReplyToTree(p.comments, parentCommentId, reply) };
      })
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
          <button
            onClick={() => handleSubTabChange("suggestion")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${subTab === "suggestion"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => handleSubTabChange("issue")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${subTab === "issue"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Issues
          </button>
        </div>

        {loggedIn ? (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            {subTab === "suggestion" ? "Add Suggestion" : "Report Issue"}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={onLoginClick}>
            Log in to submit
          </Button>
        )}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Loading...</div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            No {subTab === "suggestion" ? "suggestions" : "issues"} yet. Be the first to submit one!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              admin={admin}
              loggedIn={loggedIn}
              currentUserEmail={currentUserEmail}
              onUpvote={handleUpvote}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
              onEditPost={handleEditPost}
              onEditComment={handleEditComment}
              onAddReply={handleAddReply}
              onBan={handleBan}
              onTogglePin={handleTogglePin}
              onToggleLock={handleToggleLock}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          type={subTab}
          onClose={() => setShowCreate(false)}
          onSubmit={handleCreate}
        />
      )}
    </div>
  );
}
