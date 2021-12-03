import { GetStaticPaths, GetStaticProps } from 'next';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Head from 'next/head';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';
import { RichText } from 'prismic-dom';
import uuid from 'react-uuid';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { getPrismicClient } from '../../services/prismic';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import Header from '../../components/Header';

interface Post {
  uid: string;
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  let readingTime = post?.data.content.reduce((accWorld, pos) => {
    // eslint-disable-next-line no-param-reassign
    accWorld += RichText.asText(pos.body).split(' ').length;
    return accWorld;
  }, 0);

  readingTime = Math.ceil(readingTime / 200);
  const newDate = new Date(post?.first_publication_date);

  return (
    <>
      <Head>
        <title>{post?.data.title} | spacetraveling</title>
      </Head>
      <main className={styles.main}>
        <Header />
        {router.isFallback ? (
          <div>Carregando...</div>
        ) : (
          <>
            <img
              className={styles.banner}
              src={post?.data.banner.url}
              alt="logo"
            />
            <section className={styles.section}>
              <h1>{post?.data.title}</h1>
              <div className={styles.info}>
                <div className={styles.createdAt}>
                  <time style={{ textTransform: 'capitalize' }}>
                    <FiCalendar className={styles.calendar} />
                    {format(newDate, 'dd MMM yyyy', { locale: ptBR })}
                  </time>
                </div>
                <div className={styles.author}>
                  <FiUser className={styles.user} />
                  <span>{post?.data.author}</span>
                </div>
                <div className={styles.readingTime}>
                  <FiClock className={styles.clock} />
                  <span>{String(readingTime)} min</span>
                </div>
              </div>
              <div className={styles.content}>
                {post?.data.content.map(content => {
                  return (
                    <div key={uuid()}>
                      <strong>{content.heading}</strong>
                      {content.body.map(bod => {
                        return (
                          <div
                            dangerouslySetInnerHTML={{ __html: bod.text }}
                            key={uuid()}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.uid'],
      pageSize: 1,
    }
  );

  const paths = postsResponse.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const { slug } = params;
  const prismic = getPrismicClient();

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      ...response.data,
      content: response.data.content.map(item => {
        return {
          heading: item.heading,
          body: item.body,
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 30,
  };
};
