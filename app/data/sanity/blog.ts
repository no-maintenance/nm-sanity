import {defineQuery} from 'groq';
import {IMAGE_FRAGMENT} from './fragments';
import {SECTIONS_FRAGMENT} from './sections';
import {getIntValue} from './utils';

export const BLOG_POST_QUERY = defineQuery(`*[
  _type == "blogPost" 
  && !(_id in path("drafts.**"))
  && slug.current == $handle
][0] {
  _id,
  _type,
  "title": coalesce(
    title[_key == $language][0].value,
    title[_key == $defaultLanguage][0].value,
  ),
  "excerpt": coalesce(
    excerpt[_key == $language][0].value,
    excerpt[_key == $defaultLanguage][0].value,
  ),
  "slug": slug.current,
  season,
  "location": coalesce(
    location[_key == $language][0].value,
    location[_key == $defaultLanguage][0].value,
  ),
  credits[] {
    _key,
    role,
    name
  },
  featuredImage ${IMAGE_FRAGMENT},
  sections[] {
    _key,
    _type,
    ${SECTIONS_FRAGMENT()}
  },
  categories[]-> {
    _id,
    "title": coalesce(
      title[_key == $language][0].value,
      title[_key == $defaultLanguage][0].value,
    ),
    "slug": slug.current,
    color
  },
  tags,
  publishedAt,
  seo {
    "title": coalesce(
      title[_key == $language][0].value,
      title[_key == $defaultLanguage][0].value,
    ),
    "description": coalesce(
      description[_key == $language][0].value,
      description[_key == $defaultLanguage][0].value,
    ),
    image ${IMAGE_FRAGMENT}
  }
}`);

export const BLOG_POSTS_QUERY = defineQuery(`*[
  _type == "blogPost" 
  && !(_id in path("drafts.**"))
] | order(publishedAt desc) {
  _id,
  "title": coalesce(
    title[_key == $language][0].value,
    title[_key == $defaultLanguage][0].value,
  ),
  "excerpt": coalesce(
    excerpt[_key == $language][0].value,
    excerpt[_key == $defaultLanguage][0].value,
  ),
  "slug": slug.current,
  season,
  "location": coalesce(
    location[_key == $language][0].value,
    location[_key == $defaultLanguage][0].value,
  ),
  featuredImage ${IMAGE_FRAGMENT},
  categories[]-> {
    _id,
    "title": coalesce(
      title[_key == $language][0].value,
      title[_key == $defaultLanguage][0].value,
    ),
    "slug": slug.current,
    color
  },
  tags,
  publishedAt
}`);