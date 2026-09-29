import { Metadata } from 'next';
import { getProduct, getRelatedProductsAsync } from '../../lib/products';
import { getReviews } from '../../lib/reviews';
import { ReviewForm } from '../../components/ReviewForm';
import { AddToCartButton } from '../../components/AddToCartButton';
import { ShareButton } from '../../components/ShareButton';
import { RelatedProducts } from '../../components/RelatedProducts';

type ProductPageProps = {
  params: { id: string };
};

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const product = getProduct(params.id);

  return {
    title: product ? `${product.name} · ShopLite` : 'Product · ShopLite',
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = getProduct(params.id);
  const productReviews = getReviews(params.id);
  const relatedPromise = getRelatedProductsAsync(params.id);

  return (
    <article>
      <p className="mb-2 text-sm uppercase text-gray-500">{product.category}</p>
      <h1 className="mb-2 text-3xl font-semibold">{product.name}</h1>
      <p className="mb-4 text-gray-600">{product.description}</p>
      <p className="mb-6 text-xl font-medium">£{product.price.toFixed(2)}</p>

      <div className="mb-8 flex flex-wrap items-end gap-6">
        <AddToCartButton productId={product.id} />
        <ShareButton productName={product.name} />
      </div>

      <section className="mb-10">
        <h2 className="mb-3 text-xl font-semibold">Reviews</h2>
        <ReviewForm productId={product.id} reviews={productReviews} />
      </section>

      <RelatedProducts relatedPromise={relatedPromise} show={product.stock > 0} />
    </article>
  );
}
