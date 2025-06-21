import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowUp } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { FeaturedArticle } from '@/components/featured-article';
import { NewsGrid } from '@/components/news-grid';
import { TrendingSidebar } from '@/components/trending-sidebar';
import { fetchNews } from '@/lib/news-api';
import { NewsCategory, NewsArticle } from '@/lib/types';

export default function Home() {
  const [currentCategory, setCurrentCategory] = useState<NewsCategory>('general');
  const [currentPage, setCurrentPage] = useState(1);
  const [allArticles, setAllArticles] = useState<NewsArticle[]>([]);
  const [showGoToTop, setShowGoToTop] = useState(false);

  // Main news query
  const { data: newsData, isLoading, error } = useQuery({
    queryKey: ['/api/news', currentCategory, currentPage],
    queryFn: () => fetchNews(currentCategory, currentPage, 12),
  });

  // Trending news query
  const { data: trendingData } = useQuery({
    queryKey: ['/api/news', 'trending', 1],
    queryFn: () => fetchNews('trending', 1, 5),
  });

  // Update articles when data changes
  useEffect(() => {
    if (newsData?.articles) {
      if (currentPage === 1) {
        setAllArticles(newsData.articles);
      } else {
        setAllArticles(prev => [...prev, ...newsData.articles]);
      }
    }
  }, [newsData, currentPage]);

  // Reset when category changes
  useEffect(() => {
    setCurrentPage(1);
    setAllArticles([]);
  }, [currentCategory]);

  // Scroll listener for go to top button
  useEffect(() => {
    const handleScroll = () => {
      setShowGoToTop(window.pageYOffset > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryChange = (category: NewsCategory) => {
    setCurrentCategory(category);
  };

  const handleLoadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getSectionTitle = (category: NewsCategory) => {
    const titles = {
      'general': 'Latest News',
      'world': 'International News',
      'sports': 'Sports News',
      'technology': 'Technology News',
      'business': 'Business News',
      'entertainment': 'Entertainment News',
      'trending': 'Trending News'
    };
    return titles[category] || 'Latest News';
  };

  const featuredArticle = allArticles[0];
  const gridArticles = allArticles.slice(1);

  return (
    <div className="min-h-screen bg-white">
      <Header
        currentCategory={currentCategory}
        onCategoryChange={handleCategoryChange}
      />

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* News Articles */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-headline font-bold">
                {getSectionTitle(currentCategory)}
              </h2>
              <div className="text-sm text-news-gray">
                <span>{allArticles.length}</span> articles
              </div>
            </div>

            {isLoading && currentPage === 1 ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-news-red mx-auto"></div>
                <p className="mt-4 text-news-gray">Loading news...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600 mb-4">Failed to load news articles</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-news-red hover:bg-red-700 text-white"
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <>
                {/* Featured Article */}
                {featuredArticle && <FeaturedArticle article={featuredArticle} />}

                {/* News Grid */}
                {gridArticles.length > 0 && <NewsGrid articles={gridArticles} />}

                {/* Load More Button */}
                {newsData && newsData.articles.length >= 12 && (
                  <div className="text-center">
                    <Button
                      onClick={handleLoadMore}
                      disabled={isLoading}
                      className="bg-news-red hover:bg-red-700 text-white font-semibold px-8 py-3"
                    >
                      {isLoading ? 'Loading...' : 'Load More Articles'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Sidebar */}
          <TrendingSidebar
            trendingArticles={trendingData?.articles || []}
            onCategoryChange={handleCategoryChange}
            currentCategory={currentCategory}
          />
        </div>
      </main>

      {/* Go to Top Button */}
      <Button
        onClick={scrollToTop}
        className={`fixed bottom-6 right-6 bg-news-red hover:bg-red-700 text-white p-3 rounded-full shadow-lg transition-all transform ${
          showGoToTop ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0'
        }`}
        size="icon"
      >
        <ArrowUp className="h-5 w-5" />
      </Button>

      <Footer />
    </div>
  );
}
