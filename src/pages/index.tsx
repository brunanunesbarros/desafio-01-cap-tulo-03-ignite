import { GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import Link from 'next/link';
import { FiCalendar, FiUser } from 'react-icons/fi';
import { useEffect, useState } from 'react';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps) {
  const [posts, setPosts] = useState<PostPagination>({
    next_page: '',
    results: [],
  });

  async function loadMorePosts() {
    const result = await fetch(posts.next_page);
    const resultNextPost = await result.json();
    const postsFormated = resultNextPost.results.map(r => {
      return {
        ...r,
        first_publication_date: r.first_publication_date,
      };
    });
    setPosts({
      next_page: resultNextPost.next_page,
      results: [...posts.results, ...postsFormated],
    });
  }

  useEffect(() => {
    setPosts(postsPagination);
  }, [postsPagination]);

  return (
    <>
      <Head>
        <title>Posts | spacetraveling</title>
      </Head>
      <main className={commonStyles.main}>
        <section className={styles.section}>
          <img src="Logo.svg" alt="logo" />
          <div className={styles.content}>
            {posts &&
              posts.results.map(post => {
                return (
                  <Link href={`/post/${post.uid}`} key={post.uid}>
                    <a>
                      <strong>{post.data.title}</strong>
                      <p>{post.data.subtitle}</p>
                      <div className={styles.info}>
                        <div className={styles.createdAt}>
                          <FiCalendar className={styles.calendar} />
                          <time>
                            {format(
                              new Date(post.first_publication_date),
                              'dd MMM yyyy',
                              {
                                locale: ptBR,
                              }
                            )}
                          </time>
                        </div>
                        <div className={styles.author}>
                          <FiUser className={styles.user} />
                          <span>{post.data.author}</span>
                        </div>
                      </div>
                    </a>
                  </Link>
                );
              })}
            {posts.next_page === null ? (
              <></>
            ) : (
              <button type="button" onClick={loadMorePosts}>
                Carregar mais posts
              </button>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.content', 'posts.author'],
      pageSize: 1,
    }
  );

  const postsPagination = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: postsResponse.next_page,
        results: postsPagination,
      },
    },
  };
};
