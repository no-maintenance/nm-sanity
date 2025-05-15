import {defineQuery} from 'groq';

import {
  COLOR_SCHEME_FRAGMENT,
  IMAGE_FRAGMENT,
  MUX_VIDEO_FRAGMENT,
  RICHTEXT_FRAGMENT,
} from './fragments';
import {getIntValue} from './utils';
import {LINK_REFERENCE_FRAGMENT} from './links';

export const SECTION_SETTINGS_FRAGMENT = defineQuery(`{
  colorScheme -> ${COLOR_SCHEME_FRAGMENT},
  customCss,
  hide,
  padding
}`);

export const RELATED_PRODUCTS_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  desktopColumns,
  "heading": ${getIntValue('heading')},
  maxProducts,
  displayType,
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const PRODUCT_INFORMATION_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  desktopMediaPosition,
  desktopMediaWidth,
  galleryStyle,
  stickyProductInfo,
  mediaAspectRatio,
  "richtext": coalesce(
    richtext[_key == $language][0].value[] ${RICHTEXT_FRAGMENT},
    richtext[_key == $defaultLanguage][0].value[] ${RICHTEXT_FRAGMENT},
  )[],
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const COLLECTION_PRODUCT_GRID_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  desktopColumns,
  enableFiltering,
  enableSorting,
  mobileColumns,
  productsPerPage,
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const COLLECTION_BANNER_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  bannerHeight,
  contentAlignment,
  contentPosition,
  overlayOpacity,
  showDescription,
  showImage,
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const RICHTEXT_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  contentAlignment,
  desktopContentPosition,
  maxWidth,
  "richtext": coalesce(
    richtext[_key == $language][0].value[] ${RICHTEXT_FRAGMENT},
    richtext[_key == $defaultLanguage][0].value[] ${RICHTEXT_FRAGMENT},
  )[],
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const CAROUSEL_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  arrows,
  autoplay,
  "title": ${getIntValue('title')},
  loop,
  pagination,
  slides[] {
    _key,
    image ${IMAGE_FRAGMENT},
  },
  slidesPerViewDesktop,
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const COLLECTION_LIST_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  collections[] -> {
    store {
      gid
    }
  },
  desktopColumns,
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const FEATURED_PRODUCT_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  mediaAspectRatio,
  product -> {
    store {
      descriptionHtml,
      "firstVariant": variants[0] -> {
        store {
          gid,
          previewImageUrl,
          price
        }
      },
      gid,
      options[] {
        name,
        values
      },
      previewImageUrl,
      title
    }
  },
  'richtext': coalesce(
    richtext[_key == $language][0].value[] ${RICHTEXT_FRAGMENT},
    richtext[_key == $defaultLanguage][0].value[] ${RICHTEXT_FRAGMENT},
  )[],
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const FEATURED_COLLECTION_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  collection -> {
    store {
      gid,
      slug,
      title
    }
  },
  desktopColumns,
  displayType,
  "heading": ${getIntValue('heading')},
  maxProducts,
  settings ${SECTION_SETTINGS_FRAGMENT},
  viewAll
}`);

export const IMAGE_BANNER_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  mediaType,
  backgroundImage ${IMAGE_FRAGMENT},
  backgroundVideo ${MUX_VIDEO_FRAGMENT},
  heightMode,
  bannerHeight,
  aspectRatio,
  customAspectRatio,
  responsiveAspectRatio,
  mobileAspectRatio,
  customMobileAspectRatio,
  "content": coalesce(
    content[_key == $language][0].value[] ${RICHTEXT_FRAGMENT},
    content[_key == $defaultLanguage][0].value[] ${RICHTEXT_FRAGMENT},
  )[],
  contentAlignment,
  contentPosition,
  overlayOpacity,
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const PRODUCT_SWIMLANE_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  collection -> {
    store {
      gid,
      slug {
        current
      },
      title
    }
  },
  "heading": ${getIntValue('heading')},
  manualProducts[] -> {
    store {
      gid
    }
  },
  maxProducts,
  source,
  settings ${SECTION_SETTINGS_FRAGMENT},
  viewAll
}`);

export const STICKY_TILE_SECTION_FRAGMENT = defineQuery(`{
  _key,
  _type,
  stickyColumn,
  tiles[] {
    _key,
    mediaType,
    image ${IMAGE_FRAGMENT},
    video ${MUX_VIDEO_FRAGMENT},
    "richtext": coalesce(
      richtext[_key == $language][0].value[] ${RICHTEXT_FRAGMENT},
      richtext[_key == $defaultLanguage][0].value[] ${RICHTEXT_FRAGMENT},
    )[],
    link -> ${LINK_REFERENCE_FRAGMENT},
    externalLink,
    openInNewTab,
    contentPosition,
    contentAlignment,
    settings ${SECTION_SETTINGS_FRAGMENT}
  },
  settings ${SECTION_SETTINGS_FRAGMENT}
}`);

export const SECTIONS_FRAGMENT = () =>
  defineQuery(`
    _type == 'richtextSection' => ${RICHTEXT_SECTION_FRAGMENT},
    _type == 'carouselSection' => ${CAROUSEL_SECTION_FRAGMENT},
    _type == 'collectionListSection' => ${COLLECTION_LIST_SECTION_FRAGMENT},
    _type == 'featuredProductSection' => ${FEATURED_PRODUCT_SECTION_FRAGMENT},
    _type == 'featuredCollectionSection' => ${FEATURED_COLLECTION_SECTION_FRAGMENT},
    _type == 'imageBannerSection' => ${IMAGE_BANNER_SECTION_FRAGMENT},
    _type == 'productSwimlaneSection' => ${PRODUCT_SWIMLANE_SECTION_FRAGMENT},
    _type == 'stickyTileSection' => ${STICKY_TILE_SECTION_FRAGMENT},
  `);

export const COLLECTION_SECTIONS_FRAGMENT = () =>
  defineQuery(`
    _type == 'collectionBannerSection' => ${COLLECTION_BANNER_SECTION_FRAGMENT},
    _type == 'collectionProductGridSection' => ${COLLECTION_PRODUCT_GRID_SECTION_FRAGMENT},
    _type == 'productSwimlaneSection' => ${PRODUCT_SWIMLANE_SECTION_FRAGMENT},
  `);

export const PRODUCT_SECTIONS_FRAGMENT = () =>
  defineQuery(`
    _type == 'productInformationSection' => ${PRODUCT_INFORMATION_SECTION_FRAGMENT},
    _type == 'relatedProductsSection' => ${RELATED_PRODUCTS_SECTION_FRAGMENT},
    _type == 'productSwimlaneSection' => ${PRODUCT_SWIMLANE_SECTION_FRAGMENT},
  `);
