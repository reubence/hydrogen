import {
  useShop,
  useUrl,
  useSession,
  useShopQuery,
  gql,
} from '@shopify/hydrogen';
import {DefaultLayout as Layout} from '~/components/layouts';
import {
  FeaturedCollections,
  PageHeader,
  ProductSwimlane,
  Section,
} from '~/components/sections';
import {Heading, Text, Button, Input, Grid} from '~/components/elements';
import {ProductCard} from '~/components/blocks';

import {PRODUCT_CARD_FIELDS} from '~/lib/fragments';

export default function Search({pageBy = 12, params}) {
  const {languageCode} = useShop();
  const {countryCode = 'US'} = useSession();

  const {handle} = params;
  const {searchParams} = useUrl();

  const query = searchParams.get('q');

  if (!query) {
    const {data} = useShopQuery({
      query: NO_RESULTS_QUERY,
      variables: {
        handle,
        country: countryCode,
        language: languageCode,
        pageBy,
        query,
      },
      preload: true,
    });

    return (
      <SearchPage>
        <FeaturedCollections data={data.featuredCollections.nodes} />
        <ProductSwimlane data={data.featuredProducts.nodes} />
      </SearchPage>
    );
  }

  const {data} = useShopQuery({
    query: QUERY,
    variables: {
      handle,
      country: countryCode,
      language: languageCode,
      pageBy,
      query,
    },
    preload: true,
  });

  const results = data?.products?.nodes;

  return (
    <SearchPage query={decodeURI(query)}>
      <Section>
        <Grid>
          {results.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </Grid>
      </Section>
    </SearchPage>
  );
}

function SearchPage({query, children}) {
  return (
    <Layout>
      <PageHeader>
        <Heading as="h1" size="copy" format={false}>
          Search
        </Heading>
        <form className="relative flex w-full text-heading">
          <Input
            placeholder="Search for products"
            defaultValue={query}
            type="search"
            variant="search"
            name="q"
          />
          <button className="absolute right-0 py-2" type="submit">
            Go
          </button>
        </form>
      </PageHeader>
      {children}
    </Layout>
  );
}

const QUERY = gql`
  ${PRODUCT_CARD_FIELDS}
  query search(
    $query: String
    $country: CountryCode
    $language: LanguageCode
    $pageBy: Int!
    $after: String
  ) @inContext(country: $country, language: $language) {
    products(first: $pageBy, sortKey: RELEVANCE, query: $query, after: $after) {
      nodes {
        ...ProductCardFields
      }
      pageInfo {
        startCursor
        endCursor
        hasNextPage
        hasPreviousPage
      }
    }
  }
`;

const NO_RESULTS_QUERY = gql`
  ${PRODUCT_CARD_FIELDS}
  query homepage($country: CountryCode, $language: LanguageCode)
  @inContext(country: $country, language: $language) {
    featuredCollections: collections(first: 3, sortKey: UPDATED_AT) {
      nodes {
        id
        title
        handle
        image {
          altText
          width
          height
          url
        }
      }
    }
    featuredProducts: products(first: 12) {
      nodes {
        ...ProductCardFields
      }
    }
  }
`;
