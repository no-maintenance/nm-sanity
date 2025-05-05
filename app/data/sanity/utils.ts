export const getIntValue = (value: string) =>
  `coalesce(
    ${value}[_key == $language][0].value,
    ${value}[_key == $defaultLanguage][0].value,
  )`;

export const getBooleanValue = (value: string) =>
  `coalesce(
    ${value}[_key == $language][0].value,
    ${value}[_key == $defaultLanguage][0].value,
  )`;

export const getReferenceValue = (value: string) =>
  `coalesce(
    ${value}[_key == $language][0].value,
    ${value}[_key == $defaultLanguage][0].value,
  )`;
