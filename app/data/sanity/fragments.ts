import {defineQuery} from 'groq';

import {
  EXTERNAL_LINK_FRAGMENT,
  INTERNAL_LINK_FRAGMENT,
  LINK_REFERENCE_FRAGMENT,
  LINKS_LIST_SELECTION,
} from './links';
import {getIntValue} from './utils';

export const IMAGE_FRAGMENT = defineQuery(`{
  _type,
  asset,
  "altText": asset -> altText,
  "_ref": asset._ref,
  hotspot,
  crop,
}`);

export const MUX_VIDEO_FRAGMENT = defineQuery(`{
  _type,
  asset -> {
    _id,
    _type,
    playbackId,
    status,
    thumbTime,
    data {
      aspect_ratio,
      duration,
    },
  },
}`);

export const COLOR_FRAGMENT = defineQuery(`{
  alpha,
  hex,
  hsl,
  rgb,
}`);

export const COLOR_SCHEME_FRAGMENT = defineQuery(`{
  background ${COLOR_FRAGMENT},
  border ${COLOR_FRAGMENT},
  card ${COLOR_FRAGMENT},
  cardForeground ${COLOR_FRAGMENT},
  foreground ${COLOR_FRAGMENT},
  primary ${COLOR_FRAGMENT},
  primaryForeground ${COLOR_FRAGMENT},
}`);

export const THEME_CONTENT_FRAGMENT = defineQuery(`{
  account {
    "accountDetails": ${getIntValue('accountDetails')},
    "addAddress": ${getIntValue('addAddress')},
    "addName": ${getIntValue('addName')},
    "addressBook": ${getIntValue('addressBook')},
    "addressLine1": ${getIntValue('addressLine1')},
    "addressLine2": ${getIntValue('addressLine2')},
    "cancel": ${getIntValue('cancel')},
    "city": ${getIntValue('city')}, 
    "company": ${getIntValue('company')},
    "country": ${getIntValue('country')},
    "default": ${getIntValue('default')},
    "defaultAddress": ${getIntValue('defaultAddress')},
    "discounts": ${getIntValue('discounts')},
    "discountsOff": ${getIntValue('discountsOff')},
    "edit": ${getIntValue('edit')},
    "editAddress": ${getIntValue('editAddress')},
    "emailAddress": ${getIntValue('emailAddress')},
    "firstName": ${getIntValue('firstName')},
    "fulfillmentStatus": ${getIntValue('fulfillmentStatus')},
    "lastName": ${getIntValue('lastName')},
    "name": ${getIntValue('name')},
    "noAddress": ${getIntValue('noAddress')},
    "noOrdersMessage": ${getIntValue('noOrdersMessage')},
    "noShippingAddress": ${getIntValue('noShippingAddress')},
    "orderDate": ${getIntValue('orderDate')},
    "orderDetail": ${getIntValue('orderDetail')},
    "orderHistory": ${getIntValue('orderHistory')},
    "orderId": ${getIntValue('orderId')},
    "orderNumber": ${getIntValue('orderNumber')},
    "orderStatusCancelled": ${getIntValue('orderStatusCancelled')},
    "orderStatusError": ${getIntValue('orderStatusError')},
    "orderStatusFailure": ${getIntValue('orderStatusFailure')},
    "orderStatusOpen": ${getIntValue('orderStatusOpen')},
    "orderStatusPending": ${getIntValue('orderStatusPending')},
    "orderStatusSuccess": ${getIntValue('orderStatusSuccess')},
    "phone": ${getIntValue('phone')},
    "phoneNumber": ${getIntValue('phoneNumber')},
    "placedOn": ${getIntValue('placedOn')},
    "postalCode": ${getIntValue('postalCode')},
    "price": ${getIntValue('price')},
    "product": ${getIntValue('product')},
    "profile": ${getIntValue('profile')},
    "quantity": ${getIntValue('quantity')},
    "remove": ${getIntValue('remove')},
    "returnToAccount": ${getIntValue('returnToAccount')},
    "save": ${getIntValue('save')},
    "saving": ${getIntValue('saving')},
    "shippingAddress": ${getIntValue('shippingAddress')},
    "signOut": ${getIntValue('signOut')},
    "startShopping": ${getIntValue('startShopping')},
    "stateProvince": ${getIntValue('stateProvince')},
    "status": ${getIntValue('status')},
    "subtotal": ${getIntValue('subtotal')},
    "tax": ${getIntValue('tax')},
    "total": ${getIntValue('total')},
    "updateYourProfile": ${getIntValue('updateYourProfile')},
    "viewDetails": ${getIntValue('viewDetails')},
    "welcome": ${getIntValue('welcome')},
    "welcomeToYourAccount": ${getIntValue('welcomeToYourAccount')},
  },
  cart {
    "applyDiscount": ${getIntValue('applyDiscount')},
    "continueShopping": ${getIntValue('continueShopping')},
    "discountCode": ${getIntValue('discountCode')},
    "discounts": ${getIntValue('discounts')},
    "emptyMessage": ${getIntValue('emptyMessage')},
    "heading": ${getIntValue('heading')},
    "orderSummary": ${getIntValue('orderSummary')},
    "proceedToCheckout": ${getIntValue('proceedToCheckout')},
    "quantity": ${getIntValue('quantity')},
    "remove": ${getIntValue('remove')},
    "subtotal": ${getIntValue('subtotal')},
  },
  collection {
    "apply": ${getIntValue('apply')},
    "clear": ${getIntValue('clear')},
    "clearFilters": ${getIntValue('clearFilters')},
    "filterAndSort": ${getIntValue('filterAndSort')},
    "filterInStock": ${getIntValue('filterInStock')},
    "filterOutOfStock": ${getIntValue('filterOutOfStock')},
    "from": ${getIntValue('from')},
    "loading": ${getIntValue('loading')},
    "loadMoreProducts": ${getIntValue('loadMoreProducts')},
    "loadPrevious": ${getIntValue('loadPrevious')},
    "noCollectionFound": ${getIntValue('noCollectionFound')},
    "noProductFound": ${getIntValue('noProductFound')},
    "sortBestSelling": ${getIntValue('sortBestSelling')},
    "sortBy": ${getIntValue('sortBy')},
    "sortFeatured": ${getIntValue('sortFeatured')},
    "sortHighLow": ${getIntValue('sortHighLow')},
    "sortLowHigh": ${getIntValue('sortLowHigh')},
    "sortNewest": ${getIntValue('sortNewest')},
    "to": ${getIntValue('to')}, 
    "viewAll": ${getIntValue('viewAll')},
  },
  error {
    "addressCreation": ${getIntValue('addressCreation')},
    "missingAddressId": ${getIntValue('missingAddressId')},
    "pageNotFound": ${getIntValue('pageNotFound')},
    "reloadPage": ${getIntValue('reloadPage')},
    "sectionError": ${getIntValue('sectionError')},
    "serverError": ${getIntValue('serverError')},
  },
  product {
    "addToCart": ${getIntValue('addToCart')},
    "quantitySelector": ${getIntValue('quantitySelector')},
    "sale": ${getIntValue('sale')},
    "soldOut": ${getIntValue('soldOut')},
  },
}`);

export const SETTINGS_FRAGMENT = defineQuery(`{
  badgesCornerRadius,
  badgesPosition,
  badgesSaleColorScheme -> ${COLOR_SCHEME_FRAGMENT},
  badgesSoldOutColorScheme -> ${COLOR_SCHEME_FRAGMENT},
  blogCards,
  buttonsBorder,
  buttonsShadow,
  cartCollection -> {
    store {
      gid,
      title,
    },
  },
  cartColorScheme -> ${COLOR_SCHEME_FRAGMENT},
  collectionCards,
  description,
  dropdownsAndPopupsBorder,
  dropdownsAndPopupsShadow,
  facebook,
  favicon ${IMAGE_FRAGMENT},
  grid,
  inputsBorder,
  inputsShadow,
  instagram,
  linkedin,
  logo ${IMAGE_FRAGMENT},
  mediaBorder,
  mediaShadow,
  pinterest,
  productCards,
  showCurrencyCodes,
  showTrailingZeros,
  siteName,
  snapchat,
  socialSharingImagePreview ${IMAGE_FRAGMENT},
  spaceBetweenTemplateSections,
  tiktok,
  tumblr,
  twitter,
  vimeo,
  youtube,
}`);

export const HEADER_FRAGMENT = defineQuery(`{
  "announcementBar": coalesce(
    announcementBar[_key == $language][0].value[],
    announcementBar[_key == $defaultLanguage][0].value[],
  )[] {
    _type == "announcement" => {
      _key,
      externalLink,
      link -> ${LINK_REFERENCE_FRAGMENT},
      openInNewTab,
      text,
    },
  },
  announcementBarColorScheme -> ${COLOR_SCHEME_FRAGMENT},
  autoRotateAnnouncements,
  blur,
  showCountrySelectorIcon,
  showSearchIcon,
  colorScheme -> ${COLOR_SCHEME_FRAGMENT},
  desktopLogoWidth,
  "menu": coalesce(
    menu[_key == $language][0].value[],
    menu[_key == $defaultLanguage][0].value[],
  )[] ${LINKS_LIST_SELECTION},
  padding,
  showSeparatorLine,
  sticky,
  enableFluidHeader,
  fluidHeaderOnHomePage,
  fluidHeaderTextColor,
  logoPosition,
  showHamburgerMenuOnDesktop,
}`);

const FONT_ASSET_FRAGMENT = defineQuery(`{
  "extension": asset -> extension,
  "mimeType": asset -> mimeType,
  "url": asset -> url,
}`);

export const FONT_FRAGMENT = defineQuery(`{
  baseSize,
  capitalize,
  font[] {
    antialiased,
    fontAssets[] {
      "fontName": ^.fontName,
      fontStyle,
      fontWeight,
      ttf ${FONT_ASSET_FRAGMENT},
      woff ${FONT_ASSET_FRAGMENT},
      woff2 ${FONT_ASSET_FRAGMENT},
    },
    fontName,
    fontType,
  },
  letterSpacing,
  lineHeight,
}`);

export const COLUMN_RICHTEXT_FRAGMENT = defineQuery(`{
  ...,
  _type == 'image' => ${IMAGE_FRAGMENT},
  _type == 'button' => {
    ...,
    link -> ${LINK_REFERENCE_FRAGMENT},
  },
  _type == 'form' => {
    _type,
    formType,
    title,
    description,
  },
  _type == 'block' => {
    ...,
    markDefs[] {
      ...,
      _type == 'internalLink' => ${INTERNAL_LINK_FRAGMENT},
      _type == 'externalLink' => ${EXTERNAL_LINK_FRAGMENT},
    }
  },
}`);

export const PRODUCT_BASE_RICHTEXT_FRAGMENT = defineQuery(`{
  ...,
  _type == 'image' => ${IMAGE_FRAGMENT},
  _type == 'button' => {
    ...,
    link -> ${LINK_REFERENCE_FRAGMENT},
  },
  _type == 'block' => {
    ...,
    markDefs[] {
      ...,
      _type == 'internalLink' => ${INTERNAL_LINK_FRAGMENT},
      _type == 'externalLink' => ${EXTERNAL_LINK_FRAGMENT},
    }
  },
}`);

export const BASE_RICHTEXT_FRAGMENT = defineQuery(`{
  ...,
  _type == 'block' => {
    ...,
    markDefs[] {
      ...,
      _type == 'internalLink' => ${INTERNAL_LINK_FRAGMENT},
      _type == 'externalLink' => ${EXTERNAL_LINK_FRAGMENT},
    }
  },
}`);

export const RICHTEXT_FRAGMENT = defineQuery(`{
  ...,
  _type == 'image' => ${IMAGE_FRAGMENT},
  _type == 'button' => {
    ...,
    link -> ${LINK_REFERENCE_FRAGMENT},
  },
  _type == 'form' => {
    _type,
    formType,
    title,
    description,
  },
  _type == 'carousel' => {
    _type,
    slides[] {
      _key,
      image ${IMAGE_FRAGMENT},
    },
    slidesPerViewDesktop,
    pagination,
    arrows,
  },
  _type == 'twoColumnBlock' => {
    _type,
    layout,
    verticalAlignment,
    gap,
    leftColumn {
      contentType,
      contentType == 'richtext' => {
        richtext[] ${COLUMN_RICHTEXT_FRAGMENT}
      },
      contentType == 'image' => {
        image ${IMAGE_FRAGMENT},
      },
      contentType == 'carousel' => {
        carousel {
          slides[] {
            _key,
            image ${IMAGE_FRAGMENT},
          },
          slidesPerViewDesktop,
        }
      },
      contentType == 'form' => {
        form {
          formType,
          title,
          description,
        }
      },
      contentType == 'buttons' => {
        buttons[] {
          ...,
          link -> ${LINK_REFERENCE_FRAGMENT},
        }
      },
    },
    rightColumn {
      contentType,
      contentType == 'richtext' => {
        richtext[] ${COLUMN_RICHTEXT_FRAGMENT}
      },
      contentType == 'image' => {
        image ${IMAGE_FRAGMENT},
      },
      contentType == 'carousel' => {
        carousel {
          slides[] {
            _key,
            image ${IMAGE_FRAGMENT},
          },
          slidesPerViewDesktop,
        }
      },
      contentType == 'form' => {
        form {
          formType,
          title,
          description,
        }
      },
      contentType == 'buttons' => {
        buttons[] {
          ...,
          link -> ${LINK_REFERENCE_FRAGMENT},
        }
      },
    },
  },
  _type == 'sizeChart' => {
    _type,
    table,
    description,
    image {
      asset->{url},
      alt
    }
  },
  _type == 'productDetails' => {
    _type,
  },
  _type == 'shopifyAccordion' => {
    _type,
    title,
    content[] ${PRODUCT_BASE_RICHTEXT_FRAGMENT},
    defaultOpen,
  },
  _type == 'block' => {
    ...,
    markDefs[] {
      ...,
      _type == 'internalLink' => ${INTERNAL_LINK_FRAGMENT},
      _type == 'externalLink' => ${EXTERNAL_LINK_FRAGMENT},
    }
  },
}`);
