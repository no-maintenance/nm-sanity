import {defineQuery} from 'groq';
import {IMAGE_FRAGMENT} from './fragments';
import {SECTIONS_FRAGMENT} from './sections';
import {getIntValue} from './utils';

export const STORE_POLICY_QUERY = defineQuery(`*[_type == "storePolicy" && slug.current == $handle][0] {
  _id,
  _type,
  policyType,
  "title": ${getIntValue('title')},
  additionalContent,
  sections[] {
    _key,
    _type,
    ${SECTIONS_FRAGMENT()}
  },
  seo {
    "title": ${getIntValue('title')},
    "description": ${getIntValue('description')},
    image ${IMAGE_FRAGMENT},
  },
}`);

export const ALL_STORE_POLICIES_QUERY = defineQuery(`*[_type == "storePolicy"] {
  _id,
  _type,
  policyType,
  "title": ${getIntValue('title')},
  "slug": slug.current,
}`);
