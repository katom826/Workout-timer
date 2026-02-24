"use client";

// todo GitHubコミット時は別ファイルに退避して削除する

type SectionProps = {
  category: string;
  id: string;
  children: React.ReactNode;
};

const Section = ({ category, id, children }: SectionProps) => {
  return (
    <section id={id} className="mt-10">
      <h2 className="text-orange-400 text-2xl">{category}</h2>
      <div className="mt-5 grid grid-cols-1 gap-10">{children}</div>
    </section>
  );
};

type ArticleProps = {
  githubUrl: string;
  techUrl: string;
  imgPath: string;
  alt: string;
  title: string;
  explanation: string;
  techStack: string;
};

const Article = ({
  githubUrl,
  techUrl,
  imgPath,
  alt,
  title,
  explanation,
  techStack,
}: ArticleProps) => {
  return (
    <article className="flex gap-5">
      <a href={techUrl} target="_blank">
        <img src={imgPath} alt={alt} className="" />
      </a>
      <div>
        <a href={techUrl} target="_blank">
          <h3 className="inline text-lg font-bold bg-linear-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
            {title}
          </h3>
        </a>
        <div className="mt-2 flex flex-col gap-3">
          <div>
            <h4 className="text-orange-400">説明</h4>
            <p>{explanation}</p>
          </div>
          <div>
            <h4 className="text-orange-400">使用技術</h4>
            <p>{techStack}</p>
          </div>
          <div>
            <p>
              GitHub URL:
              <a href={githubUrl} className="text-blue-500 underline">
                {githubUrl}
              </a>
            </p>
            <p>
              サービスURL:
              <a href={techUrl} className="text-blue-500 underline">
                {techUrl}
              </a>
            </p>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function Home() {
  return (
    <div>
      <header className="bg-blue-500">
        <div className="max-w-4xl mx-auto px-3 py-5">
          <h1 className="text-3xl">ポートフォリオ</h1>
        </div>
      </header>

      <nav className="sticky top-0 bg-blue-400">
        <ul className="max-w-4xl mx-auto px-3 py-1 flex gap-10 justify-center">
          <li>
            <a href="#webApp">ウェブアプリ</a>
          </li>
          <li>
            <a href="#markup">マークアップ</a>
          </li>
          <li>
            <a href="#game">ゲーム</a>
          </li>
        </ul>
      </nav>

      <main className="max-w-4xl mx-auto px-3">
        <Section category="ウェブアプリ" id="webApp">
          <Article
            githubUrl="https://github.com/katom826/wallpaper-note"
            techUrl="https://katom826.github.io/wallpaper-note/"
            imgPath="https://placehold.jp/320x180.png"
            alt="test"
            title="壁紙メモアプリ"
            explanation="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
            techStack="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
          ></Article>

          <Article
            githubUrl="https://github.com/katom826/wallpaper-note"
            techUrl="https://katom826.github.io/wallpaper-note/"
            imgPath="https://placehold.jp/320x180.png"
            alt="test"
            title="筋トレアシストアプリ"
            explanation="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
            techStack="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
          ></Article>

          <Article
            githubUrl="https://github.com/katom826/wallpaper-note"
            techUrl="https://katom826.github.io/wallpaper-note/"
            imgPath="https://placehold.jp/320x180.png"
            alt="test"
            title="時報ポモドーロアプリ"
            explanation="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
            techStack="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
          ></Article>
        </Section>

        <Section category="マークアップ" id="markup">
          <Article
            githubUrl="https://github.com/katom826/wallpaper-note"
            techUrl="https://katom826.github.io/wallpaper-note/"
            imgPath="https://placehold.jp/320x180.png"
            alt="test"
            title="ランディングページ"
            explanation="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
            techStack="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
          ></Article>

          <Article
            githubUrl="https://github.com/katom826/wallpaper-note"
            techUrl="https://katom826.github.io/wallpaper-note/"
            imgPath="https://placehold.jp/320x180.png"
            alt="test"
            title="レストランウェブサイト"
            explanation="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
            techStack="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
          ></Article>
        </Section>

        <Section category="ゲーム" id="game">
          <Article
            githubUrl="https://github.com/katom826/wallpaper-note"
            techUrl="https://katom826.github.io/wallpaper-note/"
            imgPath="https://placehold.jp/320x180.png"
            alt="test"
            title="アタックル"
            explanation="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
            techStack="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
          ></Article>

          <Article
            githubUrl="https://github.com/katom826/wallpaper-note"
            techUrl="https://katom826.github.io/wallpaper-note/"
            imgPath="https://placehold.jp/320x180.png"
            alt="test"
            title="あああ"
            explanation="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
            techStack="Lorem ipsum dolor sit amet, consectetur adipisicing elit. Dicta
              distinctio aliquid illum ex ipsa autem quod sed magnam, aut quam
              veritatis, voluptatum praesentium nihil sint laboriosam earum
              numquam! Culpa, quis."
          ></Article>
        </Section>
      </main>

      <footer className="bg-blue-500 mt-10">
        <div className="max-w-4xl mx-auto px-3 py-5">
          <address>
            <p>© 2025 Kadokawa Tomoki</p>
            <p>
              Email:{" "}
              <a href="mailto:test@example.com" className="underline">
                test@example.com
              </a>
            </p>
            <p>
              GitHub:
              <a href="https://github.com/katom826" className="underline">
                katom826
              </a>
            </p>
          </address>
        </div>
      </footer>

      <div className="bg-blue-400 fixed bottom-4 right-4 shadow-2xl w-16 h-16 rounded-full flex justify-center items-center">
        <a href="#">TOPへ</a>
      </div>
    </div>
  );
}
