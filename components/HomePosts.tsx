import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { homePostsApi, type HomePost } from '../utils/homePostsApi';
import styles from './HomePosts.module.css';

const isExternal = (url: string) => /^https?:\/\//i.test(url);

const PostCta = ({ post }: { post: HomePost }) => {
  const label = post.cta_label?.trim() || (post.kind === 'ad' ? 'Подробнее' : 'Читать');
  const url = post.cta_url?.trim();
  if (!url) return null;

  if (isExternal(url)) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className={styles.cta}>
        {label}
      </a>
    );
  }

  return (
    <Link to={url} className={styles.cta}>
      {label}
    </Link>
  );
};

const HomePosts = () => {
  const [posts, setPosts] = useState<HomePost[]>([]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await homePostsApi.listPublic();
        if (!cancelled) setPosts(data.posts || []);
      } catch {
        if (!cancelled) setPosts([]);
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className={styles.wrap} aria-label="Новости и реклама">
      <div className={styles.list}>
        {posts.map((post) => (
          <article
            key={post.id}
            className={`${styles.card} ${post.kind === 'ad' ? styles.ad : styles.news}`}
          >
            {post.image_url ? (
              <div
                className={styles.media}
                style={{ backgroundImage: `url(${post.image_url})` }}
                aria-hidden
              />
            ) : null}
            <div className={styles.content}>
              <p className={styles.eyebrow}>
                {post.kind === 'ad' ? 'Реклама' : 'Новость'}
              </p>
              <h2 className={styles.title}>{post.title}</h2>
              <p className={styles.body}>{post.body}</p>
              <PostCta post={post} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HomePosts;
