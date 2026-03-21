"use client";

import * as React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { IconChevronUp, IconTrash, IconChevronDown, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getFeedbackPosts,
  createFeedbackPost,
  upvoteFeedbackPost,
  addFeedbackComment,
  deleteFeedbackPost,
  deleteFeedbackComment,
  updateFeedbackStatus,
  checkIsAdmin,
  type FeedbackPostData,
} from "@/lib/feedback-actions";

const STATUS_LABELS: Record<string, { label: string; issueLabel?: string; color: string }> = {
  open: { label: "Open", color: "bg-zinc-700 text-zinc-300" },
  liked: { label: "Liked", color: "bg-pink-900/60 text-pink-300" },
  in_progress: { label: "In Progress", color: "bg-blue-900/60 text-blue-300" },
  completed: { label: "Completed", issueLabel: "Fixed", color: "bg-green-900/60 text-green-300" },
};

const STATUS_OPTIONS: { value: string; label: string; issueLabel?: string }[] = [
  { value: "open", label: "Open" },
  { value: "liked", label: "Liked" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed", issueLabel: "Fixed" },
];

function StatusBadge({ status, postType }: { status: string; postType: string }) {
  const s = STATUS_LABELS[status] || STATUS_LABELS.open;
  const label = postType === "issue" && s.issueLabel ? s.issueLabel : s.label;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>
      {label}
    </span>
  );
}

function PostCard({
  post,
  admin,
  loggedIn,
  onUpvote,
  onDelete,
  onStatusChange,
  onAddComment,
  onDeleteComment,
}: {
  post: FeedbackPostData;
  admin: boolean;
  loggedIn: boolean;
  onUpvote: (id: string) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onDeleteComment: (postId: string, commentId: string) => void;
}) {
  const [expanded, setExpanded] = React.useState(false);
  const [commentText, setCommentText] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const isCompleted = post.status === "completed";

  const handleComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    await onAddComment(post.id, commentText);
    setCommentText("");
    setSubmitting(false);
  };

  return (
    <div className={`border rounded-lg ${isCompleted ? "border-green-800/50 bg-green-950/20" : "border-border/60"}`}>
      <div className="flex gap-3 p-4">
        {/* Upvote button */}
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
              <h3 className="font-medium text-sm">{post.title}</h3>
              {post.status !== "open" && <StatusBadge status={post.status} postType={post.type} />}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {admin && (
                <>
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
                  <button
                    onClick={() => onDelete(post.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded transition-colors"
                    title="Delete post"
                  >
                    <IconTrash className="h-4 w-4" />
                  </button>
                </>
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
              {post.comments.length} {post.comments.length === 1 ? "comment" : "comments"}
            </button>
            <span className="text-xs text-muted-foreground/60">
              {new Date(post.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Comments */}
      {expanded && (
        <div className="border-t border-border/40 px-4 py-3 space-y-3">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-2 group">
              <div className="flex-1 min-w-0">
                <div className="text-sm text-muted-foreground prose prose-invert prose-sm max-w-none prose-p:my-0.5">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{c.content}</ReactMarkdown>
                </div>
                <span className="text-xs text-muted-foreground/50">
                  {new Date(c.createdAt).toLocaleDateString()}
                </span>
              </div>
              {admin && (
                <button
                  onClick={() => onDeleteComment(post.id, c.id)}
                  className="text-muted-foreground/40 hover:text-destructive p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
                  title="Delete comment"
                >
                  <IconTrash className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}

          {isCompleted ? (
            <p className="text-xs text-muted-foreground/50">Comments are closed</p>
          ) : loggedIn ? (
            <div className="flex gap-2">
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
  );
}

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
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <Card className="w-full max-w-lg shadow-none flex flex-col gap-4 p-5 md:p-8 border-border/60">
        <h2 className="text-lg font-medium">
          {type === "suggestion" ? "Add Suggestion" : "Report Issue"}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Title</label>
            <input
              type="text"
              placeholder={type === "suggestion" ? "Feature idea..." : "Bug or issue..."}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          <p className="text-xs text-yellow-500">You will be permanently banned for any inappropriate feedback</p>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || !title.trim() || !description.trim()}>
              {submitting ? "Submitting..." : "Submit"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export function FeedbackTab({ loggedIn, onLoginClick }: { loggedIn: boolean; onLoginClick: () => void }) {
  const [subTab, setSubTab] = React.useState<"suggestion" | "issue">("suggestion");
  const [posts, setPosts] = React.useState<FeedbackPostData[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [admin, setAdmin] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  const loadPosts = React.useCallback(async (type: "suggestion" | "issue") => {
    setLoading(true);
    const data = await getFeedbackPosts(type);
    setPosts(data);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (loggedIn) {
      checkIsAdmin().then(setAdmin);
    } else {
      setAdmin(false);
    }
  }, [loggedIn]);

  React.useEffect(() => {
    loadPosts(subTab);
  }, [subTab, loadPosts]);

  const handleUpvote = async (postId: string) => {
    if (!loggedIn) return;
    const result = await upvoteFeedbackPost(postId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, upvotes: result.upvotes, userHasVoted: result.voted } : p
      )
    );
  };

  const handleCreate = async (title: string, description: string) => {
    const post = await createFeedbackPost({ type: subTab, title, description });
    setPosts((prev) => [post, ...prev]);
    setShowCreate(false);
  };

  const handleDelete = async (postId: string) => {
    await deleteFeedbackPost(postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  };

  const handleStatusChange = async (postId: string, status: string) => {
    await updateFeedbackStatus(postId, status as "open" | "liked" | "in_progress" | "completed");
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, status } : p))
    );
  };

  const handleAddComment = async (postId: string, content: string) => {
    const comment = await addFeedbackComment(postId, content);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, comments: [...p.comments, comment] } : p
      )
    );
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    await deleteFeedbackComment(commentId);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, comments: p.comments.filter((c) => c.id !== commentId) }
          : p
      )
    );
  };

  return (
    <div className="space-y-4">
      {/* Sub-tab switcher + add button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg">
          <button
            onClick={() => setSubTab("suggestion")}
            className={`px-3 py-1.5 text-sm rounded-md transition-colors ${subTab === "suggestion"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
              }`}
          >
            Suggestions
          </button>
          <button
            onClick={() => setSubTab("issue")}
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

      {/* Posts list */}
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
              onUpvote={handleUpvote}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onAddComment={handleAddComment}
              onDeleteComment={handleDeleteComment}
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
