import {defineQuery} from 'groq';

import {SECTION_SETTINGS_FRAGMENT} from './sections';
import {getBooleanValue, getIntValue, getReferenceValue} from './utils';
import { LINKS_LIST_SELECTION } from '~/data/sanity/links';

export const FOOTER_SOCIAL_LINKS_ONLY_FRAGMENT = defineQuery(`{
  _key,
  _type,
  "copyright": ${getIntValue('copyright')},
  settings ${SECTION_SETTINGS_FRAGMENT},
}`);

export const FOOTER_WITH_NAV_FRAGMENT = defineQuery(`{
  _key,
  _type,
  "copyright": ${getIntValue('copyright')},
  "showNewsletter": showNewsletter,
  "showCountrySelector": showCountrySelector,
  "menu": coalesce(
    menu[_key == $language][0].value[],
    menu[_key == $defaultLanguage][0].value[],
  )[] ${LINKS_LIST_SELECTION},
  settings ${SECTION_SETTINGS_FRAGMENT},
}`);

export const FOOTERS_FRAGMENT = () =>
  defineQuery(`
    _type == 'socialLinksOnly' => ${FOOTER_SOCIAL_LINKS_ONLY_FRAGMENT},
    _type == 'footerWithNav' => ${FOOTER_WITH_NAV_FRAGMENT},
  `);
