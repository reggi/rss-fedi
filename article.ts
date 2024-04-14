import { Article, Collection, CollectionPage, RequestContext } from "./deps.ts";
import { Blog } from "./blog.ts";
import { Post } from "./parsefeed.ts";
import { Comment } from "./comment.ts";

// Represents a post as an ActivityStreams `Article`:
export function toArticle(
  context: RequestContext<void>,
  blog: Blog,
  post: Post,
  comments: Comment[]
): Article {
  const url = new URL(`/posts/${post.uuid}`, context.url);
  return new Article({
    id: url,
    attribution: context.getActorUri(blog.handle),
    to: new URL("https://www.w3.org/ns/activitystreams#Public"),
    summary: post.title,
    content: post.plain,
    published: post.published,
    url,
    replies: new Collection({
      first: new CollectionPage({
        items: comments.map((c) => new URL(c.id)),
      }),
    }),
  });
}
